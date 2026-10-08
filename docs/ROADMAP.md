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
| W6–7 | **7. Game Master (규칙 기반)** | GM 브리핑, 퀘스트 템플릿, 빠른 추가 고도화, Questline 단계 입력 |
| W7–8 | **8. Animation + Pixel Polish** | 스프라이트 상태 확장, 연출 다듬기, 시각 회귀 테스트 |
| W8–9 | **9. Beta** | 10–30명 클로즈드 베타, 계측, 버그/밸런스 수정 |
| W10 | **10. Production Launch** | 개인정보처리방침/약관, 모니터링, 공개 |

---

## Phase 0 — Repository Audit + Architecture ✅ (이번 작업)
- [x] Repository 분석 (빈 저장소, greenfield)
- [x] 스택/아키텍처 제안 → `docs/ARCHITECTURE.md`
- [x] 제품/게임/GM 문서 → `docs/PRODUCT_SPEC.md`, `GAME_SYSTEM.md`, `GAME_MASTER.md`
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

## Phase 2 — Landing Page ✅
- [x] 히어로: 밤의 마을 픽셀 장면(퀘스트 게시판 + "!" 마커 + 랜턴 + 캐릭터), 3×/4×/5× 반응형 배율
- [x] "어떻게 플레이하나" 3단계(게시판에 올리기 → 오늘의 모험 → 성장) — 실제 게임 컴포넌트로 시연
- [x] 퀘스트 보드(나무 프레임 + 양피지 노트), 원칙 섹션, 마무리 CTA, 푸터
- [x] OG 이미지: 6× 사전 렌더 장면 + Galmuri 72/36px (리샘플링 없음)
- [x] 아트: walking 4프레임, 장면 소품 6종

**Exit** (통과): 390px·1280px 가로 스크롤 없음, 콘솔 오류 0, axe(WCAG 2.1 AA) 위반 0

## Phase 3 — Auth + Character ✅
- [x] 로컬 Supabase(Docker) + 마이그레이션 `profiles`/`characters`/`character_stats`, `create_character` RPC, RLS·컬럼 권한
- [x] 이메일 OTP 로그인 (6자리 코드 + 매직 링크 한 통), Google OAuth(옵션), `proxy.ts` 세션 갱신·보호 경로
- [x] 온보딩: 이름 + 외형 프리셋 4종 → `/adventure`
- [x] AppShell: 모바일 하단 내비(가운데 퀘스트 추가) / 데스크톱 사이드 내비, 설정(로그아웃)
- [x] DB 테스트(실제 역할·JWT로 RLS 검증) 7개, E2E(가입→캐릭터→모험→로그아웃, 잘못된 코드, 로그인 페이지 우회), axe

**Exit** (통과): E2E 10/10 — dev와 프로덕션 빌드(`E2E_PROD=1`) 모두, 타 사용자 데이터 접근 불가·XP 직접 쓰기 불가 테스트 통과

## Phase 4 — Quest Engine ✅
- [x] 마이그레이션 `goals`/`quests` + RLS·컬럼 권한, 타입별 제약(boss 마감·daily 반복·main 퀘스트라인), 보관 RPC
- [x] `lib/game`: 반복 규칙(Zod) + 오늘 회차 판정, 읽을 때 계산하는 "기한 만료", XP 가중 퀘스트라인 진행률, 타입별 기본값
- [x] 퀘스트 추가(빠른 입력 + 날짜 칩 + 더 보기), 상세·수정·보관/복원, 게시판(타입 필터·보관함)
- [x] 대시보드 v1: 보스 현상수배서(7일 이내 최단), 메인 퀘스트라인 맵, 오늘의 데일리, 사이드 3개
- [x] `Textarea`, `Select`, `ChoiceGroup`, `DifficultyPicker`
- [ ] 완료 버튼 → Phase 5 (XP 트랜잭션과 함께)

**Exit** (통과): E2E — 4종 생성 + 보스 마감 검증 + 대시보드 표시, 수정·보관·복원 / DB 테스트 14 / axe 0

## Phase 5 — XP + Level + Achievement ✅
- [x] `quest_completions`, `xp_logs`, `user_achievements` + RPC (`complete_quest`, `uncomplete_quest`, `clear_goal`, `player_progress`)
- [x] 게임 날짜를 DB가 계산 (TS `gameDate`와 동일성 테스트), 동시성 테스트 (6개 동시 완료 → 1회 지급)
- [x] 연출: XP 플로팅, 레벨업 장면, Questline 클리어·업적 토스트, `aria-live` 요약, reduced-motion 대응
- [x] 낙관적 완료 + 되돌리기 토스트 (대시보드 · 퀘스트 목록 · 상세)
- [x] 캐릭터 화면: 스탯, 업적 그리드(잠김 실루엣), 기록, 주간 XP 그래프, XP 원장
- [x] 모험 연속일 (보너스 XP 없음 — GAME_SYSTEM §6), 대시보드 RECENT
- [x] `(game)/error.tsx` 오류 상태
- 변경: 업적은 XP 없는 배지 → `grant_achievement` RPC 대신 본인 INSERT. Daily별 streak은 Phase 8 이후 검토

**Exit** (통과): 원장 합계 == `total_xp` DB 테스트 / E2E — 완료·업적·되돌리기, 레벨업 장면 / axe 0 (캐릭터 화면 포함)

## Phase 6 — Calendar + Today's Adventure ✅
- [x] `schedules`, `adventures` 마이그레이션 (RLS: 연결/선택한 퀘스트도 본인 것만)
- [x] `recommendToday` (결정적, 용량·일정 반영, D-0/1 보스 고정) + 단위 테스트
- [x] 대시보드 TODAY'S ADVENTURE: 미시작(Accent CTA) → 진행 중(번호 체크리스트, 남은 보상) → 완료(축하) / 다시 추천받기
- [x] `/calendar` 주간 스트립·월간 그리드 + 선택일 아젠다 (하루 종일 / 시간 일정 / 완료), 미니 픽셀 마커 + 범례 + 스크린리더 요약
- [x] `/calendar/new` 일정 추가 (로컬 시각 → timestamptz, DST 안전), 삭제
- [x] 폼 오류 시 입력 유지 (React 19 폼 리셋 대응 — `withValues`)

**Exit** (통과): E2E — 오늘의 모험 시작→완료, 일정 추가(검증 오류 후 재제출)·마감 표시·월간 뷰·삭제 / DB 테스트 28 / axe 0 (캘린더 포함)

## Phase 7 — Game Master (규칙 기반)
> 2026-10-08 결정: Claude API(LLM) 연동 제외. GM은 결정적 규칙 + 템플릿 ([GAME_MASTER](./GAME_MASTER.md)).
- GM 브리핑 (상황 판정 + 문장 템플릿, 날짜 기반 결정적 선택)
- 퀘스트 템플릿 30개 내외 (카테고리별), 온보딩 첫 퀘스트 선택
- 빠른 추가: 날짜 칩, 타입별 기본값
- Questline 생성 시 단계 여러 줄 입력

**Exit**: 템플릿만으로 온보딩 → 첫 XP까지 3분 이내, 브리핑/추천 로직 단위 테스트

## Phase 8 — Animation + Pixel Polish
- 캐릭터 상태: walking, studying, working, exercising, celebrating, sleeping, level-up
- 퀘스트 타입별 완료 이펙트, 보스 처치 연출, 업적 배지 희귀도 프레임
- 마이크로 인터랙션 정리, 성능 측정(애니메이션 중 60fps), 시각 회귀 스냅샷
- 라이트 테마(선택)

## Phase 9 — Beta
- 10–30명 클로즈드 베타, 피드백 채널, 이벤트 계측(PRODUCT_SPEC §9 지표)
- 밸런스 조정(레벨 곡선/XP), 추천 가중치·GM 문장 다듬기, 버그 수정
- PWA (manifest, 아이콘), 오류 모니터링

## Phase 10 — Production Launch
- 개인정보처리방침/이용약관, 계정 삭제 기능
- 백업/복구 확인, rate limit/비용 알림, 도메인/OG
- 공개 + 런치 노트

---

## Post-Launch 후보
HIDDEN QUEST · 주간 모험 일지 · Google Calendar 동기화 · 푸시 알림 · 의상/장비 커스터마이징 · 월드맵 · 파티/친구 · Kakao 로그인 · 영어 UI

## 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 픽셀 아트 제작량 | 일정 지연, 품질 불균일 | MVP 에셋 목록 고정(CHARACTER_GUIDE §9), 1인 아트 오너, 팔레트/그리드 검수 체크리스트 |
| "또 하나의 Todo 앱" 인상 | 리텐션 | 완료 연출·캐릭터 반응을 Phase 5부터 우선 구현, Beta에서 정성 인터뷰 |
| 과도한 범위 | 일정 | Out of Scope 목록(PRODUCT_SPEC §6) 준수, Phase별 Exit 기준 |
