-- Safe, additive cancellation for the Cloudflare ranked-search canary.
-- Serialize against both legacy and Cloudflare match creation using lock 824210.
-- IMPORTANT: a VS that was already created is NEVER cancelled by this function.
create or replace function public.edge_ranked_queue_cancel()
returns table(state text, out_match_id bigint)
language plpgsql security definer set search_path to 'public'
as $fn$
declare
  me uuid := auth.uid();
  mid bigint;
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(824210);
  select m.id into mid from public.ranked_matches m
  where me in(m.player1_id,m.player2_id)
    and m.status in('matched','review')
    and (case when me=m.player1_id then m.player1_claim else m.player2_claim end) is null
    and (case when me=m.player1_id then not coalesce(m.player1_left_room,false)
          else not coalesce(m.player2_left_room,false) end)
  order by m.created_at desc limit 1;

  delete from public.ranked_search_presence where player_id=me;
  delete from public.ranked_waiting_room where player_id=me;

  if mid is not null then
    return query select 'matched'::text,mid;
  else
    return query select 'cancelled'::text,null::bigint;
  end if;
end
$fn$;
revoke all on function public.edge_ranked_queue_cancel() from public, anon;
grant execute on function public.edge_ranked_queue_cancel() to authenticated;
