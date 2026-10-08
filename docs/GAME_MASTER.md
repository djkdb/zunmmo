# LIFE RPG — Game Master (규칙 기반)

> Game Master(GM)는 플레이어의 하루를 안내하는 **게임 속 진행자**다. 오늘 할 퀘스트를 골라 주고, 상황에 맞는 한마디를 건네고, 퀘스트를 빠르게 만들 수 있게 돕는다.
> **LLM(외부 AI API)은 사용하지 않는다.** 모든 판단은 `src/lib/game/`의 결정적 규칙과 템플릿으로 한다.

- 문서 상태: v0.2 — 2026-10-08 결정: Claude API 연동 제외 (복잡도 대비 가치가 낮다는 판단). 이전 LLM 설계는 git 히스토리(commit `270450f`, `docs/AI_GAME_MASTER.md`)에 보존.
- 구현 위치: `src/lib/game/recommend.ts`, `src/lib/game/briefing.ts`, `src/lib/game/templates.ts`, `src/features/adventure/`, `src/features/quests/`

---

## 1. 원칙

1. **결정적(deterministic)**: 같은 입력이면 항상 같은 결과. 테스트로 고정할 수 있어야 한다.
2. **외부 의존 0**: 네트워크·API 키·비용 없이 동작. 장애 지점이 없다.
3. **제안은 GM, 결정은 플레이어**: 추천은 체크된 상태로 보여 주고 플레이어가 빼거나 더한다.
4. **판단하지 않는 말투**: GM 대사는 격려·안내만. "어제 아무것도 안 했네요" 같은 문장은 금지 (UI_GUIDE §11).

## 2. 기능

| # | 기능 | 입력 | 출력 | 위치 |
|---|------|------|------|------|
| G1 | **Today's Adventure 추천** | 활성 퀘스트, 오늘 일정, 최근 7일 완료, 하루 용량 | 오늘의 퀘스트 3–6개 (점수 순) | `lib/game/recommend.ts` (GAME_SYSTEM §8) |
| G2 | **GM 브리핑** | G1 결과 + 상황(보스 임박, 연속 기록, 빈 하루, 심야 …) | 한두 문장의 GM 대사 | `lib/game/briefing.ts` |
| G3 | **퀘스트 템플릿** | 카테고리 선택 | 타입·난이도·스탯·반복이 채워진 퀘스트 초안 | `lib/game/templates.ts` |
| G4 | **빠른 추가** | 제목 + 타입 + 난이도 (+ 날짜 칩) | 퀘스트 1개 | `features/quests` |
| G5 | **Questline 단계 입력** | 목표 1개 + 단계 제목 여러 줄 | MAIN 퀘스트 N개 | `features/quests` |

## 3. G1 — Today's Adventure 추천

점수식과 가중치는 [GAME_SYSTEM §8](./GAME_SYSTEM.md#8-todays-adventure--결정적deterministic-추천-점수)이 단일 소스다.

```
recommendToday({ quests, completionsLast7Days, schedulesToday, capacityMinutes, today })
  → { picks: RecommendedQuest[]; candidates: RecommendedQuest[]; totalXp; totalMinutes }
```
- 후보: 오늘 수행 가능한 퀘스트 — 활성 단발 퀘스트 + 오늘이 회차인 daily (이미 오늘 완료한 회차 제외).
- 선택: 점수 내림차순으로 담되 `estimated_minutes` 합이 용량을 넘으면 건너뜀. 최소 1개, 최대 6개.
- 보스 D-0/D-1은 용량을 넘어도 항상 포함.
- 결과는 `adventures(game_date)`에 저장되고 하루 동안 고정된다 (다시 시작하면 재계산).

## 4. G2 — GM 브리핑 (템플릿)

상황 판정 → 우선순위가 가장 높은 상황의 문장 풀에서 **날짜 기반 결정적 선택**(같은 날엔 같은 문장).

| 우선순위 | 상황 | 조건 | 예시 대사 |
|---|------|------|-----------|
| 1 | 보스 당일 | 오늘 마감 보스 존재 | "오늘은 {boss}와 맞붙는 날이야. 준비한 만큼 보여 주자!" |
| 2 | 보스 임박 | D-1~3 보스 | "{boss}까지 D-{n}. 오늘 준비 퀘스트로 체력을 깎아 두자." |
| 3 | 연속 기록 | 모험 연속 ≥ 3일 | "{n}일 연속 모험 중! 오늘도 한 걸음만 더." |
| 4 | 복귀 | 마지막 완료가 3일 이상 전 | "다시 왔구나. 가볍게 하나부터 시작하자." |
| 5 | 가벼운 날 | 추천 합계 ≤ 60분 | "오늘은 짧은 모험이야. 여유롭게 다녀오자." |
| 6 | 기본 | — | "오늘의 모험 준비 완료. 첫 퀘스트부터 가 볼까?" |

- 심야(로컬 00–05시) 접속 + 오늘 완료 없음 → 대사 대신 "푹 쉬는 것도 모험의 일부야" (캐릭터 `sleeping`).
- 문장은 `briefing.ts`의 상수 배열로 관리하고, 테스트가 상황별 선택을 고정한다.
- 금지 표현 검사: 테스트에서 모든 문장에 "실패·패배·게으" 등이 없는지 확인.

## 5. G3 — 퀘스트 템플릿

카테고리별 5–8개, 총 30개 내외 (`templates.ts`). 각 템플릿은 완성된 퀘스트 초안이다.

```ts
interface QuestTemplate {
  id: string;                 // "exercise-30"
  category: QuestCategory;    // GAME_SYSTEM §5.1
  title: string;              // "운동 30분"
  type: QuestType;            // daily
  difficulty: Difficulty;     // 2
  estimatedMinutes?: number;  // 30
  repeat?: RepeatRule;        // { freq: "daily" }
}
```
- 스탯은 `CATEGORY_STAT[category]`, XP는 `questXp()` — 템플릿에 XP를 적지 않는다.
- 온보딩 첫 퀘스트 3개는 템플릿에서 고른다.

## 6. G4 — 빠른 추가

- 필수 3필드: 제목, 타입(세그먼트 4개), 난이도(별 1–5). 나머지는 "더 보기".
- 날짜 칩: `오늘` / `내일` / `이번 주 금요일` / `직접 선택` → `gameDate` 기준 계산 (`lib/game/time.ts`).
- 기본값: 타입별 기본 난이도(main 3, daily 2, side 2, boss 4), 카테고리 미선택 시 스탯은 타입별 기본(boss/main → foc, daily → vit, side → cre).
- BOSS는 마감 칩 선택을 필수로 요구한다 (GAME_SYSTEM §1.1).

## 7. G5 — Questline 단계 입력

- Main Questline 생성 시 "단계"를 줄 단위로 여러 개 입력 → 각 줄이 MAIN 퀘스트.
- 안내 문구: "첫 단계는 오늘 바로 시작할 수 있을 만큼 작게" (난이도 기본 ⭐2, 이후 ⭐3).
- 마지막 단계를 BOSS로 지정하는 토글 (마감 필수).

## 8. 다시 LLM을 검토한다면

규칙 기반 GM으로 Beta 지표(PRODUCT_SPEC §9)를 본 뒤 결정한다. 도입할 경우의 안전 장치(제안→수락, XP 미출력, 스키마 이중 검증, 결정적 폴백)는 이전 설계 문서에 정리되어 있다.
