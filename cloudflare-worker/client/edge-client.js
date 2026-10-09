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
