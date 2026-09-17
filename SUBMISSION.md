# Submission

Candidate assignment: Ajaia AI-native full-stack developer take-home. Product: **Ajaia Docs**.

## Included

- Next.js App Router app (`src/`), Prisma schema + migration, SQLite
- Cookie login, document CRUD, sharing, `.txt`/`.md` import
- Vitest coverage for import, validation, and access control
- `README.md`, `ARCHITECTURE.md`, `AI_WORKFLOW.md`, `SUBMISSION.md`
- Seeded users documented in the README and on the login screen
- Sample import file: `fixtures/sample.md`

## What works

End-to-end local flow: sign in → create/open → format → save → refresh → share with another seeded user → that user sees it under **Shared with me** and can edit → upload `.txt`/`.md` creates a new owned document.

## Incomplete / not in this slice

- No public live URL (see deploy below)
- No realtime collaboration, comments, history, PDF export, SSO, or mobile layout pass
- Sharing cannot invite unknown emails (by design)

## If I had 2–4 more hours

1. Turso/libSQL (or Postgres) so a Vercel deploy keeps data
2. Presence without CRDT: “last saved at” + optional poll
3. Playwright login → share → second user smoke test
4. Conflict warning if two users save over each other

## Live URL

**None.** Review locally with `npm install && npm run setup && npm run dev`.

A production build is expected to succeed: `npm run build && npm start`.

## Exact free-tier deploy (Railway)

SQLite needs a persistent disk. Railway’s free/hobby volume is the least surprising option.

1. Push this repo to GitHub (already the source of truth).
2. Create a project at [railway.app](https://railway.app) → **Deploy from GitHub** → this repository.
3. Add a **volume** mounted at `/data`.
4. Set environment variables:
   - `DATABASE_URL=file:/data/prod.db`
   - `SESSION_SECRET=` a long random string
   - `COOKIE_SECURE=true` (HTTPS only; omit for local `npm start` on http://localhost)
   - `NODE_ENV=production`
5. Set the start command to:
   ```bash
   npx prisma migrate deploy && npx prisma db seed && npm start
   ```
   Or use the `start` script after a release build. Railway’s Nixpacks will run `npm install` (which `prisma generate`s via `postinstall`) and `npm run build` if `build` is detected.
6. Open the public Railway URL, sign in with `ada@ajaia.dev` / `docs1234`.

Re-seeding on every start resets demo data. For a sticky demo, run seed **once** (Railway one-off command) and use `npx prisma migrate deploy && npm start` as the start command.

### Vercel (not recommended without Turso)

`npm run build` works on Vercel, but `file:./dev.db` is wiped on each instance. To use Vercel anyway:

1. Create a free [Turso](https://turso.tech) database.
2. Change Prisma `provider` to `sqlite` still works with `@libsql/client` + Prisma driver adapter, **or** switch to Postgres on Neon’s free tier and update `schema.prisma` `provider = "postgresql"`.
3. Set `DATABASE_URL`, `SESSION_SECRET`, then `npx prisma migrate deploy` against the remote database.
4. `vercel` deploy the repo.

Until that datasource change lands, treat Vercel as “frontend + API compile check,” not as durable storage.

## Automated tests

```bash
npm test
```

These tests fail if markdown import drops lists/headings, if upload validation accepts the wrong types, or if shared users are treated as owners.
