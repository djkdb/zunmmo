# LIFE RPG — Game System

> 퀘스트, XP, 레벨, 스탯, 업적의 **규칙**을 정의한다. 모든 수치는 `src/lib/game/`의 단일 소스에서 관리하며, 이 문서는 그 코드의 사양서다.

- 문서 상태: v0.1 (Phase 0)
- 구현 위치: `src/lib/game/*` (순수 함수, 프레임워크 의존성 없음, 100% 단위 테스트)

---

## 0. 설계 원칙

1. **Centralized rules** — XP, 레벨, 스탯, 업적 조건은 `src/lib/game/`에만 존재한다. 컴포넌트·서버 액션·SQL에 숫자를 하드코딩하지 않는다.
2. **Positive-only progression** — 미완료/실패로 XP를 *깎지 않는다*. (예외: 사용자가 직접 "완료 취소"할 때의 정정 기록)
3. **Ledger, not counter** — XP의 진실은 `xp_logs`(원장)다. `characters.total_xp`는 같은 트랜잭션에서 갱신되는 캐시이며 언제든 원장으로 재계산할 수 있어야 한다.
4. **Snapshot at creation** — 퀘스트의 XP는 생성/수정 시점에 계산해 `quests.xp`에 저장한다. 이후 규칙이 바뀌어도 과거 기록은 변하지 않는다.
5. **Growth record, not judgement** — 스탯은 "얼마나 투자했는가"이지 "얼마나 잘하는가"가 아니다. UI 문구도 이 원칙을 따른다.

## 1. Quest Model

### 1.1 타입

```ts
type QuestType = 'main' | 'daily' | 'side' | 'boss' | 'hidden'; // hidden: post-MVP
```

| 타입 | `goal_id` | `deadline` | `repeat_rule` | 비고 |
|------|-----------|------------|---------------|------|
| main | **필수** | 선택 | 없음 | Main Questline의 단계 |
| daily | 선택 | 없음 | **필수** | 회차(occurrence) 단위 완료 |
| side | 선택 | 선택 | 선택 | 반복 가능한 취미도 side |
| boss | 선택 | **필수** | 없음 | D-day 표시, 마감 후 `expired` |
| hidden | 선택 | 선택 | 선택 | 시스템만 생성 (post-MVP) |

### 1.2 난이도 → 기본 XP

| 난이도 | 표시 | Base XP | 가이드 (예상 소요/부담) |
|---|---|---|---|
| 1 | ⭐ | **20** | 15분 이내, 거의 부담 없음 (물 2L 마시기) |
| 2 | ⭐⭐ | **40** | 30분 내외 (운동 30분, 단어 암기) |
| 3 | ⭐⭐⭐ | **70** | 1–2시간 집중 (강의 1개 복습) |
| 4 | ⭐⭐⭐⭐ | **120** | 반나절, 상당한 집중 (과제 1개 완성) |
| 5 | ⭐⭐⭐⭐⭐ | **200** | 하루 이상 또는 큰 심리적 부담 (발표 준비 완료) |

### 1.3 타입 배율

| 타입 | 배율 | 근거 |
|------|------|------|
| main | ×1.0 | Questline 클리어 보너스로 별도 보상 |
| daily | ×1.0 | 반복 자체가 누적 보상 |
| side | ×1.0 | 취미도 동등하게 존중 |
| boss | **×2.5** | 드물고 큰 도전. ⭐5 Boss = **500 XP** |
| hidden | ×1.5 | 발견의 기쁨 (post-MVP) |

```ts
// src/lib/game/xp.ts (사양)
export const DIFFICULTY_XP = { 1: 20, 2: 40, 3: 70, 4: 120, 5: 200 } as const;
export const QUEST_TYPE_MULTIPLIER = { main: 1, daily: 1, side: 1, boss: 2.5, hidden: 1.5 } as const;

export function questXp(type: QuestType, difficulty: Difficulty): number {
  return Math.round(DIFFICULTY_XP[difficulty] * QUEST_TYPE_MULTIPLIER[type]);
}
```

> 폼·템플릿 어디에도 XP 입력은 없다. 사용자는 `difficulty`만 고르고 XP는 항상 `questXp()`가 계산한다.

### 1.4 상태 (Status)

```
           ┌──────────── complete ───────────┐
 active ───┤                                 ├──▶ completed ──undo──▶ active
           └── deadline passed (boss/side) ──┴──▶ expired
 active / completed / expired ──archive──▶ archived (목록에서 숨김, 기록 보존)
```

- `active`: 진행 가능. **daily는 항상 active**이며 완료는 회차별로 `quest_completions`에 기록한다.
- `completed`: 단발 퀘스트 완료. `completed_at` 기록.
- `expired`: 마감이 지난 미완료 boss/side. **XP 차감 없음.** UI 문구는 "기한 만료" (실패/패배 금지). 마감 연장 시 `active`로 복귀.
- `archived`: 소프트 삭제. 하드 삭제는 `xp_logs`가 없는 퀘스트만 허용.

### 1.5 반복 규칙 (`repeat_rule`)

RRULE 대신 Zod로 검증되는 단순 JSON을 사용한다 (필요 시 이후 RRULE로 확장).

```ts
type RepeatRule =
  | { freq: 'daily' }                                   // 매일
  | { freq: 'weekly'; weekdays: Weekday[] }             // 특정 요일 (1=월 … 7=일, ISO)
  | { freq: 'weekly_count'; timesPerWeek: 1|2|3|4|5|6 } // 주 N회 (요일 자유)
```

- 회차 키는 사용자 로컬 기준 `occurrence_date` (date).
- `weekly_count`는 해당 ISO 주에 N회 완료되면 남은 요일엔 "이번 주 클리어" 표시.

### 1.6 하루 경계 (Day Boundary)

- `profiles.timezone` (IANA, 기본 `Asia/Seoul`), `profiles.day_start_hour` (기본 **4**).
- 로컬 03:59의 완료는 **전날** 회차로 기록된다 (밤샘 작업 사용자 보호).
- 계산은 `src/lib/game/time.ts`의 `gameDate(now, tz, dayStartHour)` 하나로만 한다.

## 2. Completion & XP Transaction

### 2.1 완료 처리 (DB 함수 `complete_quest`)

퀘스트 완료는 반드시 **단일 Postgres 트랜잭션**(RPC)으로 처리한다.

```
complete_quest(p_quest_id uuid, p_occurrence_date date)
  1. SELECT … FROM quests WHERE id = p_quest_id AND user_id = auth.uid() FOR UPDATE
     └ 없음 → 'QUEST_NOT_FOUND'
  2. status 검증: active 여야 함 → 아니면 'QUEST_NOT_ACTIVE'
  3. INSERT quest_completions (quest_id, user_id, occurrence_date)
     └ UNIQUE(quest_id, occurrence_date) 위반 → 'ALREADY_COMPLETED' (이중 지급 방지의 핵심)
  4. INSERT xp_logs (amount = quests.xp, reason = 'quest_complete', stat = quests.primary_stat, …)
  5. UPDATE characters SET total_xp = total_xp + amount
  6. UPDATE character_stats SET xp = xp + amount WHERE stat = quests.primary_stat
  7. 단발 퀘스트면 UPDATE quests SET status = 'completed', completed_at = now()
  8. RETURN { xp_gained, total_xp_before, total_xp_after, stat, stat_xp_after }
```

- 함수는 `SECURITY DEFINER` + `SET search_path = ''` + 내부에서 `auth.uid()` 소유권 검증.
- 클라이언트(`authenticated` role)에는 `xp_logs`, `quest_completions`, `character_stats` **INSERT/UPDATE 권한이 없다.** `characters`는 `name`, `appearance` 컬럼만 UPDATE 가능.

### 2.2 후처리 (Application Layer, 같은 Server Action 안)

```
const result = await rpc('complete_quest', …)
const levelUp  = detectLevelUp(result.total_xp_before, result.total_xp_after)   // lib/game/level.ts
const unlocked = await evaluateAchievements(userId, event)                      // lib/game/achievements.ts + grant_achievement RPC
const goalClear = await checkGoalClear(quest.goal_id)                           // 모든 연결 퀘스트 완료 시
return { xpGained, levelUp, unlocked, goalClear }  // → UI 연출 큐
```

레벨은 DB에 저장하지 않고 `total_xp`에서 **파생**한다. 따라서 레벨 곡선을 바꿔도 마이그레이션이 필요 없다.

### 2.3 완료 취소 (Undo)

- 같은 게임 날짜 안에서만 허용 (실수 정정 목적).
- `uncomplete_quest` RPC: 해당 completion 삭제 + `xp_logs`에 **음수 정정 기록**(`reason = 'reversal'`, `meta.reverses = <log id>`) + 캐시 차감.
- 원장 기록은 삭제하지 않는다. 통계 쿼리는 reversal을 포함해 합산한다.
- 취소로 레벨이 내려가도 "레벨 다운" 연출은 하지 않는다 (XP 바만 조용히 조정).

### 2.4 `xp_logs` (원장)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| character_id | uuid | FK → characters |
| quest_id | uuid? | 퀘스트 보상인 경우 |
| completion_id | uuid? | FK → quest_completions (회차 추적) |
| goal_id | uuid? | Questline 클리어 보너스인 경우 |
| achievement_id | text? | 업적 보상인 경우 |
| amount | int | 음수 허용(reversal만) |
| stat | stat_type? | 스탯 귀속 |
| reason | xp_reason | `quest_complete` \| `goal_clear` \| `achievement` \| `streak_bonus` \| `reversal` \| `admin_adjust` |
| meta | jsonb | 계산 근거 (difficulty, multiplier, rule_version 등) |
| created_at | timestamptz | 인덱스 `(user_id, created_at desc)` |

주간/월간 통계는 `xp_logs`를 `date_trunc`으로 집계 (필요 시 materialized view).

## 3. Main Questline (`goals`)

- Questline 진행률 = `완료된 연결 퀘스트 XP 합 / 연결 퀘스트(archived 제외) XP 합`.
  - XP 가중치를 쓰는 이유: ⭐1 단계 10개와 ⭐5 단계 1개가 같은 비중이 되지 않도록.
  - daily 퀘스트는 진행률 계산에서 제외(무한 반복이므로). 단 Questline 화면에 "연결된 습관"으로 표시.
- 연결된 main/boss 퀘스트가 모두 completed → **Questline Clear** → 보너스 XP.

```ts
export const GOAL_CLEAR_BONUS = { ratio: 0.2, min: 200, max: 1000 } as const;

export function goalClearBonus(questXpSum: number): number {
  const { ratio, min, max } = GOAL_CLEAR_BONUS;
  return Math.min(max, Math.max(min, Math.round(questXpSum * ratio)));
}
```

## 4. Level System

### 4.1 MVP 곡선 — 선형

| Level | 필요 누적 XP |
|---|---|
| 1 | 0 |
| 2 | 1,000 |
| 3 | 2,000 |
| n | 1,000 × (n − 1) |

- 최대 레벨: 99 (그 이후는 "Lv.99 ★n" 프레스티지 표시 — post-MVP)
- UI 표시는 **레벨 내 진행도**: `Lv.24 · 420 / 1,000 XP` (누적 23,420)

### 4.2 교체 가능한 곡선 정의

```ts
// src/lib/game/level.ts (사양)
export type LevelCurve =
  | { kind: 'linear'; step: number }
  | { kind: 'polynomial'; base: number; exponent: number }; // xpToReach(n) = base * (n-1)^exponent

export const LEVEL_CURVE: LevelCurve = { kind: 'linear', step: 1000 };
export const MAX_LEVEL = 99;

export function xpToReachLevel(level: number, curve = LEVEL_CURVE): number;
export function levelFromXp(totalXp: number, curve = LEVEL_CURVE): number;
export function levelProgress(totalXp: number, curve = LEVEL_CURVE): {
  level: number; xpIntoLevel: number; xpForNextLevel: number; ratio: number; // 0..1
};
export function detectLevelUp(before: number, after: number): { from: number; to: number } | null;
```

### 4.3 페이싱 검증 (선형 1,000 기준)

| 사용 패턴 | 일일 XP | 레벨업 주기 | 3개월 후 |
|---|---|---|---|
| 라이트 (daily ⭐2 ×3) | ~120 | ~8일 | Lv.11 |
| 보통 (daily ×4 + 단발 ⭐3 ×1) | ~250 | ~4일 | Lv.23 |
| 하드 (+ 주 1회 Boss) | ~350 | ~3일 | Lv.32 |

→ 첫 주에 1–2회 레벨업을 경험하는 것이 목표. Beta 데이터로 재조정한다.

### 4.4 칭호 (Title)

레벨 구간별 기본 칭호 (`src/lib/game/titles.ts`):

| Lv | 칭호 (KR / EN) |
|---|---|
| 1–4 | 견습 모험가 / Novice |
| 5–9 | 모험가 / Adventurer |
| 10–19 | 숙련 모험가 / Journeyman |
| 20–34 | 베테랑 / Veteran |
| 35–49 | 영웅 / Hero |
| 50–74 | 전설 / Legend |
| 75–99 | 신화 / Mythic |

post-MVP: 가장 높은 스탯에 따라 클래스 칭호 접미사 (INT → Sage, VIT → Warrior …).

## 5. Stats

| Stat | 이름 | 의미 (성장 기록 영역) | 대표 퀘스트 | 색상 토큰 |
|---|---|---|---|---|
| **INT** | Intelligence | 학습·지식 습득 | 공부, 강의, 독서 | `--color-stat-int` |
| **FOC** | Focus | 일·프로젝트·깊은 집중 | 과제, 코딩, 업무 | `--color-stat-foc` |
| **VIT** | Vitality | 몸과 생활 리듬 | 운동, 수면, 식단 | `--color-stat-vit` |
| **SOC** | Social | 관계·소통 | 친구, 가족, 모임 | `--color-stat-soc` |
| **CRE** | Creativity | 창작·취미·놀이 | 그림, 음악, 영화, 축구 | `--color-stat-cre` |

- 모든 퀘스트는 `primary_stat` 1개를 가진다 (카테고리/타입 기본값, 사용자가 수정 가능).
- 완료 시 퀘스트 XP 전액이 해당 스탯의 `stat_xp`에 누적된다 (캐릭터 total XP와 별개 누적).
- 스탯 레벨: `statLevel = floor(sqrt(stat_xp / 50))` → 50 XP=Lv1, 200=Lv2, 1,250=Lv5, 5,000=Lv10. 초반 빠르고 이후 완만 (`src/lib/game/stats.ts`).
- 표시: 레이더 차트 대신 **픽셀 막대 + 숫자** (MVP). 다른 사용자와 비교하는 표현 금지.

### 5.1 카테고리 → 스탯 기본 매핑 (템플릿/폼 기본값)

| category | stat |
|---|---|
| study | INT |
| work, project | FOC |
| health, exercise, sleep | VIT |
| social, family | SOC |
| hobby, creative, play | CRE |
| chore, admin | FOC |

## 6. Streak (Phase 5)

- Daily 퀘스트별 연속 완료 일수 `streak` (회차가 없는 요일은 끊김으로 보지 않음).
- 전체 "모험 연속일": Today's Adventure에서 1개 이상 완료한 연속 게임 날짜.
- **Streak 보너스**: 7일 단위로 +10%, 최대 +30% (`streak_bonus` 별도 로그). 끊겨도 페널티 없음, "다시 시작" 문구.
- Streak Freeze(휴식권): 주 1회 자동 — 하루 빠져도 유지 (번아웃 방지 원칙).

## 7. Achievements

데이터 기반 정의 (seed 테이블 `achievements`) + 평가기 (`src/lib/game/achievements.ts`).

```ts
type AchievementCriteria =
  | { kind: 'quests_completed'; count: number; questType?: QuestType }
  | { kind: 'level_reached'; level: number }
  | { kind: 'stat_level_reached'; stat: Stat; level: number }
  | { kind: 'boss_cleared'; count: number }
  | { kind: 'goal_cleared'; count: number }
  | { kind: 'daily_streak'; days: number }
  | { kind: 'adventure_streak'; days: number }
  | { kind: 'early_bird'; beforeHour: number; count: number }; // 로컬 시각 기준
```

- 평가 시점: 완료 처리 직후 (이벤트 기반), 관련 criteria kind만 평가.
- 지급: `grant_achievement(achievement_id)` RPC — `user_achievements` PK(user_id, achievement_id)로 멱등. 보상 XP가 있으면 같은 트랜잭션에서 `xp_logs(reason='achievement')`.
- 희귀도: `common` / `rare` / `epic` / `legendary` → 배지 프레임 색만 다름 ([PIXEL_RULES §6](../design/PIXEL_RULES.md#6-ui-pixel-rules)).

초기 업적 예시:

| id | 이름 | 조건 | 보상 |
|---|---|---|---|
| `first_step` | 첫 걸음 | 퀘스트 1개 완료 | 20 XP |
| `daily_7` | 일주일의 의지 | daily streak 7 | 70 XP |
| `boss_slayer_1` | 첫 보스 토벌 | boss 1회 클리어 | 120 XP |
| `level_10` | 숙련 모험가 | Lv.10 | — |
| `questline_clear_1` | 이야기의 끝 | Questline 1회 클리어 | 200 XP |
| `early_bird_10` | 새벽의 모험가 | 07시 이전 완료 10회 | 70 XP |
| `balanced_5` | 균형 잡힌 영웅 | 모든 스탯 Lv.5 | 200 XP |

## 8. Today's Adventure — 결정적(Deterministic) 추천 점수

Game Master의 오늘의 모험 추천 알고리즘 (결정적, 외부 API 없음). 사용 방식은 [GAME_MASTER §3](./GAME_MASTER.md#3-g1--todays-adventure-추천).

```ts
score(q) =
    w.urgency  * urgency(q.deadline)          // 마감 임박: 1 / max(1, daysLeft)  (D-0 → 1.0)
  + w.boss     * (q.type === 'boss' ? 1 : 0)
  + w.dueToday * (isDueToday(q.repeat_rule) ? 1 : 0)
  + w.main     * (q.type === 'main' ? goalMomentum(q.goal_id) : 0)  // 진행 중 Questline 우선
  + w.balance  * statNeglect(q.primary_stat)  // 최근 7일 해당 스탯 XP가 적을수록 ↑
  - w.load     * estimatedMinutes(q) / dailyCapacity

weights = { urgency: 3, boss: 1.5, dueToday: 2, main: 1.2, balance: 0.5, load: 1 }
```

- 기본 추천 개수: 3–6개, `estimated_minutes` 합 ≤ `dailyCapacity`(기본 240분, 설정 가능).
- 오늘 고정 일정(`schedules`)이 있으면 그 시간만큼 capacity 차감.

## 9. 데이터 엔티티 요약

전체 스키마/RLS는 [ARCHITECTURE.md §5](./ARCHITECTURE.md#5-database-schema) 참조.

```
profiles 1─1 characters 1─N character_stats
   │
   ├─N goals 1─N quests 1─N quest_completions
   │              │            │
   │              └────────────┴──▶ xp_logs ◀── goals (clear bonus), achievements
   ├─N schedules ──(optional)──▶ quests
   ├─N user_achievements N─1 achievements
   └─N adventures (오늘의 모험: date + quest_ids)
```

## 10. 테스트 요구사항 (`src/lib/game/__tests__`)

- `questXp`: 모든 type × difficulty 조합 스냅샷
- `levelFromXp` / `levelProgress`: 경계값(0, 999, 1000, 1001, MAX), 음수 방어
- `gameDate`: 타임존·`day_start_hour`·DST 없는 지역/있는 지역
- `statLevel`: 경계값
- `evaluateAchievements`: criteria kind별 true/false, 이미 획득한 업적 제외
- `recommendToday`: 마감 임박/보스/용량 초과 시나리오
