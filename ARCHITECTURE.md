# Architecture

## Product cut

The assignment is a timeboxed productivity editor, not a Docs clone. The vertical slice is: **identity → owned/shared list → rich edit with durable save → share with an existing user → import a text file**. Everything else was treated as stretch and dropped so the core path stays coherent.

## Stack

| Layer | Choice | Rationale |
| --- | --- | --- |
| App | Next.js App Router + TypeScript | One process for UI and API, simple `npm run dev` |
| UI | Tailwind v4 | Fast, readable layout without a component kit |
| Editor | TipTap (ProseMirror) | Real rich text (marks + lists + headings) rather than a `<textarea>` |
| DB | SQLite via Prisma | Zero-cost, works offline, migrations are checked in |
| Auth | HMAC-signed httpOnly cookie + bcrypt password hashes | No paid IdP; enough to demonstrate sharing |

## Data model

- `User` — seeded accounts only (no self-serve signup)
- `Document` — `title` + TipTap JSON `content` + `ownerId`
- `Share` — unique `(documentId, userId)`

Access is derived, not stored as a role enum:

- **Owner**: rename, delete, share/unshare, edit body
- **Shared collaborator**: open and edit body
- Anyone else: 404/403

Shared users are editors on purpose. “View only” would be extra RBAC without helping the required demo.

## Persistence and formatting

The editor stores TipTap JSON, not HTML strings. That preserves marks and list structure across refresh. Saves are debounced (~900ms) and there is an explicit **Save** button so reviewers do not have to guess whether autosave ran.

Uploads are converted server-side (`.txt` → paragraphs, `.md` → headings / lists / bold / italic / underline) into the same JSON shape, so imported docs use the same editor path as created docs.

## Auth

`POST /api/auth/login` verifies bcrypt and sets `ajaia_session`. Middleware only checks that the cookie exists before `/docs`; API routes verify the HMAC. This keeps Edge middleware free of Node `crypto` while still rejecting forged payloads on data mutations.

## What was not built

| Cut | Why |
| --- | --- |
| Real-time CRDT / WebSockets | Needs Yjs/Redis (or similar) and a hosting story that fights SQLite; easy to fake poorly |
| Comments / suggestions / history | Separate models and UI; would dilute the edit/share path |
| PDF / DOCX | Upload requirement is satisfied by `.txt`/`.md`; Office/PDF parsing is a library rabbit hole |
| Email invites / Google SSO | Violates “no paid auth” and the seeded-user constraint |
| Mobile polish | Desktop review is the target |

## Deploy shape

SQLite on one machine (or a mounted volume) matches this schema. Serverless-with-ephemeral-disk (plain Vercel) does not. Switching later is a datasource URL change (Postgres or Turso) plus replacing `file:` — the Prisma models stay.

## Test strategy

Meaningful tests sit on the parts that are easy to get wrong without clicking:

1. Markdown/text → TipTap JSON
2. Title and upload validation messages
3. Owner vs shared vs stranger permissions
