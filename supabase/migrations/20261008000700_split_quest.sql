-- Split a quest that is too big for one day into smaller steps (GAME_MASTER §7).
-- The first part replaces the original row (schedules and today's adventure keep pointing at
-- it); the others are inserted right after it in the same questline. Steps are ordered by
-- (created_at, sort_order), so the parts share the original's created_at and later siblings
-- that share it move down. Part XP comes from lib/game splitPlan() in the server action and is
-- bounded here like any quest (ARCHITECTURE §5.3). Nothing is completed, so no XP moves.

create function public.split_quest(p_quest_id uuid, p_parts jsonb)
returns setof uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_quest public.quests;
  v_count integer;
  v_part jsonb;
  v_index integer := 0;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  select * into v_quest from public.quests where id = p_quest_id and user_id = v_user for update;
  if not found then
    raise exception 'QUEST_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_quest.status <> 'active' or v_quest.type not in ('main', 'side')
     or exists (select 1 from public.quest_completions c where c.quest_id = v_quest.id) then
    raise exception 'QUEST_NOT_SPLITTABLE' using errcode = 'P0001';
  end if;

  if jsonb_typeof(p_parts) <> 'array' then
    raise exception 'VALIDATION_FAILED' using errcode = '22023';
  end if;
  v_count := jsonb_array_length(p_parts);
  if v_count < 2 or v_count > 6 then
    raise exception 'VALIDATION_FAILED' using errcode = '22023';
  end if;

  -- Make room after the original among quests created in the same instant.
  update public.quests
     set sort_order = sort_order + (v_count - 1)
   where user_id = v_user
     and created_at = v_quest.created_at
     and sort_order > v_quest.sort_order
     and id <> v_quest.id;

  for v_part in select * from jsonb_array_elements(p_parts) loop
    if v_index = 0 then
      update public.quests
         set title = v_part ->> 'title',
             difficulty = (v_part ->> 'difficulty')::smallint,
             xp = (v_part ->> 'xp')::integer,
             estimated_minutes = (v_part ->> 'estimated_minutes')::smallint
       where id = v_quest.id;
      return next v_quest.id;
    else
      insert into public.quests (
        user_id, goal_id, title, description, type, difficulty, xp, primary_stat, deadline,
        estimated_minutes, sort_order, source, created_at
      ) values (
        v_user, v_quest.goal_id, v_part ->> 'title', null, v_quest.type,
        (v_part ->> 'difficulty')::smallint, (v_part ->> 'xp')::integer, v_quest.primary_stat,
        v_quest.deadline, (v_part ->> 'estimated_minutes')::smallint,
        v_quest.sort_order + v_index, v_quest.source, v_quest.created_at
      ) returning id into v_id;
      return next v_id;
    end if;
    v_index := v_index + 1;
  end loop;
end;
$$;

revoke all on function public.split_quest(uuid, jsonb) from public, anon;
grant execute on function public.split_quest(uuid, jsonb) to authenticated;
