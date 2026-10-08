# LIFE RPG — UI Guide

> 화면 구조, 타이포그래피, 레이아웃, 컴포넌트, 상태, 접근성 규칙.
> 목표: **앱을 켜고 5초 안에** 나·레벨·오늘 할 일·가장 중요한 퀘스트·지금 누를 버튼을 안다.

- 문서 상태: v0.1 (Phase 0)
- 관련: [ART_DIRECTION](./ART_DIRECTION.md) · [PIXEL_RULES](./PIXEL_RULES.md) · [COLOR_PALETTE](./COLOR_PALETTE.md) · [PRODUCT_SPEC §8](../docs/PRODUCT_SPEC.md#8-dashboard-정보-계층)

---

## 1. Breakpoints & 레이아웃 셸

| 이름 | 최소 폭 | 셸 |
|------|---------|----|
| base | 0 (기준 360px) | **하단 내비 5탭**, 단일 컬럼, 좌우 여백 16px |
| `sm` | 640px | 단일 컬럼, 콘텐츠 최대 560px 중앙 정렬 |
| `md` | 768px | 하단 내비 유지, 2컬럼 그리드 일부 허용 |
| `lg` | 1024px | **좌측 사이드 내비 (240px)**, 대시보드 2컬럼 (캐릭터 패널 + 메인) |
| `xl` | 1280px | 콘텐츠 최대 1200px |

### 1.1 모바일 하단 내비

```
┌──────┬──────┬────────┬──────┬──────┐
│ 🗺   │ 📜   │ ╔════╗ │ 📅   │ 🧝   │   아이콘은 16×16 픽셀 아이콘 2× (이모지는 설명용)
│ 모험 │ 퀘스트│ ║ ＋ ║ │ 캘린더│ 캐릭터│   높이 64px + safe-area-inset-bottom
└──────┴──────┴─╚════╝─┴──────┴──────┘
                 ▲ 가운데 퀘스트 추가 버튼: 픽셀 프레임, 위로 돌출, accent 테두리
```
- 활성 탭: 아이콘 아래 2유닛 gold-400 픽셀 바 + 라벨 `--color-text`. 비활성: `--color-text-muted`.
- 설정은 캐릭터 탭 우상단 톱니 아이콘.
- 스크롤 시 내비는 고정 (숨기지 않음 — 일상 도구로서 예측 가능성 우선).

### 1.2 데스크톱 사이드 내비
- 상단: 로고(픽셀 워드마크) → 미니 캐릭터(2×) + Lv → 내비 항목 → 하단 퀘스트 추가 버튼 → 설정.
- 항목 높이 44px, 활성 항목 좌측 4px 타입 색 스트립 + `surface-raised` 배경.

## 2. Typography

| 용도 | 폰트 | 크기/행간 | 굵기 | 비고 |
|------|------|-----------|------|------|
| Display XL (LEVEL UP!) | Pixel | 36 / 40 | — | 연출 전용 |
| Display L (`Lv.24`, 큰 숫자) | Pixel | 24 / 28 | — | |
| Label (섹션 라벨 `MAIN QUEST`, 태그, CTA) | Pixel | 12 / 16 | — | 영문 대문자 + 자간 0 |
| Number S (`+70 XP`, `420 / 1,000`) | Pixel | 12 / 16 | — | `font-variant-numeric: tabular-nums` 유사 효과 위해 고정폭 숫자 |
| H1 (페이지 제목) | Sans | 24 / 32 | 700 | |
| H2 (섹션 제목) | Sans | 18 / 26 | 700 | |
| Title (퀘스트 제목) | Sans | 16 / 22 | 600 | 2줄 말줄임 |
| Body | Sans | 16 / 24 | 400 | 모바일 입력 확대 방지 위해 입력 필드 16px 이상 |
| Small | Sans | 14 / 20 | 400 | 메타 정보 |
| Caption | Sans | 12 / 16 | 500 | 최소 크기 |

- **Pixel** = `Galmuri11` (한글 지원 픽셀 폰트, OFL). **Sans** = `Pretendard Variable` (OFL).
- 픽셀 폰트는 **설계 크기(12px)의 정수배에서만** 선명하다. Phase 1 실측(Chromium): 12/24/36px은 안티앨리어싱 픽셀 **0%**, 13px·16px은 약 80%. 토큰은 `text-pixel` / `text-pixel-2x` / `text-pixel-3x` 세 개뿐이다. (Windows·macOS·iOS 실기기 확인은 Beta 체크리스트)
- 폰트 파일: Galmuri11을 KS X 1001 한글 2,350자 + Latin + 기호로 subset (505KB → 51KB). subset 밖 글자는 Pretendard로 대체 렌더링된다.
- 픽셀 폰트를 **본문·설명·폼에 쓰지 않는다.** 한 줄 라벨, 숫자, 연출 텍스트에만.
- 한국어 라벨이 길어지는 버튼(예: "퀘스트 수락")은 Sans 15/600 허용. 대표 CTA만 픽셀 폰트.
- 사용자가 브라우저 글꼴 크기를 키우면 Sans는 `rem`으로 확대. 픽셀 라벨은 줌(확대)으로만 커진다 → 라벨 의미는 아이콘·`aria-label`로도 전달.

## 3. Spacing & Layout Grid

- 기본 그리드 **4px**. 토큰: `1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64`.
- 픽셀 UI는 `--pixel-unit: 2px` 배수 ([PIXEL_RULES §1.3](./PIXEL_RULES.md#13-ui-픽셀-유닛)). 4px 그리드와 정합.
- 페이지 좌우 여백: 모바일 16, 태블릿 24, 데스크톱 32.
- 섹션 간 간격: 모바일 24, 데스크톱 32. 카드 내부 패딩: 12(컴팩트) / 16(기본).
- Modern 요소 radius: `--radius-sm: 4px` 하나만. 픽셀 요소: radius 0 + notched corner.
- 매직 넘버 금지: 컴포넌트에 `mt-[13px]` 같은 임의값 금지 (PR 리뷰 항목).

## 4. Dashboard (`/adventure`)

### 4.1 정보 계층 (위 → 아래 = 중요도)

1. **Character Header** — 나는 누구, 레벨, XP
2. **Today's Adventure** — 오늘 할 일 (미시작이면 대형 CTA)
3. **Boss Alert** — 7일 내 보스가 있을 때만. 보스가 퀘스트라인에 속하면 **준비도 바**(준비 단계 XP 진행률 = 보스 HP 감소)
4. **Main Quest** — 진행 중 Questline 1–2개
5. **Daily Quests** — 오늘 회차, **만든 순서대로** (루틴은 위→아래로 읽힌다)
6. **Side Quests** — 최대 3개 + "더 보기"
7. **Expired** — 기한이 지난 단발 퀘스트가 있을 때만, 최근 3개 + [다시 도전] [보관]. 문구는 "기한이 지나도 얻은 XP는 그대로야" — 비난 없이 정리만
8. **Recent Progress** — 최근 XP 로그, 이번 주 XP
9. 퀘스트 추가 진입점은 하단 내비 가운데(모바일) / 사이드 하단(데스크톱) + 빈 상태 CTA

### 4.2 모바일 와이어프레임 (360px)

```
┌────────────────────────────────────┐
│ ┌──────┐  성준            ⚙        │  Character Header (sticky 아님)
│ │ 캐릭터 │  베테랑 모험가             │  - 스프라이트 3× (96px), idle
│ │ 96px │  Lv.24                     │  - 이름(Title 16/600), 칭호(Small muted)
│ └──────┘  ████████░░░░░ 420/1,000XP │  - Lv(Display L) + XP 바 + 수치
├────────────────────────────────────┤
│ ╔══════════════════════════════╗   │  Today's Adventure — 미시작 상태
│ ║  오늘의 모험이 기다리고 있어    ║   │  - 양피지 프레임
│ ║  추천 퀘스트 4개 · +380 XP     ║   │
│ ║ [⚔ START TODAY'S ADVENTURE ]  ║   │  - Accent CTA, 높이 56px, 전체 폭
│ ╚══════════════════════════════╝   │
├────────────────────────────────────┤
│ ☠ BOSS  AI 중간고사         D-4    │  Boss Alert (현상수배서 스트립)
│        준비도 ███░░░ 40%           │  - 준비 퀘스트 진행률 = 보스 HP 감소
├────────────────────────────────────┤
│ MAIN QUEST                    72%  │  Main Questline 맵 스트립
│ 나만의 웹서비스 출시하기             │
│ ●━━●━━●━━◉━━○━━○                  │  - 완료(gold) / 현재(깜빡임) / 남음
│ 다음: 로그인 기능 만들기  +70 XP     │
├────────────────────────────────────┤
│ DAILY                        2/4   │  Daily — 컴팩트 행 (56px)
│ ☐ 운동 30분      ⭐⭐   +40 XP  [✓]│
│ ☐ 영단어 30개    ⭐     +20 XP  [✓]│
├────────────────────────────────────┤
│ SIDE                               │
│ 📜 축구하기 (토)  ⭐⭐   +40 XP  [✓]│
├────────────────────────────────────┤
│ RECENT PROGRESS     이번 주 +1,240 │
│ +70 AI 공부 · 2시간 전 …           │
└────────────────────────────────────┘
│ 모험 │ 퀘스트 │ [＋] │ 캘린더 │ 캐릭터 │
```

**계획 편집**: 진행 중 체크리스트의 각 행에 완료 버튼 + 빼기(×, 44px). 아래 "퀘스트 더 담기 (n)" 접기 영역에 GM의 다음 후보 5개와 [담기]. 편집 후 포커스는 패널 제목으로.

**모험 진행 중 상태**: Today's Adventure 패널이 퀘스트 체크리스트로 바뀌고(순서 번호 + 완료 버튼), 패널 상단에 GM 브리핑 1줄, 하단에 `3/4 완료 · 남은 보상 +120 XP`. 모두 완료 시 "오늘의 모험 완료!" + 캐릭터 celebrating.

### 4.3 데스크톱 (≥1024px)

```
┌────────┬───────────────────────────────────────────────────────────┐
│ SideNav│ ┌───────────────┐ ┌─────────────────────────────────────┐ │
│        │ │ Character     │ │ Today's Adventure (hero, 2× 높이)    │ │
│ 모험    │ │ 스프라이트 4×  │ └─────────────────────────────────────┘ │
│ 퀘스트   │ │ 이름/칭호      │ ┌──────────────────┐┌────────────────┐ │
│ 캘린더   │ │ Lv + XP 바     │ │ Boss Alert        ││ Main Quest     │ │
│ 캐릭터   │ │ 5 Stats 바     │ └──────────────────┘└────────────────┘ │
│        │ │ 최근 업적 3     │ ┌──────────────────┐┌────────────────┐ │
│ [＋]   │ │ (sticky)       │ │ Daily             ││ Side           │ │
│ 설정    │ └───────────────┘ └──────────────────┘└────────────────┘ │
│        │                    Recent Progress (전체 폭)                │
└────────┴───────────────────────────────────────────────────────────┘
  240px     col 4/12 (sticky)    col 8/12
```

## 5. 컴포넌트 카탈로그

### 5.1 분류

| 레이어 | 위치 | 예 |
|--------|------|-----|
| Modern primitives | `components/ui` | Button(secondary/ghost/link), Input, Textarea, Select, Checkbox, Switch, Dialog, Sheet(모바일 바텀시트), Popover, Toast, Tabs, DatePicker |
| Pixel primitives | `components/pixel` | PixelFrame, PixelButton, PixelBar, PixelIcon, Sprite, PixelBadge, PixelStars, PixelSpinner |
| Game components | `components/game` | CharacterSprite, CharacterStage, LevelBadge, XpBar, StatBar, QuestCard(variants), QuestTypeTag, DifficultyStars, XpFloat, LevelUpModal, AchievementToast, AchievementBadge, BossBanner, QuestlineMap |

### 5.2 카드 다양성 (같은 카드로 도배 금지)

| 섹션 | 컴포넌트 | 시각 정체성 |
|------|----------|-------------|
| Today's Adventure | `AdventureScroll` | 양피지(parchment) 프레임, 순서 번호, GM 브리핑 |
| Boss | `BossBanner` / `BossCard` | 현상수배서: parchment + crimson 도장(`D-4`), 보스 아이콘 2×, 준비도 바 |
| Main Quest | `QuestlineMap` | 노드 연결 맵 스트립 + 진행률, 다음 단계 1개 강조 |
| Daily | `QuestRow` (compact) | 56px 행, 배경 없음, 구분선, 우측 큰 완료 버튼 |
| Side | `QuestCard` (default) | surface 픽셀 프레임 + 좌측 violet 스트립 |
| Recent Progress | `XpLogList` | 프레임 없는 타임라인, 숫자는 gold 픽셀 폰트 |
| Achievement | `AchievementBadge` grid | 희귀도 프레임 배지, 미획득은 실루엣(ink-600) |

### 5.3 QuestCard 해부

```
┌▌─────────────────────────────────────────────┐
│▌ [아이콘2×] 컴퓨터네트워크 과제 제출            │  ← Title (Sans 16/600, 2줄 말줄임)
│▌           BOSS · ⭐⭐⭐⭐ · D-1 · 2h         │  ← QuestTypeTag + PixelStars + 마감 + 예상 시간 (Small)
│▌                               +300 XP  [✓]  │  ← XP pill (Pixel 12, gold) + 완료 버튼 44×44
└▌─────────────────────────────────────────────┘
 ▲ 좌측 4유닛(8px) 퀘스트 타입 색 스트립
```
- 카드 본문 탭 → 상세 시트(모바일 Sheet / 데스크톱 Dialog). 완료 버튼 탭 → 즉시 완료(낙관적) + 연출. **확인 다이얼로그 없음** (실수는 Undo 토스트).
- 완료 처리 중에도 버튼은 `disabled`가 아니라 `aria-disabled` — 키보드 포커스가 버튼에 남고, 같은 버튼(이제 "완료 취소")을 다시 누르면 되돌린다 (P5).
- 되돌리기가 있는 토스트는 10초, 마우스를 올리거나 포커스가 있으면 멈춘다. 일반 토스트는 5초.
- 완료된 카드: 제목 취소선 대신 opacity 0.6 + 체크 스탬프 아이콘 + "완료" 라벨 (취소선은 한국어 가독성 저하).
- 마감 표현: `D-day`(오늘) crimson, `D-1~3` ember, 그 외 muted. 색 + 텍스트 병기.

### 5.4 XpBar

- Props: `totalXp` (→ `levelProgress()`로 계산, 컴포넌트에서 수식 금지), `size: 'sm' | 'md'`, `animateFrom?`.
- 수치 표기: `420 / 1,000 XP` (레벨 내), 툴팁/스크린리더: "레벨 24, 다음 레벨까지 580 XP".
- `role="progressbar"`, `aria-valuemin=0`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`.

### 5.5 Primary CTA — START TODAY'S ADVENTURE

- 화면당 Accent CTA는 **최대 1개**.
- 모바일 전체 폭, 높이 56px, PixelButton accent + 검 아이콘 2×.
- 라벨: `START TODAY'S ADVENTURE` (픽셀 12px 대문자) + 아래 보조 텍스트 `오늘의 모험 시작` (Sans 12, `aria-hidden` 아님 — 한국어 사용자 이해 보조).
- 누르면 → 추천 결과 시트(퀘스트 3–6개 체크 상태, 추가/제외) → [모험 출발] → 패널 전환 + 캐릭터 walking.

## 6. Forms (Modern)

- 퀘스트 빠른 추가: 제목 입력 + 타입 세그먼트(4) + 난이도 별(1–5)만 노출, 나머지는 "더 보기" 접기.
- 입력: 높이 44px, radius 4px, 테두리 `--color-border-strong`(3:1+), 포커스 2px `--color-focus` 링.
- 라벨은 항상 보이게 (placeholder를 라벨로 쓰지 않음). 오류는 필드 아래 Small crimson-300 + 아이콘.
- 날짜: 네이티브 `<input type="date">` 우선 (모바일 UX), 데스크톱은 Popover 캘린더.
- 저장 버튼은 하단 고정(모바일 Sheet), 진행 중 PixelSpinner + 비활성.

## 7. Calendar

- 모바일 기본 **주간 뷰** (가로 7일 스트립 + 선택일 아젠다 리스트), 데스크톱 월간 그리드 + 우측 아젠다.
- 날짜 셀에 점(dot) 대신 **퀘스트 타입 미니 픽셀 마커**(4×4ap, 2×) 최대 3개 + `+n`.
- 고정 일정(schedules)은 시간 블록, 퀘스트 마감은 하루 종일 영역에 타입 태그로.
- 오늘 강조: gold-400 2유닛 픽셀 테두리.
- 구현: 주/월 전환은 `?view=month`, 선택일은 `?d=`(링크 이동, 클라이언트 상태 없음). 기본은 주간 — 화면 크기와 무관하게 같은 URL이 같은 화면을 보여 준다.
- 마커 종류: 보스·메인·사이드(타입 색 사각), 일정(`--color-schedule-marker`), 완료(속이 빈 초록 사각 — 색만으로 구분하지 않음). 범례를 그리드 아래에 둔다.
- **오늘** 아젠다의 마감·데일리·완료 행에는 완료/취소 버튼이 있다 (완료는 항상 오늘 게임 날짜로 기록되므로 다른 날에는 없음).
- 날짜 셀의 접근 이름: `"10월 9일, 오늘, 마감 1개, 일정 2개"` — 마커는 `aria-hidden`.

## 8. States: Loading · Empty · Error

### Loading
- 라우트: `loading.tsx` = 실제 레이아웃과 같은 모양의 **픽셀 스켈레톤** (ink-800 블록, notched corner). 쉬머 그라디언트 금지 — 2단계 명도 펄스(`steps(2)`, 800ms).
- 버튼/인라인: `PixelSpinner` (3-dot 또는 모래시계 4f).

### Empty (항상: 캐릭터/아이콘 + 한 문장 + 하나의 행동)
| 상황 | 문구 | 행동 |
|------|------|------|
| 퀘스트 0개 | "퀘스트 게시판이 비어 있어. 자주 하는 일부터 골라 볼까?" | [템플릿에서 고르기] / 보조: 직접 추가 |
| Daily 0개 | "매일 쌓아 갈 습관을 하나 정해 보자." | [Daily 추가] |
| Boss 없음 | (섹션 숨김) | — |
| 오늘 모험 전부 완료 | "오늘의 모험 완료! +380 XP" | [사이드 퀘스트 보기] 또는 "푹 쉬는 것도 모험의 일부야" |
| 업적 0개 | 미획득 배지 실루엣 그리드 + "첫 퀘스트를 완료하면 첫 업적이 열려." | — |

### Error
- 문구는 게임 톤 + 명확한 원인/행동: "연결이 끊겼어요. 퀘스트는 안전하게 저장돼 있어요." [다시 시도]
- 낙관적 업데이트 실패 시: 상태 롤백 + 토스트 "완료 처리에 실패했어요. 다시 눌러 주세요." (XP 연출이 이미 나왔다면 XP 바를 조용히 되돌림)
- `error.tsx`: 캐릭터 surprised 첫 프레임 + 오류 코드(작게) + [대시보드로].

## 9. Motion (UI)

| 상황 | 시간 | 이징 |
|------|------|------|
| hover/press 피드백 | 0–80ms | 즉시 (픽셀 버튼은 트랜지션 없이 상태 전환) |
| Sheet/Dialog 진입 | 200ms | `cubic-bezier(0.2, 0, 0, 1)` |
| 퇴장 | 150ms | `cubic-bezier(0.4, 0, 1, 1)` |
| 리스트 재정렬 | 200ms | 위와 동일 |
| 게임 연출 | [ART_DIRECTION §6](./ART_DIRECTION.md#6-animation-direction) | `steps()` |

- 페이지 전환 애니메이션 없음 (속도 우선).
- `prefers-reduced-motion`이면 진입/퇴장은 opacity 100ms만.

## 10. Accessibility 체크리스트

- [ ] 텍스트 대비 4.5:1, UI 경계 3:1 ([COLOR_PALETTE §4](./COLOR_PALETTE.md#4-명암비-검증-wcag-21-실제-계산값))
- [ ] 모든 인터랙티브 요소 키보드 접근 + `:focus-visible` 링
- [ ] 터치 타깃 ≥ 44×44px (완료 버튼 포함)
- [ ] 색만으로 의미 전달 금지 (타입 = 색 + 아이콘 + 라벨)
- [ ] XP/레벨업/업적은 `aria-live="polite"` 영역으로 안내
- [ ] 픽셀 아이콘: 의미 있으면 `aria-label`, 장식이면 `aria-hidden`
- [ ] 스프라이트 애니메이션은 reduced-motion에서 정지
- [ ] 모달/시트 포커스 트랩 + ESC 닫기 + 닫힌 후 포커스 복귀
- [ ] `lang="ko"`, 페이지마다 고유 `<title>`, 랜드마크(`<nav>`, `<main>`)

## 11. 카피 & 보이스

- **게임 용어는 영문 대문자 라벨, 설명은 한국어**: `MAIN QUEST` / "나만의 웹서비스 출시하기".
- 말하는 주체로 어조를 나눈다 (한 문장 안에서 섞지 않음):
  - **캐릭터/GM이 말하는 문구** (빈 상태, 브리핑, 연출 대사) → 친근한 반말 ("자주 하는 일부터 골라 볼까?") — 설정에서 존댓말 전환 가능
  - **시스템 문구** (오류, 폼, 설정, 법적 안내) → 부드러운 해요체 ("연결이 끊겼어요.")
- 부정·처벌 표현 금지: "실패", "패배", "게으름" ✕ → "기한 만료", "다시 도전", "쉬어 가기" ○.
- 숫자: 천 단위 쉼표, XP는 항상 `+` 부호와 함께 (`+70 XP`).
- 동사형 퀘스트 제목 권장: "AI 공부" → "AI 강의 3강 복습하기".
