# CLAUDE.md — LIFE RPG

이 파일은 이 저장소에서 작업하는 AI 에이전트와 사람 모두를 위한 **개발 규칙**이다. 작업 전에 반드시 읽는다.

## 프로젝트

**LIFE RPG** — 현실의 일정·목표·습관·취미를 MMORPG 퀘스트로 바꾸고, 실제 행동에 따라 캐릭터가 성장하는 개인 맞춤형 Life RPG Web App.
"Todo 앱에 XP를 붙인 것"이 아니라 **"내 현실을 MMORPG처럼 플레이하는 앱"**이어야 한다. 기능 완성도와 시각 완성도는 동일하게 중요하다.

## 문서 맵 (단일 소스)

| 주제 | 문서 |
|------|------|
| 제품 정의, MVP 범위, 사용자 흐름 | `docs/PRODUCT_SPEC.md` |
| 퀘스트/XP/레벨/스탯/업적 규칙 | `docs/GAME_SYSTEM.md` |
| Game Master (추천·브리핑·템플릿, 규칙 기반) | `docs/GAME_MASTER.md` |
| 스택, 디렉터리, DB 스키마, RLS, 테스트 | `docs/ARCHITECTURE.md` |
| Phase 계획 | `docs/ROADMAP.md` |
| 배포·런치 체크리스트·베타 운영 | `docs/DEPLOY.md` |
| 페르소나·시뮬레이션 결과 | `docs/PERSONAS.md`, `docs/SIMULATION.md` (생성) |
| 아트 방향 | `design/ART_DIRECTION.md` |
| 픽셀 제작·렌더링 규칙 | `design/PIXEL_RULES.md` |
| 색 토큰 | `design/COLOR_PALETTE.md` |
| 캐릭터/스프라이트 | `design/CHARACTER_GUIDE.md` |
| 레이아웃/컴포넌트/상태/접근성 | `design/UI_GUIDE.md` |

규칙을 바꾸는 코드 변경은 **같은 PR에서 해당 문서도 갱신**한다.

## 스택

Next.js (App Router) · TypeScript strict · Tailwind CSS v4 + CSS 변수 토큰 · shadcn/ui(필요한 곳만) · Zod · Supabase (Postgres + Auth + RLS) · Vitest · Playwright · pnpm · Vercel (대안: Cloudflare Workers + OpenNext)

## 명령어

```bash
pnpm dev            # 개발 서버 (/styleguide = 디자인 시스템 레퍼런스, dev/preview 전용)
pnpm typecheck      # next typegen && tsc --noEmit
pnpm lint           # eslint (의존 방향 import 규칙 포함)
pnpm test           # vitest — lib/game, 아트 원본·팔레트 검사 포함
pnpm build          # next build
pnpm format         # prettier (CI는 pnpm format:check)
pnpm art:build      # /art 원본 → PNG 시트 + 타입 매니페스트 + 파비콘 (생성 파일은 손으로 고치지 않음)
pnpm art:check      # 배포 PNG의 LIFE-32 팔레트/알파 검사
pnpm sim            # 4주 페르소나 규칙 시뮬레이션 리포트 (규칙 변경 후 --write로 docs/SIMULATION.md 갱신)
pnpm sim --compare beta.json   # 베타 지표(beta-metrics.sql 7번) ↔ 시뮬레이션 범위 비교
VISUAL=1 pnpm test:e2e visual   # 픽셀 시스템 시각 회귀 (아트 변경 후 --update-snapshots)
pnpm db:start       # 로컬 Supabase (Docker) — Postgres :54322, API :54321, Mailpit :54324
pnpm db:reset       # 마이그레이션 재적용
pnpm db:types       # DB 타입 생성 → src/lib/supabase/database.types.ts (마이그레이션 후 필수)
pnpm test:e2e       # Playwright (로컬 DB 필요). E2E_PROD=1 → 프로덕션 빌드, E2E_CF=1 → Workers 런타임(pnpm cf:build 먼저)
pnpm cf:preview     # Cloudflare Workers 런타임으로 로컬 실행 · pnpm cf:deploy (docs/DEPLOY.md §6)
```
커밋/푸시 전 `pnpm typecheck && pnpm lint && pnpm test`가 통과해야 한다. 화면/플로우를 바꿨다면 `pnpm test:e2e`도.
처음 실행: `cp .env.example .env.local && pnpm db:start`.

**Next.js 16.4**는 학습 데이터보다 새 버전이다 (Cache Components 기본, Turbopack, 비동기 request API). Next API를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 가이드를 먼저 읽는다 (`AGENTS.md`).

## 작업 방식 (Phase Workflow)

현재 Phase는 `docs/ROADMAP.md`를 따른다. 한 번에 여러 Phase를 구현하지 않는다. 각 Phase는:
1. 현재 상태 분석 → 2. 구현 계획 제시 → 3. 구현 → 4. 테스트 → 5. 문제 수정 → 6. 결과 요약 → 7. 다음 Phase 제안
사용자 확인 후 다음 Phase로 진행한다.

## 핵심 규칙

### 게임 규칙
- XP·레벨·스탯·업적·추천 로직은 **`src/lib/game/`에만** 둔다. 컴포넌트/액션/SQL에 수치 하드코딩 금지.
- `lib/game`은 순수 TypeScript (React·Supabase·Next import 금지), 모든 함수에 단위 테스트.
- 레벨은 저장하지 않고 `total_xp`에서 파생한다.
- 퀘스트 완료/취소, 업적 지급, Questline 클리어처럼 **XP가 움직이는 모든 작업은 DB RPC(단일 트랜잭션)**로 처리하고 `xp_logs`에 기록한다. 원장 기록은 삭제하지 않고 `reversal`로 정정한다.
- 미완료로 XP를 깎지 않는다. 스탯은 "평가"가 아닌 "성장 기록"이다 — UI 문구도 마찬가지.

### Game Master
- **LLM/외부 AI API를 쓰지 않는다** (2026-10-08 결정). 추천·브리핑·템플릿은 `lib/game`의 결정적 규칙.
- 사용자는 XP를 입력하지 않는다 (`difficulty`만). XP는 `questXp()`가 계산한다.
- GM은 추천만, 결정은 플레이어 — 추천 목록은 언제나 수정 가능해야 한다.

### 데이터 & 보안
- 스키마 변경은 `supabase/migrations/*.sql`로만. 모든 테이블 RLS 활성화.
- 서버에서 권한 판단은 `supabase.auth.getUser()` 기준.
- `xp_logs`, `quest_completions`, `user_achievements`, `character_stats`는 클라이언트 직접 쓰기 금지 (RPC only).
- `SUPABASE_SERVICE_ROLE_KEY`는 요청 경로에서 사용 금지.

### 디자인 시스템
- 색은 `src/styles/tokens.css`의 **시맨틱 토큰**만 사용 (`bg-surface`, `text-muted`, `bg-accent` …). 임의 hex, Tailwind 기본 팔레트, 임의 px 값(`mt-[13px]`) 금지.
- **Pixel-heavy**: 캐릭터, 아이콘, 배지, XP 바, 퀘스트 카드 프레임, 대표 CTA, 게임 연출.
  **Modern**: 본문, 폼, 캘린더, 설정, 내비게이션 라벨, 데이터 표.
- 픽셀 아트: 정수 배율(2–6×)만, `image-rendering: pixelated`, 1× 원본만 배포, LIFE-32 팔레트, 1ap `ink-950` 외곽선, 광원 좌상단.
- 픽셀 요소에 `border-radius`·블러 섀도·그라디언트·글래스모피즘 금지. Modern 요소 radius는 4px만.
- 모든 화면을 같은 카드로 도배하지 않는다 (UI_GUIDE §5.2 섹션별 컴포넌트 사용).
- 화면당 Accent CTA는 최대 1개. 과도한 애니메이션 금지, `prefers-reduced-motion` 존중.
- placeholder UI를 최종 디자인처럼 남기지 않는다. 새 컴포넌트/에셋은 `/styleguide`에 먼저 추가한다.
- `cn()`은 클래스를 이어 붙일 뿐 충돌을 해결하지 않는다. 컴포넌트 내부의 `display`/크기 유틸리티를 `className`으로 덮어쓰지 말고 바깥을 감싼다.

### 코드 품질
- TypeScript strict, `any` 금지 (불가피하면 `unknown` + 좁히기).
- 작은 컴포넌트, 기능 단위 폴더(`src/features/*`). 거대 컴포넌트·한 파일에 모든 기능 금지.
- 의존 방향: `app → features → components/game → components/pixel|ui → lib`. 역방향 import 금지.
- Server Action은 `{ ok: true, data } | { ok: false, error: { code, message } }` 반환. 오류 문구 매핑은 한 곳.
- 모든 데이터 화면에 loading / empty / error 상태를 구현한다.
- 접근성: 대비 AA, 키보드 조작, 터치 타깃 44px, 색 외의 의미 전달, `aria-live` 알림.
- 새 의존성은 필요성을 PR 설명에 적은 뒤 추가. 라이브러리 대량 설치 금지.
- 기존 코드를 이유 없이 대량 삭제·재작성하지 않는다.

### 카피
- 게임 용어 라벨은 영문 대문자(`MAIN QUEST`), 설명은 한국어.
- 캐릭터/GM 대사는 반말, 시스템 문구는 해요체. "실패/패배" 대신 "기한 만료/다시 도전".

## Git

- 커밋 메시지: 영어 Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`), 본문에 이유.
- 한 커밋 = 한 논리적 변경. 마이그레이션은 별도 커밋.
