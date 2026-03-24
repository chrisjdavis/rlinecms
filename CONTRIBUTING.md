# Contributing

Thank you for your interest in RLine CMS.

## Development

1. Use Node 20+ and PostgreSQL.
2. Copy `.env.example` to `.env` and set at least `DATABASE_URL` and `NEXTAUTH_SECRET`.
3. Run `npx prisma migrate dev` after schema changes.
4. Run `npm run lint` and `npm run typecheck` before opening a pull request.
5. Run `npm test` when your change affects logic covered by tests.

## Pull requests

Keep changes focused on a single concern. Describe what changed and why in the PR description. Do not commit `.env` files or real credentials.

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0, the same license as the project.
