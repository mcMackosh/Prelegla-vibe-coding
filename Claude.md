# LegalFlow Project

## Overview

This project is a SaaS application that helps users generate legal documents from predefined templates.
Users interact with an AI assistant to determine which document they need and automatically populate the required fields.
The supported document types are listed in the `catalog.json` file located in the project root.

The current version includes AI-assisted generation for the Service Agreement template.

## Development Workflow

When implementing a new feature:

1. Retrieve the feature requirements from Jira using the available Atlassian tools.
2. Follow the complete feature development workflow without skipping any steps.
3. Validate the implementation with unit and integration tests, fixing any issues before completion.
4. Create a Pull Request using the available GitHub tools.

## Development Workflow

When implementing features that require LLM integration, use LiteLLM through OpenRouter with the `openai/gpt-oss-120b:free` model. Prefer Structured Outputs whenever possible so responses can be reliably parsed and mapped to the corresponding fields in legal documents.

The project includes an `OPENROUTER_API_KEY` in the `.env` file located at the project root. Use this key for all OpenRouter API requests.

## Technical Architecture

The application should run entirely inside Docker.

- Backend located in `backend/` using FastAPI and managed as a `uv` project.
- Frontend located in `frontend/`.
- Use SQLite as the database.
- Recreate the database whenever the Docker environment starts.
- Support basic user authentication (sign up / sign in).
- Prefer serving the production frontend directly from FastAPI if practical.

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

Backend endpoint:

http://localhost:8000

## UI Theme

- Primary Blue: `#1F8DD6`
- Accent Gold: `#E4A30A`
- Secondary Purple: `#6D3A8F`
- Dark Blue: `#05254A`
- Neutral Gray: `#8A8A8A`