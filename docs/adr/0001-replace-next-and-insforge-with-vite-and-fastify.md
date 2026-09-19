# De-Nextify to a Vite SPA + Fastify, and drop the InsForge BaaS

The Next.js layer was doing almost nothing. Every page was a client component fetching in `useEffect`, the only server component mounted providers, and there was no SSR, no server actions, no middleware and no route-level data fetching — the app was a single-page app wearing a server framework, using Next for little beyond the API routes. InsForge separately owned auth, Postgres, file storage and the AI gateway. We replaced both: React 19 with Vite and React Router on the client, Fastify 5 for the API, PostgreSQL 18 in Docker Compose, Drizzle ORM with application-level ownership filters instead of RLS, our own auth (argon2id passwords, an opaque cookie backed by an `auth_sessions` table), and Gemini 3.1 Flash-Lite for question generation.

## Considered options

- **Next.js with `output: 'export'`** — would have kept file-based routing and the existing pages almost unchanged, but retained a build system we were only using as a static file server.
- **React Router in framework mode** — reintroduces the server layer we set out to delete.
- **Keeping InsForge purely as an identity provider** — preserves Google and GitHub OAuth, but leaves two systems coupled by a user UUID and keeps every table's foreign key pointing at `auth.users(id)`.

## Consequences

Google and GitHub OAuth are dropped, along with email verification. The browser can no longer query the database directly, so the dashboard, analytics and profile screens need endpoints that did not previously exist — the API surface grows from 10 routes to roughly 14. Deployment becomes ours to run.
