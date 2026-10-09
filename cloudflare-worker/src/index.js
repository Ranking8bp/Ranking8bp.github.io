// Ranking8BP Cloudflare event gateway — staged, not yet used by the public site.
// Supabase stays authoritative for matchmaking, messages, results and ELO.
const FEEDS = {
  ranking: "get_cached_public_home",
  daily: "daily_classification_leaderboard",
};
const CACHE_TTL_MS = 30_000;
const MAX_STALE_MS = 5 * 60_000;
const MAX_EVENT_BYTES = 1500;
const MAX_ROOM_ID = 2147483647;
const encoder = new TextEncoder();

function json(value, status = 200, extra = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });
}
function validRoom(mode, id) {
  return (mode === "ranked" || mode === "daily") &&
    /^[1-9][0-9]{0,9}$/.test(String(id)) &&
    Number(id) <= MAX_ROOM_ID;
}
function allowOrigin(request, env) {
  const origin = request.headers.get("Origin");
  return !origin || origin === (env.PUBLIC_ORIGIN || "https://ranking8bp.github.io");
}
function addCors(response, request, env) {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", env.PUBLIC_ORIGIN || "https://ranking8bp.github.io");
  headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
  headers.set("access-control-allow-headers", "Authorization, Content-Type, If-None-Match");
  headers.set("vary", "Origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function safeEquals(a, b) {
  if (!a || !b) return false;
  const aa = encoder.encode(a), bb = encoder.encode(b);
  let diff = aa.length ^ bb.length;
  for (let i = 0; i < Math.max(aa.length, bb.length); i++)
    diff |= (aa[i] || 0) ^ (bb[i] || 0);
  return diff === 0;
}
function asBase64url(arr) {
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64url(data) {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(normalized);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
async function digest(value) {
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return asBase64url(new Uint8Array(bytes));
}
async function ticketSignature(message, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return asBase64url(new Uint8Array(signature));
}
async function issueTicket({ mode, room, userId }, secret) {
  const payload = asBase64url(encoder.encode(JSON.stringify({ mode, room, userId, exp: Date.now() + 45_000 })));
  return payload + "." + await ticketSignature(payload, secret);
}
async function verifyTicket(ticket, secret) {
  if (!secret || !ticket || ticket.length > 1500) return null;
  const [message, signature, excess] = ticket.split(".");
  if (excess !== undefined || !message || !signature || !safeEquals(await ticketSignature(message, secret), signature)) return null;
  try {
    const value = JSON.parse(new TextDecoder().decode(fromBase64url(message)));
    if (!value.userId || !validRoom(value.mode, value.room) || !Number.isFinite(value.exp) || value.exp < Date.now() || value.exp > Date.now() + 60_000) return null;
    return value;
  } catch (_) { return null; }
}
async function supabaseRequest(env, path, authToken, body = undefined) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error("Supabase environment is not configured");
  const headers = { apikey: env.SUPABASE_ANON_KEY, accept: "application/json" };
  if (authToken) headers.authorization = "Bearer " + authToken;
  else if (env.SUPABASE_ANON_KEY.startsWith("eyJ")) headers.authorization = "Bearer " + env.SUPABASE_ANON_KEY; // legacy anon JWT only
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(env.SUPABASE_URL.replace(/\/+$/, "") + path, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8500),
  });
  if (!response.ok) throw new Error("Supabase HTTP " + response.status);
  return response.json();
}
async function validateMembership(env, jwt, mode, room) {
  // JWT is validated by Supabase, never merely decoded or trusted from the browser.
  const user = await supabaseRequest(env, "/auth/v1/user", jwt);
  if (!user?.id) return null;
  if (mode === "ranked") {
    // The existing ranked_matches RLS SELECT policy only exposes a participant's own matches.
    const rows = await supabaseRequest(env, "/rest/v1/ranked_matches?select=id&id=eq." + room + "&limit=1", jwt);
    if (!Array.isArray(rows) || !rows.length) return null;
  } else {
    const match = await supabaseRequest(env, "/rest/v1/rpc/daily_classification_room", jwt, { p_match_id: Number(room) });
    if (Number(match?.id) !== Number(room) || match.my_id !== user.id) return null;
  }
  return user.id;
}
async function internalHub(env, name, path, init = {}) {
  const object = env.HUB.getByName(name);
  return object.fetch(new Request("https://hub.internal" + path, init));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/health") return json({
      status: "ok", service: "ranking8bp-server",
      supabaseConfigured: !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY),
      eventsConfigured: !!env.EVENT_SECRET, ticketsConfigured: !!env.TICKET_SECRET,
    });
    if (path === "/internal/event" && request.method === "POST") {
      if (!safeEquals(request.headers.get("x-event-secret"), env.EVENT_SECRET)) return json({ error: "Forbidden" }, 403);
      let payload;
      try {
        if (Number(request.headers.get("content-length") || 0) > MAX_EVENT_BYTES) return json({ error: "Event too large" }, 413);
        const raw = await request.text();
        if (raw.length > MAX_EVENT_BYTES) return json({ error: "Event too large" }, 413);
        payload = JSON.parse(raw);
      } catch (_) { return json({ error: "Invalid event" }, 400); }
      if (payload?.feed && Object.hasOwn(FEEDS, payload.feed)) {
        await internalHub(env, "public", "/invalidate/" + payload.feed, { method: "POST" });
        return json({ accepted: true });
      }
      if (validRoom(payload?.mode, payload?.room) && ["chat.changed", "room.changed", "match.found"].includes(payload?.type)) {
        await internalHub(env, "room:" + payload.mode + ":" + payload.room, "/notify", {
          method: "POST",
          body: JSON.stringify({ type: payload.type, room: Number(payload.room) }),
        });
        return json({ accepted: true });
      }
      return json({ error: "Unknown event" }, 400);
    }

    if (!allowOrigin(request, env)) return json({ error: "Origin not permitted" }, 403);
    if (request.method === "OPTIONS") return addCors(new Response(null, { status: 204 }), request, env);

    if (path === "/api/feed/ranking" || path === "/api/feed/daily") {
      if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
      const kind = path.split("/").at(-1);
      const response = await internalHub(env, "public", "/feed/" + kind, {
        method: "GET",
        headers: { "if-none-match": request.headers.get("if-none-match") || "" },
      });
      return addCors(response, request, env);
    }
    if (path === "/ws/public" && request.method === "GET") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return json({ error: "WebSocket expected" }, 426);
      return internalHub(env, "public", "/ws", { headers: { Upgrade: "websocket" } });
    }

    if (path === "/api/room-ticket" && request.method === "POST") {
      const bearer = request.headers.get("authorization") || "";
      const jwt = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
      if (!jwt || !env.TICKET_SECRET) return json({ error: "Authorization required" }, 401);
      let data;
      try { data = await request.json(); } catch (_) { return json({ error: "Invalid JSON" }, 400); }
      if (!validRoom(data?.mode, data?.room)) return json({ error: "Invalid room" }, 400);
      try {
        const userId = await validateMembership(env, jwt, data.mode, data.room);
        if (!userId) return json({ error: "Not a participant" }, 403);
        const ticket = await issueTicket({ mode: data.mode, room: Number(data.room), userId }, env.TICKET_SECRET);
        return addCors(json({ ticket, expiresIn: 45 }), request, env);
      } catch (_) { return json({ error: "Could not validate access" }, 503); }
    }
    if (path === "/ws/room" && request.method === "GET") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return json({ error: "WebSocket expected" }, 426);
      const info = await verifyTicket(url.searchParams.get("ticket"), env.TICKET_SECRET);
      if (!info) return json({ error: "Invalid/expired ticket" }, 401);
      return internalHub(env, "room:" + info.mode + ":" + info.room, "/ws", { headers: { Upgrade: "websocket" } });
    }
    return json({ error: "Not found" }, 404);
  },
};

// Durable Objects serialize updates for each feed or room, preventing a thundering herd
// of identical requests to Supabase from thousands of simultaneously connected players.
export class EventHub {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.loading = new Map();
  }
  broadcast(message) {
    const body = JSON.stringify(message);
    for (const socket of this.state.getWebSockets()) {
      try { socket.send(body); } catch (_) { try { socket.close(1011, "Disconnected"); } catch (_) {} }
    }
  }
  async freshSnapshot(kind) {
    const key = "feed:" + kind;
    let snap = await this.state.storage.get(key);
    if (snap && Date.now() - snap.fetchedAt < CACHE_TTL_MS) return snap;
    if (!this.loading.has(kind)) {
      const promise = (async () => {
        try {
          const data = await supabaseRequest(this.env, "/rest/v1/rpc/" + FEEDS[kind], null, {});
          const encoded = JSON.stringify(data);
          const etag = '"' + await digest(encoded) + '"';
          const updated = { data, etag, fetchedAt: Date.now() };
          await this.state.storage.put(key, updated);
          if (snap?.etag && snap.etag !== etag) this.broadcast({ type: "feed.changed", feed: kind, etag });
          return updated;
        } catch (error) {
          if (snap && Date.now() - snap.fetchedAt < MAX_STALE_MS) return { ...snap, stale: true };
          throw error;
        }
      })().finally(() => this.loading.delete(kind));
      this.loading.set(kind, promise);
    }
    return this.loading.get(kind);
  }
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/ws") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return json({ error: "WebSocket expected" }, 426);
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (path.startsWith("/invalidate/") && request.method === "POST") {
      const kind = path.split("/").at(-1);
      if (!Object.hasOwn(FEEDS, kind)) return json({ error: "Invalid feed" }, 400);
      await this.state.storage.delete("feed:" + kind);
      this.broadcast({ type: "feed.changed", feed: kind });
      return json({ accepted: true });
    }
    if (path === "/notify" && request.method === "POST") {
      const event = await request.json();
      this.broadcast({ type: event.type, room: event.room });
      return json({ accepted: true });
    }
    if (path.startsWith("/feed/")) {
      const kind = path.split("/").at(-1);
      if (!Object.hasOwn(FEEDS, kind)) return json({ error: "Invalid feed" }, 400);
      try {
        const snap = await this.freshSnapshot(kind);
        const headers = { etag: snap.etag, "cache-control": "private, max-age=0, must-revalidate", "x-ranking8bp-cache": snap.stale ? "stale" : "shared" };
        if (request.headers.get("if-none-match") === snap.etag)
          return new Response(null, { status: 304, headers });
        return json({ data: snap.data, updatedAt: snap.fetchedAt, stale: !!snap.stale }, 200, headers);
      } catch (_) {
        return json({ error: "Supabase temporarily unavailable" }, 503);
      }
    }
    return json({ error: "Not found" }, 404);
  }
  webSocketMessage(socket, message) {
    // WebSockets are notification-only. Game actions and chat writes remain
    // authenticated Supabase RPCs, never accepted via an anonymous event channel.
    if (message === "ping") { try { socket.send("pong"); } catch (_) {} }
  }
  webSocketClose(socket, code, reason) { try { socket.close(code, reason); } catch (_) {} }
  webSocketError(socket) { try { socket.close(1011, "Transport error"); } catch (_) {} }
}
