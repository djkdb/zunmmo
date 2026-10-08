# LIFE RPG — Architecture

- 문서 상태: v0.1 (Phase 0)
- 범위: 기술 스택, 디렉터리 구조, 데이터 흐름, DB 스키마, 보안, 테스트, 배포

---

## 1. 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| Framework | **Next.js (App Router, 최신 stable)** + React | RSC로 대시보드 초기 로드 최적화, Server Actions로 폼/뮤테이션 단순화, Vercel 1급 지원 |
| Language | **TypeScript `strict`** + `noUncheckedIndexedAccess` | 게임 규칙·폼 스키마의 타입 안전성 |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`) + CSS Variables | 디자인 토큰을 CSS 변수 하나로 관리 → Tailwind 유틸리티와 픽셀 컴포넌트가 같은 토큰 사용 |
| UI primitives | **shadcn/ui (선택적)** — Dialog, Popover, DropdownMenu, Toast, Calendar 정도 | 접근성 있는 Radix 기반 동작만 차용, 시각은 우리 토큰으로 재스킨 |
| Validation | **Zod** | 폼·Server Action 입력·DB JSON(repeat_rule 등) 공통 검증 |
| Database | **Supabase PostgreSQL** | RLS, RPC(트랜잭션 함수), 마이그레이션 CLI |
| Auth | **Supabase Auth** (`@supabase/ssr`) | Magic link + Google OAuth (Kakao는 Beta 이후) |
| AI | **사용하지 않음** (2026-10-08 결정) | Game Master는 규칙 기반 — [GAME_MASTER](./GAME_MASTER.md) |
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
│  ├─ sprites/                   # (생성) 캐릭터 스프라이트 시트 PNG
│  └─ icons/                     # (생성) 아이콘/글리프 아틀라스 PNG
├─ art/                          # 픽셀 아트 원본 — 팔레트 코드 그리드(TS). PIXEL_RULES §8
├─ scripts/art/                  # art:build / art:check
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
   │  │  └─ settings/
   │  └─ auth/                   # Route Handlers (OAuth/OTP 콜백 등 Server Action으로 부적합한 것만)
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
   ├─ lib/
   │  ├─ game/                   # ★ 게임 규칙 단일 소스 (순수 TS, React/DB 의존 금지)
   │  │  ├─ xp.ts  level.ts  stats.ts  titles.ts  achievements.ts  recommend.ts  briefing.ts  templates.ts  time.ts
   │  │  └─ __tests__/
   │  ├─ supabase/               # server.ts / client.ts / middleware.ts, database.types.ts(생성)
   │  └─ utils/
   ├─ styles/
   │  ├─ tokens.css              # ★ 디자인 토큰 단일 소스 (design/COLOR_PALETTE.md와 1:1)
   │  ├─ pixel.css               # 픽셀 UI 프리미티브 (frame/button/bar/tag)
   │  └─ fonts/                  # self-host 폰트 (Galmuri11 subset, Pretendard dynamic subset) + 라이선스
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

### 3.3 Game Master (규칙 기반)
```
adventure/actions.ts → queries (활성 퀘스트, 최근 완료, 오늘 일정)
  → lib/game/recommend.ts (점수) + lib/game/briefing.ts (대사 템플릿)
  → adventures(game_date) upsert → UI
```
외부 API 호출 없음. 상세: [GAME_MASTER](./GAME_MASTER.md).

## 4. 인증 & 라우팅

- `src/proxy.ts` (Next 16에서 middleware → proxy로 이름 변경): 모든 요청에서 Supabase 세션 쿠키 갱신, 보호 경로 미인증 시 `/login?next=…`, 로그인 상태로 `/login` 접근 시 `/adventure`. 리다이렉트 응답에도 갱신된 쿠키를 복사한다.
- **로그인 = 이메일 OTP**: 한 통의 메일에 6자리 코드 + 매직 링크(`/auth/confirm?token_hash=…`). 코드는 설치형 PWA에서도 동작한다 (매직 링크는 다른 브라우저 컨텍스트로 열려 PWA 세션이 안 생김). 템플릿: `supabase/templates/sign-in.html`. Google OAuth는 `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`일 때만 노출 (`/auth/callback`).
- `next` 파라미터는 `safeNextPath()`로 같은 출처의 상대 경로만 허용 (open redirect 방지).
- 로그인 후 기본 진입: `/adventure`. 캐릭터 미생성 시 `/onboarding` (`requireCharacter()`).
- 서버에서 사용자 확인은 항상 `getUser()`(토큰 검증) 사용. `getSession()` 결과를 신뢰해 권한 판단하지 않는다.

### 4.1 Cache Components와 세션 (Next 16)
- 세션을 읽는 컴포넌트는 **반드시 `<Suspense>` 안**에 둔다 (밖에서 `cookies()`를 읽으면 빌드 오류). 페이지는 정적 셸(제목·내비)을 즉시 보여 주고 플레이어 데이터는 스트리밍된다 → 빌드 결과 `◐ Partial Prerender`.
- `createClient()`(서버)는 `await connection()`으로 시작한다. Supabase Auth가 토큰 만료를 현재 시각으로 비교하는데, Cache Components는 요청에 묶이기 전의 `Date.now()`를 금지하기 때문.
- 데이터 접근은 `src/features/player/queries.ts`의 `getPlayer()`(React `cache`로 요청당 1회) — DAL 패턴.
- Next는 이전 라우트를 숨긴 채 유지한다(React Activity). E2E 선택자는 `filter({ visible: true })`로 보이는 요소만 대상으로 한다.

## 5. Database Schema

> 모든 변경은 `supabase/migrations/*.sql`로만. 생성 타입은 `supabase gen types typescript`로 `src/lib/supabase/database.types.ts`에 출력.

### 5.1 Enums
```sql
create type quest_type   as enum ('main','daily','side','boss','hidden');
create type quest_status as enum ('active','completed','expired','archived');
create type stat_type    as enum ('int','foc','vit','soc','cre');
create type goal_status  as enum ('active','cleared','archived');
create type xp_reason    as enum ('quest_complete','goal_clear','achievement','streak_bonus','reversal','admin_adjust');
create type quest_source as enum ('manual','template','system');
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
  source text not null default 'manual',  -- 'manual' | (later) 'google'
  created_at
)

adventures (                             -- Today's Adventure
  id uuid pk, user_id uuid not null, game_date date not null,
  quest_ids uuid[] not null, briefing text, source text not null, -- 'auto' | 'custom'
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
- `AppError.code`는 enum (`QUEST_NOT_FOUND`, `ALREADY_COMPLETED`, `UNAUTHENTICATED`, `VALIDATION_FAILED` …) → UI 문구 매핑은 `src/lib/errors/messages.ko.ts` 한 곳.
- 모든 라우트 세그먼트에 `loading.tsx`(픽셀 스켈레톤) / `error.tsx` 제공. 빈 상태는 [UI_GUIDE §8](../design/UI_GUIDE.md#8-states-loading--empty--error).

## 7. 테스트 전략

| 레이어 | 도구 | 범위 |
|--------|------|------|
| `lib/game` | Vitest | 100% 브랜치 커버리지 목표 (규칙이 곧 제품) |
| RPC/RLS | Vitest + `pg` (`supabase/tests`) — 실제 `authenticated`/`anon` 역할 + JWT claims로 실행 | 이중 완료, 타인 데이터 접근 거부, 컬럼 권한, reversal. 로컬 DB가 없으면 skip |
| UI | Playwright (`e2e/`) — 로그인 코드는 Mailpit API에서 읽음 | 가입→캐릭터 생성→퀘스트→완료→XP smoke, axe(WCAG 2.1 AA) 전 화면. `E2E_PROD=1`이면 `next start`로 실행 |
| 시각 | Playwright 스크린샷 (Phase 8) | 픽셀 컴포넌트 회귀 |

CI(GitHub Actions): `typecheck` → `lint` → `test` → `build`. Vercel Preview 배포.

## 8. 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # publishable key (구 anon key). 클라이언트 노출 OK — 권한은 RLS가 결정
NEXT_PUBLIC_SITE_URL=                  # 메일 링크/OAuth 리다이렉트 기준 URL
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=false  # Supabase에 Google provider를 설정했을 때만 true
SUPABASE_SERVICE_ROLE_KEY=             # (앱에서 사용하지 않음) 관리 스크립트 전용. 요청 경로에서 사용 금지
```
- `.env.example`만 커밋 (로컬 기본값 포함), `.env.local`은 git 제외. 공개 env는 `src/lib/supabase/env.ts`에서 Zod로 검증해 누락 시 즉시 실패. `NEXT_PUBLIC_` 접두사가 없는 키는 클라이언트 번들에 들어가지 않도록 `server-only` 모듈에서만 import.

## 9. 성능 예산

- Dashboard JS (gzip) < 120KB, 스프라이트 시트 개당 < 50KB (PNG, 인덱스 컬러)
- 폰트: Galmuri11 subset(KS X 1001 2,350자 + Latin) self-host, Pretendard Variable dynamic subset
- 이미지: 픽셀 아트는 **원본 1× PNG만 배포**하고 CSS로 정수 배율 확대 (2×/4× 파일을 따로 만들지 않음)
