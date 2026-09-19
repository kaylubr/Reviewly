# AGENTS.md

## Project layout

Reviewly is mid-migration, so two apps coexist:

- `legacy/` — the old Next.js 16 app. Still runs (`cd legacy && npm run dev`, port 3000) and still uses InsForge. Deleted at the end of the migration.
- `apps/web` — the new React 19 + Vite SPA.
- `apps/api` — the new Fastify 5 API.
- `packages/shared` — types shared between the two.

Read `docs/glossary.md` before naming anything. Read `docs/adr/` before proposing an architectural change — those decisions were deliberate and are not up for silent revision.

All new code goes in `apps/` or `packages/` and must not use InsForge. The InsForge guidance below applies only to `legacy/`.

## Commits

Write plain commit messages. Never add trailers, including `Co-Authored-By`.

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **reviewly** (API base `https://sts94a7a.ap-southeast.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->
