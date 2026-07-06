# LegalFlow Project

## Overview

This project is a SaaS application that helps users generate legal documents from predefined templates.
The long-term goal is for users to interact with an AI assistant to determine which document they need and
automatically populate the required fields.
The supported document types are listed in the `catalog.json` file located in the project root.

The current version supports all 11 catalog document types (see KAN-6 below): a manual, editable form, a live
read-only document preview, and a freeform AI chat (backed by OpenRouter), generated from the same generic
template engine for every type. The Mutual NDA keeps its original hand-built components (`NdaForm`/`NdaPreview`/
`/chat/nda`) as the reference implementation; the other 10 types run through the generic `/create/:type` flow.
A router chat (`/chat/route`) helps a user figure out which catalog type they need, always suggesting the
closest available match rather than refusing outright. Users can sign up / sign in for real (hashed passwords,
JWT sessions) and save/reload their own documents of any type — see KAN-5 below.

## Development Workflow

When implementing a new feature:

1. Retrieve the feature requirements from Jira using the available Atlassian tools.
2. Follow the complete feature development workflow without skipping any steps.
3. Validate the implementation with unit and integration tests, fixing any issues before completion.
4. Create a Pull Request using the available GitHub tools.

## LLM Integration

When implementing features that require LLM integration:

- Always use LiteLLM via OpenRouter (or a Node.js compatible wrapper / native fetch).
- Use the `openai/gpt-oss-20b:free` model (via `OPENROUTER_MODEL`) unless explicitly instructed otherwise. Switched from `openai/gpt-oss-120b:free` because that model's free-tier provider was persistently 429-rate-limited; `gpt-oss-20b:free` routes to a different, less congested provider (`Darkbloom`, as of this writing).
- Prefer Structured Outputs whenever possible so responses can be reliably parsed and mapped to the corresponding fields in legal documents.
- Read the `OPENROUTER_API_KEY` from the `.env` file in the project root.
- Do not hardcode API keys or model names in the source code.
- **Known constraint:** `openai/gpt-oss-120b:free` does not support `response_format`/Structured Outputs on any OpenRouter provider (confirmed via `/api/v1/models`'s `supported_parameters` and via `provider.require_parameters: true`, which returns "No endpoints found that can handle the requested parameters" for both `json_schema` and `json_object` modes). The paid `openai/gpt-oss-120b` variant does support it, and `openai/gpt-oss-20b:free` (the current default) does too via its `Darkbloom` provider — but since `OPENROUTER_MODEL` is meant to stay swappable across free models without re-verifying each one, JSON shape is still enforced via prompt instructions and parsed leniently (see `backend/src/chat/chat.service.ts`) rather than relying on `response_format`.

## Technical Architecture

The application should run entirely inside Docker.

- **Backend:** Located in `backend/` using **Node.js (NestJS)** and managed using `npm` / `pnpm`.
- **Frontend:** Located in `frontend/` using **React (Next.js)**.
- **Database:** Use **SQLite** via an ORM. **Prisma** was chosen (with the `@prisma/adapter-better-sqlite3` driver adapter, required by Prisma 7) — use it for any new backend persistence rather than introducing TypeORM.
- Recreate the database schema whenever the Docker environment starts.
- **Authentication:** Support basic user authentication structure (sign up / sign in) as **frontend and backend placeholders (routes and minimal UI scaffolding without production DB logic)**.
- Serving strategy: implemented as two separate containers (backend + frontend), each with its own multi-stage Dockerfile, orchestrated by a root `docker-compose.yml` — not a single NestJS `ServeStaticModule` container. Keep this topology unless there's a reason to change it.

Provide startup and shutdown scripts for all supported operating systems:

```bash
# macOS
scripts/start-mac.sh
scripts/stop-mac.sh

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

## Implementation Status

- **KAN-1** (Legal templates & catalog) — Done. `catalog.json` + `templates/` added.
- **KAN-2** (Mutual NDA Creator) — Done. Next.js prototype in `frontend/`: a labeled `NdaForm` (grouped by Party A /
  Party B / Agreement Terms) on the left, a read-only live `NdaPreview` document on the right, and PDF download.
  Unit-tested.
  - **Redo history:** KAN-2 was briefly redone to remove `NdaForm` in favor of editing fields directly in
    `NdaPreview` (no separate form), then reverted back to the original form + read-only preview split after
    user feedback that both a form and a document — not just one or the other — were required. The form and the
    KAN-4 chat panel both call the same `onFieldChange`/`onFieldsExtracted` handlers in `page.tsx`, so either input
    path updates the same `NdaFormData` state that the preview renders.
- **KAN-3** (V1 technical foundation) — Done, merged to `main`. Unaffected by KAN-2 changes (backend/DB/Docker
  foundation is independent of the frontend's form/preview layout).
  - `backend/`: NestJS app, Prisma + SQLite via `@prisma/adapter-better-sqlite3` (Prisma 7 driver-adapter model), `User` model + migration.
  - Auth: `POST /auth/signup` / `POST /auth/signin` were validated stubs only at the time (no hashing, no persistence) — real hashing/JWT/persistence landed with KAN-5, see below.
  - `frontend/`: `/signup` and `/signin` placeholder pages added, linked from the NDA Creator header.
  - Docker: separate `backend/Dockerfile` and `frontend/Dockerfile` (multi-stage), orchestrated by root `docker-compose.yml`. Backend runs `prisma db push --force-reset` on every container start to recreate the schema.
  - `scripts/start-*` / `scripts/stop-*` wrap `docker compose up -d --build` / `down`.
  - Not yet done at the time: real auth persistence/hashing, wiring the NDA Creator to the backend.
- **KAN-4** (AI chat for Mutual NDA) — Done.
  - `backend/src/chat/`: `POST /chat/nda`, stateless — takes the full conversation each call, calls OpenRouter (`openai/gpt-oss-20b:free` via `OPENROUTER_MODEL`) to get back `{ reply, fields }` in one call per turn.
  - JSON shape is enforced via prompt instructions and parsed leniently (regex-extracts the first `{...}` block if the model wraps it in prose/markdown), not via `response_format` — see the "Known constraint" note under LLM Integration above.
  - `OPENROUTER_API_KEY` is read from the repo-root `.env` (per this file's LLM Integration rules) via `ConfigModule`'s `envFilePath: ['.env', '../.env']`; `docker-compose.yml`'s backend service loads it via `env_file: ./.env`.
  - `frontend/components/NdaChatPanel.tsx`: a floating chat widget (collapsed button, bottom-right) so the form + preview (2-column layout, per KAN-2) stays the visual focus. It fills form fields as it extracts them via the same `onFieldChange` path `NdaForm` uses; the form stays fully editable and `NdaPreview`/PDF export are unchanged.
  - No chat persistence — conversation and extracted fields live in frontend React state only, same as the rest of `NdaFormData`.
  - Known limitation: a later chat turn could still overwrite a field the user manually edited in between (no per-field "user touched this" tracking) — accepted trade-off, not solved.
  - Known upstream limitation: free-tier OpenRouter models/providers are prone to two transient failure modes — `429` rate-limiting (mislabeled "rate limited"), and occasionally a malformed completion (invalid JSON, or JSON missing the expected `reply`/`fields` shape; observed on `gpt-oss-20b:free`'s `Darkbloom` provider, e.g. garbled field-name characters). Neither is a bug. `chat.service.ts` retries the whole request/parse/validate cycle up to 3 times with a 1.5s backoff on either failure mode before giving up and returning `502 Bad Gateway`.
  - **Prompt tuning** (post-launch, per user feedback that the assistant felt "linear, like you're filling in fields yourself rather than an AI"): the system prompt in `buildSystemPrompt()` now tells the model to parse unstructured/multi-fact messages in one pass instead of asking field-by-field, and to fill a field with a reasonable default when the user explicitly defers the decision ("you decide", "up to you").
  - **Always-ask-a-follow-up backstop**: the system prompt requires ending "reply" with a question whenever a field is still blank, but prompt compliance isn't guaranteed — `ensureFollowUpQuestion()` in `chat.service.ts` deterministically appends a question naming the first still-missing field if the model's reply doesn't already end in `?` while fields remain empty. This runs after every successful parse, independent of the model's own behavior.
  - **Chat input focus**: `NdaChatPanel.tsx` refocuses the message `<input>` after every turn (success or error) and when the panel opens, so the user can keep typing without reaching for the mouse.
- **Frontend visual redesign** (post-KAN-4, no ticket) — Done. Navy/gold "legal-tech" theme (serif headings via Lora, warm paper background, `SiteHeader` component) applied across all pages; chat converted from an inline column to the floating widget described above.
- **KAN-5** (Support multiple users) — Done.
  - `backend/src/auth/`: `signup`/`signin` now hash passwords with `bcryptjs` and issue a JWT (`@nestjs/jwt`, 7-day expiry) instead of returning a stub status. `JwtAuthGuard` (`jwt-auth.guard.ts`) verifies the `Authorization: Bearer <token>` header and attaches `req.userId`, protecting the new documents endpoints.
  - `JWT_SECRET` falls back to a fixed dev value (`backend/.env.example`, `docker-compose.yml`) — acceptable because the database (and any accounts/sessions in it) resets on every server restart per this ticket's own scope, so there's no production secret to protect.
  - New `Document` Prisma model (`userId`, `type`, `title`, `data` as a JSON string, `createdAt`) + `backend/src/documents/`: `POST /documents` (create), `GET /documents` (list current user's, summary fields only), `GET /documents/:id` (full record, 403/404 if not owned by the caller). All guarded by `JwtAuthGuard`.
  - `frontend/lib/session.ts`: JWT + email in `localStorage` (no cookies/server sessions — consistent with the temporary-DB scope). `frontend/lib/documents.ts` is the API client, attaching the bearer token.
  - `frontend/components/AuthNav.tsx`: shared auth-aware header nav (Sign in/Sign up vs. email + My Documents + Sign out) used on `/`, `/signin`, `/signup`, and `/documents` instead of each page hardcoding its own links.
  - `/signin` and `/signup` now actually call the backend, store the session, and redirect to `/` on success (previously placeholders with no real effect).
  - New `/documents` page: lists the signed-in user's saved NDAs; clicking one navigates to `/?documentId=<id>`, which `app/page.tsx` loads via `getDocument()` and populates into the existing `NdaFormData` state — the same state the form, chat, preview, and PDF export already share.
  - `app/page.tsx` adds a "Save to My Documents" button next to the PDF download button, visible only when signed in; it POSTs the current form data with a title derived from the two party names (falls back to "Untitled Mutual NDA").
  - Jest/ts-jest note: Prisma 7's generated client uses extensionless `.js` imports (ESM-style) that ts-jest/CommonJS can't resolve by default — fixed via a `moduleNameMapper` in `backend/package.json`'s jest config stripping the `.js` suffix so it resolves through `moduleFileExtensions` instead. This was latent before KAN-5 (no prior test imported `PrismaService`).
- **KAN-6** (Expand to all supported legal document types) — Done. All 11 `catalog.json` entries flipped from
  `"planned"` to `"available"`.
  - **Why not hand-author 10 more `ndaClauses.ts`/`nda-fields.ts`-style files:** the 11 Common Paper templates
    turned out to be structurally inconsistent (1-4 levels of nested numbered lists; section/clause titles marked
    with `header_2`/`header_3` spans in some docs and bold text in others (Mutual-NDA has no header spans at
    all); fillable variables marked with `coverpage_link`, `keyterms_link`, `orderform_link`, `sow_link`, or
    `businessterms_link` spans depending on the template — same concept, different class name per doc;
    Definitions-list terms marked 3 different ways (bold inside an id-anchored span, an empty anchor span
    immediately before separate bold text, or plain bold with no span at all)). Hand-transcribing that many
    variations reliably wasn't realistic — instead:
  - `backend/src/templates/template-parser.ts`: one tolerant parser for all 11 raw `templates/*.md` files.
    Builds a recursive `Clause` tree (title optional, body as rich `Segment[]`, nested `children`) from 4-space
    indented markdown lists at any depth, and treats *any* `<span class="X_link">non-empty text</span>` as a
    fillable field (key derived by slugifying the span text), regardless of the specific `_link` class name used.
    `header_2`/`header_3` spans (or, absent those, a leading bold run — Mutual-NDA's case) at the very start of a
    list item become that clause's title; everything else degrades gracefully (untitled clause, plain text)
    instead of throwing. Possessive spans (`Customer's`) resolve to the same field key as their base form
    (`Customer`) and re-append `'s` at render time. Tested against the real template files (not fixtures) for
    all 11 documents, plus precise structural assertions for Mutual-NDA (locking in no regression from the prior
    hand-authored version) and PSA (nested lists).
  - `backend/src/templates/templates.service.ts` + controller + module: `GET /templates` (catalog list) and
    `GET /templates/:id` (parsed clauses + fields), reading `catalog.json`/`templates/*.md` from the repo root
    at runtime via `path.resolve(process.cwd(), '..', ...)` — this only works because the backend process's cwd
    is `backend/` with `templates/`/`catalog.json` as siblings, both locally (`npm run start:dev` from `backend/`)
    and in Docker (see the Dockerfile/build-context note below).
  - **Docker layout change:** the backend's `docker-compose.yml` build context changed from `./backend` to the
    repo root (with `dockerfile: backend/Dockerfile`) so the image can `COPY templates/` and `catalog.json`
    alongside `backend/`, mirroring the same relative layout `TemplatesService` expects locally. Added a root
    `.dockerignore` since the context root changed (excludes `frontend/`, `node_modules`, etc. from the backend
    build's context — the frontend's own build is unaffected, since its context is still `./frontend`).
  - `backend/src/chat/chat.service.ts`: the NDA-specific prompt/retry logic was factored into
    `callOpenRouterForFields(messages, documentName, fields)`, reused by both the untouched `handleNdaTurn`
    (`POST /chat/nda`, exact prior behavior) and the new `handleDocumentTurn(documentTypeId, messages)`
    (`POST /chat/documents/:type`) driven by that type's parsed fields instead of hardcoded `NDA_FIELDS`.
  - **Document-type router**: `routeToDocumentType(message)` (`POST /chat/route`) is a single classification
    call against the catalog's name/description list. Per the ticket, it always picks the single closest
    available catalog entry and explains the choice in "reply" — it never refuses outright, even when the
    user's request doesn't match any catalog entry well.
  - `backend/src/documents/`: `CreateDocumentDto.type` is validated against the real catalog
    (`TemplatesService.listDocumentTypes()`) instead of a hardcoded `['mutual-nda']`, so saved documents can be
    any of the 11 types.
  - **Frontend**: generic components mirroring the existing `Nda*` ones but data-driven from a document type's
    parsed fields/clauses — `GenericDocumentForm`, `GenericDocumentPreview` (recursive clause/segment renderer:
    bold/field/link segments, nested sub-clauses rendered as nested `<ol>` at any depth), `GenericDocumentPdf` +
    `GenericDocumentDownloadButton`, `DocumentChatPanel`. New pages: `/create` (document-type picker grid +
    the router-chat assistant) and `/create/[type]` (generic creator: form + live preview + chat + save/load +
    PDF, mirroring `app/page.tsx`'s architecture). The Mutual NDA's existing `/` page/components are untouched —
    `/create`'s picker routes the `mutual-nda` card to `/` and the other 10 to `/create/:type`.
  - `frontend/lib/documents.ts`: `saveDocument`/`DocumentDetail` generalized from `NdaFormData`-specific typing
    to `Record<string, string>` plus an explicit `type` parameter, since documents are no longer only NDAs.
  - `AuthNav` gained a "Document Types" link, visible whether signed in or out (browsing/creating a document
    doesn't require an account — only saving one to "My Documents" does).
- **Known issue — stale JWT after a container restart causes `500` on save** (found 2026-07-06, not yet fixed).
  Because the schema is force-reset on every backend start (per KAN-3's Docker design above), a `User` row can
  disappear while a previously-issued JWT (7-day expiry, fixed `JWT_SECRET`) is still sitting in the browser's
  `localStorage` and still passes `JwtAuthGuard`. `POST /documents` then tries to create a `Document` row with
  that now-nonexistent `userId`, SQLite raises `SQLITE_CONSTRAINT_FOREIGNKEY`, and it surfaces to the client as
  an unhandled `500 Internal Server Error` instead of a meaningful `401`. Workaround: sign out and sign back in
  after any backend restart. Real fix would be having `DocumentsService`/`JwtAuthGuard` verify the user still
  exists and return `401` instead of letting Prisma's FK error bubble up — not yet implemented.