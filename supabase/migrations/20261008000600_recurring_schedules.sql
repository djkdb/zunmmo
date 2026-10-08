-- Weekly recurring schedules (classes, standing meetings) and single-occurrence skips.
-- A series is one row: its first occurrence is starts_at/ends_at (local wall time is kept for
-- every later occurrence), repeat_weekdays are ISO weekdays (1 = Mon … 7 = Sun), repeat_until
-- is the last local date (inclusive), and skip_dates are occurrences the player cancelled.
-- Occurrences are expanded in the app (features/calendar/recurrence.ts); nothing here moves XP.

alter table public.schedules
  add column repeat_weekdays smallint[]
    check (
      repeat_weekdays is null
      or (cardinality(repeat_weekdays) between 1 and 7
          and repeat_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[])
    ),
  add column repeat_until date,
  add column skip_dates date[] not null default '{}' check (cardinality(skip_dates) <= 366),
  add constraint schedules_until_needs_repeat check (repeat_until is null or repeat_weekdays is not null);

create index schedules_user_recurring_idx on public.schedules (user_id) where repeat_weekdays is not null;

grant insert (repeat_weekdays, repeat_until, skip_dates) on public.schedules to authenticated;
grant update (repeat_weekdays, repeat_until, skip_dates) on public.schedules to authenticated;
