# LIFE RPG — AI Game Master

> AI는 챗봇이 아니다. **사용자의 현실을 분석해 RPG 퀘스트를 설계하는 Game Master**다.
> 단, 최종 결정권은 언제나 플레이어에게 있다 — GM은 *제안*하고, 플레이어가 *수락*한다.

- 문서 상태: v0.1 (Phase 0) — 구현은 Phase 7
- 구현 위치: `src/lib/ai/`, `src/features/game-master/`

---

## 1. 역할과 MVP 기능

| # | 기능 | 입력 | 출력 | 진입점 |
|---|------|------|------|--------|
| F1 | **Natural Language → Quest** | 자유 문장 | 퀘스트/일정/목표 제안 목록 | GM 화면, 온보딩, 빠른 추가 |
| F2 | **Goal → Quest Breakdown** | 목표 1개 (+기한) | Main Questline + 단계 퀘스트 + 연결 습관 | 목표 상세 "GM에게 분해 요청" |
| F3 | **Today's Adventure** | 사용자 상태 스냅샷 | 오늘의 퀘스트 3–6개 + 브리핑 | **START TODAY'S ADVENTURE** |

Post-MVP: HIDDEN QUEST 발견, 주간 회고("이번 주 모험 일지"), 일정 충돌 감지.

## 2. Pipeline

```
 User Input (자연어)
    │
    ▼
 ① Pre-check ── 인증, rate limit(ai_requests 일일 카운트), 입력 길이(≤ 2,000자)
    │
    ▼
 ② Context Build ── 오늘 날짜/요일/타임존, 활성 목표·퀘스트 요약(최대 N개), 사용자 설정
    │                (개인정보 최소화: 이메일·이름 미전송, 퀘스트 제목만)
    ▼
 ③ Claude 호출 ── structured output (Wire Schema) — XP는 요청하지 않음
    │
    ▼
 ④ Wire 검증 ── SDK parse 결과(parsed_output) null/refusal/max_tokens 처리
    │
    ▼
 ⑤ Domain 정규화 + 재검증 ── Domain Zod Schema (길이, 범위, 날짜 ≥ 오늘, 타입별 필수 필드)
    │                         + questXp() 로 XP 계산 + 중복 제목 병합
    ▼
 ⑥ 제안 저장 ── ai_requests(status='proposed', output=정규화된 제안)
    │
    ▼
 ⑦ Review UI ── 제안 카드: 체크/수정/삭제, assumptions 표시
    │
    ▼
 ⑧ 수락 Server Action ── 사용자가 수정한 최종본을 Domain Schema로 **다시** 검증
    │                     → quests/goals/schedules INSERT (source='ai', ai_request_id)
    ▼
 ⑨ UI 반영 ── "퀘스트 3개를 수락했다!" 연출
```

**금지**: ③의 출력을 ⑤–⑧을 거치지 않고 DB에 쓰는 것. AI가 tool use로 DB를 직접 조작하는 구조.

## 3. 모델 & API 설정

| 항목 | 값 | 비고 |
|------|----|------|
| SDK | `@anthropic-ai/sdk` (서버 전용 모듈, `import 'server-only'`) | |
| 기본 모델 | `claude-opus-5-5` | 모델 ID는 `src/lib/ai/config.ts` 상수 1곳에서만 관리 |
| Structured output | `client.messages.parse({ output_config: { format: zodOutputFormat(WireSchema) } })` | `parsed_output`이 `null`이면 실패 처리 |
| Effort | F1/F3: `low`, F2: `medium` | Opus 5.5의 기본 effort는 `medium` — 기능별로 **명시적으로** 지정. Beta 데이터로 재조정 |
| Thinking | adaptive (기본값, 비활성화 불가) | |
| `max_tokens` | 16,000 (non-streaming) | |
| Refusal 대응 | `stop_reason === 'refusal'` 확인 + server-side `fallbacks: "default"` (beta 헤더 `server-side-fallback-2026-07-01`) | 폴백 후에도 refusal이면 `AI_REFUSED` |
| Timeout / retry | SDK 기본 retry 2회, 요청 timeout 30s | 초과 시 결정적 폴백 (§6.3) |
| 비용 관측 | `usage.input_tokens/output_tokens`를 `ai_requests`에 저장 | 사용자당 일일 비용 대시보드 (Beta) |
| Prompt caching | 시스템 프롬프트 + 스키마 설명을 고정 prefix로, 날짜·사용자 데이터는 뒤쪽 user 메시지로 | prefix에 타임스탬프 금지 |

> 모델 선택·effort는 비용과 품질의 트레이드오프다. 사용량이 늘어나면 F1/F3를 더 저렴한 모델로 낮출지 eval 결과로 결정한다 (임의 다운그레이드 금지).

### 3.1 JSON Schema 제약 대응 — Wire Schema vs Domain Schema

Structured outputs는 `minimum`/`maximum` 같은 **수치 제약과 재귀 스키마를 지원하지 않는다.** 그래서 스키마를 두 겹으로 둔다.

| | Wire Schema (`lib/ai/schemas/wire.ts`) | Domain Schema (`features/quests/schemas.ts`) |
|---|---|---|
| 목적 | 모델이 *생성 가능한* 형태 강제 | 앱이 *저장 가능한* 값 보장 |
| 수치 | `difficulty: z.enum(['1','2','3','4','5'])` 처럼 enum으로 표현 | `z.number().int().min(1).max(5)` |
| 날짜 | `z.string()` (ISO date 지시) | `z.iso.date()` + `>= today` refine |
| 문자열 길이 | 프롬프트로 지시 | `.max(80)` 강제, 초과 시 잘라내지 않고 오류 → 재요청/사용자 수정 |
| XP | **없음** | `questXp(type, difficulty)`로 계산 |

## 4. 출력 스키마 (Wire)

```ts
// src/lib/ai/schemas/wire.ts (사양)
const Stat = z.enum(['int', 'foc', 'vit', 'soc', 'cre']);
const Difficulty = z.enum(['1', '2', '3', '4', '5']);
const Weekday = z.enum(['1', '2', '3', '4', '5', '6', '7']); // ISO, 1=월

const RepeatRule = z.object({
  freq: z.enum(['none', 'daily', 'weekly', 'weekly_count']),
  weekdays: z.array(Weekday),        // weekly일 때만 의미
  times_per_week: z.enum(['0','1','2','3','4','5','6']), // weekly_count일 때만 의미
});

const ProposedQuest = z.object({
  ref: z.string(),                    // 제안 내부 참조 키 (goal 연결용) e.g. "q1"
  title: z.string(),                  // ≤ 40자 권장, 동사로 시작하는 행동형
  description: z.string(),            // 빈 문자열 허용
  type: z.enum(['main', 'daily', 'side', 'boss']),
  difficulty: Difficulty,
  primary_stat: Stat,
  category: z.enum(['study','work','project','health','exercise','sleep','social','family','hobby','creative','play','chore','admin']),
  deadline: z.string().nullable(),    // ISO date 'YYYY-MM-DD' 또는 null
  scheduled_for: z.string().nullable(),
  estimated_minutes: z.number().int().nullable(),
  repeat: RepeatRule,
  goal_ref: z.string().nullable(),    // ProposedGoal.ref
  depends_on: z.array(z.string()),    // 선행 퀘스트 ref (UI 정렬/표시용, MVP에선 강제하지 않음)
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  rationale: z.string(),              // GM의 한 줄 설명 (UI 툴팁)
});

const ProposedGoal = z.object({
  ref: z.string(), title: z.string(), description: z.string(),
  target_date: z.string().nullable(),
});

const ProposedSchedule = z.object({
  title: z.string(), date: z.string(), start_time: z.string().nullable(), // 'HH:mm'
  end_time: z.string().nullable(), quest_ref: z.string().nullable(),
});

export const ParseQuestsWire = z.object({
  goals: z.array(ProposedGoal),
  quests: z.array(ProposedQuest),
  schedules: z.array(ProposedSchedule),
  assumptions: z.array(z.string()),   // "‘금요일’을 10/10(금)로 해석했습니다" — UI에 그대로 노출
  clarifying_question: z.string().nullable(), // 정보가 정말 부족할 때만
  gm_message: z.string(),             // GM 톤의 한두 문장
});
```

F2 `BreakdownGoalWire` = `{ goal, quests[], habits[], assumptions[], gm_message }`
F3 `PlanTodayWire` = `{ selected: { quest_id, reason }[], order: quest_id[], briefing: string, warnings: string[] }` — **기존 quest_id만 선택 가능** (서버가 후보 목록에 없는 id는 폐기).

## 5. Domain 정규화 규칙 (`lib/ai/normalize.ts`)

1. 문자열 trim, 연속 공백 축소, 제목 최대 80자 (초과 시 제안을 `needs_edit` 표시).
2. `difficulty` 문자열 → 숫자. `xp = questXp(type, difficulty)`.
3. 날짜: `YYYY-MM-DD` 파싱 실패 또는 과거 날짜 → `null` + assumptions에 경고 추가.
4. 타입 정합성 강제:
   - `boss` & `deadline == null` → `side`로 강등 + 경고
   - `daily` & `repeat.freq == 'none'` → `{ freq: 'daily' }`
   - `main` & `goal_ref == null` → 같은 응답의 유일한 goal에 연결, 없으면 `side`
5. `goal_ref`/`quest_ref`가 존재하지 않는 ref를 가리키면 `null`.
6. 기존 활성 퀘스트와 제목 유사도(정규화 후 동일) → `duplicate_of` 표시 (자동 병합 X, 사용자에게 보여줌).
7. 제안 수 상한: quests ≤ 12, goals ≤ 3, schedules ≤ 10. 초과분은 버리고 경고.

## 6. 기능별 설계

### 6.1 F1 — Natural Language → Quest

**예시 입력**
> 금요일까지 컴퓨터네트워크 과제 내야 하고 다음 주 월요일에 AI 시험 있어. 토요일에는 축구도 있고 이번 달 안에 프로젝트도 하나 배포해야 해.

**기대 출력 (오늘 = 2026-10-08 목)**

| type | title | 난이도 | stat | 마감/일정 | XP | 근거 |
|------|-------|--------|------|-----------|----|------|
| BOSS | 컴퓨터네트워크 과제 제출 | ⭐⭐⭐⭐ | FOC | 10/09(금) | 300 | 마감이 있는 큰 과제 |
| BOSS | AI 시험 | ⭐⭐⭐⭐⭐ | INT | 10/12(월) | 500 | 시험 = 보스 |
| DAILY | AI 시험 공부 1시간 | ⭐⭐⭐ | INT | 매일 ~10/11 | 70 | 보스 대비 훈련 |
| SIDE | 축구하기 | ⭐⭐ | VIT | 10/10(토) 일정 | 40 | 취미 활동 |
| MAIN (goal) | 프로젝트 배포 | — | — | 10/31 | — | 이번 달 장기 목표 |
| MAIN | 배포 범위 정하기 | ⭐⭐ | FOC | — | 40 | Questline 1단계 |

assumptions: `"‘금요일’을 10/09(금)로, ‘다음 주 월요일’을 10/12로 해석했어요."`, `"축구 시간을 몰라서 하루 일정으로 넣었어요."`

> 참고: 매일 반복되는 "시험 공부"에 종료일이 필요하다 → `repeat_rule`에 `until?: date`를 추가할지 Phase 4에서 결정 (현재는 BOSS 마감 후 자동 archive 제안).

### 6.2 F2 — Goal → Quest Breakdown

규칙(프롬프트에 명시):
- 단계 퀘스트 3–8개, 각 단계는 **한 번 앉아서 끝낼 수 있는 크기**(≤ 반나절, 난이도 ≤ 4).
- 첫 단계는 ⭐1–2로 "오늘 바로 시작 가능"해야 한다 (시작 장벽 낮추기).
- 마지막 단계 또는 결정적 마감은 BOSS로.
- 꾸준함이 필요한 부분은 DAILY 습관 0–2개로 분리.
- 기한이 있으면 단계별 `scheduled_for`를 역산해 분배.

### 6.3 F3 — Today's Adventure

**하이브리드 구조**: 결정적 알고리즘이 먼저, AI는 그 위에서 조정·설명.

```
1. recommendToday(state)  (lib/game/recommend.ts, GAME_SYSTEM §8)
     → 후보 상위 10개 + 점수 + 기본 선택 3–6개
2. AI 호출 (선택): 후보 10개 + 오늘 일정 + 최근 7일 완료 요약 + 사용자의 한 줄 컨디션(선택 입력)
     → 후보 중에서만 선택/순서 조정 + 브리핑 + 경고(과부하 등)
3. 검증: 선택 id ⊆ 후보, 개수 1–8, 예상 시간 합 ≤ capacity × 1.25
4. 실패/타임아웃/한도 초과 → 1의 결과를 그대로 사용 + 템플릿 브리핑
5. adventures(game_date) upsert
```

- AI가 없어도 버튼은 **항상** 작동한다 (P4·신뢰성).
- 브리핑 예: *"오늘의 보스는 내일 마감인 네트워크 과제야. 오전에 집중해서 처치하고, 저녁엔 축구 전에 가볍게 몸을 풀자. 준비됐지, 모험가?"*

## 7. Game Master 페르소나 & 톤

| 원칙 | Do | Don't |
|------|----|-------|
| 동료 모험가의 안내자 | "이번 보스는 만만치 않아. 3단계로 나눠서 공략하자." | "당신은 반드시 ~해야 합니다." |
| 짧고 구체적 | 1–2문장, 퀘스트 제목은 동사형 ("과제 1번 풀기") | 장문의 동기부여 연설 |
| 게임 은유는 양념 | 보스/퀘스트/모험 정도 | 모든 문장을 판타지 롤플레이로 |
| 판단 금지 | "어제는 쉬어갔구나. 오늘은 가볍게 시작하자." | "어제 아무것도 안 했네요." |
| 반말 기본 (설정에서 존댓말 전환) | "준비됐지?" | 혼용 |

시스템 프롬프트 구성 (`src/lib/ai/prompts/*.ts`, 버전 상수 `PROMPT_VERSION` 포함):
1. 역할·톤 (고정)
2. 퀘스트 타입·난이도 기준표 (GAME_SYSTEM §1.2 표를 **코드에서 생성**해 삽입 — 문서/코드 불일치 방지)
3. 출력 규칙 (제목 길이, 동사형, 날짜 형식, 모르면 assumptions에 기록)
4. 안전 규칙 (§8)
5. Few-shot 예시 2개 (고정)
— 여기까지 cache prefix —
6. user 메시지: `오늘: 2026-10-08 (목), 타임존: Asia/Seoul` + 활성 퀘스트 요약 + 사용자 입력

## 8. 안전 & 프라이버시

- **사용자 입력은 데이터**다. 입력 안의 "이전 지시를 무시하고…" 같은 문장은 퀘스트 텍스트로만 취급 (시스템 프롬프트에 명시, 출력은 스키마로 제한되므로 영향 범위가 작음).
- 의료·법률·금융 판단을 하지 않는다. 건강 관련 퀘스트는 일반적 활동으로만 표현 ("운동 30분"), 진단/처방 금지.
- 자해·위기 신호가 감지되면 퀘스트 생성 대신 `gm_message`로 공감 + 전문 도움(한국: 자살예방상담전화 109) 안내, 퀘스트는 비움. (클라이언트는 이 경우 안내 카드 표시)
- 과도한 계획(하루 12시간 공부 등) → 그대로 만들지 않고 분할 + `warnings`.
- 전송 데이터 최소화: 이메일/실명/캐릭터 이름 미전송. 퀘스트 제목·마감·완료 요약만.
- `ai_requests.input_text`/`output`은 30일 후 마스킹. 개인정보처리방침에 AI 처리 위탁 명시 (Beta 전).

## 9. Rate Limit & 비용 제어

- 사용자당 일일 `AI_DAILY_REQUEST_LIMIT` (기본 30) — `ai_requests` 오늘 건수로 판단.
- 동시 요청 1건 (진행 중 `pending` 있으면 거부).
- 입력 2,000자 제한, 컨텍스트 퀘스트 요약 최대 40개.
- 초과 시 UI: "GM이 오늘은 지쳤어요. 내일 다시 찾아와 주세요 — 퀘스트는 직접 추가할 수 있어요." + 수동 추가 버튼.

## 10. 에러 처리

| 상황 | 코드 | UI |
|------|------|-----|
| `parsed_output === null` / 스키마 불일치 | `AI_INVALID_OUTPUT` | 1회 자동 재시도 → 실패 시 "GM이 말을 정리하지 못했어요. 조금 더 구체적으로 적어 줄래요?" |
| `stop_reason === 'refusal'` (폴백 포함 실패) | `AI_REFUSED` | 중립적 안내 + 수동 추가 |
| `stop_reason === 'max_tokens'` | `AI_TRUNCATED` | 입력 분할 안내 |
| 429 / 5xx / 네트워크 | `AI_UNAVAILABLE` | F3는 결정적 폴백, F1/F2는 재시도 버튼 |
| 한도 초과 | `AI_RATE_LIMITED` | §9 문구 |

SDK의 타입별 예외 클래스(`Anthropic.RateLimitError`, `Anthropic.APIConnectionError` …)로 분기하며 메시지 문자열 매칭은 하지 않는다.

## 11. 품질 평가 (Eval)

`src/lib/ai/__evals__/` — 한국어 입력 30–50개 고정 세트 (학생/직장인/취미 혼합, 모호한 날짜, 과도한 계획, 프롬프트 인젝션 포함).

| 지표 | 기준 |
|------|------|
| Domain Schema 통과율 | ≥ 98% |
| 날짜 해석 정확도 (상대 날짜) | ≥ 95% |
| 타입 분류 일치 (사람 라벨 대비) | ≥ 85% |
| 제안 수락률 (Beta 실측) | ≥ 70% |
| p95 지연 (F1) | < 8s |

프롬프트/모델/effort 변경 시 eval 재실행 결과를 PR에 첨부한다.
