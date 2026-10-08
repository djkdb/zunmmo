/**
 * Test-only seeding straight into the local database (service role), for screenshots and
 * scenarios that would be slow to click through. Never used by the app.
 */
import pg from "pg";

import { addDays, gameDate, questXp, type Difficulty, type QuestType } from "../src/lib/game";

const DB_URL =
  process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

async function withDb<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function userIdFor(email: string): Promise<string> {
  return withDb(
    async (c) => (await c.query("select id from auth.users where email = $1", [email])).rows[0].id,
  );
}

/** Jump a character's XP (e.g. to just below a level boundary) without playing the quests. */
export async function setTotalXp(email: string, totalXp: number): Promise<void> {
  await withDb((c) =>
    c.query(
      "update public.characters set total_xp = $2 where user_id = (select id from auth.users where email = $1)",
      [email, totalXp],
    ),
  );
}

interface SeedQuest {
  title: string;
  type: QuestType;
  difficulty: Difficulty;
  stat: string;
  deadlineInDays?: number;
  repeat?: object;
  goal?: string;
  completed?: boolean;
  minutes?: number;
}

/** A believable mid-game board: one questline in progress, a boss, dailies and side quests. */
export async function seedAdventure(email: string): Promise<void> {
  const userId = await userIdFor(email);
  const today = gameDate(new Date(), "Asia/Seoul", 4);
  await withDb(async (c) => {
    const goal = (
      await c.query(
        "insert into goals (user_id, title) values ($1, '나만의 웹서비스 출시하기') returning id",
        [userId],
      )
    ).rows[0].id as string;
    const quests: SeedQuest[] = [
      {
        title: "서비스 범위 정하기",
        type: "main",
        difficulty: 2,
        stat: "foc",
        goal,
        completed: true,
      },
      {
        title: "DB 스키마 설계하기",
        type: "main",
        difficulty: 3,
        stat: "foc",
        goal,
        completed: true,
      },
      { title: "로그인 기능 만들기", type: "main", difficulty: 3, stat: "foc", goal, minutes: 120 },
      { title: "랜딩 페이지 배포하기", type: "main", difficulty: 4, stat: "cre", goal },
      { title: "베타 테스터 10명 모으기", type: "main", difficulty: 3, stat: "soc", goal },
      { title: "AI 중간고사", type: "boss", difficulty: 5, stat: "int", deadlineInDays: 4 },
      {
        title: "컴퓨터네트워크 과제 제출",
        type: "boss",
        difficulty: 4,
        stat: "foc",
        deadlineInDays: 1,
        minutes: 180,
      },
      {
        title: "운동 30분",
        type: "daily",
        difficulty: 2,
        stat: "vit",
        repeat: { freq: "daily" },
        minutes: 30,
      },
      {
        title: "영단어 30개",
        type: "daily",
        difficulty: 1,
        stat: "int",
        repeat: { freq: "daily" },
        minutes: 15,
      },
      {
        title: "AI 강의 1강 복습하기",
        type: "daily",
        difficulty: 3,
        stat: "int",
        repeat: { freq: "weekly", weekdays: [1, 2, 3, 4, 5] },
        minutes: 60,
      },
      { title: "토요일 축구하기", type: "side", difficulty: 2, stat: "vit", deadlineInDays: 2 },
      { title: "친구와 저녁 먹기", type: "side", difficulty: 1, stat: "soc" },
      { title: "영화 〈듄〉 보기", type: "side", difficulty: 2, stat: "cre", minutes: 160 },
    ];
    const ids = new Map<string, string>();
    for (const q of quests) {
      const { rows } = await c.query(
        `insert into quests (user_id, goal_id, title, type, difficulty, xp, primary_stat, deadline, repeat_rule, estimated_minutes)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
        [
          userId,
          q.goal ?? null,
          q.title,
          q.type,
          q.difficulty,
          questXp(q.type, q.difficulty),
          q.stat,
          q.deadlineInDays === undefined ? null : addDays(today, q.deadlineInDays),
          q.repeat ? JSON.stringify(q.repeat) : null,
          q.minutes ?? null,
        ],
      );
      ids.set(q.title, rows[0].id);
    }

    // A week of play through the real RPC (so the ledger, stats and totals agree), each
    // completion then moved back to the day it "happened".
    const play = async (title: string, daysAgo: number) => {
      await c.query("begin");
      await c.query("set local role authenticated");
      await c.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ sub: userId, role: "authenticated" }),
      ]);
      const { rows } = await c.query("select (public.complete_quest($1)).completion_id", [
        ids.get(title),
      ]);
      await c.query("commit");
      if (daysAgo === 0) return;
      const date = addDays(today, -daysAgo);
      const at = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
      await c.query(
        "update quest_completions set occurrence_date = $2, completed_at = $3 where id = $1",
        [rows[0].completion_id, date, at],
      );
      await c.query(
        `update xp_logs set created_at = $3, meta = meta || jsonb_build_object('game_date', $2::text)
          where completion_id = $1`,
        [rows[0].completion_id, date, at],
      );
    };
    const at = (daysFromToday: number, hhmm: string) =>
      new Date(`${addDays(today, daysFromToday)}T${hhmm}:00+09:00`).toISOString();
    await c.query(
      `insert into schedules (user_id, title, starts_at, ends_at, location, quest_id) values
         ($1, 'AI 스터디', $2, $3, '도서관 3층', null),
         ($1, '토요일 축구 경기', $4, $5, '학교 운동장', $6),
         ($1, '컴퓨터네트워크 수업', $7, $8, null, null)`,
      [
        userId,
        at(0, "19:00"),
        at(0, "20:30"),
        at(2, "15:00"),
        at(2, "17:00"),
        ids.get("토요일 축구하기"),
        at(1, "10:30"),
        at(1, "12:00"),
      ],
    );

    for (const q of quests.filter((q) => q.completed)) await play(q.title, 3);
    for (const [daysAgo, titles] of [
      [6, ["운동 30분", "영단어 30개"]],
      [5, ["운동 30분", "영단어 30개", "AI 강의 1강 복습하기"]],
      [4, ["영단어 30개"]],
      [2, ["운동 30분", "영단어 30개", "AI 강의 1강 복습하기"]],
      [1, ["운동 30분", "영단어 30개"]],
      [0, ["영단어 30개"]],
    ] as const) {
      for (const title of titles) await play(title, daysAgo);
    }
  });
}
