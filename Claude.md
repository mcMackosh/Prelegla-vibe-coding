# LegalFlow Project

## Overview

This project is a SaaS application that helps users generate legal documents from predefined templates.
The long-term goal is for users to interact with an AI assistant to determine which document they need and
automatically populate the required fields.
The supported document types are listed in the `catalog.json` file located in the project root.

The current version includes a freeform AI chat (backed by OpenRouter) alongside a manual, editable form for
the Mutual Non-Disclosure Agreement template only — see Implementation Status below. The chat can only fill in
NDA fields today; it does not yet determine which document type the user needs. All other catalog entries are
still `"planned"`.

## Development Workflow

When implementing a new feature:

1. Retrieve the feature requirements from Jira using the available Atlassian tools.
2. Follow the complete feature development workflow without skipping any steps.
3. Validate the implementation with unit and integration tests, fixing any issues before completion.
4. Create a Pull Request using the available GitHub tools.

## LLM Integration

When implementing features that require LLM integration:

- Always use LiteLLM via OpenRouter (or a Node.js compatible wrapper / native fetch).
- Use the `openai/gpt-oss-120b:free` model unless explicitly instructed otherwise.
- Prefer Structured Outputs whenever possible so responses can be reliably parsed and mapped to the corresponding fields in legal documents.
- Read the `OPENROUTER_API_KEY` from the `.env` file in the project root.
- Do not hardcode API keys or model names in the source code.
- **Known constraint:** `openai/gpt-oss-120b:free` does not support `response_format`/Structured Outputs on any OpenRouter provider (confirmed via `/api/v1/models`'s `supported_parameters` and via `provider.require_parameters: true`, which returns "No endpoints found that can handle the requested parameters" for both `json_schema` and `json_object` modes). The paid `openai/gpt-oss-120b` variant does support it. Until instructed to switch models, enforce JSON shape via prompt instructions and parse leniently (see `backend/src/chat/chat.service.ts`) rather than relying on `response_format`.

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
- **KAN-2** (Mutual NDA Creator) — Done. Next.js prototype in `frontend/` (form, live preview, PDF download), unit-tested.
- **KAN-3** (V1 technical foundation) — Done, merged to `main`.
  - `backend/`: NestJS app, Prisma + SQLite via `@prisma/adapter-better-sqlite3` (Prisma 7 driver-adapter model), `User` model + migration.
  - Auth: `POST /auth/signup` / `POST /auth/signin` are validated stubs only — no hashing, no persistence yet.
  - `frontend/`: `/signup` and `/signin` placeholder pages added, linked from the NDA Creator header.
  - Docker: separate `backend/Dockerfile` and `frontend/Dockerfile` (multi-stage), orchestrated by root `docker-compose.yml`. Backend runs `prisma db push --force-reset` on every container start to recreate the schema.
  - `scripts/start-*` / `scripts/stop-*` wrap `docker compose up -d --build` / `down`.
  - Not yet done at the time: real auth persistence/hashing, wiring the NDA Creator to the backend.
- **KAN-4** (AI chat for Mutual NDA) — Done.
  - `backend/src/chat/`: `POST /chat/nda`, stateless — takes the full conversation each call, calls OpenRouter (`openai/gpt-oss-120b:free` via `OPENROUTER_MODEL`) to get back `{ reply, fields }` in one call per turn.
  - JSON shape is enforced via prompt instructions and parsed leniently (regex-extracts the first `{...}` block if the model wraps it in prose/markdown), not via `response_format` — see the "Known constraint" note under LLM Integration above.
  - `OPENROUTER_API_KEY` is read from the repo-root `.env` (per this file's LLM Integration rules) via `ConfigModule`'s `envFilePath: ['.env', '../.env']`; `docker-compose.yml`'s backend service loads it via `env_file: ./.env`.
  - `frontend/components/NdaChatPanel.tsx`: a floating chat widget (collapsed button, bottom-right) rather than an inline panel, so the document (form + live preview, 2-column layout) stays the visual focus. It fills form fields as it extracts them, but the form stays fully editable and `NdaPreview`/PDF export are unchanged.
  - No chat persistence — conversation and extracted fields live in frontend React state only, same as the rest of `NdaFormData`.
  - Known limitation: a later chat turn could still overwrite a field the user manually edited in between (no per-field "user touched this" tracking) — accepted trade-off, not solved.
  - Known upstream limitation: `openai/gpt-oss-120b:free` is a heavily shared free-tier pool and returns intermittent `429`s (mislabeled "rate limited") independent of request shape — this is expected and handled gracefully (`502 Bad Gateway`), not a bug.
- **Frontend visual redesign** (post-KAN-4, no ticket) — Done. Navy/gold "legal-tech" theme (serif headings via Lora, warm paper background, `SiteHeader` component) applied across all pages; chat converted from an inline column to the floating widget described above.