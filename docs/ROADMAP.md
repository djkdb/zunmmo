# LIFE RPG — Roadmap

- 문서 상태: v0.1 (Phase 0)
- 목표: **10주 안에 Production Launch** (8주 Beta + 2주 안정화)
- 원칙: 각 Phase는 *분석 → 계획 → 구현 → 테스트 → 수정 → 요약 → 다음 Phase 제안* 순서로 진행하고, 사용자 확인 후 다음 Phase로 넘어간다.

---

## 타임라인 개요

| 주차 | Phase | 핵심 산출물 |
|---|---|---|
| W0 | **0. Audit + Architecture** | 문서 세트, CLAUDE.md |
| W1 | **1. Design System** | 프로젝트 스캐폴드, 토큰, 폰트, 픽셀/모던 프리미티브, 스타일가이드 페이지, 첫 캐릭터 스프라이트 |
| W1–2 | **2. Landing Page** | 픽셀 히어로 랜딩, 반응형, OG 이미지 |
| W2–3 | **3. Auth + Character** | Supabase 연동, 로그인, 온보딩, 캐릭터 생성, 앱 셸(내비) |
| W3–4 | **4. Quest Engine** | 퀘스트 CRUD, 타입/난이도/반복/마감, 대시보드 v1 |
| W4–5 | **5. XP + Level + Achievement** | `complete_quest` RPC, 원장, 레벨업/업적 연출, 스탯 |
| W5–6 | **6. Calendar** | 주/월 뷰, 일정, 퀘스트 연결, Today's Adventure(결정적) |
| W6–7 | **7. AI Game Master** | F1/F2/F3, 제안 검토 UI, rate limit, eval |
| W7–8 | **8. Animation + Pixel Polish** | 스프라이트 상태 확장, 연출 다듬기, 시각 회귀 테스트 |
| W8–9 | **9. Beta** | 10–30명 클로즈드 베타, 계측, 버그/밸런스 수정 |
| W10 | **10. Production Launch** | 개인정보처리방침/약관, 모니터링, 공개 |

---

## Phase 0 — Repository Audit + Architecture ✅ (이번 작업)
- [x] Repository 분석 (빈 저장소, greenfield)
- [x] 스택/아키텍처 제안 → `docs/ARCHITECTURE.md`
- [x] 제품/게임/AI 문서 → `docs/PRODUCT_SPEC.md`, `GAME_SYSTEM.md`, `AI_GAME_MASTER.md`
- [x] 디자인 시스템 문서 → `design/*.md`
- [x] `CLAUDE.md`

**Exit**: 사용자 문서 리뷰 & 열린 질문(PRODUCT_SPEC §11) 결정

## Phase 1 — Design System ✅
- [x] Next.js 16.4 + TS strict + Tailwind v4 + ESLint(의존 방향 규칙)/Prettier + Vitest + Playwright 스캐폴드 (pnpm)
- [x] `src/styles/tokens.css` — COLOR_PALETTE 1:1, Tailwind 기본 팔레트/섀도/radius 비활성화, 라이트 토큰 자리
- [x] 폰트: Galmuri11 subset 51KB (12/24/36px 실측 AA 0%), Pretendard dynamic subset
- [x] Pixel primitives: `PixelFrame`, `PixelButton`, `PixelBar`, `PixelIcon`/`PixelGlyph`, `Sprite`, `PixelTag`, `PixelStars`, `PixelSpinner`, skeleton
- [x] Modern primitives: `Button`, `TextField`, `Dialog`/`Sheet`(native dialog), `Toast`(되돌리기 액션)
- [ ] `Textarea`, `Select` → Phase 4 퀘스트 폼에서 실제 사용처와 함께 추가
- [x] Game components: `XpBar`, `LevelBadge`, `QuestCard`(5 타입), `QuestRow`, `CompleteButton`, `QuestTypeTag`, `StatBar`, `CharacterSprite`(idle + 상태 fallback)
- [x] 아트 파이프라인(`pnpm art:build` / `art:check`) + 캐릭터 idle 4프레임 × 의상 4종, 아이콘 20종(퀘스트 5·스탯 5·UI 10), 난이도 별 글리프, 파비콘
- [x] `/styleguide` (dev/preview 전용) — 토큰/에셋/컴포넌트/상태 시연
- [x] `lib/game` (xp, level, stats, titles, time) + 테스트

**Exit** (통과): 모바일 390px·데스크톱 1280px 스크린샷 리뷰, 가로 스크롤 없음, 버튼 터치 타깃 ≥ 44px, 콘솔 오류 0, 키보드/ESC/포커스 복귀·reduced-motion 확인, `typecheck`·`lint`·`test`(103)·`build` 통과

## Phase 2 — Landing Page
- 히어로: 픽셀 장면(캐릭터 + 퀘스트 보드) + 한 문장 가치 제안 + CTA
- "어떻게 플레이하나" 3단계(말하기 → 퀘스트 수락 → 성장) 섹션
- 반응형, Lighthouse 성능/접근성 ≥ 90, OG 이미지(픽셀)

**Exit**: 모바일 360px ~ 데스크톱 1440px 레이아웃 확인

## Phase 3 — Auth + Character
- Supabase 프로젝트, 마이그레이션 `profiles`/`characters`/`character_stats`, RLS
- Magic link + Google OAuth, `middleware.ts` 보호 라우트
- 온보딩: 이름 → 외형 프리셋(4종) → 완료 → `/adventure`
- AppShell: 모바일 하단 내비 / 데스크톱 사이드 내비

**Exit**: 신규 가입 → 캐릭터 생성 e2e 통과, 타 사용자 데이터 접근 불가 테스트

## Phase 4 — Quest Engine
- `goals`, `quests`, `quest_completions` 마이그레이션 + RLS
- 퀘스트 생성/수정 폼 (빠른 추가: 제목 + 타입 + 난이도 3필드), 반복 규칙, 마감
- 퀘스트 목록(타입 탭, 필터), 상세, archive
- 대시보드 v1: Character / Level / XP / Main / Daily / Side / Boss (실데이터)
- 낙관적 UI 완료 (임시: 단순 상태 변경 — Phase 5에서 RPC로 교체)

**Exit**: 퀘스트 생성→목록→완료 2탭 이내, 빈/로딩/오류 상태 모두 디자인 적용

## Phase 5 — XP + Level + Achievement
- `xp_logs`, `achievements`, `user_achievements` + RPC (`complete_quest`, `uncomplete_quest`, `grant_achievement`, `clear_goal`)
- 동시성 테스트 (같은 퀘스트 동시 완료 → 1회만 지급)
- 연출: XP 플로팅, XP 바 채움, 레벨업 모달, 업적 토스트 (연출 큐)
- 캐릭터 화면: 스탯, 업적 그리드, 최근 XP 기록, 주간 XP 그래프
- Streak (daily / adventure)

**Exit**: 원장 합계 == `total_xp` 검증 쿼리 통과, 레벨업/업적 연출 reduced-motion 대응

## Phase 6 — Calendar
- `schedules`, `adventures` 마이그레이션
- 주간(기본, 모바일)/월간 뷰, 퀘스트 마감·일정·daily 회차 표시
- Today's Adventure (결정적 `recommendToday`) + **START TODAY'S ADVENTURE** CTA 실동작

**Exit**: AI 없이 Today's Adventure 전체 플로우 동작

## Phase 7 — AI Game Master
- `ai_requests` + rate limit, `lib/ai` (config, prompts, wire/domain schema, normalize)
- F1 자연어 → 퀘스트 (GM 화면 + 대시보드 빠른 입력), 제안 검토 UI
- F2 목표 분해, F3 Today's Adventure AI 브리핑
- Eval 세트 30+ 케이스, 지표 기록

**Exit**: [AI_GAME_MASTER §11](./AI_GAME_MASTER.md#11-품질-평가-eval) 기준 충족

## Phase 8 — Animation + Pixel Polish
- 캐릭터 상태: walking, studying, working, exercising, celebrating, sleeping, level-up
- 퀘스트 타입별 완료 이펙트, 보스 처치 연출, 업적 배지 희귀도 프레임
- 마이크로 인터랙션 정리, 성능 측정(애니메이션 중 60fps), 시각 회귀 스냅샷
- 라이트 테마(선택)

## Phase 9 — Beta
- 10–30명 클로즈드 베타, 피드백 채널, 이벤트 계측(PRODUCT_SPEC §9 지표)
- 밸런스 조정(레벨 곡선/XP), AI 프롬프트 개선, 버그 수정
- PWA (manifest, 아이콘), 오류 모니터링

## Phase 10 — Production Launch
- 개인정보처리방침/이용약관 (AI 처리 위탁 포함), 계정 삭제 기능
- 백업/복구 확인, rate limit/비용 알림, 도메인/OG
- 공개 + 런치 노트

---

## Post-Launch 후보
HIDDEN QUEST · 주간 모험 일지 · Google Calendar 동기화 · 푸시 알림 · 의상/장비 커스터마이징 · 월드맵 · 파티/친구 · Kakao 로그인 · 영어 UI

## 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 픽셀 아트 제작량 | 일정 지연, 품질 불균일 | MVP 에셋 목록 고정(CHARACTER_GUIDE §9), 1인 아트 오너, 팔레트/그리드 검수 체크리스트 |
| AI 비용/지연 | 사용성·비용 | 결정적 폴백, effort 조정, 캐싱, 일일 한도 |
| "또 하나의 Todo 앱" 인상 | 리텐션 | 완료 연출·캐릭터 반응을 Phase 5부터 우선 구현, Beta에서 정성 인터뷰 |
| 과도한 범위 | 일정 | Out of Scope 목록(PRODUCT_SPEC §6) 준수, Phase별 Exit 기준 |
