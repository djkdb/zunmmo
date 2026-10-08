"use client";

import { useActionState, useState } from "react";

import { ChoiceGroup } from "@/components/game/ChoiceGroup";
import { DifficultyPicker } from "@/components/game/DifficultyPicker";
import { QUEST_TYPE_META, STAT_META } from "@/components/game/quest-meta";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import {
  DEFAULT_DIFFICULTY,
  DEFAULT_STAT,
  type Difficulty,
  type GameDate,
  type RepeatRule,
  STATS,
  type Stat,
  WEEKDAYS,
  weekdayLabel,
} from "@/lib/game";
import { cn } from "@/lib/utils/cn";

import type { QuestFormState } from "../actions";
import { CREATABLE_TYPES, type CreatableType } from "../schemas";
import { deadlineChips } from "./date-chips";

export interface QuestFormValues {
  title: string;
  description: string | null;
  type: CreatableType;
  difficulty: Difficulty;
  primaryStat: Stat;
  deadline: GameDate | null;
  estimatedMinutes: number | null;
  repeat: RepeatRule | null;
  goalId: string | null;
}

interface QuestFormProps {
  action: (state: QuestFormState, formData: FormData) => Promise<QuestFormState>;
  today: GameDate;
  questlines: ReadonlyArray<{ id: string; title: string }>;
  initial?: Partial<QuestFormValues>;
  submitLabel: string;
}

type RepeatFreq = RepeatRule["freq"];

/**
 * Quick add first (title · type · difficulty · deadline), everything else behind "더 보기"
 * (GAME_MASTER §6). Server action re-validates everything with the domain schema.
 */
export function QuestForm({ action, today, questlines, initial, submitLabel }: QuestFormProps) {
  const [state, formAction, pending] = useActionState<QuestFormState, FormData>(action, null);
  const fieldError = (key: string) => (state && !state.ok ? state.error.fields?.[key] : undefined);

  const [type, setType] = useState<CreatableType>(initial?.type ?? "side");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initial?.difficulty ?? DEFAULT_DIFFICULTY[type],
  );
  const [stat, setStat] = useState<Stat>(initial?.primaryStat ?? DEFAULT_STAT[type]);
  const [touched, setTouched] = useState({
    difficulty: Boolean(initial?.difficulty),
    stat: Boolean(initial?.primaryStat),
  });
  const [deadline, setDeadline] = useState<string>(initial?.deadline ?? "");
  const [freq, setFreq] = useState<RepeatFreq>(initial?.repeat?.freq ?? "daily");
  const [weekdays, setWeekdays] = useState<number[]>(
    initial?.repeat?.freq === "weekly" ? initial.repeat.weekdays : [1, 2, 3, 4, 5],
  );
  const [goalChoice, setGoalChoice] = useState<string>(
    initial?.goalId ?? questlines[0]?.id ?? "new",
  );

  function chooseType(next: CreatableType) {
    setType(next);
    // Follow type defaults until the player picks a value themselves.
    if (!touched.difficulty) setDifficulty(DEFAULT_DIFFICULTY[next]);
    if (!touched.stat) setStat(DEFAULT_STAT[next]);
  }

  const v = (key: string) => state?.values?.[key];
  const generalError = state && !state.ok && !state.error.fields ? state.error.message : null;

  return (
    <form action={formAction} className="flex flex-col gap-7" noValidate>
      <TextField
        label="퀘스트 이름"
        name="title"
        defaultValue={v("title") ?? initial?.title}
        required
        maxLength={80}
        autoComplete="off"
        placeholder="예: AI 강의 3강 복습하기"
        hint="동사로 끝나면 더 잘 보여요."
        error={fieldError("title")}
      />

      <ChoiceGroup
        legend="종류"
        name="type"
        value={type}
        onChange={chooseType}
        columns={4}
        choices={CREATABLE_TYPES.map((t) => ({
          value: t,
          ariaLabel: QUEST_TYPE_META[t].ko,
          label: (
            <>
              <PixelIcon name={QUEST_TYPE_META[t].icon} />
              <span className="font-pixel text-pixel">{QUEST_TYPE_META[t].label}</span>
            </>
          ),
        }))}
        error={fieldError("type")}
      />

      <DifficultyPicker
        type={type}
        value={difficulty}
        onChange={(d) => {
          setDifficulty(d);
          setTouched((t) => ({ ...t, difficulty: true }));
        }}
      />

      {type === "main" && (
        <div className="flex flex-col gap-3">
          <Select
            label="메인 퀘스트라인"
            name="goalId"
            value={goalChoice}
            onChange={(e) => setGoalChoice(e.target.value)}
            error={fieldError("goalId")}
          >
            {questlines.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
            <option value="new">+ 새 퀘스트라인</option>
          </Select>
          {goalChoice === "new" && (
            <TextField
              label="새 퀘스트라인 이름"
              name="newGoalTitle"
              defaultValue={v("newGoalTitle")}
              maxLength={80}
              placeholder="예: 나만의 웹서비스 출시하기"
              error={fieldError("newGoalTitle")}
            />
          )}
        </div>
      )}

      {type === "daily" ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-small font-semibold text-text-secondary">반복</legend>
          <input type="hidden" name="repeatFreq" value={freq} />
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="반복 방식">
            {(
              [
                ["daily", "매일"],
                ["weekly", "요일 선택"],
                ["weekly_count", "주 N회"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={freq === value}
                onClick={() => setFreq(value)}
                className={cn(
                  "min-h-11 rounded-sm border px-4 text-small font-semibold",
                  freq === value
                    ? "border-accent bg-surface-raised text-text"
                    : "border-border-strong text-text-muted hover:text-text",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {freq === "weekly" && (
            <div className="flex gap-1.5" role="group" aria-label="반복 요일">
              {WEEKDAYS.map((day) => {
                const checked = weekdays.includes(day);
                return (
                  <label
                    key={day}
                    className={cn(
                      "relative flex size-11 cursor-pointer items-center justify-center rounded-sm border text-small font-semibold",
                      "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                      checked
                        ? "border-accent bg-accent text-on-accent"
                        : "border-border-strong text-text-muted",
                    )}
                  >
                    <input
                      type="checkbox"
                      name="weekdays"
                      value={day}
                      checked={checked}
                      onChange={() =>
                        setWeekdays((cur) =>
                          checked ? cur.filter((d) => d !== day) : [...cur, day],
                        )
                      }
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    {weekdayLabel(day)}
                  </label>
                );
              })}
            </div>
          )}
          {freq === "weekly_count" && (
            <Select
              label="일주일에 몇 번?"
              name="timesPerWeek"
              defaultValue={
                v("timesPerWeek") ??
                (initial?.repeat?.freq === "weekly_count"
                  ? String(initial.repeat.timesPerWeek)
                  : "3")
              }
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  주 {n}회
                </option>
              ))}
            </Select>
          )}
          {fieldError("repeat") && (
            <p className="text-caption text-danger-text">{fieldError("repeat")}</p>
          )}
        </fieldset>
      ) : (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-small font-semibold text-text-secondary">
            마감일{type === "boss" ? " (필수)" : ""}
          </legend>
          <div className="flex flex-wrap gap-2">
            {type !== "boss" && (
              <button
                type="button"
                onClick={() => setDeadline("")}
                aria-pressed={deadline === ""}
                className={cn(
                  "min-h-11 rounded-sm border px-3 text-small",
                  deadline === ""
                    ? "border-accent bg-surface-raised text-text"
                    : "border-border-strong text-text-muted",
                )}
              >
                없음
              </button>
            )}
            {deadlineChips(today).map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setDeadline(chip.date)}
                aria-pressed={deadline === chip.date}
                className={cn(
                  "min-h-11 rounded-sm border px-3 text-small",
                  deadline === chip.date
                    ? "border-accent bg-surface-raised text-text"
                    : "border-border-strong text-text-muted",
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <TextField
            label="직접 고르기"
            type="date"
            name="deadline"
            value={deadline}
            min={today}
            onChange={(e) => setDeadline(e.target.value)}
            error={fieldError("deadline")}
          />
        </fieldset>
      )}

      <details className="group flex flex-col gap-5 rounded-sm border border-border p-4 open:gap-6">
        <summary className="flex min-h-11 cursor-pointer items-center text-small font-semibold text-text-secondary">
          더 보기 — 스탯, 예상 시간, 메모
        </summary>
        <div className="mt-4 flex flex-col gap-6">
          <ChoiceGroup
            legend="성장할 스탯"
            name="primaryStat"
            value={stat}
            onChange={(s) => {
              setStat(s);
              setTouched((t) => ({ ...t, stat: true }));
            }}
            columns={5}
            choices={STATS.map((s) => ({
              value: s,
              ariaLabel: `${STAT_META[s].label} ${STAT_META[s].ko}`,
              label: (
                <>
                  <PixelIcon name={STAT_META[s].icon} />
                  <span className="font-pixel text-pixel">{STAT_META[s].label}</span>
                </>
              ),
            }))}
          />
          <TextField
            label="예상 시간 (분)"
            name="estimatedMinutes"
            type="number"
            inputMode="numeric"
            min={5}
            max={1440}
            step={5}
            defaultValue={v("estimatedMinutes") ?? initial?.estimatedMinutes ?? undefined}
            hint="오늘의 모험 추천이 하루 용량을 맞출 때 써요."
            error={fieldError("estimatedMinutes")}
          />
          {type !== "main" && questlines.length > 0 && (
            <Select
              label="메인 퀘스트라인과 연결 (선택)"
              name="goalId"
              defaultValue={v("goalId") ?? initial?.goalId ?? ""}
            >
              <option value="">연결 안 함</option>
              {questlines.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </Select>
          )}
          <Textarea
            label="메모"
            name="description"
            defaultValue={v("description") ?? initial?.description ?? undefined}
            maxLength={1000}
            error={fieldError("description")}
          />
        </div>
      </details>

      {generalError && (
        <p role="alert" className="text-small text-danger-text">
          {generalError}
        </p>
      )}

      <PixelButton type="submit" variant="accent" size="lg" block loading={pending}>
        {submitLabel}
      </PixelButton>
    </form>
  );
}
