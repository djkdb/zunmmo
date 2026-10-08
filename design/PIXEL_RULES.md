# LIFE RPG — Pixel Rules

> 픽셀 아트를 **제작**하고 웹에서 **렌더링**할 때 지켜야 하는 기술 규칙. 아트 방향(무엇을 그릴지)은 [ART_DIRECTION.md](./ART_DIRECTION.md), 색은 [COLOR_PALETTE.md](./COLOR_PALETTE.md).

- 문서 상태: v0.1 (Phase 0)
- 용어: **ap** = art pixel (원본 이미지의 1픽셀), **px** = CSS 픽셀

---

## 1. Pixel Scale & Density

### 1.1 에셋 캔버스 크기 (원본, 1×)

| 에셋 | 캔버스 | 실제 그림 영역 | 비고 |
|------|--------|---------------|------|
| 인라인 글리프 (체크, 화살표, 별) | 8×8 | 7×7 | 텍스트 옆 |
| UI / 퀘스트 / 스탯 아이콘 | **16×16** | 14×14 (1ap 여백) | 기본 아이콘 |
| 아이템 / 큰 아이콘 | 24×24 | 22×22 | 보상, 업적 내부 |
| **캐릭터 스프라이트 프레임** | **32×32** | 높이 26–28ap | [CHARACTER_GUIDE](./CHARACTER_GUIDE.md) |
| 업적 배지 | 32×32 | 프레임 포함 | 희귀도 프레임 + 24×24 내부 아이콘 |
| 캐릭터 초상(portrait) | 48×48 | — | 프로필/GM 대화 (Phase 8) |
| 보스 / 대형 몬스터 | 64×64 | — | 보스 처치 연출 |
| 장면 타일 | 16×16 | — | 랜딩 히어로, 배경 (Phase 2) |

### 1.2 화면 배율 (정수 배율만 허용)

| 컨텍스트 | 배율 | 결과 크기 |
|----------|------|-----------|
| UI 아이콘 (버튼, 리스트, 내비) | **2×** | 16→32px |
| 인라인 글리프 | 2× | 8→16px |
| 대시보드 캐릭터 — 모바일 | **3×** | 32→96px |
| 대시보드 캐릭터 — 데스크톱 (≥1024px) | **4×** | 32→128px |
| 업적 배지 (그리드) | 2× | 64px |
| 업적 해금 / 레벨업 모달 | 4× | 128px |
| 랜딩 히어로 장면 | 3× / 4× / 5× (뷰포트별) | — |

**규칙**
1. 배율은 **2, 3, 4, 5, 6 중 정수**만. 1.5×, 2.5×, `width: 100%` 같은 비정수 스케일 금지.
2. **한 컴포넌트 안에서는 하나의 배율**만 쓴다 (예: QuestCard의 아이콘과 배지는 모두 2×).
3. 서로 다른 배율은 **레이어가 다를 때만** 공존 가능 (히어로 레이어 4× 캐릭터 + UI 크롬 레이어 2× 아이콘).
4. 픽셀 아트는 원본 1× PNG만 배포하고 CSS로 확대한다. 미리 확대한 2×/4× PNG를 만들지 않는다.

### 1.3 UI 픽셀 유닛

픽셀 스타일 UI(테두리, 섀도, XP 바)는 UI 아이콘과 같은 밀도를 쓰기 위해 **`--px: 2px`**를 기본 유닛으로 한다.

```css
:root { --pixel-unit: 2px; }   /* 픽셀 UI 전용 유닛 — 프레임/섀도/바는 calc(var(--pixel-unit) * n)으로만 크기 지정 */
```
- 픽셀 프레임 테두리 = 1 유닛(2px), 하드 섀도 오프셋 = 2 유닛(4px), XP 바 하이라이트 줄 = 1 유닛.
- Modern UI(폼, 본문)는 일반 4px 스페이싱 그리드를 쓴다 ([UI_GUIDE §3](./UI_GUIDE.md#3-spacing--layout-grid)). 4px 그리드와 2px 픽셀 유닛은 정수배 관계라 정렬이 깨지지 않는다.

## 2. 렌더링 규칙 (Web)

```css
.pixel-art {
  image-rendering: crisp-edges;    /* 구형 브라우저 fallback */
  image-rendering: pixelated;      /* 지원 브라우저에서 우선 적용 (뒤에 선언) */
}
```

| 규칙 | 이유 |
|------|------|
| 스프라이트는 `<img>` 또는 `background-image` + `image-rendering: pixelated` | 보간(blur) 방지 |
| 크기는 `원본 × 배율`의 정확한 px로 지정 (`width: calc(32px * var(--scale))`) | 비정수 리샘플링 방지 |
| 위치는 **정수 px**에만 (`transform: translate3d(Npx, …)`에서 N은 정수) | 서브픽셀 위치 → 흐림/찢김 |
| 애니메이션 이동은 배율 단위로 스냅 (`steps()` 사용, 4× 캐릭터는 4px 단위 이동) | 픽셀 그리드 유지 |
| `transform: scale()`로 픽셀 아트 확대 금지 (정수라도) — 레이아웃 크기로 확대 | 일부 브라우저에서 보간 발생 |
| `rotate()`·`skew()` 금지 — 회전이 필요하면 회전된 프레임을 그린다 | 픽셀 형태 붕괴 |
| `filter: blur()`, `box-shadow` 블러, `opacity` 페이드는 픽셀 레이어에 쓰지 않는다 (예외: §7 연출의 전체 레이어 페이드) | 스타일 일관성 |
| devicePixelRatio 1.5/2.5 화면에서도 CSS 정수 배율이면 허용 (브라우저 nearest-neighbor) | 실사용 기기 대응 |
| 스프라이트 시트는 **텍스처 블리딩 방지를 위해 프레임 간 여백 0 + 정확한 background-position** | 시트 경계 번짐 방지 |

## 3. Outline (외곽선)

| 대상 | 규칙 |
|------|------|
| 캐릭터 (32×32) | **1ap 외곽선**. 기본색 `ink-950`. 빛을 받는 상단·좌측 일부는 해당 부위 램프의 가장 어두운 색으로 대체하는 **selective outline(sel-out)** 허용 |
| 아이콘 16×16 | **1ap `ink-950` 전체 외곽선** (작은 크기 가독성 우선, sel-out 금지) |
| 아이템 24×24, 배지 | 1ap `ink-950`, 내부 하이라이트로 재질 표현 |
| 내부 선 (팔과 몸통 사이 등) | `ink-950` 금지. 해당 색 램프의 어두운 단계 사용 |
| 이펙트 (반짝임, XP 파티클) | 외곽선 없음 (빛은 외곽선을 갖지 않는다) |
| UI 픽셀 프레임 | 1 유닛(2px) `--color-outline` |

**선 품질**
- **Pixel-perfect line**: 선은 1ap 두께, L자형 계단(더블 픽셀 코너) 금지.
- 곡선은 **일정한 길이 변화**(1-2-3-3-2-1 같은 대칭적 세그먼트)로. 들쭉날쭉한 세그먼트(1-3-1-2) 금지.
- 외곽선 두께 2ap 이상 금지 (보스 64×64도 1ap).

## 4. Lighting & Shading

- **광원: 좌상단 (top-left), 약간 정면**. 모든 에셋 공통. 예외 없음.
- 명암 단계: 캐릭터/아이템 **3단계(하이라이트-베이스-그림자)** + 필요 시 4번째 깊은 그림자. 16×16 아이콘은 2–3단계.
- 하이라이트는 좌상단 가장자리, 그림자는 우하단 가장자리와 접힘 부분.
- **Hue shift**: 그림자는 차갑게(보라/파랑 쪽), 하이라이트는 따뜻하게(노랑 쪽). 같은 hue의 명도만 바꾼 "검정 섞기" 그림자 금지. (팔레트 램프가 이미 hue shift 되어 있으므로 **램프 안에서만 고르면** 자동 충족)
- **Pillow shading 금지** (외곽에서 중심으로 동심원처럼 밝아지는 음영).
- **Banding 금지**: 서로 다른 명도의 픽셀 줄이 같은 길이로 나란히 계단을 이루는 것.
- **Dithering**: 넓은 면(하늘, 보스 몸체, 히어로 배경)에서만 2색 체커 디더 허용. 캐릭터·아이콘에는 금지.
- **Anti-aliasing**: 수동 AA만, 내부 곡선에만, 1–2px. **외곽 실루엣에는 AA 금지** (배경색이 바뀌면 지저분해짐).
- 그림자(지면): 스프라이트에 그리지 않는다. 캐릭터 아래 타원 그림자는 CSS 레이어(`ink-950` 40% 불투명도의 픽셀 타원 이미지)로 분리.

## 5. 금지 목록 (Visual QA Checklist)

에셋 PR마다 다음을 확인한다:

- [ ] LIFE-32 팔레트 외 색 없음 (`pnpm art:check`, `pnpm test`에도 포함)
- [ ] 알파 0/255 외 반투명 픽셀 없음
- [ ] 캔버스 크기가 §1.1 표와 일치
- [ ] 외곽선 1ap, 더블 픽셀 코너 없음
- [ ] 광원 좌상단 일관
- [ ] Pillow shading / banding 없음
- [ ] 2× 배율 + 1× 원본 모두에서 실루엣이 읽힌다 (흑백 실루엣 테스트)
- [ ] 같은 세트(예: 퀘스트 아이콘 5종)끼리 시각적 무게(채워진 픽셀 수, 명도)가 비슷하다
- [ ] AI 생성 이미지를 그대로 쓰지 않았다 (ART_DIRECTION §8)

## 6. UI Pixel Rules

### 6.1 Pixel Frame (픽셀 카드/패널)

```
 ┌ notched corner: 모서리 1유닛 깎기 (clip-path 또는 box-shadow 기법)
 ▼
  ████████████████
 █▓▓▓▓▓▓▓▓▓▓▓▓▓▓░█    █ = outline (ink-950), 1 unit
 █▓              ░█    ▓ = 내부 하이라이트 (상/좌, surface보다 1단계 밝게), 1 unit
 █▓    content   ░█    ░ = 내부 그림자 (하/우, surface보다 1단계 어둡게), 1 unit
 █░░░░░░░░░░░░░░░█
  ████████████████▒▒  ▒ = 하드 드롭 섀도 (ink-950, offset 2 unit, blur 0)
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
```

- 구현: 다중 `box-shadow`(블러 0)로 테두리/하이라이트/섀도를 그려 **이미지 없이** 해상도 독립. 9-slice 이미지는 나무/양피지 같은 텍스처 프레임에만 사용.
- `border-radius` 금지 — 모서리는 notched(1유닛 계단)로 표현.
- 변형:
  - `PixelFrame variant="surface"` — 기본 패널 (ink-800)
  - `variant="parchment"` — 퀘스트 보드/두루마리 (parchment-300 / 텍스트 ink-900)
  - `variant="wood"` — 랜딩/특별 패널 (parchment-500 + parchment-900 내부선)
  - `variant="quest-{type}"` — 좌측 4유닛 컬러 스트립(퀘스트 타입 색)

### 6.2 Pixel Button

| 상태 | 표현 |
|------|------|
| default | 프레임 + 하드 섀도 2유닛 |
| hover | 배경 1단계 밝게 (섀도 유지) |
| active (pressed) | **버튼이 섀도 위치로 2유닛 내려감**(translate 4px) + 섀도 제거 → 물리적 "딸깍" |
| focus-visible | 프레임 바깥 2px `--color-focus` 링 (notched 유지) |
| disabled | 배경 ink-500, 텍스트 ink-300, 섀도 없음 |
| loading | 라벨 자리에 3-dot 픽셀 스피너 (steps 애니메이션) |

- 최소 높이 44px (모바일 터치), 라벨은 픽셀 폰트(Galmuri11) 12px 배수.
- Primary CTA(`START TODAY'S ADVENTURE`)는 `--color-accent`(gold-400) 배경 + `--color-on-accent` 텍스트 + 아이콘(검) 2×.

### 6.3 Pixel Bar (XP / 진행률 / 스탯)

- 높이: XP 바 **5유닛(10px)** 모바일 / 6유닛(12px) 데스크톱. 스탯 바 4유닛(8px).
- 구조: outline 1유닛 → track(ink-950) → fill(3단 밴드: highlight 1유닛 / body / shadow 1유닛).
- 채움 폭은 **유닛 단위로 스냅** (`round(ratio × innerWidthUnits) × 2px`) — 반 픽셀 채움 금지.
- 증가 애니메이션: `steps(n)` 으로 유닛 단위 증가, 400–600ms.
- 텍스트(`420 / 1,000 XP`)는 바 **바깥**(위 또는 오른쪽)에 둔다. 바 내부 텍스트 금지(가독성).

### 6.4 Icons

- 16×16 원본, UI에서는 2×(32px)가 기본. 리스트 밀도가 높은 곳은 2× 그대로 쓰고 주변 여백을 줄인다 (1× 금지).
- 아이콘은 단일 스프라이트 시트(`public/icons/icons.png` + `icons.json`)로 묶고 `<PixelIcon name="quest-boss" />`로 사용.
- 의미 있는 아이콘은 `aria-label`, 장식 아이콘은 `aria-hidden`.
- Lucide 등 벡터 아이콘은 **Modern 영역(설정, 폼 보조, 캘린더 내비 화살표)**에서만, stroke 2px, 크기 20/24px.

### 6.5 Badges & Tags

- 퀘스트 타입 태그: 픽셀 폰트 대문자 라벨(`BOSS`) + 타입 색 배경 + ink-950 텍스트 + 1유닛 outline.
- 난이도: ⭐ 이모지 대신 **8×8 픽셀 별 글리프** ×N (채움 gold-400 / 빈 별 ink-500).
- 업적 배지: 32×32 원형/방패형 프레임, 희귀도 색 ([COLOR_PALETTE §3.4](./COLOR_PALETTE.md#34-achievement-rarity-배지-프레임)).

## 7. Animation 기술 규칙

| 규칙 | 값 |
|------|-----|
| 스프라이트 프레임 애니메이션 | CSS `animation` + `steps(frameCount)` on `background-position`, 또는 JS 프레임 타이머 |
| 프레임 지속 시간 | 프레임별 지정 가능 (JSON 메타데이터), 기본 100–200ms |
| 이동 애니메이션 | 배율 단위 스냅 (`steps()`), easing 대신 프레임으로 가감속 표현 |
| UI 트랜지션 (Modern) | 150–250ms, `cubic-bezier(0.2, 0, 0, 1)` |
| `prefers-reduced-motion: reduce` | 스프라이트 루프 정지(첫 프레임), 파티클·흔들림 제거, 수치 변화는 즉시 반영 + 텍스트로 알림 |
| 동시 실행 | 화면당 루프 애니메이션 ≤ 3개 (idle 캐릭터 + 최대 2개) |
| 성능 | `transform`/`background-position`/`opacity`만 애니메이트, 레이아웃 속성 금지 |

상세 상태별 프레임 수·타이밍은 [CHARACTER_GUIDE §5](./CHARACTER_GUIDE.md#5-animation-states) 와 [ART_DIRECTION §6](./ART_DIRECTION.md#6-animation-direction).

## 8. 파일 & 파이프라인

**원본은 팔레트 코드 그리드(TypeScript)**다. 한 글자 = 1ap, 코드는 `art/palette.ts`의 LIFE-32. 원본이 텍스트라서 PR diff로 픽셀 단위 리뷰가 가능하고, 테스트가 크기·코드·여백을 강제한다.

```
art/                                        # 원본 (git 포함, 앱 번들에는 포함 안 됨)
  palette.ts                                # LIFE-32 + 의상 팔레트 스왑 프리셋
  characters/adventurer.ts                  # 32×32 프레임, 상태별 프레임/지속시간
  icons.ts                                  # 16×16 아이콘, 8×8 글리프
  scene.ts                                  # 장면 소품 (게시판, 랜턴, 달, 덤불, 지면 타일, "!" 마커)
  palette/life-32.gpl                       # (생성) Aseprite/GIMP 팔레트
scripts/art/build.ts                        # pnpm art:build
scripts/art/check.ts                        # pnpm art:check — 팔레트/알파 검사
public/
  sprites/characters/adventurer-<preset>.png   # (생성) 가로=프레임, 세로=상태(row)
  icons/icons.png, icons/glyphs.png            # (생성) 아틀라스
src/components/game/character/sprite-sheets.generated.ts   # (생성) 시트 메타데이터
src/components/pixel/icons.generated.ts                    # (생성) 아이콘 이름 타입 + 좌표
src/app/icon.png                                           # (생성) 32×32 파비콘 (머리 크롭 2×)
public/sprites/scene/*.png + src/components/pixel/scene-sprites.generated.ts   # (생성) 장면 소품
src/app/_og/og-scene.png                                   # (생성) OG 배경 200×105ap를 정확히 6× (1200×630)
```

- 생성 파일은 커밋하되 손으로 고치지 않는다. 원본 수정 → `pnpm art:build` → 결과 PNG를 `/styleguide`에서 2×/3×/4×로 확인.
- Aseprite로 작업해도 된다: `life-32.gpl`을 불러와 그리고, 결과를 그리드 원본으로 옮긴다(변환 스크립트는 필요해지면 추가).
- 반응형 장면은 `scale="inherit"` + `.pixel-scale-responsive`(3×/4×/5×)로 한 요소의 배율을 CSS 변수로 바꾼다. 위치·크기는 `ap(n)`(art pixel) 단위로만 지정하고, %·중앙 정렬은 CSS `round()`로 배율 단위에 스냅한다.
- OG 이미지는 예외적으로 6× 사전 확대 PNG를 쓴다 (`ImageResponse`가 리샘플링 없이 그대로 쓰도록). 텍스트는 Galmuri 72/36px.
- 출력은 1× RGBA PNG, 무손실. 이름은 `kebab-case`, 상태 키는 CHARACTER_GUIDE §5의 이름(`idle`, `level-up` …).
