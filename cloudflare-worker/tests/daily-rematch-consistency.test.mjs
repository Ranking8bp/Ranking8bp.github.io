import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../supabase-relay/daily-unified-rematch-locks.sql", import.meta.url), "utf8");
const app = readFileSync(new URL("../../app-v5.js", import.meta.url), "utf8");

test("legacy daily matchmaking excludes interacted 12-hour rematches", () => {
  const first = sql.slice(sql.indexOf("CREATE OR REPLACE FUNCTION public.daily_classification_find"),sql.indexOf("CREATE OR REPLACE FUNCTION public.daily_classification_accept_invite"));
  assert.match(first,/pg_advisory_xact_lock\(992834\)/);
  assert.match(first,/recent\.created_at>now\(\)-interval '12 hours'/);
  assert.match(first,/recent\.player1_id=me and recent\.player2_id=q\.player_id/);
  assert.match(first,/recent\.player2_id=me and recent\.player1_id=q\.player_id/);
  assert.match(first,/recent\.player1_claim is not null/);
  assert.match(first,/recent\.player2_claim is not null/);
  assert.match(first,/recent\.player1_exit_action is not null/);
  assert.match(first,/recent\.player2_exit_action is not null/);
  assert.match(first,/daily_classification_evidence/);
  assert.match(first,/order by q\.joined_at limit 1;/);
  assert.match(first,/day between d-1 and d and status='matched'/);
});

test("invitation acceptance shares Cloudflare lock and cannot bypass rematch restriction", () => {
  const fn = sql.slice(sql.indexOf("CREATE OR REPLACE FUNCTION public.daily_classification_accept_invite"));
  assert.match(fn,/pg_advisory_xact_lock\(992834\)/);
  assert.doesNotMatch(fn,/pg_advisory_xact_lock\(992835\)/);
  assert.match(fn,/REMATCH_BLOCKED_12H/);
  assert.match(fn,/m\.created_at>now\(\)-interval '12 hours'/);
  assert.match(fn,/m\.player1_claim is not null/);
  assert.match(fn,/m\.player2_claim is not null/);
  assert.match(fn,/ACTIVE_DAILY_MATCH/);
});

test("reviewed videos are still available for admin decision and never marked playing", () => {
  assert.match(app,/const dailyAdminMatchLabel=m=>m\.status==='disputed'\|\|m\.player1_claim!=null\|\|m\.player2_claim!=null/);
  assert.match(app,/\?'EN REVISIÓN'/);
  assert.match(app,/playingCount=rows\.filter/);
  assert.match(app,/reviewCount=rows\.length-playingCount/);
  assert.match(app,/dailyAdminMatchLabel\(m\)/);
  assert.doesNotMatch(sql,/DELETE FROM public\.daily_classification_matches/i);
  assert.doesNotMatch(sql,/UPDATE public\.daily_classification_matches/i);
});
