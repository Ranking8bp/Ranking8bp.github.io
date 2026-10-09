import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { TextEncoder } from "node:util";
const code = readFileSync(new URL("../supabase-relay/index.ts", import.meta.url), "utf8");
const validEnv = {
  RANKING_WEBHOOK_SECRET: "s".repeat(48),
  EVENT_SECRET: "e".repeat(48),
  WORKER_URL: "https://ranking8bp-server.ikarsolismonedas.workers.dev",
};
function setup(env = validEnv) {
  let handler;
  const requests = [];
  runInNewContext(code, {
    TextEncoder, Response, AbortSignal,
    Deno: { env: { get: key => env[key] }, serve: fn => { handler = fn; } },
    fetch: async (_url, data) => {
      requests.push(JSON.parse(data.body));
      return new Response("{}", { status: 200 });
    },
  });
  return { handler, requests };
}
function makeRequest(events, secret = validEnv.RANKING_WEBHOOK_SECRET) {
  return new Request("https://example.test/", {
    method: "POST",
    headers: { "x-ranking-webhook-secret": secret },
    body: JSON.stringify({ events }),
  });
}
test("relay refuses missing configuration", async () => {
  const { handler } = setup({});
  assert.equal((await handler(makeRequest([{ feed: "ranking" }]))).status, 503);
});
test("relay refuses unauthorized requests", async () => {
  const { handler, requests } = setup();
  assert.equal((await handler(makeRequest([{ feed: "ranking" }], "wrong"))).status, 401);
  assert.equal(requests.length, 0);
});
test("relay refuses invalid event types", async () => {
  const { handler, requests } = setup();
  assert.equal((await handler(makeRequest([{ feed: "unknown" }]))).status, 400);
  assert.equal((await handler(makeRequest([{ feed: "ranking", extra: "private data" }]))).status, 400);
  assert.equal(requests.length, 0);
});
test("relay sends only validated change events", async () => {
  const { handler, requests } = setup();
  const events = [{ feed: "daily" }, { mode: "ranked", room: 18, type: "chat.changed" }];
  assert.equal((await handler(makeRequest(events))).status, 200);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests.map(JSON.stringify), events.map(JSON.stringify));
});
