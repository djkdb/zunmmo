-- Phase 10: players can delete their account and everything in it.
-- Every player table references auth.users with ON DELETE CASCADE, so removing the auth user
-- removes profiles, characters, stats, goals, quests, completions, the XP ledger, badges,
-- schedules and adventures in the same transaction. This is the one place ledger rows are
-- deleted: the player's right to erasure outranks "corrections only" (ARCHITECTURE §5.3).

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;
  delete from auth.users where id = v_user;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
