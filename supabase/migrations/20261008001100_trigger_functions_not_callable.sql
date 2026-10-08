-- Trigger-only functions are not RPCs. Postgres grants EXECUTE to PUBLIC by default, so
-- PostgREST listed them under /rest/v1/rpc (the Supabase security advisor flags this).
-- Calling one outside a trigger only errors, but nothing should expose them.

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.quests_check_goal_owner() from public, anon, authenticated;
