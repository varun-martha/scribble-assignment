---
description: "Task list for Game Start & Drawer Flow implementation"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are excluded as they were not explicitly requested, relying on manual verification via quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Review project structure and verify HTTP polling is functioning properly

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Update Zod schemas for Room and Round in `backend/src/models/game.ts` (data-model.md)
- [ ] T003 Update backend Room structure to support `currentRound` and statuses in `backend/src/services/roomStore.ts`
- [ ] T004 [P] Update frontend types for Room state in `frontend/src/state/roomStore.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Host starts the game and a drawer is assigned (Priority: P1) 🎯 MVP

**Goal**: The host decides to start the game from the lobby. The game transitions to the active game state, and one player is randomly chosen to be the drawer for the first round.

**Independent Test**: Have multiple players in a lobby, host clicks "Start Game", and all players transition to the game view with exactly one player identified as the drawer.

### Implementation for User Story 1

- [ ] T005 [US1] Implement Start Game logic (assign drawer, pick words) in `backend/src/services/roomStore.ts`
- [ ] T006 [US1] Create POST `/api/rooms/:roomId/start` endpoint in `backend/src/api/rooms.ts`
- [ ] T007 [P] [US1] Add "Start Game" button for Host in `frontend/src/components/Lobby.tsx`
- [ ] T008 [P] [US1] Create basic Game view component in `frontend/src/components/Game.tsx`
- [ ] T009 [US1] Handle transition to Game view in `frontend/src/pages/RoomPage.tsx` based on `status === 'Game'`
- [ ] T010 [US1] Add `startGame` API call to `frontend/src/state/roomStore.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Drawer selects the secret word (Priority: P2)

**Goal**: The newly assigned drawer is presented with multiple word choices. They must select one to draw, while the other players wait securely.

**Independent Test**: Verify the drawer sees word options, selects one, and the guessers never receive the word in their client data payloads.

### Implementation for User Story 2

- [ ] T011 [US2] Implement payload sanitization in `backend/src/api/rooms.ts` so `wordOptions` and `secretWord` are only sent if `X-Player-ID` matches `drawerId`
- [ ] T012 [US2] Implement Select Secret Word logic in `backend/src/services/roomStore.ts`
- [ ] T013 [US2] Create POST `/api/rooms/:roomId/word` endpoint in `backend/src/api/rooms.ts`
- [ ] T014 [P] [US2] Create Word Selection UI for Drawer in `frontend/src/components/WordSelection.tsx`
- [ ] T015 [P] [US2] Display "Waiting for Drawer..." for Guessers in `frontend/src/components/Game.tsx`
- [ ] T016 [US2] Add `selectWord` API call to `frontend/src/state/roomStore.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Transition to Drawing Phase (Priority: P3)

**Goal**: Once the word is selected, the actual round begins. The drawer can start drawing on the canvas, and the timer starts ticking down for the round.

**Independent Test**: Select a word as the drawer and observe that the canvas unlocks and a timer begins counting down on all clients.

### Implementation for User Story 3

- [ ] T017 [US3] Start round timer on backend when word is selected in `backend/src/services/roomStore.ts`
- [ ] T018 [P] [US3] Render Canvas UI for Drawer in `frontend/src/components/Game.tsx`
- [ ] T019 [P] [US3] Render Round Timer for all players in `frontend/src/components/Game.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T020 Run quickstart.md validation to manually test the full flow locally.
- [ ] T021 Code cleanup and refactoring in backend/frontend.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates with US2

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Models within a story marked [P] can run in parallel
- Frontend UI components can be built in parallel with Backend API endpoints
