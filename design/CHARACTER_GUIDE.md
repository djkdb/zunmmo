# LIFE RPG — Character Guide

> 캐릭터는 사용자 자신의 분신이며 LIFE RPG의 얼굴이다. 이 문서는 캐릭터의 비율, 스프라이트 사양, 애니메이션 상태, 데이터/컴포넌트 구조를 정의한다.

- 문서 상태: v0.1 (Phase 0)
- 관련: [PIXEL_RULES](./PIXEL_RULES.md) · [COLOR_PALETTE §5 LIFE-32](./COLOR_PALETTE.md#5-픽셀-아트-스프라이트-팔레트--life-32) · [ART_DIRECTION](./ART_DIRECTION.md)

---

## 1. 캐릭터 컨셉

- **"현실의 나를 닮은 평범한 모험가"** — 거창한 전사나 마법사가 아니라, 후드티에 가방을 멘 현대적 모험가. 판타지 소품(망토 끝단, 작은 검 장식, 랜턴)이 살짝 섞인 **현대 × 판타지** 하이브리드.
- 성별 중립적 기본 체형. 머리 모양·색, 의상 색, 피부 톤으로 개성을 표현.
- 표정은 단순하지만 감정이 읽혀야 한다 (눈 2ap 높이, 입 1–2ap).
- 사용자를 평가하지 않는다: 캐릭터가 지치거나 아파 보이는 "부정 상태"는 만들지 않는다. 쉬는 상태는 `sleeping`(편안함)으로만 표현.

## 2. 비율 (Proportion)

**프레임 32×32ap, 치비(chibi) 약 2.3등신.**

```
 y
 0  ┌────────────────────────────────┐
 2  │          (머리 여유 2ap)         │  ← 머리카락/모자 최상단 y=2~4
 4  │            ██████              │
    │          ██▓▓▓▓▓▓██            │  머리(Head): 높이 11–12ap, 폭 12–14ap
    │          █▓ ●  ● ▓█            │  눈: y≈10–11, 2ap 높이, 눈 사이 3–4ap
    │          █▓▓▓▓▓▓▓▓█            │
15  │           ████████             │  턱 y≈15
16  │          █▒▒▒▒▒▒▒▒█            │  몸통(Torso): 높이 7–8ap, 폭 10–12ap
    │         █▒█▒▒▒▒▒▒█▒█           │  팔: 폭 3ap, 손 2×2ap
23  │          █▒▒▒▒▒▒▒▒█            │
24  │           ██▒▒▒▒██             │  다리(Legs): 높이 5–6ap
29  │           ██    ██             │  발 y=29–30
30  │ ─ ─ ─ ─ ─ baseline ─ ─ ─ ─ ─ ─ │  ← 발바닥 기준선 y=30 (모든 프레임 공통)
31  │          (지면 여유 1–2ap)        │
    └────────────────────────────────┘
     x=0            x=16(중심)        31
```

| 항목 | 값 | 비고 |
|------|----|------|
| 전체 높이 | 26–28ap | 모자/머리카락 포함 |
| 머리 : 몸(목 아래) | ≈ 11 : 15 | 머리가 큰 치비 — 작은 크기에서 표정이 읽힘 |
| 기준선(발바닥) | **y = 30** 고정 | 상태 전환 시 캐릭터가 위아래로 튀지 않도록 |
| 수평 중심 | **x = 16** | 좌우 반전 시 기준 |
| 점프/축하 최고점 | 기준선 −4ap | 프레임 밖으로 나가지 않게 |
| 무기/소품 | 프레임 내부에 들어오게. 넘치면 64×32 와이드 프레임 별도 (Phase 8) | |

**실루엣 테스트**: 단색으로 채웠을 때 머리-몸통-다리, 가방 또는 후드가 구분되어야 한다. 3× (96px) 크기에서 다른 캐릭터 프리셋과 실루엣만으로 구분 가능해야 한다.

## 3. 색 구성 (부위별 램프)

| 부위 | 램프 (LIFE-32) | 단계 |
|------|----------------|------|
| 피부 | skin-A light/base/shade/deep | 3+1 |
| 머리카락 (기본) | parchment-900 / parchment-700 / parchment-500 | 3 |
| 상의(후드) 기본 | royal-700 / royal-500 / royal-300 | 3 |
| 하의 | ink-800 / ink-600 / ink-400 | 3 |
| 가방/벨트 | parchment-900 / parchment-700 / parchment-500 | 3 |
| 눈 | ink-950 (+ 하이라이트 ink-100 1ap, 4× 이상 배율용 프레임에서만) | |
| 볼 홍조(선택) | crimson-300 1ap | |
| 외곽선 | ink-950 (sel-out: 해당 부위 가장 어두운 램프) | PIXEL_RULES §3 |

프리셋 4종(온보딩)은 상의/머리 램프만 바꾼다: **Royal(파랑) / Emerald(초록) / Violet(보라) / Ember(주황)**.

## 4. 방향 (Direction)

- MVP: **정면 단일 방향** (눈과 음영이 살짝 오른쪽으로 치우쳐 3/4 느낌만 준다). 대시보드·모달에서 충분.
- 좌측을 봐야 하면 CSS `scaleX(-1)` 반전 허용 (반전은 정수 배율 스케일과 별개라 보간 없음 — 단, 비대칭 소품이 있으면 별도 프레임).
- Phase 8+: 월드맵/걷기 연출용 4방향(down/up/left/right) — 시트에 row 추가로 확장.

## 5. Animation States

데이터 구조는 아래 **전체 상태**를 처음부터 지원하고, 아트는 Phase별로 채운다. 아직 그려지지 않은 상태는 `fallback`으로 대체된다.

| State | 프레임 | 프레임당 ms | 루프 | 용도 / 트리거 | fallback | Phase |
|-------|--------|-------------|------|----------------|----------|-------|
| `idle` | 4 | 420, 220, 420, 220 (호흡: 서기 → 머리 1ap 하강 → 머리+상체 1ap 하강 → 머리 하강) | ∞ | 기본 대기 | — | **1** ✅ |
| `walking` | 6 | 100 | ∞ | 랜딩 히어로, 화면 전환 | idle | 2 |
| `running` | 8 | 80 | ∞ | 보스 마감 임박 연출 | walking | 8 |
| `studying` | 4 | 220 | ∞ | 진행 중 퀘스트 stat=INT | idle | 8 |
| `working` | 4 | 160 (타이핑) | ∞ | 진행 중 퀘스트 stat=FOC | idle | 8 |
| `exercising` | 6 | 120 | ∞ | 진행 중 퀘스트 stat=VIT | idle | 8 |
| `thinking` | 4 | 250 | ∞ | AI GM 응답 대기 중 | idle | 7 |
| `celebrating` | 6 | 90, 90, 90, 90, 120, 200 | 1회 → idle | **퀘스트 완료** | idle | **5** |
| `sleeping` | 4 | 400 ("Z" 파티클 별도) | ∞ | 사용자 로컬 00–06시 & 오늘 활동 없음 | idle | 8 |
| `surprised` | 3 | 80, 80, 300 | 1회 → idle | 업적 해금, 히든 퀘스트 발견 | celebrating | 8 |
| `level-up` | 8 | 80×6, 150, 300 | 1회 → idle | **레벨업** (빛기둥 이펙트는 별도 레이어) | celebrating | **5** |

**상태 우선순위** (동시에 여러 트리거 시): `level-up` > `surprised` > `celebrating` > `thinking` > 활동 상태(studying 등) > `sleeping` > `idle`.
일회성(1회) 상태는 큐로 순차 재생 후 base 상태로 복귀.

## 6. Sprite Sheet 사양

### 6.1 이미지 레이아웃

```
adventurer-<preset>.png  (폭 = 32 × 최대프레임수, 높이 = 32 × 상태수, 프리셋마다 1장)
row 0: idle        [f0][f1][f2][f3]
row 1: walking     [f0][f1][f2][f3][f4][f5]
row 2: celebrating [f0]…[f5]
row 3: level-up    [f0]…[f7]
…
```
- 프레임 간 여백 0, 빈 칸은 투명.
- 모든 프레임은 기준선 y=30, 중심 x=16을 지킨다.

### 6.2 메타데이터

상태별 프레임과 지속 시간은 **원본 `art/characters/adventurer.ts`에서 정의**하고, `pnpm art:build`가 시트 PNG와 타입이 있는 메타데이터 모듈을 생성한다. 런타임에 JSON을 fetch하거나 검증할 필요가 없다 (빌드 시 타입 체크).

```ts
// src/components/game/character/sprite-sheets.generated.ts (생성됨 — 발췌)
export const SPRITE_SHEETS = {
  adventurer: {
    frameSize: { w: 32, h: 32 },
    anchor: { x: 16, y: 30 },
    sheetSize: { w: 128, h: 32 },
    images: { royal: "/sprites/characters/adventurer-royal.png", /* emerald, violet, ember */ },
    states: {
      idle: { row: 0, frames: 4, durations: [420, 220, 420, 220], loop: true },
      // celebrating, level-up … (Phase 5)
    },
  },
} as const;
```

- 아직 그리지 않은 상태는 `CharacterSprite`의 `FALLBACKS` 체인으로 그려진 상태에 도달한다 (예: `level-up → celebrating → idle`). 모든 상태가 해석되는지 테스트로 보장.
- 의상 색은 원본의 슬롯 `1`/`2`/`3`을 프리셋 램프로 치환하는 팔레트 스왑으로 만든다 (`art/palette.ts` `OUTFIT_PRESETS`).

## 7. 커스터마이징 데이터 구조

MVP는 프리셋만 선택하지만, 페이퍼돌(레이어 합성) 확장을 위해 `characters.appearance`는 처음부터 레이어 구조로 저장한다.

```ts
// src/features/character/schemas.ts (사양)
const Appearance = z.object({
  version: z.literal(1),
  base: z.enum(['adventurer']),               // 체형/기본 시트
  skinTone: z.enum(['a', 'b', 'c']),          // 팔레트 스왑 키
  hair: z.object({ style: z.string(), color: z.enum(['brown', 'black', 'blonde', 'red', 'blue']) }),
  outfit: z.object({ style: z.string(), color: z.enum(['royal', 'emerald', 'violet', 'ember']) }),
  accessory: z.string().nullable(),           // 'lantern' | 'scarf' | null … (Phase 8+)
});
```

렌더링 전략:
- **MVP**: 프리셋 4종 = 완성된 시트 4장 (`adventurer-royal.png` …). `appearance` → 시트 id 매핑 함수 1개.
- **확장**: 레이어별 시트(body, hair, outfit, accessory)를 같은 프레임 그리드로 그려 `<canvas>`(또는 겹친 `<div>`)로 합성. 팔레트 스왑은 인덱스 컬러 PNG + 런타임 팔레트 치환.
- 어떤 방식이든 컴포넌트 API는 동일하게 유지한다 (§8).

## 8. 컴포넌트 API

```tsx
// src/components/game/character/CharacterSprite.tsx (사양)
type CharacterState =
  | 'idle' | 'walking' | 'running' | 'studying' | 'working' | 'exercising'
  | 'thinking' | 'celebrating' | 'sleeping' | 'surprised' | 'level-up';

interface CharacterSpriteProps {
  appearance: Appearance;
  state?: CharacterState;            // 기본 'idle'
  scale?: 2 | 3 | 4 | 5 | 6;          // 정수 배율만 (타입으로 강제)
  onAnimationEnd?: (state: CharacterState) => void; // 1회 상태 종료 콜백
  paused?: boolean;                  // reduced-motion이면 자동 true
  className?: string;
  'aria-label'?: string;             // 기본: "{이름}의 캐릭터"
}
```

```tsx
// 연출 오케스트레이션 (src/features/character/useCharacterState.ts, 사양)
const { state, play } = useCharacterState({ base: deriveBaseState(activeQuest, now) });
play('celebrating');           // 큐에 추가 → 끝나면 base 상태로 복귀
play('level-up');              // 우선순위 높은 상태는 현재 일회성 상태 다음에 바로 재생
```

- `<Sprite>`(components/pixel) — 범용: 시트 + 상태 + 배율 + 프레임 타이머
- `<CharacterSprite>`(components/game) — `appearance` → 시트 선택 + 상태 fallback 해석 + 접근성
- 캐릭터 아래 지면 그림자, 이펙트(빛기둥, 반짝임)는 **별도 레이어 컴포넌트** (`<CharacterStage>`)

## 9. MVP 에셋 목록 (고정)

| # | 에셋 | 크기 | Phase |
|---|------|------|-------|
| 1 | 기본 모험가 idle ×4 프리셋 색 | 32×32 ×4f ×4 | 1 |
| 2 | celebrating, level-up | 32×32 ×(6+8)f | 5 |
| 3 | 지면 그림자 | 16×4 | 1 |
| 4 | 레벨업 빛기둥 이펙트 | 32×64 ×6f | 5 |
| 5 | 완료 반짝임 파티클 | 8×8 ×5f | 5 |
| 6 | walking (랜딩) | 32×32 ×6f | 2 |
| 7 | thinking (GM 대기) | 32×32 ×4f | 7 |
| 8 | 나머지 상태 | — | 8 |

## 10. 캐릭터 반응 매핑 (Game Event → State)

| 이벤트 | 캐릭터 | 동반 UI |
|--------|--------|---------|
| 퀘스트 완료 | `celebrating` | +XP 플로팅, XP 바 증가 |
| BOSS 클리어 | `celebrating` ×1 + 보스 처치 이펙트 | 보스 아이콘 파괴 연출 |
| 레벨업 | `level-up` | 레벨업 모달 |
| 업적 해금 | `surprised` | 업적 토스트 |
| GM 응답 대기 | `thinking` | "GM이 퀘스트를 설계하는 중…" |
| 오늘 모험 시작 | `walking` 1루프 → idle | 모험 패널 펼침 |
| 심야 + 무활동 | `sleeping` | 대시보드 문구 "푹 쉬는 것도 모험의 일부야" |
