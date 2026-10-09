-- Unify daily match eligibility between Cloudflare FIFO, legacy Supabase search
-- and private invitations. Keeps all existing VS, claims, evidence and ELO.
-- Replaces ONLY these two SECURITY DEFINER functions (no data updates).
CREATE OR REPLACE FUNCTION public.daily_classification_find()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid:=auth.uid();d date:=(now() at time zone 'America/Mexico_City')::date;opp uuid;mid bigint;cnt int;elo int;
begin
 if me is null then raise exception 'AUTH_REQUIRED';end if;
 PERFORM public.cancel_expired_daily_classification_matches();
 perform pg_advisory_xact_lock(992834);

 select count(*) into cnt from daily_classification_matches where day=d and (status in ('finished','disputed') or (status='matched' and (player1_claim is not null or player2_claim is not null))) and (player1_id=me or player2_id=me);
 if cnt>=15 then raise exception 'DAILY_LIMIT_15';end if;
 select id into mid from daily_classification_matches where day between d-1 and d and status='matched' and ((player1_id=me and player1_claim is null and player1_left_at is null) or (player2_id=me and player2_claim is null and player2_left_at is null)) order by id desc limit 1;
 if mid is not null then return jsonb_build_object('state','matched','match_id',mid);end if;
 insert into daily_classification_queue(player_id,joined_at,last_seen,match_id) values(me,now(),now(),null)
 on conflict(player_id) do update set last_seen=now(),match_id=null,joined_at=case when daily_classification_queue.match_id is null then daily_classification_queue.joined_at else now() end;
 select q.player_id into opp from daily_classification_queue q join profiles p on p.id=q.player_id
 where q.player_id<>me and q.match_id is null and q.last_seen>now()-interval '20 seconds'
 and (select count(*) from daily_classification_matches m where m.day=d and (m.status in ('finished','disputed') or (m.status='matched' and (m.player1_claim is not null or m.player2_claim is not null))) and (m.player1_id=q.player_id or m.player2_id=q.player_id))<15
 and not exists(select 1 from daily_classification_matches m where m.day between d-1 and d and m.status='matched' and ((m.player1_id=q.player_id and m.player1_claim is null and m.player1_left_at is null) or (m.player2_id=q.player_id and m.player2_claim is null and m.player2_left_at is null)))
 -- Apply the SAME 12-hour rematch protection as Cloudflare's daily pairing RPC.
 -- A merely matched room with no action is not blocked, but any result,
 -- abandonment or uploaded evidence prevents a repeated opponent for 12 hours.
 and not exists (
   select 1 from daily_classification_matches recent
   where recent.created_at>now()-interval '12 hours'
     and ((recent.player1_id=me and recent.player2_id=q.player_id)
       or (recent.player2_id=me and recent.player1_id=q.player_id))
     and (recent.status <> 'matched'
       or recent.player1_claim is not null or recent.player2_claim is not null
       or recent.player1_exit_action is not null or recent.player2_exit_action is not null
       or recent.player1_left_at is not null or recent.player2_left_at is not null
       or exists(select 1 from public.daily_classification_evidence e where e.match_id=recent.id))
 )
 order by q.joined_at limit 1;
 if opp is null then return jsonb_build_object('state','searching');end if;
 insert into daily_classification_matches(day,player1_id,player2_id) values(d,opp,me) returning id into mid;
 update daily_classification_queue set match_id=mid where player_id in(me,opp);
 return jsonb_build_object('state','matched','match_id',mid);
end $function$;

CREATE OR REPLACE FUNCTION public.daily_classification_accept_invite(p_token uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid:=auth.uid();i record; mid bigint;elo int; played int;d date:=(now() at time zone 'America/Mexico_City')::date;
begin
 if me is null then raise exception 'AUTH_REQUIRED';end if;
 perform public.cancel_expired_daily_classification_matches();
 perform pg_advisory_xact_lock(992834);
 select * into i from daily_classification_invites where token=p_token for update;
 if not found or i.cancelled_at is not null or i.expires_at<now() or i.day<>d or i.accepted_by is not null then raise exception 'INVITE_EXPIRED_OR_USED';end if;
 if i.creator_id=me then raise exception 'CANNOT_JOIN_OWN_INVITE';end if;
 if exists(select 1 from daily_classification_matches where day between d-1 and d and status='matched'
    and ((player1_id in(me,i.creator_id) and player1_claim is null and player1_left_at is null)
      or (player2_id in(me,i.creator_id) and player2_claim is null and player2_left_at is null)))
   then raise exception 'ACTIVE_DAILY_MATCH';end if;
 -- An invite cannot bypass the 12-hour rule enforced in both search queues.
 if exists(select 1 from daily_classification_matches m
    where m.created_at>now()-interval '12 hours'
      and ((m.player1_id=me and m.player2_id=i.creator_id)
        or (m.player2_id=me and m.player1_id=i.creator_id))
      and (m.status<>'matched' or m.player1_claim is not null or m.player2_claim is not null
        or m.player1_exit_action is not null or m.player2_exit_action is not null
        or m.player1_left_at is not null or m.player2_left_at is not null
        or exists(select 1 from public.daily_classification_evidence e where e.match_id=m.id)))
   then raise exception 'REMATCH_BLOCKED_12H';end if;
 if exists(select 1 from daily_classification_invites where creator_id=i.creator_id and token<>p_token and accepted_by is not null and match_id is not null and day=d and created_at>i.created_at) then raise exception 'INVITE_EXPIRED_OR_USED';end if;


 select count(*) into played from daily_classification_matches where day=d and (status in ('finished','disputed') or (status='matched' and (player1_claim is not null or player2_claim is not null))) and me in(player1_id,player2_id);
 if played>=15 then raise exception 'DAILY_LIMIT_15';end if;
 select count(*) into played from daily_classification_matches where day=d and (status in ('finished','disputed') or (status='matched' and (player1_claim is not null or player2_claim is not null))) and i.creator_id in(player1_id,player2_id);
 if played>=15 then raise exception 'CREATOR_DAILY_LIMIT_15';end if;
 insert into daily_classification_matches(day,player1_id,player2_id) values(d,i.creator_id,me) returning id into mid;
 update daily_classification_invites set accepted_by=me,match_id=mid where token=p_token;
 delete from daily_classification_queue where player_id in(me,i.creator_id);
 return mid;
end $function$;
