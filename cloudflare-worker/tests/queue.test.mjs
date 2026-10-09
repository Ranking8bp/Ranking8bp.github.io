import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker, { EventHub } from "../src/index.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function makeHub() {
  const memory = new Map();
  const notifications = [];
  const state = {
    storage: {
      get: async key => memory.get(key),
      put: async (key, value) => memory.set(key, value),
      delete: async key => memory.delete(key),
    },
    getWebSockets: tag => tag === "ranked:" + A ? [{ send(msg) { notifications.push(JSON.parse(msg)); } }] : [],
  };
  return { memory, notifications, hub: new EventHub(state, {
    SUPABASE_URL: "https://supabase.test",
    SUPABASE_ANON_KEY: "sb_publishable_test",
  }) };
}

test("ranked queue requires an authenticated session", async () => {
  const response = await worker.fetch(new Request("https://worker.test/api/ranked/search", {
    method: "POST", headers: { Origin: "https://ranking8bp.github.io" }, body: "{}",
  }), { TICKET_SECRET: "secret-test" });
  assert.equal(response.status, 401);
});

test("ranked queue rejects unknown origins before backend work", async () => {
  const response = await worker.fetch(new Request("https://worker.test/api/ranked/search", {
    method: "POST", headers: { Origin: "https://evil.invalid", authorization: "Bearer fake" },
  }), { TICKET_SECRET: "secret-test" });
  assert.equal(response.status, 403);
});

test("two authorized entrants pair once and waiting player receives Cloudflare notification", async () => {
  const { memory, notifications, hub } = makeHub();
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts = {}) => {
    const path = new URL(url).pathname;
    const bearer = opts.headers?.authorization || "";
    const userId = bearer === "Bearer jwt-A" ? A : B;
    calls.push({ path, userId });
    let result;
    if (path === "/auth/v1/user") result = { id: userId };
    else if (path.endsWith("/rpc/set_ranked_search_presence")) result = null;
    else if (path.endsWith("/rpc/find_ranked_opponent")) {
      result = [{ state: userId === A ? "searching" : "matched", out_match_id: userId === B ? 456 : null }];
    } else if (path === "/rest/v1/ranked_matches") result = [{ player1_id: A, player2_id: B }];
    else throw Error("Unexpected backend path " + path);
    return new Response(JSON.stringify(result), {
      status: 200, headers: { "content-type": "application/json" },
    });
  };
  const env = {
    SUPABASE_URL: "https://supabase.test",
    SUPABASE_ANON_KEY: "sb_publishable_test",
    TICKET_SECRET: "search-secret",
    PUBLIC_ORIGIN: "https://ranking8bp.github.io",
    HUB: { getByName: name => {
      assert.equal(name, "ranked:queue");
      return { fetch: request => hub.fetch(request) };
    } },
  };
  try {
    const first = await worker.fetch(new Request("https://worker.test/api/ranked/search", {
      method: "POST",
      headers: { Origin: "https://ranking8bp.github.io", authorization: "Bearer jwt-A" },
      body: "{}",
    }), env);
    assert.equal(first.status, 200);
    const waiting = await first.json();
    assert.equal(waiting.state, "searching");
    assert.equal(typeof waiting.ticket, "string");
    assert.deepEqual(memory.get("ranked:waiters").map(x => x.userId), [A]);

    const second = await worker.fetch(new Request("https://worker.test/api/ranked/search", {
      method: "POST",
      headers: { Origin: "https://ranking8bp.github.io", authorization: "Bearer jwt-B" },
      body: "{}",
    }), env);
    assert.equal(second.status, 200);
    const paired = await second.json();
    assert.equal(paired.state, "matched");
    assert.equal(paired.out_match_id, 456);
    assert.deepEqual(memory.get("ranked:waiters"), []);
    assert.deepEqual(notifications, [{ type: "match.found", matchId: 456 }]);
    assert.equal(memory.get("ranked:assignments")[A].matchId, 456);
    assert.equal(calls.filter(c => c.path.endsWith("/rpc/find_ranked_opponent")).length, 2);
    assert.equal(calls.filter(c => c.path.endsWith("/rpc/set_ranked_search_presence")).length, 2);
  } finally { globalThis.fetch = originalFetch; }
});
