import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker, { EventHub } from "../src/index.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

test("health does not disclose credentials", async () => {
  const reply = await worker.fetch(new Request("https://worker.test/health"), {});
  assert.equal(reply.status, 200);
  const body = await reply.json();
  assert.equal(body.service, "ranking8bp-server");
  assert.equal(body.eventsConfigured, false);
});

test("unauthorized event is rejected", async () => {
  const reply = await worker.fetch(
    new Request("https://worker.test/internal/event", {
      method: "POST", headers: { "x-event-secret": "bad" }, body: JSON.stringify({ feed: "ranking" }),
    }),
    { EVENT_SECRET: "correct" }
  );
  assert.equal(reply.status, 403);
});

test("browser from foreign origin is rejected", async () => {
  const reply = await worker.fetch(
    new Request("https://worker.test/api/feed/ranking", { headers: { Origin: "https://evil.invalid" } }),
    { PUBLIC_ORIGIN: "https://ranking8bp.github.io" }
  );
  assert.equal(reply.status, 403);
});

test("room ticket without session rejected", async () => {
  const reply = await worker.fetch(
    new Request("https://worker.test/api/room-ticket", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "daily", room: 10 })
    }),
    { TICKET_SECRET: "something" }
  );
  assert.equal(reply.status, 401);
});

test("shared Durable Object fetches daily classification once for repeated requests", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  const memory = new Map();
  const state = {
    storage: {
      get: async key => memory.get(key),
      put: async (key, value) => memory.set(key, value),
      delete: async key => memory.delete(key)
    },
    getWebSockets: () => []
  };
  globalThis.fetch = async () => {
    calls++;
    return new Response(JSON.stringify([{ player_id: "test", points: 45 }]), {
      status: 200, headers: { "content-type": "application/json" }
    });
  };
  try {
    const hub = new EventHub(state, {
      SUPABASE_URL: "https://supabase.invalid",
      SUPABASE_ANON_KEY: "sb_publishable_test"
    });
    const req = new Request("https://hub.internal/feed/daily");
    const first = await hub.fetch(req);
    const content = await first.json();
    assert.equal(content.data[0].points, 45);
    const etag = first.headers.get("etag");
    assert.ok(etag);
    const second = await hub.fetch(new Request("https://hub.internal/feed/daily", {
      headers: { "if-none-match": etag }
    }));
    assert.equal(second.status, 304);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
