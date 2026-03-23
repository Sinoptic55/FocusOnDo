# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview

Pomodoro TMS — Task Management System with integrated Pomodoro timer for time tracking.

## Planned Technology Stack

- **Frontend**: TypeScript, JavaScript, HTML
- **Backend**: Python (simple web server)
- **Database**: PostgreSQL
- **Authentication**: Login/password
- **Data Storage**: Server-side with internet access
- **Development Principle**: KISS (Keep It Simple, Stupid)

## Core Architecture Concepts

### Task Structure
- Hierarchical: Tasks → Steps (subtasks)
- Each task has: title, description, planned date, deadline, status, project, client, pomodoro estimate, "first action" field, external link, total time

### Three View Types
1. **Lists view** — tasks grouped by colored lists (Work, Personal, etc.)
2. **Date board** — columns: No date, Today, Tomorrow, This week, Later, Someday
3. **Status board** — customizable status columns

### Pomodoro Timer
- Always visible at bottom (persists across sections)
- Auto-assigns time to active task during work intervals
- Configurable interval sequence (work/break types, duration, order)
- Post-work questions: "Did task progress?" and "Energy level?"
- Stuck pattern detection → suggests breaking task into steps

### Time Tracking
- Automatic during work intervals (start time + duration in seconds)
- Two time fields per segment: Actual time vs Billed time (adjustable)
- Real-time total time display on task form

### Smart Features
- "Don't know where to start" — auto-selects priority task
- Quick capture — hotkey opens mini-window for Inbox
- Morning ritual — daily planning screen on first launch
- Weekly review — summary with task carry-over options

### Reference Data (configurable via UI)
- Task lists (with colors)
- Statuses (with board visibility toggle)
- Projects (with colors)
- Clients
- Timer intervals

### Analytics
- Time by projects/clients (actual vs billed)
- Productivity peaks (time of day)
- Estimation accuracy
- Work speed (tasks/day, tasks/week)
- Stuck patterns

### Settings
- Light/dark theme (auto by system)
- Sound notifications (separate for work/break)
- Hotkey for quick capture
- Morning ritual toggle
- Weekly review reminder day
- Stuck detection threshold

## Notes

- Codebase not yet implemented — this is project specification only
- See `pomodoro_tms_overview.md` for complete feature documentation
