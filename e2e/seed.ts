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
    for (const q of quests) {
      await c.query(
        `insert into quests (user_id, goal_id, title, type, difficulty, xp, primary_stat, deadline, repeat_rule, estimated_minutes, status, completed_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
          q.completed ? "completed" : "active",
          q.completed ? new Date().toISOString() : null,
        ],
      );
    }
  });
}
