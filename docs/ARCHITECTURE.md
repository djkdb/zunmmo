# LIFE RPG — Architecture

- 문서 상태: v0.1 (Phase 0)
- 범위: 기술 스택, 디렉터리 구조, 데이터 흐름, DB 스키마, 보안, 테스트, 배포

---

## 1. 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| Framework | **Next.js (App Router, 최신 stable)** + React | RSC로 대시보드 초기 로드 최적화, Server Actions로 폼/뮤테이션 단순화, Vercel 1급 지원 |
| Language | **TypeScript `strict`** + `noUncheckedIndexedAccess` | 게임 규칙·AI 스키마의 타입 안전성 |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`) + CSS Variables | 디자인 토큰을 CSS 변수 하나로 관리 → Tailwind 유틸리티와 픽셀 컴포넌트가 같은 토큰 사용 |
| UI primitives | **shadcn/ui (선택적)** — Dialog, Popover, DropdownMenu, Toast, Calendar 정도 | 접근성 있는 Radix 기반 동작만 차용, 시각은 우리 토큰으로 재스킨 |
| Validation | **Zod** | 폼·Server Action 입력·AI 출력 공통 검증 |
| Database | **Supabase PostgreSQL** | RLS, RPC(트랜잭션 함수), 마이그레이션 CLI |
| Auth | **Supabase Auth** (`@supabase/ssr`) | Magic link + Google OAuth (Kakao는 Beta 이후) |
| AI | **Anthropic Claude API** (`@anthropic-ai/sdk`), 기본 모델 `claude-opus-5-5` | Structured outputs(`output_config.format` + Zod) 지원. 상세: [AI_GAME_MASTER](./AI_GAME_MASTER.md) |
| Testing | **Vitest** (unit) + **Playwright** (e2e smoke) | `lib/game` 순수 함수 100% 커버리지, 핵심 플로우 e2e |
| Lint/Format | ESLint (next config) + Prettier (+ tailwind plugin) | |
| Package manager | **pnpm** | |
| Deployment | **Vercel** (Preview per PR, Production on `main`) + Supabase Cloud | |
| Monitoring (Beta) | Vercel Analytics + Sentry(선택) | |

**추가 라이브러리 정책**: 위 목록 외의 의존성은 "왜 직접 구현이 더 나쁜가"를 PR 설명에 적은 뒤 추가한다. 애니메이션 라이브러리(framer-motion 등)는 Phase 8에서 CSS `steps()` + Web Animations API로 부족함이 확인될 때만 도입.

## 2. 디렉터리 구조

```
.
├─ CLAUDE.md                     # 개발 규칙 (AI 에이전트 + 사람)
├─ docs/                         # 제품/시스템 문서
├─ design/                       # 아트 디렉션/디자인 시스템 문서
├─ public/
│  ├─ sprites/                   # 캐릭터 스프라이트 시트 (*.png + *.json)
│  ├─ icons/                     # 16×16 픽셀 아이콘 (단일 시트 권장)
│  └─ fonts/                     # self-host 폰트 (Galmuri, Pretendard subset)
├─ art/                          # 원본 .aseprite 소스 (빌드에 포함 안 됨)
├─ supabase/
│  ├─ migrations/                # 타임스탬프 SQL 마이그레이션 (유일한 스키마 변경 경로)
│  └─ seed.sql                   # achievements 등 정적 데이터
└─ src/
   ├─ app/
   │  ├─ (marketing)/            # 랜딩 (/)
   │  ├─ (auth)/                 # /login, /auth/callback
   │  ├─ (game)/                 # 로그인 후 앱 셸 (사이드바/하단 내비)
   │  │  ├─ adventure/           # 대시보드 (로그인 후 기본 진입점)
   │  │  ├─ quests/              # 퀘스트 목록/상세/편집
   │  │  ├─ calendar/
   │  │  ├─ character/           # 스탯, 업적, XP 기록
   │  │  ├─ game-master/         # AI 입력/제안 검토
   │  │  └─ settings/
   │  └─ api/                    # Route Handlers (AI 스트리밍 등 Server Action으로 부적합한 것만)
   ├─ components/
   │  ├─ ui/                     # Modern primitives: Button, Input, Dialog, Sheet, Toast …
   │  ├─ pixel/                  # Pixel primitives: PixelFrame, PixelIcon, Sprite, PixelBar, PixelBadge
   │  ├─ game/                   # 도메인 표현: XpBar, LevelBadge, QuestCard, StatBar, CharacterSprite …
   │  └─ layout/                 # AppShell, BottomNav, SideNav
   ├─ features/                  # 기능 단위 (UI + actions + queries + schemas 동거)
   │  ├─ quests/   { actions.ts, queries.ts, schemas.ts, components/ }
   │  ├─ character/
   │  ├─ achievements/
   │  ├─ adventure/
   │  ├─ calendar/
   │  └─ game-master/
   ├─ lib/
   │  ├─ game/                   # ★ 게임 규칙 단일 소스 (순수 TS, React/DB 의존 금지)
   │  │  ├─ xp.ts  level.ts  stats.ts  titles.ts  achievements.ts  recommend.ts  time.ts
   │  │  └─ __tests__/
   │  ├─ ai/                     # Anthropic client, prompts/, schemas/, context builders
   │  ├─ supabase/               # server.ts / client.ts / middleware.ts, database.types.ts(생성)
   │  └─ utils/
   ├─ styles/
   │  ├─ tokens.css              # ★ 디자인 토큰 단일 소스 (design/COLOR_PALETTE.md와 1:1)
   │  └─ globals.css
   └─ middleware.ts              # 세션 갱신 + (game) 라우트 보호
```

**의존 방향 규칙** (ESLint `no-restricted-imports`로 강제 예정):
```
app → features → components/game → components/pixel, components/ui → lib
lib/game  ⇸ (아무것도 import 하지 않음, 표준 라이브러리 + zod만)
components/* ⇸ features/*  (역방향 금지)
```

## 3. 데이터 흐름

### 3.1 읽기 (RSC)
```
page.tsx (Server Component)
  → features/*/queries.ts  (createServerClient, RLS 적용된 사용자 세션)
  → lib/game 파생 계산 (level, progress, title)
  → props로 Client Component에 전달 (직렬화 가능한 view model만)
```

### 3.2 쓰기 (Server Actions)
```
Client form / button
  → Server Action (features/*/actions.ts)
     1. auth 확인 (supabase.auth.getUser())
     2. Zod parse (입력 스키마)
     3. lib/game으로 파생값 계산 (예: quests.xp = questXp(type, difficulty))
     4. DB 쓰기 (단순 CRUD는 테이블, XP가 얽히면 반드시 RPC)
     5. revalidatePath / 결과(view model + 연출 이벤트) 반환
  → Client: useOptimistic로 즉시 반영, 결과 이벤트로 연출 큐 실행
```

### 3.3 AI
```
User Input → Route Handler/Server Action → lib/ai (context build + prompt)
  → Claude (structured output, Zod wire schema)
  → Domain Zod 재검증 + 정규화 (날짜, 길이, enum, XP 계산)
  → ai_requests에 제안 저장 (status: proposed)
  → UI: 제안 카드 검토/수정
  → 사용자 수락 → Server Action → quests INSERT (source='ai', ai_request_id)
```
AI 출력은 **절대 직접 DB에 쓰지 않는다.** 상세: [AI_GAME_MASTER §2](./AI_GAME_MASTER.md#2-pipeline).

## 4. 인증 & 라우팅

- `middleware.ts`: Supabase 세션 쿠키 갱신, `(game)` 그룹 미인증 접근 시 `/login?next=…`로 리다이렉트.
- 로그인 후 기본 진입: `/adventure`. 캐릭터 미생성 시 `/onboarding`.
- 서버에서 사용자 확인은 항상 `getUser()`(토큰 검증) 사용. `getSession()` 결과를 신뢰해 권한 판단하지 않는다.

## 5. Database Schema

> 모든 변경은 `supabase/migrations/*.sql`로만. 생성 타입은 `supabase gen types typescript`로 `src/lib/supabase/database.types.ts`에 출력.

### 5.1 Enums
```sql
create type quest_type   as enum ('main','daily','side','boss','hidden');
create type quest_status as enum ('active','completed','expired','archived');
create type stat_type    as enum ('int','foc','vit','soc','cre');
create type goal_status  as enum ('active','cleared','archived');
create type xp_reason    as enum ('quest_complete','goal_clear','achievement','streak_bonus','reversal','admin_adjust');
create type quest_source as enum ('manual','ai','template','system');
```

### 5.2 Tables (요약)

```sql
-- 사용자 설정 (auth.users 1:1)
profiles (
  id uuid pk references auth.users on delete cascade,
  display_name text not null,
  timezone text not null default 'Asia/Seoul',
  day_start_hour smallint not null default 4 check (day_start_hour between 0 and 12),
  daily_capacity_min smallint not null default 240,
  locale text not null default 'ko',
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
)

characters (
  id uuid pk default gen_random_uuid(),
  user_id uuid not null unique references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 16),
  appearance jsonb not null,            -- design/CHARACTER_GUIDE.md §7 스키마
  total_xp bigint not null default 0 check (total_xp >= 0),  -- 캐시, 원장은 xp_logs
  created_at timestamptz not null default now()
)

character_stats (
  character_id uuid references characters on delete cascade,
  stat stat_type,
  xp bigint not null default 0 check (xp >= 0),
  primary key (character_id, stat)
)

goals (                                  -- UI: "MAIN QUEST" (Main Questline)
  id uuid pk, user_id uuid not null,
  title text not null, description text,
  target_date date, status goal_status not null default 'active',
  cleared_at timestamptz, created_at, updated_at
)

quests (
  id uuid pk, user_id uuid not null,
  goal_id uuid references goals on delete set null,
  title text not null check (char_length(title) between 1 and 80),
  description text check (char_length(description) <= 1000),
  type quest_type not null,
  difficulty smallint not null check (difficulty between 1 and 5),
  xp int not null check (xp between 0 and 1000),   -- lib/game/questXp 스냅샷
  primary_stat stat_type not null,
  status quest_status not null default 'active',
  deadline timestamptz,
  scheduled_for date,                  -- 특정 날짜에 하기로 한 단발 퀘스트
  estimated_minutes smallint check (estimated_minutes between 5 and 1440),
  repeat_rule jsonb,                   -- GAME_SYSTEM §1.5, Zod 검증
  sort_order int not null default 0,
  source quest_source not null default 'manual',
  ai_request_id uuid references ai_requests on delete set null,
  created_at, updated_at, completed_at timestamptz,
  check (type <> 'boss'  or deadline is not null),
  check (type <> 'daily' or repeat_rule is not null),
  check (type <> 'main'  or goal_id is not null)
)
-- index: (user_id, status, type), (user_id, deadline)

quest_completions (
  id uuid pk, quest_id uuid not null references quests on delete cascade,
  user_id uuid not null, occurrence_date date not null,
  completed_at timestamptz not null default now(),
  unique (quest_id, occurrence_date)   -- ★ 이중 지급 방지
)

xp_logs (… GAME_SYSTEM §2.4 …)

schedules (                              -- 고정 시간 일정
  id uuid pk, user_id uuid not null,
  title text not null, starts_at timestamptz not null, ends_at timestamptz,
  all_day boolean not null default false, location text,
  quest_id uuid references quests on delete set null,
  source text not null default 'manual',  -- 'manual' | 'ai' | (later) 'google'
  created_at
)

adventures (                             -- Today's Adventure
  id uuid pk, user_id uuid not null, game_date date not null,
  quest_ids uuid[] not null, briefing text, source text not null, -- 'auto' | 'ai'
  started_at timestamptz not null default now(),
  unique (user_id, game_date)
)

achievements (                           -- seed, 읽기 전용
  id text pk, name text, description text, icon_key text,
  rarity text check (rarity in ('common','rare','epic','legendary')),
  criteria jsonb not null, xp_reward int not null default 0, sort int
)

user_achievements (
  user_id uuid, achievement_id text references achievements,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
)

ai_requests (                            -- AI 감사 로그 + rate limit + 제안 보관
  id uuid pk, user_id uuid not null,
  kind text not null,                    -- 'parse_quests' | 'breakdown_goal' | 'plan_today'
  input_text text, model text not null,
  status text not null,                  -- 'pending' | 'proposed' | 'accepted' | 'rejected' | 'failed'
  output jsonb, error_code text,
  input_tokens int, output_tokens int, latency_ms int,
  created_at timestamptz not null default now()
)
-- 30일 후 input_text/output 마스킹 (pg_cron)
```

### 5.3 RLS 정책 원칙

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| profiles | own | own (가입 트리거) | own | — |
| characters | own | RPC `create_character` | own, **컬럼 제한** (`name`, `appearance`) | — |
| character_stats | own | RPC | RPC | — |
| goals / quests / schedules | own | own | own (`quests.xp`는 Server Action에서 계산된 값만) | own (조건부) |
| quest_completions | own | **RPC only** | — | **RPC only** |
| xp_logs | own | **RPC only** | — | — |
| adventures | own | own | own | — |
| achievements | all authenticated | — | — | — |
| user_achievements | own | **RPC only** | — | — |
| ai_requests | own | server only | server only | — |

"own" = `user_id = (select auth.uid())`. RPC는 `SECURITY DEFINER`, `set search_path = ''`, 함수 내 소유권 검증.

> **알려진 트레이드오프**: `quests.xp`는 Server Action이 계산하지만, 사용자가 자신의 JWT로 PostgREST에 직접 비정상 값(최대 1000)을 넣는 것은 막지 않는다. 경쟁 요소(랭킹)가 없는 MVP에서는 "자기 자신만 속이는" 행위이므로 허용한다. 랭킹/소셜 도입 시 퀘스트 쓰기를 RPC로 이전하고 XP를 DB에서 계산한다.

### 5.4 RPC 목록
- `create_character(name, appearance)` — characters + 5개 character_stats 생성
- `complete_quest(quest_id, occurrence_date)` — [GAME_SYSTEM §2.1](./GAME_SYSTEM.md#21-완료-처리-db-함수-complete_quest)
- `uncomplete_quest(completion_id)`
- `grant_achievement(achievement_id)` — 조건 재검증은 앱 레이어, 멱등성은 DB
- `clear_goal(goal_id)` — 모든 연결 퀘스트 완료 확인 + 보너스 지급

## 6. 에러/로딩/빈 상태 규약

- Server Action은 `Result<T, AppError>` 형태로 반환 (`{ ok: true, data } | { ok: false, error: { code, message } }`). throw는 예상치 못한 오류만.
- `AppError.code`는 enum (`QUEST_NOT_FOUND`, `ALREADY_COMPLETED`, `AI_RATE_LIMITED`, `AI_INVALID_OUTPUT` …) → UI 문구 매핑은 `src/lib/errors/messages.ko.ts` 한 곳.
- 모든 라우트 세그먼트에 `loading.tsx`(픽셀 스켈레톤) / `error.tsx` 제공. 빈 상태는 [UI_GUIDE §8](../design/UI_GUIDE.md#8-states-loading--empty--error).

## 7. 테스트 전략

| 레이어 | 도구 | 범위 |
|--------|------|------|
| `lib/game` | Vitest | 100% 브랜치 커버리지 목표 (규칙이 곧 제품) |
| `lib/ai` | Vitest + 고정 fixture | wire→domain 정규화, 날짜 해석, 잘못된 출력 거부 |
| RPC/RLS | Supabase local + SQL 테스트 (pgTAP 또는 Vitest+supabase-js) | 이중 완료, 타인 데이터 접근 거부, reversal |
| UI | Playwright | 가입→캐릭터 생성→퀘스트 생성→완료→XP 반영 smoke |
| 시각 | Playwright 스크린샷 (Phase 8) | 픽셀 컴포넌트 회귀 |

CI(GitHub Actions): `typecheck` → `lint` → `test` → `build`. Vercel Preview 배포.

## 8. 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # (또는 publishable key)
SUPABASE_SERVICE_ROLE_KEY=         # 서버 전용, 마이그레이션/관리 스크립트만. 요청 경로에서 사용 금지
ANTHROPIC_API_KEY=                 # 서버 전용
AI_DAILY_REQUEST_LIMIT=30
NEXT_PUBLIC_SITE_URL=
```
- `.env.example`만 커밋. `NEXT_PUBLIC_` 접두사가 없는 키는 클라이언트 번들에 들어가지 않도록 `server-only` 모듈에서만 import.

## 9. 성능 예산

- Dashboard JS (gzip) < 120KB, 스프라이트 시트 개당 < 50KB (PNG, 인덱스 컬러)
- 폰트: Galmuri11 subset(KS X 1001 2,350자 + Latin) self-host, Pretendard Variable dynamic subset
- 이미지: 픽셀 아트는 **원본 1× PNG만 배포**하고 CSS로 정수 배율 확대 (2×/4× 파일을 따로 만들지 않음)
