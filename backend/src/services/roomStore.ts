import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, ParticipantRole, Stroke, Guess } from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name?: string) {
  return name || "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    strokes: [],
    guesses: [],
    scores: {},
    lastGuessTime: {},
    lastSeenTime: {},
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new Error("Room not found");
  }

  if (room.participants.length >= 20) {
    throw new Error("Room is full");
  }

  const newName = displayName(playerName);
  if (room.participants.some(p => p.name === newName)) {
    throw new Error("Username already taken in this room");
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

// Idle Room Cleanup (every 1 minute)
setInterval(() => {
    const timeNow = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;
    for (const [code, room] of rooms.entries()) {
        const lastActivity = new Date(room.updatedAt).getTime();
        if (timeNow - lastActivity > FIVE_MINUTES) {
            rooms.delete(code);
        }
    }
}, 60 * 1000);

export function getRoom(code: string, viewerParticipantId?: string) {
  const room = rooms.get(code);
  
  if (room) {
    const nowTime = Date.now();
    if (viewerParticipantId) {
      if (!room.lastSeenTime) room.lastSeenTime = {};
      room.lastSeenTime[viewerParticipantId] = nowTime;
    }
    
    // Remove participants not seen in 2 minutes (auto-reassigns host if host dropped)
    // 2 minutes allows background tabs (which are throttled to 1min intervals by browsers) to stay alive
    if (room.lastSeenTime) {
      const active = room.participants.filter(p => {
        const lastSeen = room.lastSeenTime![p.id] || nowTime;
        return (nowTime - lastSeen) < 120000;
      });
      if (active.length > 0 && active.length < room.participants.length) {
        room.participants = active;
        room.updatedAt = now();
      }
    }

    if (room.status === "game" && room.currentRound && room.currentRound.roundStatus === "Drawing" && room.currentRound.roundEndTime) {
      if (nowTime > room.currentRound.roundEndTime) {
        room.currentRound.roundStatus = "Ended";
        room.status = "results";
      }
    }
  }
  
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  let currentRound = room.currentRound ? { ...room.currentRound } : undefined;
  
  if (currentRound && currentRound.drawerId !== viewerParticipantId) {
    delete currentRound.wordOptions;
    if (currentRound.roundStatus !== "Ended") {
      delete currentRound.secretWord;
    }
  }

  const roles: ParticipantRole[] = room.participants.map(p => {
    if (currentRound && currentRound.drawerId === p.id) return "drawer";
    if (p.id === room.participants[0].id) return "host";
    return "guesser";
  });

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    currentRound,
    availableWords: listWords(),
    roles,
    strokes: room.strokes,
    guesses: room.guesses,
    scores: room.scores
  };
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room not found");
  if (room.participants.length < 2) throw new Error("Minimum 2 players required to start");
  if (room.participants[0].id !== participantId) throw new Error("Only the host can start the game");

  const drawerIndex = room.participants.length > 1 ? 1 : 0;
  const drawerId = room.participants[drawerIndex].id;

  const allWords = listWords();
  const wordOptions: string[] = allWords.slice(0, 3);

  room.status = "game";
  room.currentRound = {
    drawerId,
    wordOptions,
    roundStatus: "SelectingWord",
    roundEndTime: null
  };
  room.strokes = [];
  room.guesses = [];

  room.updatedAt = now();
  rooms.set(code, room);
  return { participantId, room: cloneRoom(room) };
}

export function selectWord(code: string, participantId: string, word: string) {
  const room = rooms.get(code);
  if (!room || room.status !== "game" || !room.currentRound) throw new Error("Invalid room state");
  if (room.currentRound.drawerId !== participantId) throw new Error("Only the drawer can select a word");
  if (room.currentRound.roundStatus !== "SelectingWord") throw new Error("Word already selected");
  if (!room.currentRound.wordOptions?.includes(word)) throw new Error("Invalid word selection");

  room.currentRound.secretWord = word;
  room.currentRound.roundStatus = "Drawing";
  room.currentRound.roundEndTime = Date.now() + 60000; // 60 seconds

  room.updatedAt = now();
  rooms.set(code, room);
  return { participantId, room: cloneRoom(room) };
}

export function addStroke(code: string, participantId: string, stroke: Stroke) {
  const room = rooms.get(code);
  if (!room || room.status !== "game" || !room.currentRound) throw new Error("Invalid room state");
  if (room.currentRound.drawerId !== participantId) throw new Error("Only the drawer can draw");
  if (room.currentRound.roundStatus !== "Drawing") throw new Error("Not currently drawing");

  const existingIndex = room.strokes.findIndex(s => s.id === stroke.id);
  if (existingIndex >= 0) {
    room.strokes[existingIndex] = stroke;
  } else {
    room.strokes.push(stroke);
  }

  room.updatedAt = now();
  rooms.set(code, room);
  return { participantId, room: cloneRoom(room) };
}

export function clearStrokes(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room || room.status !== "game" || !room.currentRound) throw new Error("Invalid room state");
  if (room.currentRound.drawerId !== participantId) throw new Error("Only the drawer can clear strokes");
  if (room.currentRound.roundStatus !== "Drawing") throw new Error("Not currently drawing");

  room.strokes = [];
  room.updatedAt = now();
  rooms.set(code, room);
  return { participantId, room: cloneRoom(room) };
}

export function addGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);
  if (!room || room.status !== "game" || !room.currentRound) throw new Error("Invalid room state");
  if (room.currentRound.drawerId === participantId) throw new Error("The drawer cannot guess");
  if (room.currentRound.roundStatus !== "Drawing") throw new Error("Not currently drawing");

  const nowTime = Date.now();
  const lastGuess = room.lastGuessTime[participantId] || 0;
  if (nowTime - lastGuess < 1000) {
    throw new Error("Rate limit exceeded. Please wait 1 second between guesses.");
  }

  const isCorrect = !!room.currentRound.secretWord && room.currentRound.secretWord.toLowerCase() === text.trim().toLowerCase();
  
  const guess: Guess = {
    userId: participantId,
    text: text.trim(),
    timestamp: nowTime,
    isCorrect
  };

  room.guesses.push(guess);
  room.lastGuessTime[participantId] = nowTime;

  if (isCorrect && room.currentRound.roundEndTime) {
    const timeRemaining = Math.max(0, room.currentRound.roundEndTime - nowTime);
    const guesserPoints = Math.floor(timeRemaining / 1000) * 10;
    const drawerPoints = Math.floor(guesserPoints / 2);

    room.scores[participantId] = (room.scores[participantId] || 0) + guesserPoints;
    room.scores[room.currentRound.drawerId] = (room.scores[room.currentRound.drawerId] || 0) + drawerPoints;

    const guesserIds = room.participants.filter(p => p.id !== room.currentRound!.drawerId).map(p => p.id);
    const correctGuesserIds = new Set(room.guesses.filter(g => g.isCorrect).map(g => g.userId));
    
    if (guesserIds.every(id => correctGuesserIds.has(id))) {
      room.currentRound.roundStatus = "Ended";
      room.status = "results";
    }
  }

  room.updatedAt = now();
  rooms.set(code, room);
  return { participantId, room: cloneRoom(room) };
}

export function resetRoomToLobby(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room not found");
  if (room.participants.length === 0 || room.participants[0].id !== participantId) throw new Error("Only the host can reset the room");
  if (room.status !== "results") throw new Error("Room must be in results phase to reset");

  room.status = "lobby";
  room.currentRound = undefined;
  room.strokes = [];
  room.guesses = [];
  
  // reset scores
  for (const p of room.participants) {
    room.scores[p.id] = 0;
  }
  
  room.updatedAt = now();
  rooms.set(code, room);
  return { participantId, room: cloneRoom(room) };
}
