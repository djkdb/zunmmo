# LIFE RPG

> 현실의 일정·목표·습관·취미를 MMORPG 퀘스트로 바꾸고, 실제 행동에 따라 나의 캐릭터가 성장하는 Life RPG Web App.

**현재 상태: v0.1.0-beta — Phase 0–10 구현 완료** (런치 운영 작업은 [DEPLOY](docs/DEPLOY.md) 체크리스트)

```bash
pnpm install
cp .env.example .env.local
pnpm db:start       # 로컬 Supabase (Docker) — Postgres, Auth, Mailpit(:54324)
pnpm dev            # http://localhost:3000  (/styleguide = 디자인 시스템)
pnpm test           # 단위 + DB 테스트
pnpm test:e2e       # Playwright (모바일·데스크톱, axe)
```

로컬 로그인 코드는 Mailpit(http://127.0.0.1:54324)에서 확인해요.

## 문서

- 제품: [PRODUCT_SPEC](docs/PRODUCT_SPEC.md) · [GAME_SYSTEM](docs/GAME_SYSTEM.md) · [GAME_MASTER](docs/GAME_MASTER.md) · [ARCHITECTURE](docs/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md)
- 디자인: [ART_DIRECTION](design/ART_DIRECTION.md) · [PIXEL_RULES](design/PIXEL_RULES.md) · [COLOR_PALETTE](design/COLOR_PALETTE.md) · [CHARACTER_GUIDE](design/CHARACTER_GUIDE.md) · [UI_GUIDE](design/UI_GUIDE.md)
- 운영: [DEPLOY](docs/DEPLOY.md) · [RELEASE_NOTES](docs/RELEASE_NOTES.md) · 지표 `supabase/queries/beta-metrics.sql`
- 개발 규칙: [CLAUDE.md](CLAUDE.md)

## Stack

Next.js · TypeScript · Tailwind CSS v4 · Supabase (Postgres/Auth) · Vercel
