# Shelf

Shelf is a self-hosted reading tracker built with Next.js, Better Auth, Drizzle ORM, PostgreSQL, and shadcn/ui.

It supports personal reading workflows and admin operations for managing a hosted instance.

## Features

### Reading and library

- Three reading states: `to_read`, `reading`, `read`
- Rich book metadata: title, author, pages, ISBN, cover URL, notes, rating, review, favorites
- ISBN lookup via OpenLibrary
- Reading sessions with timeline/progress events
- Dedicated timer workspace with stopwatch/countdown and quick session logging
- Book highlights/quotes with optional page/date
- Weekly insights and best-books-this-year summaries
- Rule-based recommendations from completed books and community ratings

### Account and admin

- Email/password auth via Better Auth
- Optional OAuth providers (when env vars are configured)
- Optional custom OAuth providers for self-hosted identity systems
- Reading reminder preferences (channel + inactivity threshold)
- User settings: profile, reminders, password reset, account export/delete
- Admin dashboard: users, signup policy, audit logs, health checks, backup tools
- Full-database JSON export/import in admin backup tools

## Tech stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth
- **UI:** React 19, Tailwind CSS 4, shadcn/ui, lucide-react
- **Package manager:** pnpm 10

## Project structure

```text
src/
  app/                 # Routes/pages (dashboard, library, admin, auth)
  actions/             # Server actions
  components/          # UI and feature components
  db/                  # Drizzle db setup + schema
  lib/                 # Domain logic (auth, books, reminders, admin, backup)
scripts/
  reminder-worker.ts   # Reminder worker loop/once runner
  run-migrations.mjs   # Migration/push orchestration script
drizzle/               # SQL migrations + metadata
```

## Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL 17+ (or Docker)

## Local development (without Docker)

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy env template:

   ```bash
   cp .env.example .env.local
   ```

3. Configure at minimum:

   ```bash
   BETTER_AUTH_SECRET=replace-with-a-long-random-secret
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
   DATABASE_URL=postgres://user:password@localhost:5432/shelf
   ```

4. Run migrations:

   ```bash
   node scripts/run-migrations.mjs
   ```

5. Start dev server:

   ```bash
   pnpm dev
   ```

6. Open `http://localhost:3000`.
   - First-time setup redirects to `/setup/admin` to bootstrap the initial admin user.

## Docker

### Development stack

Includes app + postgres + migration job + caddy, exposed on `http://localhost:8080`.

```bash
docker compose -f compose.dev.yml up --build
```

### Production-style stack

Uses `ghcr.io/vainnor/shelf:latest` for app and migrate services, app exposed on port `8888`.

```bash
docker compose -f compose.prod.yml up --build
```

## Environment variables

Use `.env.example` as the source of truth.

### Required

```bash
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=
```

### Optional OAuth providers

Enable by setting both `*_CLIENT_ID` and `*_CLIENT_SECRET` for each provider:

- Google
- GitHub
- Microsoft
- Discord
- GitLab
- LinkedIn
- Apple
- Facebook
- X / Twitter
- Reddit
- Spotify
- Twitch
- Slack
- Notion

### Optional custom OAuth providers

`CUSTOM_OAUTH_PROVIDERS_JSON` accepts an array of Better Auth generic OAuth configs:

```bash
CUSTOM_OAUTH_PROVIDERS_JSON='[
  {
    "providerId": "my-idp",
    "label": "My IDP",
    "discoveryUrl": "https://id.example.com/.well-known/openid-configuration",
    "clientId": "...",
    "clientSecret": "...",
    "scopes": ["openid", "profile", "email"]
  }
]'
```

### Email/password reset delivery

AWS SES mode:

```bash
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SES_FROM_EMAIL=
```

SMTP mode:

```bash
EMAIL_TRANSPORT=smtp
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
```

If `EMAIL_TRANSPORT` is unset, Shelf prefers SMTP when `SMTP_HOST` is present; otherwise it uses SES.

### Reminder worker controls

```bash
REMINDER_WORKER_INTERVAL_MS=900000
REMINDER_WORKER_MAX_USERS=100
```

## Scripts

```bash
pnpm dev                    # Start dev server (Turbopack)
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # ESLint
pnpm typecheck              # TypeScript check
pnpm worker:reminders       # Run reminder worker loop
pnpm worker:reminders:once  # Run one reminder cycle
```

## Database and migrations

- Drizzle config: `drizzle.config.ts`
- Migration SQL files: `drizzle/*.sql`
- Migration runner: `scripts/run-migrations.mjs`

`run-migrations.mjs` automatically chooses `drizzle-kit migrate` or `drizzle-kit push` based on DB state and performs schema readiness checks.

Manual commands:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
pnpm drizzle-kit push
```

## Operations

- **Admin health:** `/admin/health` (DB connectivity, migration alignment, email diagnostics)
- **Admin backup:** `/admin/backup` (backup guidance + full JSON export/import)
- **Admin users:** `/admin` and `/admin/users/[id]`
- **Docs page:** `/docs`

## CI/CD workflows

- `.github/workflows/pr-validation.yml`
  - install, lint, typecheck, build
- `.github/workflows/docker-build-test.yml`
  - docker image build test on PR/non-main pushes
- `.github/workflows/docker-build-prod.yml`
  - build + push GHCR image on `main`

Image tags follow:

```text
<package.json version>.<git short sha>
```

## License

This project is licensed under the terms in [`LICENSE`](./LICENSE).
