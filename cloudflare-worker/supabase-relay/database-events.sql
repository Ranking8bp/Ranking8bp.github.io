-- Ranking8BP: event-only, minimal-data change notifications.
-- Prerequisites (store privately, never in GitHub):
--   Vault secret named ranking8bp_relay_webhook_secret (random 32-byte value).
--   Edge Function ranking8bp-event-relay with RANKING_WEBHOOK_SECRET
--   equal to the Vault value; EVENT_SECRET equal to the Cloudflare value;
--   WORKER_URL = https://ranking8bp-server.ikarsolismonedas.workers.dev
-- Until the Vault secret exists, this function returns without sending events.
-- Changes to matches, points, ELO and player accounts remain with Supabase.
create extension if not exists pg_net with schema extensions;
create schema if not exists private;
revoke all on schema private from public;

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
  changed_fields boolean := false;
  webhook_secret text;
  match_id bigint;
begin
  if TG_TABLE_SCHEMA <> 'public' then return coalesce(NEW, OLD); end if;
  if TG_OP <> 'DELETE' then fresh := to_jsonb(NEW); end if;
  if TG_OP <> 'INSERT' then prior := to_jsonb(OLD); end if;

  if TG_OP = 'UPDATE' then
    -- Only invalidate on fields that actually affect standings or room state.
    if TG_TABLE_NAME = 'profiles' then
      foreach field_name in array array[
        'elo_points','rank_name','wins','losses','avatar_path',
        'username','account_name','country'
      ] loop
        if fresh->field_name is distinct from prior->field_name then
          changed_fields := true; exit;
        end if;
      end loop;
    elsif TG_TABLE_NAME = 'ranked_matches' then
      foreach field_name in array array['status','winner_id','loser_id','finished_at'] loop
        if fresh->field_name is distinct from prior->field_name then
          changed_fields := true; exit;
        end if;
      end loop;
    elsif TG_TABLE_NAME = 'daily_classification_matches' then
      foreach field_name in array array[
        'status','player1_claim','player2_claim','winner_id','finished_at'
      ] loop
        if fresh->field_name is distinct from prior->field_name then
          changed_fields := true; exit;
        end if;
      end loop;
    end if;
  else
    changed_fields := true;
  end if;

  if TG_TABLE_NAME = 'profiles' and changed_fields then
    events := events || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('feed','ranking'),
      pg_catalog.jsonb_build_object('feed','daily')
    );
  elsif TG_TABLE_NAME = 'ranked_matches' then
    if changed_fields then
      events := events || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('feed','ranking'));
    end if;
    match_id := coalesce((fresh->>'id')::bigint, (prior->>'id')::bigint);
    if match_id between 1 and 2147483647 then
      events := events || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('mode','ranked','room',match_id,'type','room.changed')
      );
    end if;
  elsif TG_TABLE_NAME = 'daily_classification_matches' then
    if changed_fields then
      events := events || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('feed','daily'));
    end if;
    match_id := coalesce((fresh->>'id')::bigint, (prior->>'id')::bigint);
    if match_id between 1 and 2147483647 then
      events := events || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('mode','daily','room',match_id,'type','room.changed')
      );
    end if;
  elsif TG_TABLE_NAME = 'ranked_match_messages' and TG_OP = 'INSERT' then
    match_id := (fresh->>'match_id')::bigint;
    if match_id between 1 and 2147483647 then
      events := events || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('mode','ranked','room',match_id,'type','chat.changed')
      );
    end if;
  elsif TG_TABLE_NAME = 'daily_classification_chat' and TG_OP = 'INSERT' then
    match_id := (fresh->>'match_id')::bigint;
    if match_id between 1 and 2147483647 then
      events := events || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('mode','daily','room',match_id,'type','chat.changed')
      );
    end if;
  elsif TG_TABLE_NAME = 'daily_classification_winners' then
    events := events || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('feed','daily'));
  end if;

  if pg_catalog.jsonb_array_length(events) = 0 then return coalesce(NEW, OLD); end if;

  -- Only webhook authentication (not the Worker event secret) touches pg_net.
  select ds.decrypted_secret into webhook_secret
  from vault.decrypted_secrets ds
  where ds.name = 'ranking8bp_relay_webhook_secret'
  limit 1;
  if webhook_secret is null or length(webhook_secret) < 32 then
    return coalesce(NEW, OLD);
  end if;

  perform net.http_post(
    url := 'https://xcrzxnshhamribnimsxc.supabase.co/functions/v1/ranking8bp-event-relay',
    body := pg_catalog.jsonb_build_object('events', events),
    headers := pg_catalog.jsonb_build_object(
      'Content-Type','application/json',
      'x-ranking-webhook-secret',webhook_secret
    ),
    timeout_milliseconds := 6500
  );
  return coalesce(NEW, OLD);
exception when others then
  -- Notifications must never prevent a game result, registration or chat write.
  raise log 'ranking8bp change notification skipped: %', SQLSTATE;
  return coalesce(NEW, OLD);
end;
$fn$;
revoke all on function private.ranking8bp_event_after_change() from public;

create trigger trg_ranking8bp_cloudflare_profiles
after insert or update or delete on public.profiles
for each row execute function private.ranking8bp_event_after_change();

create trigger trg_ranking8bp_cloudflare_ranked_matches
after insert or update or delete on public.ranked_matches
for each row execute function private.ranking8bp_event_after_change();

create trigger trg_ranking8bp_cloudflare_daily_matches
after insert or update or delete on public.daily_classification_matches
for each row execute function private.ranking8bp_event_after_change();

create trigger trg_ranking8bp_cloudflare_ranked_chat
after insert on public.ranked_match_messages
for each row execute function private.ranking8bp_event_after_change();

create trigger trg_ranking8bp_cloudflare_daily_chat
after insert on public.daily_classification_chat
for each row execute function private.ranking8bp_event_after_change();

create trigger trg_ranking8bp_cloudflare_daily_winners
after insert or update or delete on public.daily_classification_winners
for each row execute function private.ranking8bp_event_after_change();
