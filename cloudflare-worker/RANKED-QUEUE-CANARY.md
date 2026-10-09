# Ranked matchmaking — Cloudflare FIFO canary

Production is **unchanged by default**. Open `https://ranking8bp.github.io/?edgequeue=1` on
**both** test players' browsers after deploying the updated Worker and applying
`supabase-relay/ranked-edge-queue.sql`. Existing players without the flag
continue using the original matchmaking.

Flow:
1. The browser requests a signed 45-second search ticket from the Worker,
   using its own Supabase JWT.
2. It opens a private WebSocket with the ticket. Only after the socket is
   connected does it send the authenticated `/api/ranked/ready` request.
3. One `edge_ranked_queue_enter` RPC sets initial DB presence/eligibility;
   the FIFO of waiting, connected candidates lives in the Cloudflare Durable Object.
4. The new arrival is compared with the earliest connected waiter.
   `edge_ranked_queue_pair` performs the *authoritative*, advisory-locked
   checks for other active VS, pending daily matches, abandonment and one-hour
   rematch blocks, then inserts the official ranked match if eligible.
   If incompatible, the older player keeps their place and the next is tried.
5. The Worker sends each participant `match.found` with the match ID;
   the **existing** `get_fresh_ranked_room` RPC and UI render the same VS room.
   All chat, videos, results and ELO remain in Supabase.

The existing 60-second browser presence heartbeat is **still required** by
the legacy DB validity check; there are no 2-second repeated search RPCs
when the Cloudflare socket is healthy. Other background UI/room requests
are unchanged. Exact performance requires production measurements.

Important safety limitations:
- This is a canary, not a measured capacity guarantee.
- If the Worker, socket or new RPC fails, the same browser automatically
  falls back to the original 2-second (5-second when hidden) Supabase search.
- During the canary, **both test browsers should use `?edgequeue=1`**.
  Mixing canary and legacy players can delay detection because the legacy
  code can still select a player represented in the authoritative DB.
- Cloudflare only holds player IDs, time of joining and short-lived match
  IDs. It never stores passwords, JWTs, messages or game results.
- Do not activate for everybody until two-account, cancellation, reconnect,
  rematch-block, daily-room, and simultaneous-join tests pass.
- `GET /health` reports `rankedQueueCanary:true` once the Worker code is
  deployed; check it before testing the website.
- Remove `?edgequeue=1` to immediately return to the unaffected production
  matcher. Do not drop database functions while a canary VS is in progress.
