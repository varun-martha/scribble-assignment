# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-29 | **Spec**: [spec.md](file:///Users/adminadmin/Documents/scribble-assignment/specs/001-room-setup-lobby/spec.md)

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

Implement the foundational Room Setup and Lobby capabilities. Users can create a new game room (becoming the host) or join an existing room via a unique 6-character alphanumeric code. The lobby state is kept synchronized across clients using HTTP polling every 2 seconds. The room state is maintained strictly in-memory on the backend, with inactive rooms automatically cleaned up after 5 minutes of no polling activity.

## Technical Context

**Language/Version**: TypeScript / Node.js (Backend), React v18 / TypeScript (Frontend)

**Primary Dependencies**: Express, Zod (Backend), React Router v6, Vite (Frontend)

**Storage**: In-memory strictly (no databases)

**Testing**: Manual via frontend UI, backend endpoint validation via Zod

**Target Platform**: Web Browsers

**Project Type**: Web application (Monorepo with `frontend/` and `backend/` directories)

**Performance Goals**: <1s for room creation/joining, <2.5s for lobby updates (using ~2s polling interval)

**Constraints**: No WebSockets, no persistent database, strict stateful bloat prevention.

**Scale/Scope**: Max 20 players per room.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Architecture Constraints**: PASS. Uses separated backend/frontend, in-memory state, and HTTP polling.
- **Security & Validation**: PASS. Will use Zod for API contract validation.
- **Out of Scope Items**: PASS. No WebSockets, no DB, no authentication.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # API endpoints contract
└── tasks.md             # To be created by /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── game.ts
│   │   └── roomStore.ts
│   └── api/
│       └── roomRoutes.ts

frontend/
├── src/
│   ├── components/
│   │   ├── CreateRoom.tsx
│   │   ├── JoinRoom.tsx
│   │   └── Lobby.tsx
│   ├── state/
│   │   └── roomStore.ts
│   └── services/
│       └── api.ts
```
