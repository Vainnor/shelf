# Shelf

Shelf is a book-tracking app MVP built with Next.js, Better Auth, Drizzle, and shadcn/ui.

## MVP scope

- Email/password authentication with Better Auth
- Social sign-in with major OAuth providers when credentials are configured
- Custom OAuth provider support for self-hosted deployments
- Three book shelves:
  - To read
  - Currently reading
  - Read
- Book metadata:
  - Title
  - Author
  - Total pages
  - Current page
  - Notes
  - Cover image URL
  - ISBN
- Per-user ownership for all books

## Database

The Drizzle schema currently includes:

- `users`
- `sessions`
- `accounts`
- `verification_tokens`
- `books`

## Environment variables

Copy `.env.example` to `.env.local` and set:

```bash
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=
```

### Optional OAuth providers

Set both `*_CLIENT_ID` and `*_CLIENT_SECRET` for each provider you want enabled.

Built-in providers wired by default:

- Google
- GitHub
- Microsoft
- Discord
- GitLab
- LinkedIn
- Apple
- Facebook
- X/Twitter
- Reddit
- Spotify
- Twitch
- Slack
- Notion
- TikTok

### Custom OAuth for self-hosted

Use `CUSTOM_OAUTH_PROVIDERS_JSON` with an array of Better Auth `GenericOAuthConfig`
objects (you can include an optional `label` field for UI display).

```bash
CUSTOM_OAUTH_PROVIDERS_JSON='[{"providerId":"my-idp","label":"My IDP","discoveryUrl":"https://id.example.com/.well-known/openid-configuration","clientId":"...","clientSecret":"...","scopes":["openid","profile","email"]}]'
```

Auth routes and pages:

- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`

### Password reset email delivery (SES)

Password reset emails are sent through AWS SES when these env vars are set:

```bash
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SES_FROM_EMAIL=
```

`SES_FROM_EMAIL` must be a verified sender identity in SES.

You can also use SMTP transport (including SES SMTP credentials) by setting:

```bash
EMAIL_TRANSPORT=smtp
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
```

If `EMAIL_TRANSPORT` is unset, the app prefers SMTP when `SMTP_HOST` is present; otherwise it uses SES API.

Admins can use `/admin/health` -> `Email diagnostics` to verify config presence and trigger a test reset email to their own account.

## Development

```bash
pnpm dev
```

## Docker Compose

### Local development

Uses the app container, Postgres, and Caddy on port `8080`.
Migrations run automatically before the app starts.

```bash
docker compose -f compose.dev.yml up --build
```

### Production-style local run

Uses the production image target with Caddy on port `80`.
Migrations run automatically before the app starts.

```bash
docker compose -f compose.prod.yml up --build
```

### Self-hosted deployment

Run only the app and database when you want to place your own proxy in front of it.

```bash
docker compose -f compose.selfhosted.yml up -d
```

If you want the bundled Caddy config for self-hosting, add the optional overlay:

```bash
docker compose -f compose.selfhosted.yml -f compose.selfhosted.caddy.override.yml up -d
```

### Image versioning

Container image tags follow this pattern:

```text
<package.json version>.<git short sha>
```

Example:

```text
0.0.1.abc123def456
```

## Migrations

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

## Reminders worker (stub)

Reading reminders are surfaced in-app and can be dispatched by a tiny worker stub.
Current dispatch is console-based (no real email provider yet).

```bash
pnpm worker:reminders:once
pnpm worker:reminders
```

Optional env vars:

```bash
REMINDER_WORKER_INTERVAL_MS=900000
REMINDER_WORKER_MAX_USERS=100
```

## Recommendations

Dashboard recommendations currently use a simple rule-based scorer combining:

- author overlap with your finished books
- keyword overlap from finished title/notes/review text
- community rating boost

## Next implementation steps

1. Add a Better Auth client for sign-in and sign-up UI.
2. Build protected pages for the three reading lists.
3. Add create/edit book dialogs and status updates.
4. Add ISBN lookup and richer book metadata later.
