# Tasks: Room Setup & Lobby

**Input**: Design documents from `/specs/001-room-setup-lobby/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure per implementation plan
- [X] T002 Initialize empty Room and Player models in backend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Setup in-memory global state for rooms (`Map<string, Room>`) in backend
- [X] T004 Implement basic error handling middleware in backend
- [X] T005 [P] Setup Zod schemas for room validation in backend
- [X] T006 [P] Setup React Router structure in frontend
- [X] T007 [P] Create API service base configuration (`frontend/src/services/api.ts`)
- [X] T008 [P] Initialize Zustand or Context API store (`frontend/src/state/roomStore.ts`)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Host a Room (Priority: P1) 🎯 MVP

**Goal**: As a player, I want to create a new game room so that I can host a game and invite my friends to join.

**Independent Test**: Can be fully tested by a user clicking "Create Room" and seeing a new room created with a unique code, where they are designated as the host.

### Implementation for User Story 1

- [X] T009 [P] [US1] Implement `Room` and `Participant` interfaces in `backend/src/models/game.ts`
- [X] T010 [US1] Implement `createRoom` method in `backend/src/services/roomStore.ts` (generates 6-char code)
- [X] T011 [US1] Implement `POST /api/rooms` endpoint in `backend/src/api/roomRoutes.ts`
- [X] T012 [P] [US1] Add `createRoom` API call to `frontend/src/services/api.ts`
- [X] T013 [US1] Update `roomStore.ts` with create room logic
- [X] T014 [US1] Implement `frontend/src/components/CreateRoom.tsx` UI
- [X] T015 [US1] Implement basic `frontend/src/components/Lobby.tsx` UI for host view

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Join an Existing Room (Priority: P1)

**Goal**: As a player, I want to join a room using a unique code so that I can play with my friends.

**Independent Test**: Can be fully tested by a second user entering a valid room code and joining the lobby, appearing on the player list.

### Implementation for User Story 2

- [X] T016 [US2] Implement `joinRoom` method in `backend/src/services/roomStore.ts` (with validation for max 20 players and unique usernames)
- [X] T017 [US2] Implement `POST /api/rooms/:code/join` endpoint in `backend/src/api/roomRoutes.ts`
- [X] T018 [P] [US2] Add `joinRoom` API call to `frontend/src/services/api.ts`
- [X] T019 [US2] Update `roomStore.ts` with join room logic
- [X] T020 [US2] Implement `frontend/src/components/JoinRoom.tsx` UI (handles code input, name input, and error messages)
- [X] T021 [US2] Update `Lobby.tsx` to handle guest view and player list display

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Real-time Lobby Updates (Priority: P2)

**Goal**: As a player in the lobby, I want to see when other players join or leave in near real-time, so that I know who is ready to play.

**Independent Test**: Can be fully tested by having two users in the same room. When user A joins or leaves, user B's screen should update automatically within approximately 2 seconds without requiring a manual refresh.

### Implementation for User Story 3

- [X] T022 [US3] Implement `getRoom` method in `backend/src/services/roomStore.ts`
- [X] T023 [US3] Implement `GET /api/rooms/:code` and `POST /api/rooms/:code/leave` in `backend/src/api/roomRoutes.ts`
- [X] T024 [P] [US3] Add `getRoom` and `leaveRoom` API calls to `frontend/src/services/api.ts`
- [X] T025 [US3] Implement HTTP polling in `frontend/src/components/Lobby.tsx` using `setInterval` (~2s interval)
- [X] T026 [US3] Implement Idle Room Cleanup logic in backend (interval scanning `Map` for rooms inactive > 5 mins)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T027 Code cleanup and refactoring (if needed)
- [X] T028 Verify XSS mitigation for user inputs and rendered usernames (ensure React default escaping is sufficient and payloads are sanitized)
- [X] T029 Run quickstart.md manual verification
- [X] T030 Add boundary condition unit tests for backend `RoomService` (e.g., max players, duplicate names)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Requires US1 to create the room to join
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members
