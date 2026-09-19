# AGENTS.md

## Project layout

- `apps/web` — the React 19 + Vite SPA.
- `apps/api` — the Fastify 5 API, and the only thing that talks to PostgreSQL.
- `packages/shared` — the API contract types shared by the two.

Read `docs/glossary.md` before naming anything. Read `docs/adr/` before proposing an architectural change — those decisions were deliberate and are not up for silent revision.

`packages/shared` is type-only on purpose: both apps import from it with `import type`, so nothing resolves the package at runtime and the api keeps working under tsx. Do not add runtime values to it.

## Running it

`docker compose up -d` starts PostgreSQL 18. `npm install` from the root installs every workspace. The API reads `apps/api/.env`, and `apps/api/.env.example` lists every variable it needs, including `GEMINI_API_KEY` — without that key question generation answers 502 rather than failing at boot.

## Commits

Write plain commit messages. Never add trailers, including `Co-Authored-By`.
