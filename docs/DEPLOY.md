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
- [ ] OG 이미지(`/opengraph-image.png`, `pnpm art:build`가 만든 정적 파일)와 링크 미리보기 확인 (카카오톡·슬랙)
- [ ] PWA 설치 확인: Android Chrome "앱 설치", iOS Safari "홈 화면에 추가" — 아이콘·`/adventure` 시작
- [ ] 법적 고지: 문의처 설정, 저장 지역 기입, **공개 전 법률 검토** (현재 문서는 베타 초안)
- [ ] Lighthouse (모바일): Performance ≥ 90, Accessibility 100 목표 (ARCHITECTURE §9)

## 5. 베타 운영 (Phase 9)

- 10–30명 초대, 피드백 채널 하나(오픈채팅/폼)를 정해 설정 화면 문구와 릴리스 노트에 적는다.
- 매주 지표 쿼리 → **7번 결과(JSON 한 줄)를 `beta.json`으로 저장해 `pnpm sim --compare beta.json`** — 각 지표가 4주 시뮬레이션 범위 안인지, 밖이면 어느 규칙부터 볼지 알려 준다 (플레이어 10명 미만이면 경고).
- 밸런스 조정 후보: 레벨 곡선(`LEVEL_CURVE`), 추천 가중치(`RECOMMEND_WEIGHTS`), GM 문장 풀(`briefing.ts`). 바꾸면 GAME_SYSTEM/GAME_MASTER 문서도 같은 PR에서.
- 롤백: Vercel "Promote previous deployment". 마이그레이션은 되돌리지 않고 **새 마이그레이션으로 정정**한다.

## 6. Cloudflare Workers (대안 호스팅)

Vercel이 기본이고, Cloudflare에서는 **OpenNext 어댑터(`@opennextjs/cloudflare`)로 Workers에** 올린다. 옛 `@cloudflare/next-on-pages`(Pages)는 지원이 끝났다. 설정은 저장소에 들어 있다: `wrangler.jsonc`, `open-next.config.ts`, `patches/`, `pnpm cf:*` 스크립트.
검증(2026-10-08, Next 16.4.0 · @opennextjs/cloudflare 1.20.9 · wrangler 4.148): 로컬 Workers 런타임에서 E2E 23개(데스크톱 전체와 모바일 페르소나) 통과, CI에 Workers 빌드 잡이 있다.

### 6.1 처음 한 번

1. Cloudflare 계정. **플랜**: 워커 크기가 gzip 약 3.0MiB라 Free 한도(3MiB)에 겨우 들어간다. 운영은 **Workers Paid(월 $5, 10MiB)**를 권장한다. CI의 "Worker size" 단계가 매번 크기를 출력하고, 3MiB를 넘으면 경고, 10MiB를 넘으면 실패한다.
2. Supabase는 그대로 쓴다 (§1). 워커 이름은 `wrangler.jsonc`의 `"name": "life-rpg"`. 바꾸면 `services[].service`도 같이 바꾼다.

### 6.2 방법 A — Git 연결 (Workers Builds, 권장)

Dashboard → **Workers & Pages → Create → Import a repository** → 이 저장소.

| 항목 | 값 |
|------|----|
| Build command | `pnpm exec opennextjs-cloudflare build` |
| Deploy command | `pnpm exec opennextjs-cloudflare deploy` |
| Production branch | `main` (그 외 브랜치는 미리보기 URL — Builds 설정에서 켠다) |

- **빌드 변수** (Settings → Build → *Variables and secrets*): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED`. `NEXT_PUBLIC_*`는 **빌드할 때 코드에 박히므로** 런타임 변수로 넣으면 소용없다. 바꾸면 다시 빌드한다. `NODE_VERSION=22`도 넣는다.
- **런타임 변수** (Settings → *Variables and Secrets*): `ERROR_WEBHOOK_URL`(Secret, 선택), 프리뷰에서만 `ENABLE_STYLEGUIDE=1`.
- **`SUPABASE_SERVICE_ROLE_KEY`는 넣지 않는다** — Vercel과 같은 원칙이다.

### 6.3 방법 B — 내 컴퓨터나 CI에서 직접

```bash
# 프로덕션 공개 값(NEXT_PUBLIC_*)을 .env.production.local에 — 빌드에 들어간다 (커밋 금지)
pnpm exec wrangler login               # CI에서는 CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
pnpm cf:deploy                         # = opennextjs-cloudflare build && deploy
pnpm exec wrangler secret put ERROR_WEBHOOK_URL   # 선택
```

### 6.4 도메인 · Auth

1. Worker → Settings → **Domains & Routes → Add → Custom domain** (도메인 DNS가 Cloudflare에 있어야 한다). 임시로는 `life-rpg.<계정>.workers.dev`를 쓴다.
2. `NEXT_PUBLIC_SITE_URL`을 그 주소로 바꾸고 **다시 빌드·배포**한다.
3. Supabase Auth의 **Site URL / Redirect URLs**에 그 주소(`https://<도메인>/**`)를 추가한다 (§1.3). 빠뜨리면 로그인 메일 링크가 엉뚱한 곳으로 간다.

### 6.5 배포 전에 로컬에서 확인

```bash
pnpm cf:preview                              # 실제 Workers 런타임(workerd)으로 http://localhost:8787
pnpm cf:build && E2E_CF=1 pnpm test:e2e      # E2E 전체를 Workers 런타임에서 (로컬 DB 필요)
```
어댑터나 Next를 올릴 때는 반드시 이 두 가지를 돌린다.

### 6.6 알아 둘 점

- **proxy.ts(Node 미들웨어)**: OpenNext에서는 아직 "experimental"이다 (빌드 경고). 지금은 로그인 리다이렉트와 세션 갱신이 E2E로 확인됐다.
- **`patches/@opennextjs__cloudflare@1.20.9.patch`**: 어댑터가 Next 16.4의 `preview-props.json`을 아직 번들에 넣지 않아 모든 페이지가 500이 나던 문제를 고치는 한 줄 패치다. 어댑터가 고치면 `pnpm patch-remove @opennextjs/cloudflare@1.20.9`로 지운다.
- **캐시**: `open-next.config.ts`는 static assets 캐시를 쓴다. 빌드 결과만 내보내므로 R2 버킷이 필요 없다. 시간 기반 재검증(`revalidate`, `cacheLife`)을 쓰기 시작하면 R2 캐시로 바꿔야 한다 (https://opennext.js.org/cloudflare/caching).
- **런타임 파일 읽기 불가**: Workers에는 프로젝트 파일이 없다. 그래서 OG 이미지를 `pnpm art:build`에서 미리 렌더한다. 서버 코드에서 `fs`로 저장소 파일을 읽지 않는다.
- **관측**: `wrangler.jsonc`에서 Workers Logs를 켜 두었다 (`observability`). 실시간으로 보려면 `pnpm exec wrangler tail`. 서버 오류 JSON과 `ERROR_WEBHOOK_URL`은 Vercel과 같다.
- **남용 방지**: Vercel Firewall 대신 Cloudflare **WAF → Rate limiting rules**를 쓴다. 예: `/login`, `/auth/*`에 IP당 분당 제한.
- **롤백**: Dashboard → Deployments → 이전 버전 *Rollback*, 또는 `pnpm exec wrangler rollback`. 마이그레이션은 Vercel 때처럼 되돌리지 않고 새 마이그레이션으로 정정한다.
