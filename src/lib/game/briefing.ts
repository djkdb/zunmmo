import { COMEBACK_GAP_DAYS, LATE_NIGHT_END_HOUR } from "./recommend";
import { type GameDate, daysBetween } from "./time";

/** Character states the GM can ask for (CHARACTER_GUIDE §5; the UI resolves undrawn ones). */
export type CharacterMood = "idle" | "thinking" | "celebrating" | "sleeping" | "surprised";

/**
 * GAME_MASTER §4 — the GM's line for the day. Pick the highest-priority situation, then a
 * sentence from its pool chosen by the date (same day → same line). Words only encourage.
 */
export type BriefingSituation =
  "late_night" | "boss_today" | "boss_soon" | "streak" | "comeback" | "light_day" | "default";

export interface BriefingInput {
  today: GameDate;
  /** Local hour 0–23 right now (for the late-night rest line). */
  localHour: number;
  completedToday: number;
  /** Nearest open boss and its deadline. */
  boss: { title: string; deadline: GameDate } | null;
  adventureStreak: number;
  lastPlayedDate: GameDate | null;
  /** Minutes of today's picks. */
  totalMinutes: number;
  pickCount: number;
}

export interface Briefing {
  situation: BriefingSituation;
  line: string;
  mood: CharacterMood;
}

type Fill = { boss?: string; n?: number };

/**
 * Korean particle after a word: `josa("과제 제출", "이", "가")` → "과제 제출이".
 * Non-Hangul endings (English, digits) get the neutral "이(가)" form.
 */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const last = word.trim().at(-1) ?? "";
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return `${word}${withFinal}(${withoutFinal})`;
  return `${word}${code % 28 === 0 ? withoutFinal : withFinal}`;
}

const POOLS: Record<BriefingSituation, ReadonlyArray<(f: Fill) => string>> = {
  late_night: [
    () => "늦은 밤이야. 꼭 필요한 것만 짧게 하고 푹 쉬자. 쉬는 것도 모험의 일부야.",
    () => "밤이 깊었어. 가볍게 하나만 끝내고, 나머지는 내일의 나에게 맡기자.",
  ],
  boss_today: [
    (f) => `오늘은 ${josa(f.boss!, "과", "와")} 맞붙는 날이야. 준비한 만큼 보여 주자!`,
    (f) => `${f.boss} 등장! 하나씩 차근차근 공략해 보자.`,
  ],
  boss_soon: [
    (f) => `${f.boss}까지 D-${f.n}. 오늘 준비 퀘스트로 체력을 깎아 두자.`,
    (f) => `D-${f.n}, ${josa(f.boss!, "이", "가")} 다가오고 있어. 지금 한 걸음이 큰 차이를 만들어.`,
  ],
  streak: [
    (f) => `${f.n}일 연속 모험 중! 오늘도 한 걸음만 더.`,
    (f) => `벌써 ${f.n}일째야. 이 기세 그대로 가 보자.`,
  ],
  comeback: [
    () => "다시 왔구나. 가볍게 하나부터 시작하자.",
    () => "어서 와! 오늘은 작은 퀘스트 두어 개면 충분해.",
  ],
  light_day: [
    () => "오늘은 짧은 모험이야. 여유롭게 다녀오자.",
    () => "가벼운 하루야. 끝내고 남은 시간은 마음껏 쉬자.",
  ],
  default: [
    () => "오늘의 모험 준비 완료. 첫 퀘스트부터 가 볼까?",
    () => "좋은 아침이야, 모험가! 오늘 길을 같이 정해 봤어.",
    () => "지도를 펼쳤어. 하나씩 깃발을 꽂아 보자.",
  ],
};

const MOOD: Record<BriefingSituation, CharacterMood> = {
  late_night: "sleeping",
  boss_today: "surprised",
  boss_soon: "thinking",
  streak: "celebrating",
  comeback: "idle",
  light_day: "idle",
  default: "idle",
};

const STREAK_MIN_DAYS = 3;
const LIGHT_DAY_MINUTES = 60;
const BOSS_SOON_DAYS = 3;

export function briefingSituation(input: BriefingInput): {
  situation: BriefingSituation;
  fill: Fill;
} {
  if (input.localHour < LATE_NIGHT_END_HOUR && input.completedToday === 0) {
    return { situation: "late_night", fill: {} };
  }
  if (input.boss) {
    const daysLeft = daysBetween(input.today, input.boss.deadline);
    if (daysLeft === 0) return { situation: "boss_today", fill: { boss: input.boss.title } };
    if (daysLeft > 0 && daysLeft <= BOSS_SOON_DAYS) {
      return { situation: "boss_soon", fill: { boss: input.boss.title, n: daysLeft } };
    }
  }
  if (input.adventureStreak >= STREAK_MIN_DAYS) {
    return { situation: "streak", fill: { n: input.adventureStreak } };
  }
  if (input.lastPlayedDate && daysBetween(input.lastPlayedDate, input.today) >= COMEBACK_GAP_DAYS) {
    return { situation: "comeback", fill: {} };
  }
  if (input.pickCount > 0 && input.totalMinutes <= LIGHT_DAY_MINUTES) {
    return { situation: "light_day", fill: {} };
  }
  return { situation: "default", fill: {} };
}

/** Stable day index so the same date always picks the same sentence. */
function dayIndex(date: GameDate): number {
  return Math.abs(daysBetween("2000-01-01", date));
}

export function briefing(input: BriefingInput): Briefing {
  const { situation, fill } = briefingSituation(input);
  const pool = POOLS[situation];
  const line = pool[dayIndex(input.today) % pool.length]!(fill);
  return { situation, line, mood: MOOD[situation] };
}

/** Every sentence the GM can say, for copy review and the banned-word test. */
export function allBriefingLines(): string[] {
  const sample: Fill = { boss: "보스", n: 3 };
  return Object.values(POOLS).flatMap((pool) => pool.map((make) => make(sample)));
}
