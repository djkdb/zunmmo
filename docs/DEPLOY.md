# LIFE RPG — 배포 & 런치 가이드

> Phase 9–10 운영 문서. 코드가 아니라 **계정·설정·확인 작업**을 다룬다. 체크박스는 배포할 때마다 복사해서 쓴다.

## 1. Supabase (DB · Auth)

1. 프로젝트 생성 — 리전 `Northeast Asia (Seoul)` 권장 (주 사용자 지연 시간). 개인정보처리방침의 "저장 지역"에 같은 값을 적는다.
2. 마이그레이션 적용
   ```bash
   pnpm exec supabase link --project-ref <ref>
   pnpm exec supabase db push        # supabase/migrations/*.sql 순서대로
   ```
   스키마 변경은 항상 새 마이그레이션 파일로 (CLAUDE.md). 대시보드에서 손으로 고치지 않는다.
3. Auth 설정 (Dashboard → Authentication)
   - **Site URL**: `https://<도메인>` · **Redirect URLs**: `https://<도메인>/**` (+ 프리뷰 도메인)
   - **Email OTP 길이 6자리**, 만료 1시간 이하
   - **Email Templates → Magic Link / Confirm signup**: `supabase/templates/sign-in.html` 내용을 붙여 넣는다 (코드 `{{ .Token }}` + `/auth/confirm?token_hash={{ .TokenHash }}&type=email` 링크). 제목: `LIFE RPG 입장 코드`
   - **Custom SMTP** 설정 — 기본 메일 발송은 시간당 몇 통으로 제한되어 베타에도 부족하다.
   - Google 로그인을 쓸 때만 Google provider를 켜고 Vercel에 `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`.
4. 클로즈드 베타라면 **Allow new users to sign up**을 끄고 Dashboard에서 초대한다.

## 2. Vercel (웹 앱)

| 변수 | 값 | 비고 |
|------|----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 프로젝트 URL | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key | 공개돼도 됨 — 권한은 RLS |
| `NEXT_PUBLIC_SITE_URL` | `https://<도메인>` | 메일 링크·OG 기준 |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 운영자 메일 | `/privacy`·`/terms` 문의처. **필수** |
| `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` | `false` / `true` | |
| `ERROR_WEBHOOK_URL` | (선택) | 서버 오류 JSON 전송 (`src/instrumentation.ts`) |
| `ENABLE_STYLEGUIDE` | 프리뷰에서만 `1` | 프로덕션에서는 비워 둔다 |

- **`SUPABASE_SERVICE_ROLE_KEY`는 Vercel에 넣지 않는다.** 앱은 어떤 요청 경로에서도 쓰지 않는다 (계정 삭제도 `delete_my_account()` RPC).
- Node 22, 빌드 명령은 기본값(`pnpm build`). Cache Components라 플레이어 화면은 ◐ Partial Prerender로 나온다.

## 3. 배포 전 확인 (매 릴리스)

- [ ] CI 녹색: typecheck · lint · format · art:check · unit · build · DB 테스트 · E2E(`next start`)
- [ ] 새 마이그레이션이 있으면 프리뷰 브랜치 DB에 먼저 `db push` → 프리뷰에서 스모크
- [ ] 아트를 바꿨다면 `VISUAL=1 pnpm test:e2e visual` 스냅샷 갱신 커밋
- [ ] 프로덕션 스모크 (수동, 5분): 로그인 코드 메일 수신 → 캐릭터 생성 → 템플릿 3개 → 오늘의 모험 시작 → 완료(+XP, 첫 걸음 업적) → 되돌리기 → 캘린더 일정 추가 → 로그아웃

## 4. 런치 체크리스트 (Phase 10)

**데이터 보호**
- [ ] 백업: 일일 백업 활성 확인, Pro 이상이면 PITR. **복구 리허설** — 백업을 새 프로젝트(또는 브랜치)에 복원해 로그인·퀘스트 조회까지 확인
- [ ] 개인정보처리방침의 백업 보관 기간(현재 "최대 7일")이 실제 플랜과 같은지 확인
- [ ] 계정 삭제 동작 확인 (설정 → 계정 삭제 → 재로그인 시 새 게임)

**남용·비용**
- [ ] Auth rate limit: 이메일 발송/시간, OTP 검증 시도 (Dashboard → Auth → Rate Limits)
- [ ] Vercel Firewall/Attack Challenge 기본 활성, 비정상 트래픽 알림
- [ ] Supabase **Spend cap** 켜기, 사용량 알림 (DB 크기·egress)
- [ ] Vercel 사용량 알림 (함수 실행·대역폭)

**관측**
- [ ] 로그 드레인 또는 `ERROR_WEBHOOK_URL` 연결 — 서버 오류는 `{"level":"error",…}` 한 줄 JSON
- [ ] 주간 지표: `supabase/queries/beta-metrics.sql` (PRODUCT_SPEC §9)

**공개 면**
- [ ] 도메인 연결, `NEXT_PUBLIC_SITE_URL` 갱신, Auth Site URL/Redirect URLs 갱신
- [ ] OG 이미지(`/opengraph-image`)와 링크 미리보기 확인 (카카오톡·슬랙)
- [ ] PWA 설치 확인: Android Chrome "앱 설치", iOS Safari "홈 화면에 추가" — 아이콘·`/adventure` 시작
- [ ] 법적 고지: 문의처 설정, 저장 지역 기입, **공개 전 법률 검토** (현재 문서는 베타 초안)
- [ ] Lighthouse (모바일): Performance ≥ 90, Accessibility 100 목표 (ARCHITECTURE §9)

## 5. 베타 운영 (Phase 9)

- 10–30명 초대, 피드백 채널 하나(오픈채팅/폼)를 정해 설정 화면 문구와 릴리스 노트에 적는다.
- 매주 지표 쿼리 → 밸런스 조정 후보: 레벨 곡선(`LEVEL_CURVE`), 추천 가중치(`RECOMMEND_WEIGHTS`), GM 문장 풀(`briefing.ts`). 바꾸면 GAME_SYSTEM/GAME_MASTER 문서도 같은 PR에서.
- 롤백: Vercel "Promote previous deployment". 마이그레이션은 되돌리지 않고 **새 마이그레이션으로 정정**한다.
