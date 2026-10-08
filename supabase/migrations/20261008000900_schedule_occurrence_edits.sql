-- Change one occurrence of a weekly series ("이번만 시간 변경"). The changed occurrence becomes
-- its own one-off row that remembers where it came from (series_id + occurrence_date), and the
-- series skips that date — so listing schedules needs no extra query. Deleting the series
-- removes its changed occurrences too. restore_occurrence() puts the original back.
-- Both writes happen in one function so the occurrence is never shown twice or lost.
-- Nothing here moves XP.

alter table public.schedules
  add column series_id uuid references public.schedules (id) on delete cascade,
  add column occurrence_date date,
  add constraint schedules_occurrence_shape check (
    (series_id is null) = (occurrence_date is null)
    and (series_id is null or repeat_weekdays is null)
  );

create unique index schedules_series_occurrence_key
  on public.schedules (series_id, occurrence_date)
  where series_id is not null;

-- series_id / occurrence_date are written only by the functions below (no column grants).

create function public.edit_occurrence(
  p_series_id uuid,
  p_date date,
  p_title text,
  p_starts_at timestamptz,
  p_all_day boolean,
  p_ends_at timestamptz default null,
  p_location text default null,
  p_quest_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_series public.schedules;
  v_tz text;
  v_first date;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  select * into v_series from public.schedules
   where id = p_series_id and user_id = v_user and repeat_weekdays is not null
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  -- The date must be a real, not yet changed or skipped occurrence of the series.
  select timezone into v_tz from public.profiles where id = v_user;
  v_first := (v_series.starts_at at time zone v_tz)::date;
  if p_date < v_first
     or (v_series.repeat_until is not null and p_date > v_series.repeat_until)
     or not (extract(isodow from p_date)::smallint = any (v_series.repeat_weekdays))
     or p_date = any (v_series.skip_dates) then
    raise exception 'VALIDATION_FAILED' using errcode = '22023';
  end if;

  if p_quest_id is not null and not exists (
    select 1 from public.quests q where q.id = p_quest_id and q.user_id = v_user
  ) then
    raise exception 'VALIDATION_FAILED' using errcode = '22023';
  end if;

  insert into public.schedules (
    user_id, title, starts_at, ends_at, all_day, location, quest_id, series_id, occurrence_date
  ) values (
    v_user, p_title, p_starts_at, p_ends_at, p_all_day, p_location, p_quest_id,
    v_series.id, p_date
  ) returning id into v_id;

  update public.schedules
     set skip_dates = (select array_agg(d order by d) from unnest(skip_dates || p_date) d)
   where id = v_series.id;

  return v_id;
end;
$$;

create function public.restore_occurrence(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_row public.schedules;
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  delete from public.schedules
   where id = p_id and user_id = v_user and series_id is not null
   returning * into v_row;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  update public.schedules
     set skip_dates = array_remove(skip_dates, v_row.occurrence_date)
   where id = v_row.series_id and user_id = v_user;

  return v_row.series_id;
end;
$$;

revoke all on function public.edit_occurrence(uuid, date, text, timestamptz, boolean, timestamptz, text, uuid) from public, anon;
grant execute on function public.edit_occurrence(uuid, date, text, timestamptz, boolean, timestamptz, text, uuid) to authenticated;
revoke all on function public.restore_occurrence(uuid) from public, anon;
grant execute on function public.restore_occurrence(uuid) to authenticated;
