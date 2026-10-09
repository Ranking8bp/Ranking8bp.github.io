// Browser adapter, NOT automatically loaded into production until gateway is tested.
// Pass the Worker URL from your Cloudflare dashboard; never hardcode a secret here.
export class Ranking8bpEdgeClient {
  constructor({ baseUrl, supabase }) {
    this.baseUrl = String(baseUrl).replace(/\/+$/, "");
    this.supabase = supabase;
    this.snapshots = new Map();
  }
  async getFeed(feed) {
    if (feed !== "ranking" && feed !== "daily") throw Error("Unknown feed");
    const cached = this.snapshots.get(feed);
    try {
      const headers = cached?.etag ? { "if-none-match": cached.etag } : {};
      const result = await fetch(this.baseUrl + "/api/feed/" + feed, {
        headers,
        signal: AbortSignal.timeout(9000),
      });
      if (result.status === 304 && cached) return { data: cached.data, unchanged: true, stale: false };
      if (!result.ok) throw Error("Gateway unavailable");
      const payload = await result.json();
      this.snapshots.set(feed, { data: payload.data, etag: result.headers.get("etag") });
      return { data: payload.data, unchanged: false, stale: !!payload.stale };
    } catch (_) {
      // Browser can always use the old Supabase backend if Cloudflare is unavailable.
      const fn = feed === "ranking" ? "get_cached_public_home" : "daily_classification_leaderboard";
      const { data, error } = await this.supabase.rpc(fn);
      if (error) {
        if (cached) return { data: cached.data, unchanged: true, stale: true };
        throw error;
      }
      return { data, unchanged: false, stale: false, fallback: true };
    }
  }
  watchPublic(onChanged) {
    let closed = false, socket, retry, attempt = 0;
    const connect = () => {
      if (closed) return;
      socket = new WebSocket(this.baseUrl.replace(/^http/, "ws") + "/ws/public");
      socket.onopen = () => {
        attempt = 0;
        // Refresh once after reconnect in case events were missed while offline.
        onChanged({ type: "resync" });
      };
      socket.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data);
          if (event.type === "feed.changed" && ["ranking", "daily"].includes(event.feed))
            onChanged(event);
        } catch (_) {}
      };
      socket.onclose = () => {
        if (!closed) retry = setTimeout(connect, Math.min(30_000, 1200 * 2 ** Math.min(attempt++, 5)));
      };
      socket.onerror = () => socket.close();
    };
    connect();
    return () => { closed = true; clearTimeout(retry); socket?.close(); };
  }
  // One authenticated RPC on entry, then an idle Cloudflare WebSocket while waiting.
  // If anything fails, the caller falls back to the existing Supabase polling loop.
  async waitForRankedMatch(signal) {
    // A rival leaving cannot end another player's search. Reconnect a dropped
    // private WebSocket before falling back to the original Supabase matcher.
    for (let attempt = 0; ; attempt++) {
      if (signal?.aborted) throw Error("Search cancelled");
      try {
        return await this.waitForRankedMatchOnce(signal);
      } catch (error) {
        if (signal?.aborted || attempt >= 3) throw error;
        const ms = Math.min(1200 * 2 ** attempt, 5000);
        await new Promise((resolve, reject) => {
          const abort = () => {
            clearTimeout(timer);
            signal?.removeEventListener("abort", abort);
            reject(Error("Search cancelled"));
          };
          const timer = setTimeout(() => {
            signal?.removeEventListener("abort", abort);
            resolve();
          }, ms);
          signal?.addEventListener("abort", abort, { once: true });
          if (signal?.aborted) abort();
        });
      }
    }
  }
  async waitForRankedMatchOnce(signal) {
    if (signal?.aborted) throw Error("Search cancelled");
    const { data } = await this.supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw Error("Session required");
    const response = await fetch(this.baseUrl + "/api/ranked/search", {
      method: "POST",
      headers: { authorization: "Bearer " + token, "content-type": "application/json" },
      body: "{}",
      signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(15000)]),
    });
    if (!response.ok) throw Error("Cloudflare ranked queue unavailable");
    const result = await response.json();
    if (result.state !== "connect" || !result.ticket) throw Error("Cloudflare ranked queue not ready");
    return new Promise((resolve, reject) => {
      let socket, pingTimer;
      const timeout = setTimeout(() => done(Error("Ranked queue connection timed out")), 12000);
      const cleanup = () => {
        clearTimeout(timeout);
        clearInterval(pingTimer);
        signal?.removeEventListener("abort", abort);
        if (socket) { socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null; socket.close(); }
      };
      let finished = false;
      const done = (error, value) => {
        if (finished) return;
        finished = true;
        cleanup();
        if (error) reject(error); else resolve(value);
      };
      const abort = () => {
        // Cancel in the serialized Durable Object; keepalive helps on pagehide.
        // Supabase cancellation will never remove an already-created ranked VS.
        fetch(this.baseUrl + "/api/ranked/cancel", {
          method: "POST",
          headers: { authorization: "Bearer " + token, "content-type": "application/json" },
          body: JSON.stringify({ ticket: result.ticket }),
          keepalive: true,
        }).catch(() => {});
        done(Error("Search cancelled"));
      };
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) { abort(); return; }
      try {
        socket = new WebSocket(this.baseUrl.replace(/^http/, "ws") +
          "/ws/ranked-search?ticket=" + encodeURIComponent(result.ticket));
        socket.onopen = async () => {
          clearTimeout(timeout);
          // Register in Supabase only AFTER the WebSocket is established.
          // Closing the tab during the first HTTP step cannot create a ghost match.
          try {
            const reply = await fetch(this.baseUrl + "/api/ranked/ready", {
              method: "POST",
              headers: { authorization: "Bearer " + token, "content-type": "application/json" },
              body: JSON.stringify({ ticket: result.ticket }),
              signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(15000)]),
            });
            if (!reply.ok) throw Error("Could not confirm ranked queue entry");
            const status = await reply.json();
            if (finished) return;
            if (status.state === "matched" && Number(status.out_match_id) > 0) {
              done(null, { state: "matched", out_match_id: Number(status.out_match_id) });
              return;
            }
            if (status.state !== "searching") throw Error("Ranked queue entry rejected");
            // Keepalive is Cloudflare-only, not a Supabase query.
            pingTimer = setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send("ping"); }, 25000);
          } catch (error) { done(error); }
        };
        socket.onmessage = event => {
          try {
            const m = JSON.parse(event.data);
            if (m.type === "match.found" && Number.isSafeInteger(Number(m.matchId)) &&
                Number(m.matchId) > 0)
              done(null, { state: "matched", out_match_id: Number(m.matchId) });
          } catch (_) {}
        };
        socket.onerror = () => done(Error("Cloudflare ranked WebSocket error"));
        socket.onclose = () => done(Error("Cloudflare ranked WebSocket disconnected"));
      } catch (error) { done(error); }
    });
  }
  // Room WebSockets only signal changes. Messages/results are loaded and written
  // through authenticated Supabase RPCs, preserving all authoritative validations.
  watchRoom(mode, room, onChanged, onResync, onConnectionChange) {
    if (!["ranked", "daily"].includes(mode) || !/^[1-9]\d*$/.test(String(room))) throw Error("Invalid room");
    let closed = false, socket, retry, attempt = 0;
    const sync = () => { if (!closed && !document.hidden) onResync?.(); };
    const interval = setInterval(sync, 60_000); // Failsafe if a webhook is missed.
    const connect = async () => {
      if (closed) return;
      try {
        const { data } = await this.supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (!token) throw Error("Session required");
        const reply = await fetch(this.baseUrl + "/api/room-ticket", {
          method: "POST",
          headers: { authorization: "Bearer " + token, "content-type": "application/json" },
          body: JSON.stringify({ mode, room: Number(room) }),
          signal: AbortSignal.timeout(9000),
        });
        if (!reply.ok) throw Error("Room ticket failed");
        const ticket = (await reply.json()).ticket;
        if (closed) return;
        socket = new WebSocket(this.baseUrl.replace(/^http/, "ws") + "/ws/room?ticket=" + encodeURIComponent(ticket));
        socket.onopen = () => { attempt = 0; onConnectionChange?.(true); sync(); };
        socket.onmessage = (m) => {
          try {
            const event = JSON.parse(m.data);
            if (event.room === Number(room) && ["chat.changed", "room.changed", "match.found"].includes(event.type))
              onChanged(event);
          } catch (_) {}
        };
        socket.onclose = () => {
          onConnectionChange?.(false);
          if (!closed) retry = setTimeout(connect, Math.min(30_000, 1200 * 2 ** Math.min(attempt++, 5)));
        };
        socket.onerror = () => socket.close();
      } catch (_) {
        onConnectionChange?.(false);
        if (!closed) retry = setTimeout(connect, Math.min(30_000, 1200 * 2 ** Math.min(attempt++, 5)));
      }
    };
    connect();
    return () => { closed = true; clearInterval(interval); clearTimeout(retry); socket?.close(); onConnectionChange?.(false); };
  }
}
