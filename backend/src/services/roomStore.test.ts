import { describe, expect, it } from "vitest";
import { createRoom, joinRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 6-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{6}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom throws error for an unknown room code", () => {
    expect(() => joinRoom("ZZZZZZ", "Bob")).toThrow("Room not found");
  });

  it("joinRoom throws error for duplicate usernames", () => {
    const { room } = createRoom("Alice");
    expect(() => joinRoom(room.code, "Alice")).toThrow("Username already taken in this room");
  });

  it("joinRoom enforces max 20 players", () => {
    const { room } = createRoom("Player0");
    for (let i = 1; i < 20; i++) {
        joinRoom(room.code, `Player${i}`);
    }
    expect(() => joinRoom(room.code, "Player20")).toThrow("Room is full");
  });
});

import { startGame, selectWord, addStroke, addGuess, clearStrokes, resetRoomToLobby } from "./roomStore.js";

describe("roomStore Game Logic", () => {
  it("allows host to start game, selects word, and draws", async () => {
    // 1. Setup Room
    const hostRes = createRoom("Host");
    const guesserRes = joinRoom(hostRes.room.code, "Guesser");
    
    // 2. Start Game
    const startRes = startGame(hostRes.room.code, hostRes.participantId);
    expect(startRes.room.status).toBe("game");
    expect(startRes.room.currentRound?.drawerId).toBe(guesserRes.participantId); // 2nd player is deterministic drawer
    expect(startRes.room.currentRound?.wordOptions?.length).toBe(3);
    
    // 3. Select Word
    const selectedWord = startRes.room.currentRound!.wordOptions![0];
    const wordRes = selectWord(hostRes.room.code, guesserRes.participantId, selectedWord);
    expect(wordRes.room.currentRound?.secretWord).toBe(selectedWord);
    expect(wordRes.room.currentRound?.roundStatus).toBe("Drawing");

    // 4. Add Stroke
    const stroke = { id: "s1", color: "black", brushSize: 5, points: [], isComplete: false };
    const strokeRes = addStroke(hostRes.room.code, guesserRes.participantId, stroke);
    expect(strokeRes.room.strokes).toHaveLength(1);

    // 5. Clear Strokes
    const clearRes = clearStrokes(hostRes.room.code, guesserRes.participantId);
    expect(clearRes.room.strokes).toHaveLength(0);

    // 6. Add Guess (Incorrect then Correct)
    addGuess(hostRes.room.code, hostRes.participantId, "wrong word");
    await new Promise(r => setTimeout(r, 1000));
    const guessRes = addGuess(hostRes.room.code, hostRes.participantId, selectedWord);
    expect(guessRes.room.guesses).toHaveLength(2);
    expect(guessRes.room.guesses[1].isCorrect).toBe(true);
    expect(guessRes.room.scores[hostRes.participantId]).toBeGreaterThan(0);
    
    // Game ends immediately since all guessers got it
    expect(guessRes.room.status).toBe("results");
    
    // 7. Reset to Lobby
    const resetRes = resetRoomToLobby(hostRes.room.code, hostRes.participantId);
    expect(resetRes.room.status).toBe("lobby");
    expect(resetRes.room.scores[hostRes.participantId]).toBe(0);
  });
});
