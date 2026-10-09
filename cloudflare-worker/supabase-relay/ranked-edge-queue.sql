-- Cloudflare FIFO ranking queue, canary only (?edgequeue=1).
-- Cloudflare chooses an earlier waiter. Supabase ONLY validates and inserts VS.
-- These new RPCs do not alter the legacy matchmaking or match outcomes.
-- Both functions run under the SAME advisory lock as find_ranked_opponent().
create or replace function public.edge_ranked_queue_enter()
returns table(state text, out_match_id bigint)
language plpgsql security definer set search_path to 'public'
as $fn$
declare
  me uuid := auth.uid();
  mid bigint;
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(824210);

  -- Preserve the original safety check: no new ranking match while an
  -- unresolved daily-classification room exists.
  if exists (
    select 1 from public.daily_classification_matches dm
    where dm.day between ((now() at time zone 'America/Mexico_City')::date - 1)
                      and (now() at time zone 'America/Mexico_City')::date
      and dm.status='matched'
      and ((dm.player1_id=me and dm.player1_claim is null and dm.player1_left_at is null)
        or (dm.player2_id=me and dm.player2_claim is null and dm.player2_left_at is null))
  ) then raise exception 'DAILY_CLASSIFICATION_PENDING'; end if;

  select m.id into mid
  from public.ranked_matches m
  where me in(m.player1_id,m.player2_id)
    and m.status in('matched','review')
    and (case when me=m.player1_id then m.player1_claim else m.player2_claim end) is null
    and (case when me=m.player1_id then not coalesce(m.player1_left_room,false)
          else not coalesce(m.player2_left_room,false) end)
  order by m.created_at desc limit 1;

  if mid is not null then
    delete from public.ranked_waiting_room where player_id=me;
    return query select 'matched'::text,mid; return;
  end if;

  insert into public.ranked_search_presence(player_id,last_seen)
  values(me,clock_timestamp())
  on conflict(player_id) do update set last_seen=excluded.last_seen;
  insert into public.ranked_waiting_room(player_id,joined_at,match_id)
  values(me,clock_timestamp(),null)
  on conflict(player_id) do update
    set match_id=null,
        joined_at=case when public.ranked_waiting_room.match_id is null
                       then public.ranked_waiting_room.joined_at else excluded.joined_at end;
  return query select 'searching'::text,null::bigint;
end
$fn$;

create or replace function public.edge_ranked_queue_pair(p_opponent_id uuid)
returns table(state text, out_match_id bigint)
language plpgsql security definer set search_path to 'public'
as $fn$
declare
  me uuid := auth.uid();
  mid bigint;
  my_joined timestamptz;
  opp_joined timestamptz;
  my_elo integer;
  opp_elo integer;
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_opponent_id is null or p_opponent_id=me then
    return query select 'ineligible'::text,null::bigint; return;
  end if;
  perform pg_advisory_xact_lock(824210);

  -- Idempotency if another request already created my VS.
  select m.id into mid from public.ranked_matches m
  where me in(m.player1_id,m.player2_id)
    and m.status in('matched','review')
    and (case when me=m.player1_id then m.player1_claim else m.player2_claim end) is null
    and (case when me=m.player1_id then not coalesce(m.player1_left_room,false)
          else not coalesce(m.player2_left_room,false) end)
  order by m.created_at desc limit 1;
  if mid is not null then
    return query select 'matched'::text,mid; return;
  end if;

  -- Both players MUST have deliberately entered and still have live presence.
  select q.joined_at into my_joined from public.ranked_waiting_room q
   join public.ranked_search_presence sp on sp.player_id=q.player_id
    and sp.last_seen>now()-interval '90 seconds'
   where q.player_id=me and q.match_id is null;
  select q.joined_at into opp_joined from public.ranked_waiting_room q
   join public.ranked_search_presence sp on sp.player_id=q.player_id
    and sp.last_seen>now()-interval '90 seconds'
   where q.player_id=p_opponent_id and q.match_id is null;
  if my_joined is null or opp_joined is null or opp_joined>=my_joined then
    return query select 'ineligible'::text,null::bigint; return;
  end if;

  -- Reject pending daily-classification VS for EITHER user.
  if exists (
    select 1 from public.daily_classification_matches dm
    where dm.day between ((now() at time zone 'America/Mexico_City')::date - 1)
                      and (now() at time zone 'America/Mexico_City')::date
      and dm.status='matched'
      and ((dm.player1_id in(me,p_opponent_id) and dm.player1_claim is null and dm.player1_left_at is null)
        or (dm.player2_id in(me,p_opponent_id) and dm.player2_claim is null and dm.player2_left_at is null))
  ) then return query select 'ineligible'::text,null::bigint; return; end if;

  -- Same active-match definition as the original FIFO RPC.
  if exists (
    select 1 from public.ranked_matches r
    where p_opponent_id in(r.player1_id,r.player2_id)
      and r.status in('matched','review')
      and (case when p_opponent_id=r.player1_id then r.player1_claim else r.player2_claim end) is null
      and (case when p_opponent_id=r.player1_id then not coalesce(r.player1_left_room,false)
                else not coalesce(r.player2_left_room,false) end)
  ) then return query select 'ineligible'::text,null::bigint; return; end if;

  if exists (
    select 1 from public.ranked_abandon_blocks ab
    where ab.blocked_until>now()
      and ((ab.player_id=me and ab.blocked_player_id=p_opponent_id)
        or (ab.player_id=p_opponent_id and ab.blocked_player_id=me))
  ) or exists (
    select 1 from public.ranked_matches r
    where r.status='finished' and r.finished_at>now()-interval '1 hour'
      and ((r.player1_id=me and r.player2_id=p_opponent_id)
        or (r.player2_id=me and r.player1_id=p_opponent_id))
  ) then return query select 'ineligible'::text,null::bigint; return; end if;

  select coalesce(p.elo_points,200) into my_elo from public.profiles p where p.id=me;
  select coalesce(p.elo_points,200) into opp_elo from public.profiles p where p.id=p_opponent_id;
  if my_elo is null or opp_elo is null then
    return query select 'ineligible'::text,null::bigint; return;
  end if;

  insert into public.ranked_matches(player1_id,player2_id,player1_elo,player2_elo,status,created_at)
  values(p_opponent_id,me,opp_elo,my_elo,'matched',clock_timestamp())
  returning id into mid;
  update public.ranked_waiting_room q set match_id=mid
  where q.player_id in(me,p_opponent_id);
  return query select 'matched'::text,mid;
end
$fn$;

revoke all on function public.edge_ranked_queue_enter() from public, anon;
revoke all on function public.edge_ranked_queue_pair(uuid) from public, anon;
grant execute on function public.edge_ranked_queue_enter() to authenticated;
grant execute on function public.edge_ranked_queue_pair(uuid) to authenticated;

-- To disable this canary, keep the DB functions but omit ?edgequeue=1.
-- Does not affect the existing find_ranked_opponent() or matchmaking_v2_cancel().
