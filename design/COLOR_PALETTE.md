# LIFE RPG — Color Palette

- 문서 상태: v0.1 (Phase 0)
- 코드 단일 소스: `src/styles/tokens.css` (이 문서와 1:1로 유지. 색을 추가/변경할 땐 **문서와 토큰을 같은 PR에서** 수정)

---

## 1. 팔레트 철학

- **"Night Ink + Gold"**: 밤하늘 같은 보라빛 남색(Ink) 배경 위에서 금색(보상)과 퀘스트 색이 빛나는 구조. 야간 모험 / 캠프파이어의 따뜻함.
- **통제된 램프(ramp)**: 모든 색은 아래 정의된 램프에서만 고른다. 임의의 hex, Tailwind 기본 팔레트(`blue-500` 등) 사용 금지.
- **Hue shifting**: 램프는 밝아질수록 따뜻한 쪽(노랑)으로, 어두워질수록 차가운 쪽(파랑/보라)으로 색상이 이동한다. 픽셀 아트 명암의 기본.
- **의미 고정**: 한 색은 한 의미. Gold = 보상/진행, Crimson = 보스/위험, Royal = 브랜드/메인 퀘스트.
- **다크 테마 기본**, 라이트 테마는 Parchment(양피지) 기반으로 Phase 8에 추가 (토큰 구조는 처음부터 지원).

## 2. 기본 램프 (Base Ramps)

### Ink — 중성/배경 (보라 기운의 남색)
| 토큰 | Hex | 용도 |
|------|-----|------|
| `ink-950` | `#0d0a14` | **픽셀 외곽선**, 가장 깊은 그림자, 하드 섀도 |
| `ink-900` | `#15111f` | **앱 배경** |
| `ink-850` | `#1b1628` | 배경 변형(섹션 구분) |
| `ink-800` | `#221c33` | 서피스(카드, 패널) |
| `ink-700` | `#2e2645` | 상승 서피스(hover, 모달) |
| `ink-600` | `#3d3459` | 장식 테두리, 구분선 |
| `ink-500` | `#564b78` | 비활성 요소 배경 |
| `ink-400` | `#776c99` | **입력 필드 테두리**(3:1 이상), placeholder |
| `ink-300` | `#a59cc4` | 보조 텍스트 |
| `ink-200` | `#cfc8e6` | 2차 텍스트 |
| `ink-100` | `#eeeaf8` | **본문 텍스트**, 픽셀 하이라이트 |

### Parchment — Secondary (양피지/나무/가죽, RPG 소재감)
| 토큰 | Hex | 용도 |
|------|-----|------|
| `parchment-100` | `#f7efd9` | 라이트 테마 배경, 두루마리 UI |
| `parchment-300` | `#e6d3a8` | 양피지 그림자, 라이트 서피스 |
| `parchment-500` | `#c4a46e` | 나무/가죽 프레임, 퀘스트 보드 |
| `parchment-700` | `#7a5c35` | 나무 그림자, 라이트 테마 보조 텍스트 |
| `parchment-900` | `#4f3a22` | 나무 외곽(내부 선) |

### Royal — Primary (브랜드, MAIN QUEST)
| 토큰 | Hex |
|------|-----|
| `royal-200` | `#b9cdff` |
| `royal-300` | `#8aa9ff` |
| `royal-400` | `#5f86f2` |
| `royal-500` | `#4466d6` |
| `royal-600` | `#3249a8` |
| `royal-700` | `#23347a` |
| `royal-800` | `#182350` |

### Gold — Accent & XP (보상, 진행, 주요 CTA)
| 토큰 | Hex |
|------|-----|
| `gold-100` | `#fff4cc` |
| `gold-200` | `#ffe58f` |
| `gold-300` | `#ffd256` |
| `gold-400` | `#f7b733` |
| `gold-500` | `#e0901f` |
| `gold-600` | `#b06818` |
| `gold-700` | `#7a4414` |

### Emerald — Success
| `emerald-200` `#a8f0c0` · `emerald-300` `#6fdc98` · `emerald-400` `#3fc277` · `emerald-500` `#2a9d5e` · `emerald-600` `#1e7447` · `emerald-700` `#154f33` |
|---|

### Teal — DAILY QUEST, Info
| `teal-200` `#a6eef2` · `teal-300` `#6ad8e0` · `teal-400` `#35b8c6` · `teal-500` `#23909f` · `teal-700` `#175663` |
|---|

### Violet — SIDE QUEST, CRE
| `violet-200` `#dcc4ff` · `violet-300` `#bf98ff` · `violet-400` `#9d6bf0` · `violet-500` `#7b4cd1` · `violet-700` `#4b2b88` |
|---|

### Crimson — BOSS QUEST, Danger
| `crimson-200` `#ffb3b3` · `crimson-300` `#ff7f7f` · `crimson-400` `#f04f5a` · `crimson-500` `#c9333f` · `crimson-700` `#7f1d2d` |
|---|

### Ember — Warning, SOC
| `ember-300` `#ffb071` · `ember-400` `#f98b3c` · `ember-500` `#d96a22` · `ember-700` `#8a3d12` |
|---|

### Skin (캐릭터 전용)
| 톤 | Light | Base | Shade | Deep(외곽 인접) |
|----|-------|------|-------|------|
| A (기본) | `#f6d2b4` | `#e0a983` | `#b9785a` | `#7d4a36` |
| B | `#e8b98f` | `#c98d5f` | `#9a6340` | `#5f3a25` |
| C | `#b07a52` | `#8c5a3a` | `#6a4029` | `#3f2418` |

> 스킨 톤은 다양성을 위해 램프 단위로 교체 가능하게 설계한다 ([CHARACTER_GUIDE §7](./CHARACTER_GUIDE.md#7-커스터마이징-데이터-구조)).

## 3. 시맨틱 토큰 (Semantic Tokens)

컴포넌트는 **시맨틱 토큰만** 사용한다. 램프 토큰 직접 사용은 픽셀 아트 프리미티브(`components/pixel`) 내부에서만 허용.

| 시맨틱 토큰 | Dark (기본) | Light (Phase 8) | 용도 |
|---|---|---|---|
| `--color-bg` | ink-900 | parchment-100 | 페이지 배경 |
| `--color-bg-subtle` | ink-850 | parchment-300 (30%) | 섹션 배경 |
| `--color-surface` | ink-800 | `#fffaf0` | 카드/패널 |
| `--color-surface-raised` | ink-700 | `#ffffff` | 모달, hover |
| `--color-border` | ink-600 | parchment-300 | 장식 테두리 |
| `--color-border-strong` | ink-400 | parchment-700 | 입력 테두리 (3:1+) |
| `--color-outline` | ink-950 | ink-950 | **픽셀 외곽선 (테마 불변)** |
| `--color-text` | ink-100 | ink-900 | 본문 |
| `--color-text-muted` | ink-300 | parchment-700 | 보조 |
| `--color-primary` | royal-500 | royal-600 | 브랜드 버튼, 선택 상태 |
| `--color-primary-text` | royal-300 | royal-600 | 링크, 강조 텍스트 |
| `--color-secondary` | parchment-500 | parchment-500 | 나무/양피지 프레임 |
| `--color-accent` | gold-400 | gold-400 | **주요 CTA** (START TODAY'S ADVENTURE) |
| `--color-on-accent` | ink-950 | ink-950 | CTA 위 텍스트 |
| `--color-focus` | royal-300 | royal-500 | 포커스 링 |
| `--color-success` | emerald-400 | emerald-600 | 완료, 성공 |
| `--color-danger` | crimson-400 | crimson-500 | 오류, 삭제 |
| `--color-warning` | ember-400 | ember-500 | 경고, 마감 임박 |
| `--color-info` | teal-400 | teal-500 | 정보 |
| `--color-on-parchment` | ink-900 | ink-900 | 양피지 위 본문 (12.59:1) |
| `--color-on-parchment-muted` | parchment-900 | parchment-900 | 양피지 위 보조 텍스트 (7.27:1) |
| `--color-parchment-divider` | parchment-500 | parchment-500 | 양피지 위 목록 구분선 (텍스트 금지) |
| `--color-boss-stamp` | crimson-700 | crimson-700 | 현상수배서 D-day 도장 (양피지 위 6.73:1 — crimson-500은 3.54:1이라 불가) |

### 3.1 XP / Progress
| 토큰 | 값 | 설명 |
|------|----|------|
| `--color-xp-fill` | gold-300 | XP 바 채움 본체 |
| `--color-xp-fill-highlight` | gold-100 | 채움 상단 1px 하이라이트 줄 |
| `--color-xp-fill-shadow` | gold-500 | 채움 하단 1px 그림자 줄 |
| `--color-xp-track` | ink-950 | 빈 트랙 |
| `--color-xp-text` | gold-300 | "+70 XP" 플로팅 텍스트 |

> XP 바는 그라디언트를 쓰지 않는다. **하이라이트 줄 / 본체 / 그림자 줄의 3단 플랫 밴드**로 입체감을 낸다.

### 3.2 Quest Type
| 타입 | 메인 | 밝은 | 어두운(테두리/아이콘 그림자) | 텍스트 on dark |
|------|------|------|------|------|
| MAIN | royal-400 | royal-200 | royal-700 | royal-300 |
| DAILY | teal-400 | teal-200 | teal-700 | teal-300 |
| SIDE | violet-400 | violet-200 | violet-700 | violet-300 |
| BOSS | crimson-400 | crimson-200 | crimson-700 | crimson-300 |
| HIDDEN | gold-400 | gold-100 | gold-700 | gold-300 |

토큰명: `--color-quest-{main|daily|side|boss|hidden}`, `-light`, `-dark`, `-text`.

### 3.3 Stats
| Stat | 토큰 | 값 | 아이콘 모티프 |
|------|------|----|------|
| INT | `--color-stat-int` | royal-300 | 펼친 책 |
| FOC | `--color-stat-foc` | teal-300 | 과녁 |
| VIT | `--color-stat-vit` | crimson-300 | 하트 |
| SOC | `--color-stat-soc` | ember-300 | 두 사람 |
| CRE | `--color-stat-cre` | violet-300 | 붓/별 |

### 3.4 Achievement Rarity (배지 프레임)
| 희귀도 | 프레임 | 하이라이트 |
|--------|--------|-----------|
| common | parchment-500 | parchment-300 |
| rare | royal-400 | royal-200 |
| epic | violet-400 | violet-200 |
| legendary | gold-400 | gold-100 (+ 반짝임 애니메이션) |

## 4. 명암비 검증 (WCAG 2.1, 실제 계산값)

| 전경 / 배경 | 비율 | 판정 |
|------|------|------|
| ink-100 / ink-900 (본문) | **15.69** | AAA |
| ink-200 / ink-900 | 11.54 | AAA |
| ink-300 / ink-900 (보조 텍스트) | 7.20 | AAA |
| ink-300 / ink-800 (카드 위 보조 텍스트) | 6.36 | AA |
| ink-400 / ink-900 (입력 테두리) | 3.88 | UI 컴포넌트 3:1 충족 · **텍스트 금지** |
| ink-400 / ink-800 | 3.42 | UI 3:1 충족 |
| ink-950 / gold-400 (CTA 텍스트) | **11.00** | AAA |
| white / royal-500 (Primary 버튼) | 5.10 | AA |
| ink-100 / royal-600 | 6.69 | AA |
| royal-300 / ink-900 (링크) | 8.13 | AAA |
| royal-400 / ink-900 | 5.46 | AA |
| gold-300 / ink-900 (XP 텍스트) | 12.90 | AAA |
| teal-300 / ink-900 | 11.05 | AAA |
| violet-300 / ink-900 | 8.08 | AAA |
| crimson-300 / ink-900 | 7.59 | AAA |
| crimson-400 / ink-900 (오류 텍스트) | 5.28 | AA |
| emerald-300 / ink-900 | 10.93 | AAA |
| ember-300 / ink-900 | 10.34 | AAA |
| ink-950 / emerald-400 · teal-400 · violet-400 · crimson-400 | 8.59 · 8.24 · 5.41 · 5.58 | 퀘스트 타입 배지 위 텍스트 AA+ |
| ink-900 / parchment-100 (라이트 본문) | 16.17 | AAA |
| parchment-700 / parchment-100 | 5.37 | AA |
| parchment-900 / parchment-300 (양피지 노트 위 보조 텍스트) | 7.27 | AAA |
| parchment-700 / parchment-300 | 4.18 | **텍스트 금지** — parchment-300 위 보조 텍스트는 parchment-900 |
| royal-600 / parchment-100 | 6.90 | AA |
| crimson-500 / parchment-100 | 4.54 | AA |
| ink-600 / ink-900 | 1.62 | **장식 전용** — 의미 있는 경계에 사용 금지 |
| ink-500 / ink-900 | 2.36 | **장식/비활성 전용** |

규칙:
- 텍스트는 4.5:1 이상 (18.66px bold / 24px 이상의 큰 텍스트는 3:1).
- 의미 있는 UI 경계(입력, 토글, 포커스)는 3:1 이상 → `--color-border-strong` 사용.
- **색만으로 의미를 전달하지 않는다**: 퀘스트 타입은 색 + 아이콘 + 라벨, 마감 임박은 색 + `D-1` 텍스트.

## 5. 픽셀 아트 스프라이트 팔레트 — `LIFE-32`

스프라이트·아이콘·이펙트는 아래 **32색 안에서만** 제작한다. (Aseprite 팔레트 파일: `art/palette/life-32.gpl`, Phase 1에서 생성)

| # | 이름 | Hex | # | 이름 | Hex |
|---|------|-----|---|------|-----|
| 1 | ink-950 | `#0d0a14` | 17 | gold-200 | `#ffe58f` |
| 2 | ink-800 | `#221c33` | 18 | gold-400 | `#f7b733` |
| 3 | ink-600 | `#3d3459` | 19 | gold-600 | `#b06818` |
| 4 | ink-400 | `#776c99` | 20 | emerald-300 | `#6fdc98` |
| 5 | ink-200 | `#cfc8e6` | 21 | emerald-500 | `#2a9d5e` |
| 6 | ink-100 | `#eeeaf8` | 22 | emerald-700 | `#154f33` |
| 7 | parchment-100 | `#f7efd9` | 23 | teal-300 | `#6ad8e0` |
| 8 | parchment-300 | `#e6d3a8` | 24 | teal-500 | `#23909f` |
| 9 | parchment-500 | `#c4a46e` | 25 | violet-300 | `#bf98ff` |
| 10 | parchment-700 | `#7a5c35` | 26 | violet-500 | `#7b4cd1` |
| 11 | parchment-900 | `#4f3a22` | 27 | crimson-300 | `#ff7f7f` |
| 12 | royal-300 | `#8aa9ff` | 28 | crimson-500 | `#c9333f` |
| 13 | royal-500 | `#4466d6` | 29 | crimson-700 | `#7f1d2d` |
| 14 | royal-700 | `#23347a` | 30 | ember-400 | `#f98b3c` |
| 15 | skin-A-light | `#f6d2b4` | 31 | skin-A-shade | `#b9785a` |
| 16 | skin-A-base | `#e0a983` | 32 | skin-A-deep | `#7d4a36` |

- 스킨 B/C 램프는 팔레트 스왑(palette swap)으로만 사용 (15/16/31/32번 슬롯 교체).
- 순수 흑(`#000`)/순수 백(`#fff`) 사용 금지 → ink-950 / ink-100.
- 반투명 픽셀 금지 (알파는 0 또는 255). 그림자/글로우는 CSS 레이어에서 처리.

## 6. `tokens.css` 형태 (Phase 1 구현 사양)

Tailwind v4는 `@theme`의 `--color-*` 변수로 유틸리티(`bg-*`, `text-*`, `border-*`)를 만들고, 유틸리티는 `var(--color-*)`를 참조한다. 따라서 **시맨틱 토큰도 `@theme`에 등록**하고, 테마 전환은 같은 변수를 `[data-theme]`에서 재정의하는 방식으로 한다.

```css
/* src/styles/tokens.css */
@import "tailwindcss";

@theme {
  --color-*: initial;               /* Tailwind 기본 팔레트 비활성화 → bg-blue-500 같은 임의 색 사용 불가 */

  /* 1) Ramps — 픽셀 프리미티브 내부 전용 (bg-ink-900, text-gold-300 …) */
  --color-ink-950: #0d0a14;
  --color-ink-900: #15111f;
  /* … §2 전체 램프 … */

  /* 2) Semantic — 컴포넌트는 이것만 사용 (bg-surface, text-muted, bg-accent …) */
  --color-bg: var(--color-ink-900);
  --color-surface: var(--color-ink-800);
  --color-surface-raised: var(--color-ink-700);
  --color-border: var(--color-ink-600);
  --color-border-strong: var(--color-ink-400);
  --color-outline: var(--color-ink-950);
  --color-text: var(--color-ink-100);
  --color-text-muted: var(--color-ink-300);
  --color-primary: var(--color-royal-500);
  --color-accent: var(--color-gold-400);
  --color-on-accent: var(--color-ink-950);
  --color-xp-fill: var(--color-gold-300);
  --color-quest-boss: var(--color-crimson-400);
  --color-stat-int: var(--color-royal-300);
  /* … §3 전체 … */

  /* 3) Type / pixel unit — UI_GUIDE §2, PIXEL_RULES §1 */
  --font-pixel: "Galmuri11", ui-monospace, monospace;
  --font-sans: "Pretendard Variable", Pretendard, system-ui, sans-serif;
}

:root { color-scheme: dark; }

:root[data-theme="light"] {          /* Phase 8 */
  color-scheme: light;
  --color-bg: var(--color-parchment-100);
  --color-surface: #fffaf0;
  --color-text: var(--color-ink-900);
  --color-text-muted: var(--color-parchment-700);
  /* … */
}
```

- 시맨틱 토큰은 하나의 변수로 여러 테마를 지원한다 → 컴포넌트 코드에 `dark:` 변형을 쓰지 않는다.
- `components/pixel` 바깥에서 램프 유틸리티(`bg-ink-800`)가 보이면 리뷰에서 시맨틱 토큰으로 교체한다.
