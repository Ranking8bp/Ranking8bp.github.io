-- Stage 2: private event NOTIFICATIONS for the daily VS room canary.
-- No game data, chat content, player IDs or video is sent outside Supabase.
-- Called AFTER each relevant mutation; failures must never block gameplay.
-- All writes, authorization, match evaluation and ELO remain in Supabase.
-- Uses the existing Vault secret and deployed Edge Function relay.
-- This migration preserves existing public ranking feed triggers.
create or replace function private.ranking8bp_event_after_change()
returns trigger
language plpgsql security definer
set search_path = ''
as $fn$
declare
  events jsonb := '[]'::jsonb;
  fresh jsonb;
  prior jsonb;
  field_name text;
  feed_changed boolean := false;
  room_changed boolean := false;
  webhook_secret text;
  room_id bigint;
begin
  if TG_OP <> 'DELETE' then fresh := pg_catalog.to_jsonb(NEW); end if;
  if TG_OP <> 'INSERT' then prior := pg_catalog.to_jsonb(OLD); end if;

  if TG_OP = 'UPDATE' then
    if TG_TABLE_NAME = 'profiles' then
      foreach field_name in array array[
        'elo_points','rank_name','wins','losses','avatar_path',
        'username','account_name','country'
      ] loop
        if fresh->field_name is distinct from prior->field_name then
          feed_changed := true; exit;
        end if;
      end loop;
    elsif TG_TABLE_NAME = 'ranked_matches' then
      foreach field_name in array array[
        'status','winner_id','loser_id','finished_at'
      ] loop
        if fresh->field_name is distinct from prior->field_name then
          feed_changed := true; exit;
        end if;
      end loop;
    elsif TG_TABLE_NAME = 'daily_classification_matches' then
      foreach field_name in array array[
        'status','player1_claim','player2_claim','winner_id','finished_at'
      ] loop
        if fresh->field_name is distinct from prior->field_name then
          feed_changed := true; room_changed := true; exit;
        end if;
      end loop;
      if not room_changed then
        foreach field_name in array array[
          'player1_left_at','player2_left_at',
          'player1_exit_action','player2_exit_action',
          'rank_elo_awarded_amount','rank_elo_awarded_at'
        ] loop
          if fresh->field_name is distinct from prior->field_name then
            room_changed := true; exit;
          end if;
        end loop;
      end if;
    end if;
  elsif TG_TABLE_NAME = 'daily_classification_chat' then
    room_changed := TG_OP = 'INSERT';
  else
    feed_changed := true;
    if TG_TABLE_NAME = 'daily_classification_matches' then room_changed := true; end if;
  end if;

  if TG_TABLE_NAME = 'profiles' and feed_changed then
    events := events || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('feed','ranking'),
      pg_catalog.jsonb_build_object('feed','daily')
    );
  elsif TG_TABLE_NAME = 'ranked_matches' and feed_changed then
    events := events || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('feed','ranking')
    );
  elsif TG_TABLE_NAME = 'daily_classification_matches' then
    if feed_changed then
      events := events || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('feed','daily'));
    end if;
    if room_changed then
      room_id := pg_catalog.coalesce((fresh->>'id')::bigint,(prior->>'id')::bigint);
      if room_id between 1 and 2147483647 then
        events := events || pg_catalog.jsonb_build_array(
          pg_catalog.jsonb_build_object('mode','daily','room',room_id,'type','room.changed')
        );
      end if;
    end if;
  elsif TG_TABLE_NAME = 'daily_classification_chat' and room_changed then
    room_id := (fresh->>'match_id')::bigint;
    if room_id between 1 and 2147483647 then
      events := events || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('mode','daily','room',room_id,'type','chat.changed')
      );
    end if;
  elsif TG_TABLE_NAME = 'daily_classification_winners' and feed_changed then
    events := events || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('feed','daily')
    );
  end if;

  if pg_catalog.jsonb_array_length(events) = 0 then return null; end if;

  select ds.decrypted_secret into webhook_secret
    from vault.decrypted_secrets ds
   where ds.name = 'ranking8bp_relay_webhook_secret'
   limit 1;
  if webhook_secret is null or pg_catalog.length(webhook_secret) < 32 then return null; end if;

  perform net.http_post(
    url := 'https://xcrzxnshhamribnimsxc.supabase.co/functions/v1/ranking8bp-event-relay',
    body := pg_catalog.jsonb_build_object('events', events),
    headers := pg_catalog.jsonb_build_object(
      'Content-Type','application/json',
      'x-ranking-webhook-secret',webhook_secret
    ),
    timeout_milliseconds := 6500
  );
  return null; -- AFTER triggers ignore return values.
exception when others then
  raise log 'ranking8bp change event skipped (SQLSTATE %)', SQLSTATE;
  return null;
end;
$fn$;
revoke all on function private.ranking8bp_event_after_change() from public;

-- The existing matches trigger now sends BOTH feed and room notifications.
-- A new chat trigger only sends one small private room notification per new message.
create trigger trg_ranking8bp_cloudflare_daily_chat
after insert on public.daily_classification_chat
for each row execute function private.ranking8bp_event_after_change();

-- Emergency pause for room chat event (leave feed notifications functioning):
-- alter table public.daily_classification_chat disable trigger trg_ranking8bp_cloudflare_daily_chat;
-- To revert function behavior, reapply database-events.sql after disabling
-- this chat trigger; never delete any matches or chat messages.
