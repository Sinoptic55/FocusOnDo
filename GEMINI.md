# GEMINI.md - Pomodoro TMS Context

## Project Overview
Pomodoro TMS (Task Management System) is a productivity-focused web application that combines task management with an integrated Pomodoro timer. It features hierarchical task structures, multiple views (List, Date Board, Status Board), automatic time tracking, analytics, and smart tools (Morning Ritual, Weekly Review).

- **Backend:** Python (FastAPI), SQLAlchemy (ORM), Alembic (Migrations), PostgreSQL.
- **Frontend:** TypeScript, Vanilla JavaScript, CSS (No frameworks), esbuild (Bundler).
- **Process:** Follows the [OpenSpec](openspec/) methodology for feature design and implementation tracking.

## Building and Running

### Backend
1.  **Environment:** Requires Python 3.9+. Create a venv in `src/backend`.
2.  **Dependencies:** `pip install -r src/backend/requirements.txt`.
3.  **Database:** Ensure PostgreSQL is running. Configure `.env` in the root (see `.env.example`).
4.  **Migrations:** `cd src/backend && alembic upgrade head`.
5.  **Run Dev:** `cd src/backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000`.
6.  **Tests:** `cd src/backend && pytest`.

### Frontend
1.  **Dependencies:** `cd src/frontend && npm install`.
2.  **Run Dev:** `cd src/frontend && npm run dev` (starts esbuild in watch mode).
3.  **Build:** `cd src/frontend && npm run build`.
4.  **Type Check:** `cd src/frontend && npm run type-check`.

## Development Conventions

### OpenSpec Workflow
All significant changes must follow the OpenSpec artifact workflow located in `openspec/changes/`:
1.  **Proposal:** Initial idea and goals.
2.  **Design:** Architectural decisions and UI/UX plan.
3.  **Delta Specs:** Specific changes to project specs (`openspec/specs/`).
4.  **Tasks:** Implementation checklist.

### Frontend Style
- **Vanilla Only:** Do NOT introduce frontend frameworks (React, Vue, etc.). Use native DOM APIs and standard TypeScript classes/modules.
- **Components:** UI elements are structured as TypeScript classes or functional components in `src/frontend/src/components/`.
- **Styling:** Main styles are in `src/frontend/styles.css`. Prefer simple, clean CSS.

### Backend Style
- **Type Safety:** Use Pydantic schemas for request/response validation (`src/backend/schemas/`).
- **Logic Separation:** Business logic should reside in `src/backend/services/`, not directly in the API endpoints.
- **Migrations:** Every database model change MUST be accompanied by an Alembic migration (`alembic revision --autogenerate`).

### Repository Rules
- Do NOT commit to the `main` branch directly if using a feature branch workflow (check local git config).
- Always update relevant OpenSpec artifacts when implementing a feature.
- Ensure `npm run type-check` and `pytest` pass before considering a task complete.
