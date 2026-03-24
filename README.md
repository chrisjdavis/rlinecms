# This probably doesn't work. Unless you like to tinker, I would wait for a few weeks.

# RLine CMS

A Next.js content management system with an admin UI, block-based content, authentication, and optional integrations (email, object storage, GitHub, weather, Last.fm, and more).

Licensed under the [Apache License 2.0](LICENSE).

## Requirements

- Node.js 20+
- PostgreSQL

## Quick start

1. Clone the repository and install dependencies:

   ```bash
   npm ci
   ```

2. Copy the environment template and configure it:

   ```bash
   cp .env.example .env
   ```

   At minimum set `DATABASE_URL` and `NEXTAUTH_SECRET`. For public URLs and metadata, set `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_APP_URL`, and optionally `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_AUTHOR`, and `NEXT_PUBLIC_APP_NAME`.

3. Apply database migrations and generate the Prisma client:

   ```bash
   npx prisma migrate dev
   ```

4. Create an administrator (recommended for first login):

   ```bash
   npm run create-admin -- you@example.com your-secure-password
   ```

   Alternatively, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` and run `npx prisma db seed` (see [prisma/seed.js](prisma/seed.js)).

5. Start the dev server (you run this locally; the app does not auto-start in this repo):

   ```bash
   npm run dev
   ```

## Production build

`npm run build` runs Prisma generate, module route generation, and `next build`. It does **not** run migrations (so CI and fresh clones do not need a database during the compile step).

Before starting the app in production, run migrations against the target database:

```bash
npm run db:deploy
```

(`npm run migrate` is an alias for the same command.)

## Object storage (S3-compatible)

Production file uploads use S3-compatible storage (for example DigitalOcean Spaces). Configure **server-only** variables (do not use `NEXT_PUBLIC_` for secrets):

- `DO_SPACES_ENDPOINT`
- `DO_SPACES_REGION`
- `DO_SPACES_KEY`
- `DO_SPACES_SECRET`
- `DO_SPACES_BUCKET`

If you previously used `NEXT_PUBLIC_DO_SPACES_*`, rename those keys to the `DO_SPACES_*` names above.

`next/image` remote patterns may use `AWS_BUCKET_NAME` and `AWS_REGION` for your Spaces host (see [next.config.ts](next.config.ts)).

## Production deployment

Run `npm run build`, then `npm run db:deploy` against the production database, then `npm run start` (or use your host’s process manager). Set the same environment variables as in production `.env` on the server.

## Optional utility scripts

- **`npx tsx src/scripts/reset-admin-password.ts`**: reset a user password (arguments or `RESET_ADMIN_EMAIL` / `RESET_ADMIN_PASSWORD`). Use with care.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build (no migrate) |
| `npm run start` | Start production server (after build) |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run create-admin` | Create or promote an admin user |
| `npm test` | Vitest |

## Documentation

- Environment variables: [.env.example](.env.example)
- Optional extensions: [src/modules/README.md](src/modules/README.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- Security reports: [SECURITY.md](SECURITY.md)
