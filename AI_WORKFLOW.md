# AI workflow

This note describes how AI was used to produce this MVP. The parent reviewer may refine it against the actual session transcript.

## Tools

- **Cursor Grok 4.6** (cloud agent) for scaffolding, implementation, tests, and the four markdown deliverables
- **create-next-app** for the Next.js 16 + Tailwind baseline
- No Copilot / ChatGPT / Claude web chat outside this agent session
- No generated video (parent agent records the walkthrough separately)

## Where AI sped the work up

- Bootstrapping Next.js App Router files, Prisma schema, and cookie-session helpers
- TipTap toolbar + JSON document shape
- Seed data that already demonstrates owned vs shared
- First-pass README / ARCHITECTURE / SUBMISSION drafts

## Where AI output was changed or rejected

- **create-next-app in-repo** failed on a non-empty directory and a false “not writable” check; the app was generated in `/tmp` and copied, then the original git remote was restored after an accidental `.git` overwrite. That recovery was judgment, not a generated happy path.
- **Vitest 5** was rejected because of an `@types/node` peer conflict; Vitest 3 is pinned instead.
- **Prisma 7** was avoided (adapter-only SQLite). Prisma 6 keeps `provider = "sqlite"` simple for reviewers.
- Default create-next-app **dark-mode CSS** was removed so the paper-like editor stays consistent.
- Share permissions were **not** left as “anyone with the link.” Sharing is always to an existing user, with owner-only manage rights.
- Upload is **not** a generic attachment. The assignment’s strongest demo is “file becomes an editable document,” so `.docx`/PDF were explicitly refused in validation rather than stubbed.

## What was verified without relying on the model

- `npm test` (import, validation, access)
- `npm run setup` against a real SQLite file
- `npm run build`
- Manual HTTP checks: login, list owned vs shared, patch content, share, upload `.md`

Correctness of rich text after refresh depends on storing TipTap JSON and loading it with `setContent` — that path was implemented and exercised rather than trusted from a generated snippet.
