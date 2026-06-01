# Discovery & Scaffold Understanding

## Overview
This document outlines the architecture, directory structure, and technical constraints of the "Scribble" multiplayer drawing game. The application is built as a single monolithic repository divided into a strict backend and frontend.

## Architecture Constraints
- **Backend**: Node.js, Express, TypeScript, Zod.
- **Frontend**: React 18, React Router 6, Vite, TypeScript.
- **State Management**: In-memory ONLY. No databases (SQL/NoSQL) are used.
- **Communication**: HTTP polling ONLY. WebSockets, Socket.io, or other real-time protocols are strictly forbidden.
- **Authentication**: None. Players are identified by generated UUIDs and their chosen names per session.

## Directory Structure

### `backend/`
Contains the Express HTTP server and all game logic.
- `src/api/`: Express routes and handlers. Zod is used here to validate request payloads.
- `src/services/`: Core game logic (`roomStore.ts`), managing the in-memory `Map` of game rooms, transitioning game phases (lobby -> game -> results), and managing idle room cleanup.
- `src/models/`: TypeScript interfaces and types shared conceptually across the app (`game.ts`).

### `frontend/`
Contains the React SPA application.
- `src/state/`: Zustand store (`roomStore.ts`) that handles periodic polling to the backend and exposes game state to the UI.
- `src/components/`: Reusable React components (e.g., `Canvas.tsx`, `Scoreboard.tsx`, `Chat.tsx`).
- `src/pages/`: Main route views mapping to game states (`StartPage.tsx`, `JoinRoomPage.tsx`, `LobbyPage.tsx`, `GamePage.tsx`).
- `src/styles/`: Vanilla CSS files (`app.css`) for all styling. No Tailwind is used per instructions.

## Game State Machine
1. **Lobby**: Players join and wait. Host can start the game when >1 players are present.
2. **Game**: 
   - *Selecting Word*: The drawer selects from 3 deterministic word choices.
   - *Drawing*: Drawer draws strokes; guessers submit text guesses. Scoring is based on speed.
3. **Results**: Round ends (time expires or all guessers succeed). The final canvas, word, and scores are displayed.
4. **Restart**: Host can transition the room back to **Lobby**, clearing the canvas and resetting points.

## Polling Strategy
Since WebSockets are forbidden, the frontend implements a fast-polling strategy (typically every 1000-2000ms depending on state) via `src/state/roomStore.ts` to sync strokes, guesses, and phase changes from the backend.

## Assumptions
- Assume a maximum of 20 players per room to maintain reasonable performance under HTTP polling.
- Assume browsers keep polling active for at least 2 minutes in background tabs before throttling completely, to avoid aggressive participant removal.

## Identified Gaps
- **Lack of Persistent Storage**: The entirely in-memory state means all active games, scores, and rooms are lost upon server restart or crash.
- **HTTP Polling Overhead**: Relying on strict HTTP polling constraint dramatically increases server load and latency compared to a WebSocket connection, which could degrade drawing responsiveness.
- **No Authenticated Sessions**: Players are identified only by generated UUIDs stored locally per session, which prevents long-term player tracking or reconnection across devices.
