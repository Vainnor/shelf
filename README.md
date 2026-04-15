# Shelf

Shelf is a book-tracking app MVP built with Next.js, Better Auth, Drizzle, and shadcn/ui.

## MVP scope

- Email/password authentication with Better Auth
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
DATABASE_URL=
```

## Development

```bash
pnpm dev
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
