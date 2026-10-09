-- Ranking8BP / Cloudflare: stage 1 - low-volume public feed invalidation.
-- SQL intentionally leaves room/chat triggers DISABLED until browser room sockets go live.
-- Vault secret: ranking8bp_relay_webhook_secret, equal to RANKING_WEBHOOK_SECRET
-- in Supabase Edge Functions. EVENT_SECRET is shared with Cloudflare.
-- This is an AFTER-row trigger: never modifies player scores or match outcomes.
-- pg_net is async. To stop notifications immediately, disable four triggers below.
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

  -- Skip all unchanged state/heartbeat updates BEFORE touching Vault or pg_net.
  if not changed_fields then return null; end if;

  if TG_TABLE_NAME = 'profiles' then
    events := pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('feed','ranking'),
      pg_catalog.jsonb_build_object('feed','daily')
    );
  elsif TG_TABLE_NAME = 'ranked_matches' then
    events := pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('feed','ranking'));
  elsif TG_TABLE_NAME = 'daily_classification_matches'
      or TG_TABLE_NAME = 'daily_classification_winners' then
    events := pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('feed','daily'));
  end if;
  if pg_catalog.jsonb_array_length(events) = 0 then return null; end if;

  select ds.decrypted_secret into webhook_secret
    from vault.decrypted_secrets ds
   where ds.name = 'ranking8bp_relay_webhook_secret'
   limit 1;
  if webhook_secret is null or pg_catalog.length(webhook_secret) < 32 then
    return null;
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
  return null; -- AFTER trigger return values are ignored.
exception when others then
  -- NEVER fail registration, chat, a match or ELO because a notification fails.
  raise log 'ranking8bp feed notification skipped (SQLSTATE %)', SQLSTATE;
  return null;
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

create trigger trg_ranking8bp_cloudflare_daily_winners
after insert or update or delete on public.daily_classification_winners
for each row execute function private.ranking8bp_event_after_change();

-- Emergency pause (not executed by this migration):
-- alter table public.profiles disable trigger trg_ranking8bp_cloudflare_profiles;
-- alter table public.ranked_matches disable trigger trg_ranking8bp_cloudflare_ranked_matches;
-- alter table public.daily_classification_matches disable trigger trg_ranking8bp_cloudflare_daily_matches;
-- alter table public.daily_classification_winners disable trigger trg_ranking8bp_cloudflare_daily_winners;
