// Supabase database trigger -> private relay -> Cloudflare Durable Object.
// Only event categories and room IDs cross the network. Never row contents.
// The endpoint is deny-by-default until the private secrets are configured.
const enc = new TextEncoder();
function equalsSafe(a, b) {
  if (!a || !b) return false;
  const x = enc.encode(a), y = enc.encode(b);
  let difference = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    difference |= (x[i] || 0) ^ (y[i] || 0);
  }
  return difference === 0;
}
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json", "cache-control": "no-store" },
});
const FEEDS = new Set(["ranking", "daily"]);
const CHANGES = new Set(["chat.changed", "room.changed", "match.found"]);
function validEvent(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) return false;
  const fields = Object.keys(event).sort().join(",");
  if (fields === "feed") return FEEDS.has(event.feed);
  if (fields !== "mode,room,type") return false;
  return ["ranked", "daily"].includes(event.mode) &&
    Number.isSafeInteger(event.room) && event.room > 0 &&
    event.room <= 2147483647 && CHANGES.has(event.type);
}
Deno.serve(async request => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const webhookSecret = Deno.env.get("RANKING_WEBHOOK_SECRET");
  const workerSecret = Deno.env.get("EVENT_SECRET");
  const workerUrl = Deno.env.get("WORKER_URL");
  if (!webhookSecret || webhookSecret.length < 32 || !workerSecret ||
      !workerUrl || !/^https:\/\/[^/]+\.workers\.dev\/?$/.test(workerUrl)) {
    return json({ error: "Missing server configuration" }, 503);
  }
  if (!equalsSafe(request.headers.get("x-ranking-webhook-secret"), webhookSecret)) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (Number(request.headers.get("content-length") || 0) > 4096) {
    return json({ error: "Event too large" }, 413);
  }
  let events;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: "Event too large" }, 413);
    const parsed = JSON.parse(raw);
    events = parsed?.events;
  } catch (_) { return json({ error: "Invalid JSON" }, 400); }
  if (!Array.isArray(events) || events.length < 1 || events.length > 3 ||
      !events.every(validEvent)) return json({ error: "Invalid event" }, 400);
  const gateway = workerUrl.replace(/\/+$/, "") + "/internal/event";
  const results = await Promise.allSettled(events.map(async event => {
    const response = await fetch(gateway, {
      method: "POST",
      headers: { "content-type": "application/json", "x-event-secret": workerSecret },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(6500),
    });
    if (!response.ok) throw Error("Gateway HTTP " + response.status);
  }));
  const failed = results.filter(result => result.status === "rejected").length;
  return json({ delivered: results.length - failed, failed }, failed ? 502 : 200);
});
