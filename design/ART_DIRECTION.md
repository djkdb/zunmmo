# LIFE RPG — Art Direction

> **"인디 픽셀 RPG를 현대적인 웹앱 UX로 구현한 느낌."**
> 픽셀 아트는 장식이 아니라 LIFE RPG의 핵심 브랜드 아이덴티티다.

- 문서 상태: v0.1 (Phase 0)
- 이 문서는 **방향과 요약**을 정의한다. 세부 수치는 하위 문서가 단일 소스다:
  - 색 → [COLOR_PALETTE.md](./COLOR_PALETTE.md)
  - 픽셀 제작/렌더링 규칙 → [PIXEL_RULES.md](./PIXEL_RULES.md)
  - 캐릭터 → [CHARACTER_GUIDE.md](./CHARACTER_GUIDE.md)
  - UI 레이아웃/컴포넌트 → [UI_GUIDE.md](./UI_GUIDE.md)

---

## 1. Visual Pillars

| # | Pillar | 설명 |
|---|--------|------|
| V1 | **Crisp & Consistent** | 모든 픽셀 아트는 같은 밀도·팔레트·외곽선·광원을 공유한다. 한 화면에 "다른 게임에서 가져온 것 같은" 에셋이 있으면 실패. |
| V2 | **Warm Night Adventure** | 어두운 밤하늘(Ink) 위에 금빛 보상과 따뜻한 랜턴 빛. 차분하지만 설레는 분위기. 형광/네온 사이버펑크 아님. |
| V3 | **Pixel where it's play, modern where it's work** | 캐릭터·아이콘·보상·연출은 픽셀. 읽고 입력하는 곳(본문, 폼, 캘린더, 설정)은 현대적 타이포·레이아웃. |
| V4 | **Readable first** | 3× 크기에서 실루엣이 읽히고, 텍스트는 WCAG AA. 예쁨이 가독성을 이기지 않는다. |
| V5 | **Earned delight** | 화려한 연출은 사용자가 무언가를 *해냈을 때*만. 평소 화면은 조용하다. |

## 2. 스타일 정의

- **Polished 16-bit / 32-bit inspired**: SNES~GBA 시대의 정돈된 픽셀 감성 + 현대 인디 게임의 절제된 색과 조명.
- **Mood board 키워드**: 캠프파이어, 모험가 길드 게시판, 양피지 퀘스트 두루마리, 밤의 마을 등불, 작은 영웅의 일상.
- **레퍼런스 방향 (참고용, 복제 금지)**: Stardew Valley의 생활감, Eastward의 디테일한 조명, Sea of Stars의 따뜻한 팔레트, Celeste의 선명한 실루엣과 절제된 UI.
- **Environmental storytelling**: 배경 소품이 사용자 상태를 은근히 반영 (Phase 8+) — 공부 퀘스트가 많은 주엔 책 더미, 보스 임박 시 게시판에 붉은 현상수배서.

### Pixel-heavy vs Modern

| Pixel-heavy (픽셀 아트로 표현) | Modern (현대 UI로 표현) |
|------|------|
| 캐릭터, 몬스터/보스 | 본문 텍스트, 설명 |
| 퀘스트 타입·스탯·UI 아이콘 | 폼(입력, 선택, 날짜 선택기) |
| 업적 배지, 아이템 | 캘린더 그리드 |
| XP 바, 레벨 배지, 퀘스트 카드 프레임 | 설정, 계정, 법적 페이지 |
| 주요 CTA 버튼 (START TODAY'S ADVENTURE) | 보조 버튼, 텍스트 링크 |
| 레벨업·완료·업적 연출, 파티클 | 통계 차트(픽셀 막대 스타일은 허용), 표 |
| 랜딩 히어로 장면, 월드맵 | 내비게이션 레이블, 토스트 본문 |
| 헤드라인/숫자 (픽셀 폰트) | 본문 폰트 (Pretendard) |

**경계 규칙**: Modern 요소도 같은 색 토큰·같은 4px 그리드·직각에 가까운 모서리(radius ≤ 4px)를 써서 픽셀 요소와 "같은 세계"에 있도록 한다. Modern 요소에 글래스모피즘, 큰 radius(≥12px), 블러 섀도, 그라디언트 금지.

## 3. Pixel Scale

| 항목 | 규칙 |
|------|------|
| 기본 아이콘 | 16×16ap, UI에서 **2×** (32px) |
| 캐릭터 | 32×32ap 프레임, 대시보드 **3× (모바일) / 4× (데스크톱)** |
| 배율 | **정수만** (2–6×). 한 컴포넌트 = 한 배율 |
| UI 픽셀 유닛 | `--pixel-unit: 2px` (아이콘 2×와 같은 밀도) |
| 렌더링 | `image-rendering: pixelated`, 정수 px 위치, 1× 원본만 배포 |

상세: [PIXEL_RULES §1–2](./PIXEL_RULES.md#1-pixel-scale--density)

## 4. Color Palette 요약

| 역할 | 토큰 | Hex | 의미 |
|------|------|-----|------|
| **Background** | ink-900 | `#15111f` | 밤하늘. 앱 배경 |
| Surface | ink-800 | `#221c33` | 카드/패널 |
| **Primary** | royal-500 | `#4466d6` | 브랜드, 선택, MAIN QUEST |
| **Secondary** | parchment-500 | `#c4a46e` | 나무·양피지·가죽 — RPG 소재감 |
| **Accent** | gold-400 | `#f7b733` | 주요 CTA, 보상 강조 |
| **XP** | gold-300 (+gold-100 / gold-500 밴드) | `#ffd256` | 경험치, 진행 |
| **Success** | emerald-400 | `#3fc277` | 완료 |
| **Danger** | crimson-400 | `#f04f5a` | 오류, BOSS |
| Warning | ember-400 | `#f98b3c` | 마감 임박 |
| **Outline** | ink-950 | `#0d0a14` | 모든 픽셀 외곽선 (순수 검정 대신) |
| Text | ink-100 | `#eeeaf8` | 본문 (대비 15.69:1) |

- 스프라이트는 **LIFE-32** 팔레트(32색) 안에서만 제작.
- Gold는 "보상/진행"의 색이다. Gold를 경고·장식 목적으로 쓰지 않는다 → 보상의 가치가 희석됨.

상세: [COLOR_PALETTE](./COLOR_PALETTE.md)

## 5. Outline · Lighting · Character Proportion 요약

**Outline**
- 1ap, `ink-950`. 캐릭터는 selective outline 허용, 16×16 아이콘은 전체 ink-950.
- 내부 선은 ink-950 대신 해당 램프의 어두운 색. 이펙트(빛)는 외곽선 없음.

**Lighting**
- 광원 **좌상단 고정**. 하이라이트 좌상단, 그림자 우하단.
- 3단계 셰이딩(하이라이트-베이스-그림자) + hue shift (그림자는 차갑게, 빛은 따뜻하게).
- Pillow shading, banding, 외곽 AA 금지. 디더링은 넓은 배경 면에만.

**Character Proportion**
- 32×32 프레임, 높이 26–28ap, **약 2.3등신 치비** (머리 11–12ap).
- 발 기준선 y=30, 중심 x=16 — 모든 프레임 공통.
- 현대 × 판타지 모험가 (후드티 + 가방 + 작은 판타지 소품).

상세: [PIXEL_RULES §3–4](./PIXEL_RULES.md#3-outline-외곽선), [CHARACTER_GUIDE §2](./CHARACTER_GUIDE.md#2-비율-proportion)

## 6. Animation Direction

**원칙**: 픽셀 애니메이션은 *프레임*으로 움직이고(`steps()`), UI 트랜지션은 *짧고 조용하게* 움직인다. 큰 연출은 성취의 순간에만.

| 애니메이션 | 프레임 / 길이 | 연출 방향 | 감정 |
|------------|---------------|-----------|------|
| **Idle** | 4f × 180ms 루프 | 호흡: 2프레임째 몸통·머리 1ap 하강, 가끔(8–12초 간격) 눈 깜빡임 1f 삽입 | 살아 있음, 차분함 |
| **Walk** | 6f × 100ms 루프 | 접지 프레임에서 몸 1ap 하강(bob), 팔다리 반대 방향 스윙 | 모험 출발 |
| **Run** | 8f × 80ms 루프 | 상체 앞으로 1ap 기울임, 공중 프레임 2개, 머리카락/가방 2프레임 지연(follow-through) | 긴박함 (보스 임박) |
| **Quest Complete** | 총 ≈ 900ms | ① 체크 버튼 눌림(즉시) → ② 체크 글리프 스탬프 2f → ③ 퀘스트 타입 색 픽셀 파티클 5f 방사 → ④ "+70 XP" 픽셀 폰트가 위로 24px(배율 단위 스냅) 떠오르며 600ms → ⑤ XP 바 유닛 단위로 채움(400–600ms) → ⑥ 캐릭터 `celebrating` 1회 | 즉각적인 손맛, "성장했다" |
| **Boss Clear** | 총 ≈ 1.6s | Quest Complete + 보스 아이콘 흔들림(2px, 3회) → 깨짐 6f → 화면 가장자리 crimson 1프레임 플래시(reduced-motion 시 생략) | 큰 성취 |
| **Level Up** | 총 ≈ 2.2s | ① XP 바 가득 참 → 반짝 1f → 0으로 리셋 ② 화면 dim(ink-950 60%) ③ 캐릭터 `level-up` 8f + 금빛 빛기둥 이펙트 6f ④ `LEVEL UP!` 픽셀 타이포가 스텝 스케일(2×→3×)로 등장 ⑤ `Lv.23 → Lv.24` 숫자 롤 ⑥ 새 칭호/해금 요소 표시 ⑦ [계속] 버튼 | 축제, 이정표 |
| **Achievement** | 토스트 3.5s | 상단(모바일)/우하단(데스크톱)에서 배지 프레임이 2유닛 스텝으로 슬라이드 인 → 배지 32×32 2× + 희귀도 프레임 → legendary는 반짝임 4f 루프 2회 → 슬라이드 아웃 | 발견의 기쁨 |

**연출 큐 규칙**
- 한 번의 완료로 여러 이벤트가 발생하면 순서: Quest Complete → Boss Clear → Level Up → Achievement(들) → Questline Clear.
- 연출 중에도 다음 퀘스트 완료 입력은 받는다 (연출이 사용성을 막지 않음). Level Up 모달만 확인 버튼 필요.
- `prefers-reduced-motion`: 파티클·흔들림·플래시 제거, 스프라이트 첫 프레임 정지, 수치는 즉시 반영 + `aria-live`로 "70 XP 획득, 레벨 24 달성" 안내.

상세 프레임 사양: [CHARACTER_GUIDE §5](./CHARACTER_GUIDE.md#5-animation-states), 기술 규칙: [PIXEL_RULES §7](./PIXEL_RULES.md#7-animation-기술-규칙)

## 7. UI Pixel Rules 요약

- 픽셀 프레임: 2px outline + 2px 내부 하이라이트/그림자 + 4px 하드 드롭 섀도(블러 0), **notched corner**, radius 금지.
- 픽셀 버튼: 눌림 시 섀도 위치로 4px 이동 + 섀도 제거 (물리적 클릭감). 최소 높이 44px.
- XP/진행 바: 3단 플랫 밴드(하이라이트/본체/그림자), 유닛 단위 스냅, 텍스트는 바 바깥.
- 난이도 별, 퀘스트 타입, 스탯은 이모지 대신 **픽셀 글리프/아이콘**.
- 카드 다양성: 모든 정보를 같은 카드로 감싸지 않는다 — Today's Adventure는 양피지 두루마리, Boss는 현상수배서, Main은 진행 지도 스트립, Daily는 컴팩트 체크 행 (UI_GUIDE §5).

상세: [PIXEL_RULES §6](./PIXEL_RULES.md#6-ui-pixel-rules), [UI_GUIDE](./UI_GUIDE.md)

## 8. AI 생성 이미지 정책

AI 이미지 생성은 브랜드 일관성의 가장 큰 위협이다.

| 허용 | 금지 |
|------|------|
| 무드보드, 구도 탐색, 색 조합 아이디어 | AI 생성 픽셀 아트를 그대로 에셋으로 사용 |
| 레퍼런스 포즈 탐색 | 팔레트 밖 색, 불규칙한 픽셀 크기가 남아 있는 이미지 |
| — | 리샘플링된(가짜) 픽셀 아트 (픽셀 크기가 균일하지 않음) |

AI 결과물을 기반으로 할 경우에도 **32×32 그리드에서 손으로 다시 찍고**(re-pixel), LIFE-32 팔레트로 재매핑하며, PIXEL_RULES §5 QA 체크리스트를 통과해야 한다.

## 9. 거버넌스

- **아트 오너 1인**이 모든 픽셀 에셋을 최종 승인한다 (현재: 프로젝트 오너).
- 에셋 PR에는 2×·3×·4× 스크린샷 + QA 체크리스트 첨부.
- `/styleguide`(dev 전용 라우트)가 시각 시스템의 살아 있는 레퍼런스다. 새 컴포넌트/에셋은 반드시 여기 먼저 추가된다.
- 이 문서와 하위 문서의 규칙을 바꾸려면, 영향받는 기존 에셋 목록을 함께 PR에 적는다.

## 10. 안티패턴 (하지 말 것)

- 흐릿한 픽셀 아트 / 비정수 배율 / 서로 다른 픽셀 크기 혼용
- 일관되지 않은 외곽선 (어떤 아이콘은 검정, 어떤 아이콘은 외곽선 없음)
- 과도한 그라디언트, 글래스모피즘, 네온 글로우
- Generic SaaS 일러스트(납작한 사람 캐릭터), 이모지만으로 된 인터페이스
- 무작위 색상, 화면마다 다른 스타일
- 모든 UI를 8bit로 만들어 본문까지 픽셀 폰트로 쓰는 것 (가독성 붕괴)
- 상시 반복되는 화려한 애니메이션 (연출의 가치 하락, 성능 저하)
