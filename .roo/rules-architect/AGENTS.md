# AGENTS.md - Architect Mode

This file provides guidance to agents when working with code in this repository.

## Project Status

**Codebase not yet implemented** — this is a project in planning phase only.

## Planned Architecture

### Frontend
- TypeScript, JavaScript, HTML
- Simple, direct DOM manipulation (no heavy frameworks)

### Backend
- Python (simple web server)
- PostgreSQL database
- REST API (assumed)

### Development Principle
- KISS (Keep It Simple, Stupid)
- Avoid over-engineering
- Prefer simple solutions over complex abstractions

### Key Architectural Decisions

1. **Server-side data storage** — all data on server, internet access required
2. **Timer persistence** — Pomodoro timer visible across all UI sections
3. **Time tracking model** — dual fields: actual time vs billed time
4. **Multi-client support** — web + desktop clients sharing same data
5. **Authentication** — login/password only (no OAuth planned)

### Data Model

- Tasks with hierarchical steps
- Reference data: lists, statuses, projects, clients, timer intervals
- Time segments: start time, duration, actual time, billed time

## Reference

See `pomodoro_tms_overview.md` for complete feature specification.
