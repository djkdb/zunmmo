import type { SimPersona, SimQuest } from "./simulate";

/** The five personas of docs/PERSONAS.md, as four-week lives (day 0 = Monday). */

const daily = (
  id: string,
  title: string,
  minutes: number,
  stat: SimQuest["stat"],
  difficulty: SimQuest["difficulty"] = 1,
): SimQuest => ({
  id,
  title,
  type: "daily",
  difficulty,
  stat,
  minutes,
  repeat: { freq: "daily" },
});

const WEEKEND = new Set([6, 7]);

/** P1 지민 — studies at 1am on weekdays, afternoons at the weekend; midterm on day 17. */
export const JIMIN: SimPersona = {
  id: "p1-jimin",
  name: "지민 (대학생, 새벽형)",
  capacity: 240,
  playHour: (_day, weekday) => (WEEKEND.has(weekday) ? 15 : 1),
  // Takes the GM's night-owl tip after the first week: the day now starts at 07:00.
  dayStartHour: (day) => (day < 7 ? 4 : 7),
  diligence: 0.85,
  scheduleMinutes: { 1: 180, 2: 90, 3: 180, 4: 90, 5: 60 },
  quests: [
    {
      id: "ds-1",
      title: "자료구조 1–4장 정리",
      type: "main",
      difficulty: 3,
      stat: "int",
      minutes: 90,
      goal: "midterm",
    },
    {
      id: "ds-2",
      title: "자료구조 5–8장 정리",
      type: "main",
      difficulty: 3,
      stat: "int",
      minutes: 90,
      goal: "midterm",
    },
    {
      id: "ds-3",
      title: "기출 2년치 풀기",
      type: "main",
      difficulty: 4,
      stat: "int",
      minutes: 120,
      goal: "midterm",
    },
    {
      id: "ds-4",
      title: "오답 노트",
      type: "main",
      difficulty: 2,
      stat: "int",
      minutes: 40,
      goal: "midterm",
    },
    {
      id: "ds-boss",
      title: "자료구조 중간고사",
      type: "boss",
      difficulty: 5,
      stat: "int",
      deadlineDay: 17,
      goal: "midterm",
    },
    daily("vocab", "영단어 30개", 15, "int"),
    {
      id: "club",
      title: "동아리 회의록 공유",
      type: "side",
      difficulty: 1,
      stat: "soc",
      minutes: 15,
    },
  ],
  arrivals: {
    2: [
      {
        id: "os-hw1",
        title: "운영체제 과제 1",
        type: "side",
        difficulty: 3,
        stat: "foc",
        minutes: 60,
        deadlineDay: 4,
      },
    ],
    9: [
      {
        id: "os-hw2",
        title: "운영체제 과제 2",
        type: "side",
        difficulty: 3,
        stat: "foc",
        minutes: 60,
        deadlineDay: 11,
      },
    ],
    16: [
      {
        id: "os-hw3",
        title: "운영체제 과제 3",
        type: "side",
        difficulty: 3,
        stat: "foc",
        minutes: 60,
        deadlineDay: 18,
      },
    ],
  },
};

/** P2 현우 — 90 minutes before work, a side project questline and the gym three times a week. */
export const HYUNWOO: SimPersona = {
  id: "p2-hyunwoo",
  name: "현우 (개발자, 하루 90분)",
  capacity: 90,
  playHour: () => 8,
  diligence: 0.75,
  quests: [
    {
      id: "launch-1",
      title: "결제 API 조사하기",
      type: "main",
      difficulty: 2,
      stat: "foc",
      minutes: 40,
      goal: "launch",
    },
    {
      id: "launch-2",
      title: "결제 화면 만들기",
      type: "main",
      difficulty: 2,
      stat: "foc",
      minutes: 40,
      goal: "launch",
    },
    {
      id: "launch-3",
      title: "결제 테스트하기",
      type: "main",
      difficulty: 2,
      stat: "foc",
      minutes: 40,
      goal: "launch",
    },
    {
      id: "launch-4",
      title: "랜딩 페이지 카피",
      type: "main",
      difficulty: 2,
      stat: "cre",
      minutes: 40,
      goal: "launch",
    },
    {
      id: "launch-5",
      title: "베타 공지 쓰기",
      type: "main",
      difficulty: 2,
      stat: "soc",
      minutes: 30,
      goal: "launch",
    },
    {
      id: "gym",
      title: "헬스장 가기",
      type: "daily",
      difficulty: 3,
      stat: "vit",
      minutes: 70,
      repeat: { freq: "weekly_count", timesPerWeek: 3 },
    },
    daily("book", "책 20쪽 읽기", 20, "int"),
    { id: "blog", title: "기술 블로그 글", type: "side", difficulty: 3, stat: "cre", minutes: 90 },
    { id: "dentist", title: "치과 예약", type: "side", difficulty: 1, stat: "vit", minutes: 5 },
  ],
};

/** P3 소연 — plays three days, disappears for three weeks, comes back on day 24. */
export const SOYEON: SimPersona = {
  id: "p3-soyeon",
  name: "소연 (3주 공백 후 복귀)",
  capacity: 120,
  playHour: (day) => (day < 3 || day >= 24 ? 10 : null),
  diligence: 0.8,
  quests: [
    daily("yoga", "요가 20분", 20, "vit", 2),
    daily("walk", "아이와 산책", 30, "soc"),
    {
      id: "resume",
      title: "이력서 업데이트",
      type: "side",
      difficulty: 2,
      stat: "foc",
      minutes: 60,
      deadlineDay: 6,
    },
    {
      id: "folio",
      title: "포트폴리오 정리",
      type: "side",
      difficulty: 3,
      stat: "cre",
      minutes: 90,
      deadlineDay: 12,
    },
    {
      id: "cert",
      title: "자격증 원서 접수",
      type: "boss",
      difficulty: 3,
      stat: "foc",
      minutes: 30,
      deadlineDay: 18,
    },
  ],
};

/** P4 태오 — meetings fill weekdays, a client deadline every Friday. */
export const TAEO: SimPersona = {
  id: "p4-taeo",
  name: "태오 (프리랜서, 일정 과밀)",
  capacity: 240,
  playHour: () => 10,
  diligence: 0.8,
  scheduleMinutes: { 1: 270, 2: 210, 3: 270, 4: 240, 5: 180 },
  quests: [
    daily("sketch", "크로키 15분", 15, "cre"),
    {
      id: "invoice",
      title: "견적서 보내기",
      type: "side",
      difficulty: 1,
      stat: "foc",
      minutes: 15,
    },
    {
      id: "icons",
      title: "아이콘 세트",
      type: "side",
      difficulty: 3,
      stat: "cre",
      minutes: 120,
      deadlineDay: 10,
    },
    {
      id: "client-1",
      title: "A사 시안",
      type: "boss",
      difficulty: 4,
      stat: "cre",
      minutes: 180,
      deadlineDay: 4,
    },
  ],
  arrivals: {
    7: [
      {
        id: "client-2",
        title: "B사 시안",
        type: "boss",
        difficulty: 4,
        stat: "cre",
        minutes: 180,
        deadlineDay: 11,
      },
    ],
    14: [
      {
        id: "client-3",
        title: "C사 시안",
        type: "boss",
        difficulty: 4,
        stat: "cre",
        minutes: 180,
        deadlineDay: 18,
      },
    ],
    21: [
      {
        id: "client-4",
        title: "D사 시안",
        type: "boss",
        difficulty: 4,
        stat: "cre",
        minutes: 180,
        deadlineDay: 25,
      },
    ],
  },
};

/** P5 하늘 — eight small routines every day, does everything the GM picks. */
export const HANEUL: SimPersona = {
  id: "p5-haneul",
  name: "하늘 (루틴 8개, 매일)",
  capacity: 240,
  playHour: () => 9,
  diligence: 1,
  quests: [
    daily("pill-am", "아침 약 먹기", 5, "vit"),
    daily("water", "물 2L 마시기", 5, "vit"),
    daily("stretch", "스트레칭 10분", 10, "vit"),
    daily("walk", "산책 20분", 20, "vit"),
    daily("braille", "점자 책 읽기", 30, "int"),
    daily("call", "가족과 통화", 10, "soc"),
    daily("pill-pm", "저녁 약 먹기", 5, "vit"),
    daily("diary", "하루 일기", 10, "cre"),
  ],
};

export const SIM_PERSONAS = [JIMIN, HYUNWOO, SOYEON, TAEO, HANEUL] as const;
