import test from "node:test";
import assert from "node:assert/strict";
import { Ranking8bpEdgeClient } from "../client/edge-client.js";

test("Cloudflare search reconnects instead of closing search after transient WebSocket loss", async () => {
  const previousFetch = globalThis.fetch;
  const previousSocket = globalThis.WebSocket;
  let connections = 0, enters = 0, ready = 0;
  class MockSocket {
    static OPEN = 1;
    constructor() {
      this.readyState = 0;
      this.n = ++connections;
      queueMicrotask(() => {
        this.readyState = MockSocket.OPEN;
        this.onopen?.();
        setTimeout(() => {
          if (this.readyState !== MockSocket.OPEN) return;
          if (this.n === 1) {
            this.readyState = 3;
            this.onclose?.();
          } else {
            this.onmessage?.({ data: JSON.stringify({ type: "match.found", matchId: 912 }) });
          }
        }, 50);
      });
    }
    send() {}
    close() { this.readyState = 3; }
  }
  globalThis.WebSocket = MockSocket;
  globalThis.fetch = async url => {
    const path = new URL(url).pathname;
    if (path === "/api/ranked/search") {
      enters++;
      return new Response(JSON.stringify({ state: "connect", ticket: "signed-ticket" }), { status: 200 });
    }
    if (path === "/api/ranked/ready") {
      ready++;
      return new Response(JSON.stringify({ state: "searching" }), { status: 200 });
    }
    throw Error("Unexpected endpoint: " + path);
  };
  try {
    const client = new Ranking8bpEdgeClient({
      baseUrl: "https://worker.test",
      supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token-A" } } }) } },
    });
    const answer = await client.waitForRankedMatch();
    assert.deepEqual(answer, { state: "matched", out_match_id: 912 });
    assert.equal(connections, 2, "same search must reconnect without user pressing JUGAR");
    assert.equal(enters, 2);
    assert.equal(ready, 2);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousSocket === undefined) delete globalThis.WebSocket;
    else globalThis.WebSocket = previousSocket;
  }
});
