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

- 새 포즈는 `art/characters/poses.ts`의 `edit()`/`stamp()`로 **STAND 프레임 위에 작은 수정**을 얹어 만든다 — 몸·실루엣·발 기준선(y=30)이 모든 상태에서 같다. 점프 대신 팔·표정·이펙트로 표현한다 (기준선 테스트).
- 들어 올린 팔은 머리 외곽선 열(x=9, x=22)을 공유해 외곽선이 2ap로 두꺼워지지 않게 한다. 양팔 모두 왼쪽 가장자리가 밝다 (광원 좌상단).
- 1회 재생 상태(`loop: false`)는 `next`(현재 모두 idle)로 이어진다. `Sprite`의 `then`이 이를 재생한다.
- `prefers-reduced-motion`에서는 모든 상태가 첫 프레임에 멈춘다.
- 대시보드 캐릭터의 진행 중 상태는 `adventureMood()`(features/adventure/mood.ts)가 정한다: 오늘·내일 마감 보스 → running, INT → studying, FOC → working, VIT → exercising, 그 외 → walking.
- 이제 11개 상태가 모두 그려져 있다. 폴백 체인은 새 상태를 추가할 때를 위해 남겨 둔다.

| State | 프레임 | 프레임당 ms | 루프 | 용도 / 트리거 | fallback | Phase |
|-------|--------|-------------|------|----------------|----------|-------|
| `idle` | 4 | 420, 220, 420, 220 (호흡: 서기 → 머리 1ap 하강 → 머리+상체 1ap 하강 → 머리 하강) | ∞ | 기본 대기 | — | **1** ✅ |
| `walking` | 4 | 150 (정면 보행: 서기 → 왼발 → 서기 → 오른발, 딛는 프레임에서 상체 1ap 하강) | ∞ | 랜딩, 화면 전환 | idle | 2 ✅ |
| `running` | 8 | 80 (정면 조깅: 발 교대 + 반대손 가슴까지 펌프, 딛는 프레임에 먼지) | ∞ | 모험 진행 중 다음 단계가 오늘·내일 마감 보스 | walking | 8+ ✅ |
| `studying` | 4 | 220 (책을 가슴 앞에 들고 시선 아래, 4프레임째 책장 넘김) | ∞ | 모험 진행 중 다음 단계 stat=INT | idle | 8 ✅ |
| `working` | 4 | 160 (노트북 덮개가 정면, 좌·우 손 교대 타이핑, 시선 아래) | ∞ | 모험 진행 중 다음 단계 stat=FOC | idle | 8+ ✅ |
| `exercising` | 6 | 120 (제자리 팔벌려 — 팔 내림 → 옆 → 위, 땀방울 효과) | ∞ | 모험 진행 중 다음 단계 stat=VIT | idle | 8+ ✅ |
| `thinking` | 4 | 250 (눈동자 위 → 생각 점 → 말풍선 점 1개 → 2개) | ∞ | GM 브리핑: 보스 D-1~3 | idle | 8 ✅ |
| `celebrating` | 6 | 90, 90, 90, 90, 120, 200 (양팔 위, 손 1ap 흔들기 + 반짝이) | 1회 → idle | 오늘의 모험 완료, 연속 기록 브리핑 | idle | 8 ✅ |
| `sleeping` | 4 | 400 (눈 감음, Z 파티클이 프레임에 포함) | ∞ | 사용자 로컬 00–05시 & 오늘 완료 없음 | idle | 8 ✅ |
| `surprised` | 3 | 80, 80, 300 (눈 세로 3ap, 입 O, 머리 위 "!") | 1회 → idle | GM 브리핑: 보스 당일 | celebrating | 8 ✅ |
| `level-up` | 8 | 80×6, 150, 300 (양팔 위 + 원을 그리는 반짝이, 마지막에 링 전체) | 1회 → idle | **레벨업** 장면 | celebrating | 8 ✅ |

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
| 7 | thinking (모험 준비) | 32×32 ×4f | 8 |
| 8 | 나머지 상태 | — | 8 |

## 10. 캐릭터 반응 매핑 (Game Event → State)

| 이벤트 | 캐릭터 | 동반 UI |
|--------|--------|---------|
| 퀘스트 완료 | `celebrating` | +XP 플로팅, XP 바 증가 |
| BOSS 클리어 | `celebrating` ×1 + 보스 처치 이펙트 | 보스 아이콘 파괴 연출 |
| 레벨업 | `level-up` | 레벨업 모달 |
| 업적 해금 | `surprised` | 업적 토스트 |
| 오늘의 모험 추천 계산 | `thinking` (최소 600ms) | "오늘의 모험을 고르는 중…" |
| 오늘 모험 시작 | `walking` 1루프 → idle | 모험 패널 펼침 |
| 심야 + 무활동 | `sleeping` | 대시보드 문구 "푹 쉬는 것도 모험의 일부야" |

## 11. 몬스터 (퀘스트의 적)

퀘스트마다 "쓰러뜨릴 적"이 있다 — 할 일 목록이 아니라 전투처럼 보이게 하는 장치. 원본은 `art/monsters.ts`, `pnpm art:build`가 시트를 만든다.

| 적 | 스탯 / 타입 | 크기 | 색 |
|----|------------|------|----|
| 슬라임 `slime` | VIT 활력 | 24×24 | emerald |
| 마도서 미믹 `tome` | INT 학습 | 24×24 | violet + gold |
| 감시자의 눈 `watcher` | FOC 집중 | 24×24 | ink-100 + royal |
| 수다 유령 `ghost` | SOC 관계 | 24×24 | ink-100 ramp |
| 불꽃 도깨비 `wisp` | CRE 창작 | 24×24 | gold → ember → crimson |
| 마감 드래곤 `dragon` | 모든 BOSS | 32×32 | crimson + parchment 뿔 |

- 원본은 대기 1프레임만 그린다. 빌드가 **bob 프레임**(1ap 아래로)과 **처치 프레임**(밝기별 ink 램프, 외곽선 유지)을 만들어 `[idle, bob, defeated]` 3프레임 가로 시트로 낸다 — 원본의 맨 아래 줄은 비워 둔다.
- 대기는 900ms 2스텝(CSS `steps`, `prefers-reduced-motion`이면 정지), 완료된 퀘스트는 처치 프레임 + "처치!".
- 매핑은 `components/game/monster/monster.ts`의 `monsterFor(type, stat)` (게임 규칙이 아닌 표현 매핑). 레벨 표기 `Lv.N` = 난이도.
- 몬스터는 장식이다(`aria-hidden`) — 의미는 제목·태그·XP가 전달한다.

