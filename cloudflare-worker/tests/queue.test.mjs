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
    getWebSockets: tag => tag.startsWith("ranked-ticket:") ? [{}] : tag === "ranked:" + A ? [{ send(msg) { notifications.push(JSON.parse(msg)); } }] : tag === "ranked:" + B ? [{ send() {} }] : [],
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
    else if (path.endsWith("/rpc/edge_ranked_queue_enter")) {
      result = [{ state: "searching", out_match_id: null }];
    } else if (path.endsWith("/rpc/edge_ranked_queue_pair")) {
      assert.equal(JSON.parse(opts.body).p_opponent_id, A);
      result = [{ state: "matched", out_match_id: 456 }];
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
    assert.equal(waiting.state, "connect");
    assert.equal(typeof waiting.ticket, "string");
    assert.equal(memory.get("ranked:waiters"), undefined, "no DB queue entry before WS is open");
    const firstReady = await worker.fetch(new Request("https://worker.test/api/ranked/ready", {
      method: "POST", headers: { Origin: "https://ranking8bp.github.io", authorization: "Bearer jwt-A" },
      body: JSON.stringify({ ticket: waiting.ticket }),
    }), env);
    assert.equal(firstReady.status, 200);
    assert.equal((await firstReady.json()).state, "searching");
    assert.deepEqual(memory.get("ranked:waiters").map(x => x.userId), [A]);

    const second = await worker.fetch(new Request("https://worker.test/api/ranked/search", {
      method: "POST",
      headers: { Origin: "https://ranking8bp.github.io", authorization: "Bearer jwt-B" },
      body: "{}",
    }), env);
    assert.equal(second.status, 200);
    const secondTicket = await second.json();
    assert.equal(secondTicket.state, "connect");
    const pairingResponse = await worker.fetch(new Request("https://worker.test/api/ranked/ready", {
      method: "POST", headers: { Origin: "https://ranking8bp.github.io", authorization: "Bearer jwt-B" },
      body: JSON.stringify({ ticket: secondTicket.ticket }),
    }), env);
    assert.equal(pairingResponse.status, 200);
    const paired = await pairingResponse.json();
    assert.equal(paired.state, "matched");
    assert.equal(paired.out_match_id, 456);
    assert.deepEqual(memory.get("ranked:waiters"), []);
    assert.deepEqual(notifications, [{ type: "match.found", matchId: 456 }]);
    assert.equal(memory.get("ranked:assignments")[A].matchId, 456);
    assert.equal(calls.filter(c => c.path.endsWith("/rpc/edge_ranked_queue_enter")).length, 2);
    assert.equal(calls.filter(c => c.path.endsWith("/rpc/edge_ranked_queue_pair")).length, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test("cancelling waiting A prevents the next B from pairing with A", async () => {
  const { hub, memory, notifications } = makeHub();
  const originalFetch = globalThis.fetch;
  const backendCalls = [];
  globalThis.fetch = async (url, opts = {}) => {
    const path = new URL(url).pathname;
    const userId = opts.headers?.authorization === "Bearer jwt-A" ? A : B;
    backendCalls.push(path);
    let result;
    if (path === "/auth/v1/user") result = { id: userId };
    else if (path.endsWith("/rpc/edge_ranked_queue_enter")) result = [{ state: "searching", out_match_id: null }];
    else if (path.endsWith("/rpc/edge_ranked_queue_cancel")) result = [{ state: "cancelled", out_match_id: null }];
    else if (path.endsWith("/rpc/edge_ranked_queue_pair")) throw Error("Cancelled A must not be selected");
    else throw Error("Unexpected " + path);
    return new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } });
  };
  const env = {
    SUPABASE_URL: "https://supabase.test", SUPABASE_ANON_KEY: "sb_publishable_test",
    TICKET_SECRET: "cancel-secret", PUBLIC_ORIGIN: "https://ranking8bp.github.io",
    HUB: { getByName: () => ({ fetch: req => hub.fetch(req) }) },
  };
  const request = (path, jwt, ticket) => worker.fetch(new Request("https://worker.test" + path, {
    method: "POST", headers: { Origin: "https://ranking8bp.github.io", authorization: "Bearer " + jwt },
    body: JSON.stringify(ticket ? { ticket } : {}),
  }), env);
  try {
    const a = await (await request("/api/ranked/search", "jwt-A")).json();
    assert.equal((await (await request("/api/ranked/ready", "jwt-A", a.ticket)).json()).state, "searching");
    assert.deepEqual(memory.get("ranked:waiters").map(x => x.userId), [A]);
    const cancelled = await request("/api/ranked/cancel", "jwt-A", a.ticket);
    assert.equal(cancelled.status, 200);
    assert.equal((await cancelled.json()).state, "cancelled");
    assert.deepEqual(memory.get("ranked:waiters"), []);
    // A delayed entry response cannot resurrect the previously cancelled ticket.
    const late = await request("/api/ranked/ready", "jwt-A", a.ticket);
    assert.equal((await late.json()).state, "cancelled");
    assert.deepEqual(memory.get("ranked:waiters"), []);
    const b = await (await request("/api/ranked/search", "jwt-B")).json();
    const readyB = await request("/api/ranked/ready", "jwt-B", b.ticket);
    assert.equal((await readyB.json()).state, "searching");
    assert.deepEqual(memory.get("ranked:waiters").map(x => x.userId), [B]);
    assert.equal(backendCalls.filter(x => x.endsWith("/rpc/edge_ranked_queue_pair")).length, 0);
    assert.deepEqual(notifications, []);
  } finally { globalThis.fetch = originalFetch; }
});

test("post-match cancellation cannot remove a ranked VS", async () => {
  const { hub } = makeHub();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url).pathname, "/rest/v1/rpc/edge_ranked_queue_cancel");
    return new Response(JSON.stringify([{ state: "matched", out_match_id: 456 }]), { status: 200 });
  };
  try {
    const response = await hub.fetch(new Request("https://hub.internal/ranked/cancel", {
      method: "POST", body: JSON.stringify({ userId: A, jwt: "jwt-A", nonce: "12345678-1234-4123-8123-123456789abc" }),
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { state: "matched", out_match_id: 456 });
  } finally { globalThis.fetch = originalFetch; }
});
