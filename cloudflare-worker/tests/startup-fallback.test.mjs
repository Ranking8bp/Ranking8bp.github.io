import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const block = html.match(/<div id="rankingReloadFallback"[\s\S]*?<script>([\s\S]*?)<\/script>/);
assert.ok(block, "Startup fallback script must exist");

function runStartup(savedAuth) {
  let now = 0;
  const timers = [];
  const fallback = { style: { display: "none" } };
  const guest = { hidden: true };
  const dashboard = { hidden: true };
  const topbar = { hidden: true };
  const ui = new Map([
    ["rankingReloadFallback", fallback],
    ["guestEmpty", guest],
    ["playerDashboard", dashboard],
    ["guestTopbar", topbar],
  ]);
  const removed = [];
  const session = savedAuth ? "saved-user-session" : null;
  const context = {
    Date: { now: () => now },
    document: {
      getElementById: key => ui.get(key),
      documentElement: { classList: { remove: key => removed.push(key) } },
      hidden: false,
      addEventListener() {},
    },
    window: { ranking8bpViewReady: false, addEventListener() {} },
    localStorage: { getItem: key => key === "ranking8bp-auth" ? session : null },
    setTimeout: fn => { timers.push(fn); return 1; },
    setInterval: fn => { timers.push(fn); return 2; },
  };
  runInNewContext(block[1], context);
  return { fallback, guest, dashboard, topbar, removed, session, timers, context, advance: ms => { now = ms; timers.forEach(fn => fn()); } };
}

test("no blocking overlay appears during ordinary first 8 seconds", () => {
  const app = runStartup(true);
  app.advance(8000);
  assert.equal(app.fallback.style.display, "none");
  assert.equal(app.guest.hidden, true);
  assert.equal(app.dashboard.hidden, true);
  assert.match(html, /position:fixed;bottom:16px/);
  assert.doesNotMatch(block[0], /position:fixed;inset:0/);
});

test("auth delay shows public ranking without clearing a saved session", () => {
  const app = runStartup(true);
  app.advance(13000);
  assert.equal(app.guest.hidden, false, "public content becomes visible");
  assert.equal(app.topbar.hidden, true, "do not pretend the saved session was signed out");
  assert.equal(app.fallback.style.display, "flex");
  assert.deepEqual(app.removed, ["auth-checking", "auth-checking"]);
  assert.equal(app.session, "saved-user-session");
  app.context.window.ranking8bpViewReady = true;
  app.advance(16000);
  assert.equal(app.fallback.style.display, "none", "notice disappears when real UI is ready");
});

test("without a saved session, late fallback shows login and public ranking", () => {
  const app = runStartup(false);
  app.advance(13000);
  assert.equal(app.guest.hidden, false);
  assert.equal(app.topbar.hidden, false);
});
