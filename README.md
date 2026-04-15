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

## Next implementation steps

1. Add a Better Auth client for sign-in and sign-up UI.
2. Build protected pages for the three reading lists.
3. Add create/edit book dialogs and status updates.
4. Add ISBN lookup and richer book metadata later.
