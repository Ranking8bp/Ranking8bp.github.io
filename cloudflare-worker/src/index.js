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
  headers.set("access-control-expose-headers", "ETag, X-Ranking8BP-Cache");
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
// Search tickets are short-lived, scoped to one authenticated player's queue socket.
async function issueSearchTicket(userId, secret, mode = "ranked") {
  const payload = asBase64url(encoder.encode(JSON.stringify({
    kind: mode + "-search", userId, nonce: crypto.randomUUID(), exp: Date.now() + 45_000,
  })));
  return payload + "." + await ticketSignature(payload, secret);
}
async function verifySearchTicket(ticket, secret) {
  if (!secret || !ticket || ticket.length > 1500) return null;
  const [message, signature, excess] = ticket.split(".");
  if (excess !== undefined || !message || !signature ||
      !safeEquals(await ticketSignature(message, secret), signature)) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64url(message)));
    if (!["ranked-search", "daily-search"].includes(data.kind) ||
        !/^[0-9a-f-]{36}$/i.test(data.nonce) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.userId) ||
        !Number.isFinite(data.exp) || data.exp < Date.now() ||
        data.exp > Date.now() + 60_000) return null;
    return data;
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
      rankedQueueCanary: true, dailyQueueCanary: true,
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

    const queueApi = path.match(/^\/api\/(ranked|daily)\/(search|ready|cancel)$/);
    if (queueApi && request.method === "POST") {
      const queueMode = queueApi[1];
      const queueAction = queueApi[2];
      const bearer = request.headers.get("authorization") || "";
      const jwt = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
      if (!jwt || !env.TICKET_SECRET) return addCors(json({ error: "Authorization required" }, 401), request, env);
      try {
        const user = await supabaseRequest(env, "/auth/v1/user", jwt);
        if (!user?.id) return addCors(json({ error: "Invalid session" }, 401), request, env);
        if (queueAction === "search") {
          // No database queue row is created until an authenticated WebSocket opens.
          return addCors(json({ state: "connect", ticket: await issueSearchTicket(user.id, env.TICKET_SECRET, queueMode) }), request, env);
        }
        const parsed = await request.json().catch(() => ({}));
        const ticket = await verifySearchTicket(parsed.ticket, env.TICKET_SECRET);
        if (!ticket || ticket.userId !== user.id || ticket.kind !== queueMode + "-search")
          return addCors(json({ error: "Invalid search ticket" }, 403), request, env);
        const cancel = queueAction === "cancel";
        const response = await internalHub(env, queueMode + ":queue",
          cancel ? "/" + queueMode + "/cancel" : "/" + queueMode + "/search", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ userId: user.id, jwt, nonce: ticket.nonce }),
        });
        if (!response.ok) return addCors(response, request, env);
        return addCors(json(await response.json()), request, env);
      } catch (_) {
        return addCors(json({ error: "Search gateway temporarily unavailable" }, 503), request, env);
      }
    }
    const queueSocket = path.match(/^\/ws\/(ranked|daily)-search$/);
    if (queueSocket && request.method === "GET") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
        return json({ error: "WebSocket expected" }, 426);
      const mode = queueSocket[1];
      const info = await verifySearchTicket(url.searchParams.get("ticket"), env.TICKET_SECRET);
      if (!info || info.kind !== mode + "-search") return json({ error: "Invalid search ticket" }, 401);
      return internalHub(env, mode + ":queue", "/" + mode + "/ws", {
        headers: { Upgrade: "websocket", "x-ranked-player": info.userId, "x-ranked-nonce": info.nonce },
      });
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
  // The shared Durable Object stores a FIFO view of connected seekers; no JWTs
  // are ever persisted. Supabase still atomically validates and creates each VS.
  async rankedQueueFinish(playerId, jwt, matchId, queue, now) {
    if (!Number.isSafeInteger(matchId) || matchId < 1) throw Error("Invalid match ID");
    // Authenticated Supabase RLS verifies the real opponent before any alert.
    const rows = await supabaseRequest(this.env,
      "/rest/v1/ranked_matches?select=player1_id,player2_id&id=eq." + matchId + "&limit=1", jwt);
    const match = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!match || ![match.player1_id, match.player2_id].includes(playerId))
      throw Error("Match membership not verified");
    const opponent = match.player1_id === playerId ? match.player2_id : match.player1_id;
    queue = queue.filter(x => x.userId !== playerId && x.userId !== opponent);
    await this.state.storage.put("ranked:waiters", queue);
    let messages = (await this.state.storage.get("ranked:assignments")) || {};
    for (const id of [playerId, opponent]) messages[id] = { matchId, createdAt: now };
    messages = Object.fromEntries(Object.entries(messages).filter(([,v]) => now - v.createdAt < 120_000));
    await this.state.storage.put("ranked:assignments", messages);
    for (const id of [playerId, opponent]) {
      for (const socket of this.state.getWebSockets("ranked:" + id)) {
        try { socket.send(JSON.stringify({ type: "match.found", matchId })); } catch (_) {}
      }
    }
    return { state: "matched", out_match_id: matchId };
  }
  async rankedQueueCancel(playerId, jwt, nonce) {
    // Mark this ticket first; an out-of-order /ready cannot resurrect its queue entry.
    // Keep short-lived cancellation markers in ONE bounded DO value; avoid an
    // unbounded storage key per user action at high traffic.
    const now = Date.now();
    const markerKey = "ranked:cancelled-tickets";
    const markers = (await this.state.storage.get(markerKey)) || {};
    for (const [id, at] of Object.entries(markers)) {
      if (now - Number(at) > 90_000) delete markers[id];
    }
    markers[nonce] = now;
    await this.state.storage.put(markerKey, markers);
    const raw = await supabaseRequest(this.env, "/rest/v1/rpc/edge_ranked_queue_cancel", jwt, {});
    const result = Array.isArray(raw) ? raw[0] : raw;
    if (!result || !["cancelled", "matched"].includes(result.state))
      throw Error("Invalid cancellation response");
    const queue = (await this.state.storage.get("ranked:waiters")) || [];
    await this.state.storage.put("ranked:waiters", queue.filter(x => x.userId !== playerId));
    return { state: result.state, out_match_id: result.out_match_id || null };
  }
  async rankedQueueSearch(playerId, jwt, nonce) {
    // ONE entry RPC per new seeker, then NO Supabase polling from Cloudflare.
    // The SQL RPC registers presence and a DB safety marker, but does not select opponents.
    const cancelledTickets = (await this.state.storage.get("ranked:cancelled-tickets")) || {};
    if (Date.now() - Number(cancelledTickets[nonce] || 0) < 90_000)
      return { state: "cancelled" };
    if (!this.state.getWebSockets("ranked-ticket:" + nonce).length)
      return { state: "cancelled" };
    const raw = await supabaseRequest(this.env, "/rest/v1/rpc/edge_ranked_queue_enter", jwt, {});
    const entry = Array.isArray(raw) ? raw[0] : raw;
    if (!entry || !["searching", "matched"].includes(entry.state))
      throw Error("Invalid ranked queue entry");
    const now = Date.now();
    // Handle a disconnect during the first Supabase call.
    const cancelledNow = (await this.state.storage.get("ranked:cancelled-tickets")) || {};
    if ((Date.now() - Number(cancelledNow[nonce] || 0) < 90_000) ||
        !this.state.getWebSockets("ranked-ticket:" + nonce).length) {
      await supabaseRequest(this.env, "/rest/v1/rpc/edge_ranked_queue_cancel", jwt, {});
      return { state: "cancelled" };
    }
    let queue = (await this.state.storage.get("ranked:waiters")) || [];
    const previous = queue.find(item => item.userId === playerId);
    queue = queue.filter(item => item.userId !== playerId &&
      now - item.joinedAt < 3_600_000 && this.state.getWebSockets("ranked:" + item.userId).length > 0);
    if (entry.state === "matched")
      return this.rankedQueueFinish(playerId, jwt, Number(entry.out_match_id), queue, now);

    // True Cloudflare FIFO selection. SQL ONLY accepts/rejects the proposed pair
    // and creates the match atomically under the legacy matcher advisory lock.
    for (const candidate of queue) {
      const pairing = await supabaseRequest(this.env, "/rest/v1/rpc/edge_ranked_queue_pair", jwt, {
        p_opponent_id: candidate.userId,
      });
      const result = Array.isArray(pairing) ? pairing[0] : pairing;
      if (result?.state === "matched" && Number(result.out_match_id) > 0)
        return this.rankedQueueFinish(playerId, jwt, Number(result.out_match_id), queue, now);
      if (result?.state !== "ineligible") throw Error("Invalid ranked pair outcome");
      // Preserve the earlier candidate: B may be blocked from A, but C may not.
    }

    // Preserve the user's place after a temporary WebSocket reconnect.
    queue.push({ userId: playerId, joinedAt: previous?.joinedAt || now });
    queue.sort((a, b) => a.joinedAt - b.joinedAt);
    await this.state.storage.put("ranked:waiters", queue);
    return { state: "searching" };
  }

  // Daily classification queue uses an isolated Durable Object and the same
  // advisory lock as the original daily matcher. SQL remains authoritative.
  async dailyQueueFinish(playerId, jwt, matchId, queue, now) {
    if (!Number.isSafeInteger(matchId) || matchId < 1) throw Error("Invalid daily match");
    const m = await supabaseRequest(this.env, "/rest/v1/rpc/daily_classification_room", jwt, { p_match_id: matchId });
    if (Number(m?.id) !== matchId || m.my_id !== playerId)
      throw Error("Daily match membership not verified");
    const opponent = m.player1_id === playerId ? m.player2_id : m.player1_id;
    queue = queue.filter(x => x.userId !== playerId && x.userId !== opponent);
    await this.state.storage.put("daily:waiters", queue);
    let assignments = (await this.state.storage.get("daily:assignments")) || {};
    for (const id of [playerId, opponent]) assignments[id] = { matchId, createdAt: now };
    assignments = Object.fromEntries(Object.entries(assignments).filter(([, v]) => now - v.createdAt < 120_000));
    await this.state.storage.put("daily:assignments", assignments);
    for (const id of [playerId, opponent]) {
      for (const socket of this.state.getWebSockets("daily:" + id)) {
        try { socket.send(JSON.stringify({ type: "match.found", matchId })); } catch (_) {}
      }
    }
    return { state: "matched", out_match_id: matchId };
  }
  async dailyQueueCancel(playerId, jwt, nonce) {
    const now = Date.now();
    const markers = (await this.state.storage.get("daily:cancelled-tickets")) || {};
    for (const [key, at] of Object.entries(markers))
      if (now - Number(at) > 90_000) delete markers[key];
    markers[nonce] = now;
    await this.state.storage.put("daily:cancelled-tickets", markers);
    const raw = await supabaseRequest(this.env, "/rest/v1/rpc/edge_daily_queue_cancel", jwt, {});
    const outcome = Array.isArray(raw) ? raw[0] : raw;
    if (!outcome || !["cancelled","matched"].includes(outcome.state)) throw Error("Invalid daily cancel");
    const queue = (await this.state.storage.get("daily:waiters")) || [];
    await this.state.storage.put("daily:waiters", queue.filter(x => x.userId !== playerId));
    return { state: outcome.state, out_match_id: outcome.out_match_id || null };
  }
  async dailyQueueSearch(playerId, jwt, nonce) {
    const markers = (await this.state.storage.get("daily:cancelled-tickets")) || {};
    if (Date.now() - Number(markers[nonce] || 0) < 90_000)
      return { state: "cancelled" };
    if (!this.state.getWebSockets("daily-ticket:" + nonce).length)
      return { state: "cancelled" };
    const raw = await supabaseRequest(this.env, "/rest/v1/rpc/edge_daily_queue_enter", jwt, {});
    const entry = Array.isArray(raw) ? raw[0] : raw;
    if (!entry || !["searching","matched"].includes(entry.state)) throw Error("Invalid daily queue entry");
    const now = Date.now();
    const cancelled = (await this.state.storage.get("daily:cancelled-tickets")) || {};
    if (Date.now() - Number(cancelled[nonce] || 0) < 90_000 ||
        !this.state.getWebSockets("daily-ticket:" + nonce).length) {
      await supabaseRequest(this.env, "/rest/v1/rpc/edge_daily_queue_cancel", jwt, {});
      return { state: "cancelled" };
    }
    let queue = (await this.state.storage.get("daily:waiters")) || [];
    const previous = queue.find(x => x.userId === playerId);
    queue = queue.filter(x => x.userId !== playerId &&
       now-x.joinedAt < 3_600_000 && this.state.getWebSockets("daily:" + x.userId).length > 0);
    if (entry.state === "matched")
      return this.dailyQueueFinish(playerId, jwt, Number(entry.out_match_id), queue, now);
    for (const candidate of queue) {
      const response = await supabaseRequest(this.env,"/rest/v1/rpc/edge_daily_queue_pair",jwt,{
        p_opponent_id: candidate.userId,
      });
      const outcome = Array.isArray(response) ? response[0] : response;
      if (outcome?.state === "matched" && Number(outcome.out_match_id) > 0)
        return this.dailyQueueFinish(playerId, jwt, Number(outcome.out_match_id), queue, now);
      if (outcome?.state !== "ineligible") throw Error("Invalid daily pairing response");
    }
    queue.push({ userId: playerId, joinedAt: previous?.joinedAt || now });
    queue.sort((a,b)=>a.joinedAt-b.joinedAt);
    await this.state.storage.put("daily:waiters", queue);
    return { state:"searching" };
  }
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/daily/search" && request.method === "POST") {
      let data;
      try { data = await request.json(); } catch (_) { return json({error:"Bad request"},400); }
      if (!data?.userId || typeof data.jwt !== "string" || !/^[0-9a-f-]{36}$/i.test(data.nonce))
        return json({ error:"Bad request" },400);
      const prior = this.dailyQueueLock || Promise.resolve();
      const action = prior.catch(()=>{}).then(()=>this.dailyQueueSearch(data.userId,data.jwt,data.nonce));
      this.dailyQueueLock = action.catch(()=>{});
      try { return json(await action); } catch (_) { return json({error:"Daily matching unavailable"},503); }
    }
    if (path === "/daily/cancel" && request.method === "POST") {
      let data;
      try { data = await request.json(); } catch (_) { return json({error:"Bad request"},400); }
      if (!data?.userId || typeof data.jwt !== "string" || !/^[0-9a-f-]{36}$/i.test(data.nonce))
        return json({ error:"Bad request" },400);
      const prior=this.dailyQueueLock || Promise.resolve();
      const action=prior.catch(()=>{}).then(()=>this.dailyQueueCancel(data.userId,data.jwt,data.nonce));
      this.dailyQueueLock=action.catch(()=>{});
      try { return json(await action); } catch (_) { return json({error:"Daily cancel unavailable"},503); }
    }
    if (path === "/daily/ws") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
        return json({error:"WebSocket expected"},426);
      const userId=request.headers.get("x-ranked-player")||"";
      const nonce=request.headers.get("x-ranked-nonce")||"";
      if (!/^[0-9a-f-]{36}$/i.test(userId)||!/^[0-9a-f-]{36}$/i.test(nonce))
        return json({error:"Invalid daily ticket"},403);
      const pair=new WebSocketPair();
      this.state.acceptWebSocket(pair[1],["daily:"+userId,"daily-ticket:"+nonce]);
      pair[1].serializeAttachment({kind:"daily-search",userId,nonce});
      const assignments=(await this.state.storage.get("daily:assignments"))||{};
      const match=assignments[userId];
      if (match&&Date.now()-match.createdAt<120_000) {
        try {pair[1].send(JSON.stringify({type:"match.found",matchId:match.matchId}))}catch(_){}
      }
      return new Response(null,{status:101,webSocket:pair[0]});
    }
    if (path === "/ranked/search" && request.method === "POST") {
      let data;
      try { data = await request.json(); } catch (_) { return json({ error: "Bad request" }, 400); }
      if (!data?.userId || typeof data.jwt !== "string" ||
          !/^[0-9a-f-]{36}$/i.test(data.nonce)) return json({ error: "Bad request" }, 400);
      // Serialize every entrant so the Cloudflare queue has a deterministic order,
      // including while Supabase RPCs are in flight.
      const previous = this.rankedQueueLock || Promise.resolve();
      const action = previous.catch(() => {}).then(() => this.rankedQueueSearch(data.userId, data.jwt, data.nonce));
      this.rankedQueueLock = action.catch(() => {});
      try { return json(await action); } catch (_) { return json({ error: "Matchmaking unavailable" }, 503); }
    }
    if (path === "/ranked/cancel" && request.method === "POST") {
      let data;
      try { data = await request.json(); } catch (_) { return json({ error: "Bad request" }, 400); }
      if (!data?.userId || typeof data.jwt !== "string" ||
          !/^[0-9a-f-]{36}$/i.test(data.nonce)) return json({ error: "Bad request" }, 400);
      const previous = this.rankedQueueLock || Promise.resolve();
      const action = previous.catch(() => {}).then(() =>
        this.rankedQueueCancel(data.userId, data.jwt, data.nonce));
      this.rankedQueueLock = action.catch(() => {});
      try { return json(await action); } catch (_) { return json({ error: "Cancellation unavailable" }, 503); }
    }
    if (path === "/ranked/ws") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
        return json({ error: "WebSocket expected" }, 426);
      const userId = request.headers.get("x-ranked-player") || "";
      const nonce = request.headers.get("x-ranked-nonce") || "";
      if (!/^[0-9a-f-]{36}$/i.test(userId) || !/^[0-9a-f-]{36}$/i.test(nonce))
        return json({ error: "Invalid search ticket" }, 403);
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1], ["ranked:" + userId, "ranked-ticket:" + nonce]);
      pair[1].serializeAttachment({ kind: "ranked-search", userId, nonce });
      const messages = (await this.state.storage.get("ranked:assignments")) || {};
      const match = messages[userId];
      if (match && Date.now() - match.createdAt < 120_000) {
        try { pair[1].send(JSON.stringify({ type: "match.found", matchId: match.matchId })); } catch (_) {}
      }
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
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
  webSocketClose(socket, code, reason) {
    try { socket.close(code, reason); } catch (_) {}
    // Only the Durable Object's connection list is cleaned up here. A browser's
    // explicit cancel/pagehide still uses its authenticated Supabase cancel RPC.
    const attachment = socket.deserializeAttachment?.();
    if (attachment?.kind === "daily-search" && attachment.userId) {
      const id=attachment.userId;
      if (this.state.getWebSockets("daily:"+id).length===0) {
        const prior=this.dailyQueueLock||Promise.resolve();
        const action=prior.catch(()=>{}).then(async()=>{
          if (this.state.getWebSockets("daily:"+id).length) return;
          const waiters=await this.state.storage.get("daily:waiters");
          if (Array.isArray(waiters))
            await this.state.storage.put("daily:waiters",waiters.filter(x=>x.userId!==id));
        });
        this.dailyQueueLock=action.catch(()=>{});
      }
    }
    if (attachment?.kind === "ranked-search" && attachment.userId) {
      const id = attachment.userId;
      if (this.state.getWebSockets("ranked:" + id).length === 0) {
        // Close cleanup shares the same lock as join and cancellation.
        const previous = this.rankedQueueLock || Promise.resolve();
        const action = previous.catch(() => {}).then(async () => {
          if (this.state.getWebSockets("ranked:" + id).length) return;
          const items = await this.state.storage.get("ranked:waiters");
          if (Array.isArray(items))
            await this.state.storage.put("ranked:waiters", items.filter(x => x.userId !== id));
        });
        this.rankedQueueLock = action.catch(() => {});
      }
    }
  }
  webSocketError(socket) { try { socket.close(1011, "Transport error"); } catch (_) {} }
}
