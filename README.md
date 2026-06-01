# Reviewly

Reviewly is a learning and review platform built with Next.js. It provides a study dashboard, module creation, review sessions, progress tracking, and integrations with the InsForge backend.

## What it is

Reviewly is a web app for building learning modules from notes and reviewing them through flashcards, multiple choice, and speed modes. The app includes a dashboard, analytics, user profile, module editor, and session tracking.

## Tools used

- Next.js 16
- React 19
- InsForge SDK (`@insforge/sdk`)
- Framer Motion
- Recharts
- Lucide React
- Tailwind CSS / PostCSS
- PDF parsing with `pdf-parse`

## Setup

1. Open a terminal at the project root.
2. Change to the `src` folder:

```bash
cd src
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env.local` file in `src`.
5. Add the required environment variables.
6. Start the development server:

```bash
npm run dev
```

7. Open the app at `http://localhost:3000`.

## Environment variables

Create `src/.env.local` and add the following values:

```env
INSFORGE_URL=https://your-insforge-app.insforge.app
INSFORGE_API_KEY=your-server-api-key
INSFORGE_ANON_KEY=your-server-anon-key
NEXT_PUBLIC_INSFORGE_URL=https://your-insforge-app.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-public-anon-key
AI_MODEL=anthropic/claude-sonnet-4.5
```

### Notes

- `INSFORGE_URL` and `INSFORGE_API_KEY` are used by server-side API routes and server helpers.
- `NEXT_PUBLIC_INSFORGE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY` are used in client-side code.
- `AI_MODEL` is optional and defaults to `anthropic/claude-sonnet-4.5`.

## Scripts

Run these from the `src` folder:

- `npm run dev` - start the development server
- `npm run build` - build the application for production
- `npm run start` - run the built app
- `npm run lint` - run ESLint
