# Security

## Reporting a vulnerability

Please report security issues privately rather than using the public issue tracker. Contact the maintainers with a description of the issue, affected versions if known, and steps to reproduce.

We will work with you to understand and address the report before any public disclosure.

## General practices

- Never commit `.env` files or production secrets.
- Rotate `NEXTAUTH_SECRET` and database credentials if they may have been exposed.
- Run `npm run db:deploy` (or your host’s equivalent) so production databases stay on current migrations.
