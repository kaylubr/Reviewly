# Reviewly

A study app where you turn your own notes into modules of questions and review them to build recall.

## Stack

- `apps/web` — React 19, Vite 8, React Router 8, TanStack Query for server state, and a hand-written stylesheet.
- `apps/api` — Fastify 5 on Node 20+, Drizzle ORM, PostgreSQL 18.
- `packages/shared` — the API contract types used by both, imported as types only.

Auth is ours: argon2id password hashes and an opaque session token in an httpOnly cookie, backed by an `auth_sessions` table that stores only a hash of that token.

Question generation makes one call to `gemini-3.1-flash-lite` with a structured output schema, which returns the summary, flashcards and multiple choice questions together — so the response shape is a contract rather than something to parse out of prose.

Uploading a PDF or TXT extracts its text and sets it as the module content. The file itself is never stored: there is no bucket, no upload directory, and no `file_url`.

## Running it

1. `docker compose up -d` — starts PostgreSQL 18 on port 5432
2. `npm install` — from the repository root, installs every workspace
3. `cp apps/api/.env.example apps/api/.env` and fill in the values
4. `npm run db:migrate` — applies the schema
5. `npm run dev:api` and, in a second terminal, `npm run dev:web`
6. Open http://localhost:5173

The web dev server proxies `/api` to the API on port 3001 so both share one origin. That means the session cookie works without CORS configuration and without a token in localStorage.

## Environment

Set in `apps/api/.env`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_COOKIE_SECRET` | Signs the session cookie |
| `GEMINI_API_KEY` | Question generation; without it generation answers 502 |
| `PORT` | API port, defaults to 3001 |
| `HOST` | API bind address, defaults to 127.0.0.1 |
| `NODE_ENV` | `production` also marks the session cookie `Secure` |

## Scripts

Run from the repository root.

| Script | Does |
| --- | --- |
| `npm test` | Runs the API test suite |
| `npm run typecheck` | Typechecks every workspace |
| `npm run build` | Builds the web app into `apps/web/dist` |
| `npm run dev:api` | API with reload on port 3001 |
| `npm run dev:web` | Web dev server on port 5173 |
| `npm run db:generate` | Generates a migration from the Drizzle schema |
| `npm run db:migrate` | Applies pending migrations |

Once `apps/web/dist` exists the API also serves it, with a fallback to `index.html` so client-side routes work on a hard refresh.

## Notes

- Modules are only ever read or written through the API, scoped to the signed-in user. There is no row level security; ownership is enforced in the queries.
- A module's mastery score is the average of its session scores, so it moves as you keep reviewing.
- Uploading a scanned PDF will fail, because there is no OCR: if a document has no text layer there is nothing to extract.

## Docs

- `docs/glossary.md` — the project's vocabulary, and which words to avoid
- `docs/adr/` — why the architecture is the way it is

## Where this came from

Reviewly was previously a Next.js app on the InsForge backend, carrying an XP, level, streak and achievement layer. It was rebuilt as a Vite SPA with a Fastify API and a self-hosted Postgres, and the gamification was removed. `docs/adr/0001` and `docs/adr/0002` record both decisions and what they cost.
