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
  - `backend/src/chat/`: `POST /chat/nda`, stateless — takes the full conversation each call, calls OpenRouter (`openai/gpt-oss-120b:free` via `OPENROUTER_MODEL`) with Structured Outputs (`response_format: json_schema`) to get back `{ reply, fields }` in one call per turn.
  - `OPENROUTER_API_KEY` is read from the repo-root `.env` (per this file's LLM Integration rules) via `ConfigModule`'s `envFilePath: ['.env', '../.env']`; `docker-compose.yml`'s backend service loads it via `env_file: ./.env`.
  - `frontend/components/NdaChatPanel.tsx`: chat sits side-by-side with the existing `NdaForm` (3-column layout: Chat | Form | Preview) — it fills form fields as it extracts them, but the form stays fully editable and `NdaPreview`/PDF export are unchanged.
  - No chat persistence — conversation and extracted fields live in frontend React state only, same as the rest of `NdaFormData`.
  - Known limitation: a later chat turn could still overwrite a field the user manually edited in between (no per-field "user touched this" tracking) — accepted trade-off, not solved.