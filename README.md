This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Accounts (authentication + session-management scaffolding)

The `feat/account-auth` work adds **account creation + session management ONLY**. It is
SCAFFOLDING: nothing here authorizes any privileged or value-bearing action yet. "Auth" =
authentication + session management, **not** authorization. Concretely it provides:

- `POST /api/account/register` — create an account (email + a server-generated ≥512-bit
  recovery key, shown once; the server stores only a scrypt hash).
- `POST /api/account/login` — authenticate with email + key; sets an httpOnly session cookie.
- `POST|GET /api/account/logout` — clear the session cookie.
- `GET /api/account/me` — resolve the current account from the cookie (or guest).

### Required production environment

- **`MARKER_SESSION_SECRET`** (or `BOBR_SERVER_SECRET`) — **required in production**. The
  account session cookie is HMAC-signed with this secret. If it is unset in production the
  app **fails closed** (throws) rather than signing forgeable cookies with the dev fallback.
- **`/data` volume** — the accounts DB (`better-sqlite3`) is written to `/data/accounts.db`.
  On Railway you **must mount a persistent `/data` volume**. If `/data` is absent in
  production the app **refuses to start** (it would otherwise fall back to `/tmp`, which is
  **wiped on every redeploy**, silently losing all accounts). Outside production it falls
  back to `/tmp` with a loud warning.

### Session linking is ownership-gated (anti karma-grafting)

Linking a guest karma session to an account requires a **server-verifiable ownership proof**
(the markerSession HMAC token the server issued for that session) — a client cannot bind an
arbitrary, attacker-chosen session id from the request body. A session with no proof yet
(e.g. no marker recorded) simply isn't linked; the account is still created. See
`src/lib/accountsDb.ts` (`linkSession` / `verifySessionOwnership`).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
