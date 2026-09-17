# Ajaia Docs

Collaborative document editor MVP for the Ajaia AI-native full-stack assessment. Create, edit, persist, share, and import `.txt` / `.md` files. Depth over a Google Docs clone.

## What works

- Lightweight cookie login with three seeded users
- Document list with a clear **Owned** vs **Shared with me** split
- Create, rename (owner), open, rich-text edit, save, reopen after refresh
- Bold, italic, underline, H1–H3, bulleted lists, numbered lists
- Upload `.txt` or `.md` (max **256 KB**) → new editable document from file contents
- Owner shares with another existing user; that user can open and edit
- SQLite persistence via Prisma
- Validation and error messages on login, save, share, and upload
- Automated tests for import, validation, and access control

## Seeded accounts

Password for all accounts: **`docs1234`**

| Email | Name | Seeded data |
| --- | --- | --- |
| `ada@ajaia.dev` | Ada Lovelace | Owns **Product brief** (shared with Alan) and **Untitled draft** |
| `alan@ajaia.dev` | Alan Turing | Owns **Engineering notes**; sees Ada's Product brief under Shared with me |
| `grace@ajaia.dev` | Grace Hopper | No documents until you create or share one |

## Limits (also shown in the UI)

- Upload types: **`.txt` and `.md` only** (not `.docx`, PDF, or images)
- Upload size: **256 KB**
- Titles: 1–120 characters
- Sharing: only to users that already exist in the database (no email invites)

## Local setup

Requires Node.js 20+.

```bash
cp .env.example .env
npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run setup` runs Prisma migrations and re-seeds the three users plus sample documents. Re-run it to reset demo data.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run setup` | `prisma migrate deploy` + seed |
| `npm run dev` | Next.js dev server |
| `npm test` | Vitest (import, validation, access) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

## Suggested review path

1. Sign in as `ada@ajaia.dev` / `docs1234`
2. Open **Product brief**, change formatting, click **Save**, refresh
3. Share it with `grace@ajaia.dev` if you want a fresh share (Alan already has access)
4. Sign out, sign in as `alan@ajaia.dev`
5. Confirm **Engineering notes** is Owned and **Product brief** is Shared with me; open the shared doc
6. From the docs list, upload `fixtures/sample.md` or any small `.txt`

## Out of scope (deliberate cuts)

Real-time CRDT / presence, comments, suggestions, version history, PDF/DOCX export, mobile polish, email invites, Google SSO. See [ARCHITECTURE.md](ARCHITECTURE.md) for why.

## Deploy

Live app: [https://ajaia-collab-docs-production-5aff.up.railway.app](https://ajaia-collab-docs-production-5aff.up.railway.app)

Use that URL only. An older Railway hostname ending in `d57a` returns 502.

Railway hosts the service with a volume at `/data`. Env: `DATABASE_URL=file:/data/prod.db`, `SESSION_SECRET` set, `COOKIE_SECURE=true`, `NODE_ENV=production`. Seeded accounts are the same as above (`ada@ajaia.dev` / `docs1234`, etc.).

Local SQLite (`prisma/dev.db`) still works for `npm run dev`. Recreate-from-scratch steps are in [SUBMISSION.md](SUBMISSION.md). SQLite on a single VM/volume is durable; it is **not** durable on Vercel’s ephemeral filesystem unless you switch the datasource to Turso/libSQL.
