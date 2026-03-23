# AGENTS.md - Code Mode

This file provides guidance to agents when working with code in this repository.

## Project Status

**Codebase not yet implemented** — this is a project in planning phase only.

## Planned Stack

- Frontend: TypeScript, JavaScript, HTML
- Backend: Python (simple web server)
- Database: PostgreSQL
- Authentication: Login/password
- Development Principle: KISS (Keep It Simple, Stupid)

## Key Architecture Notes

When implementing, ensure:
- Pomodoro timer must persist across all UI sections
- Time tracking: Actual time vs Billed time (both stored)
- Three task view types: Lists, Date board, Status board
- Hierarchical tasks with steps (subtasks)
- All data stored server-side with internet access

## Reference

See `pomodoro_tms_overview.md` for complete feature specification.
