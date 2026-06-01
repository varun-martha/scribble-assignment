import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  selectWordSchema,
  addStrokeSchema,
  addGuessSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, toRoomSnapshot, startGame, selectWord, addStroke, addGuess, resetRoomToLobby, clearStrokes } from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code.toUpperCase(), playerName);

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error: any) {
      if (error.message === "Room not found") {
        next(new HttpError(404, error.message));
      } else if (error.message === "Room is full" || error.message === "Username already taken in this room") {
        next(new HttpError(409, error.message));
      } else {
        next(error);
      }
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error: any) {
      if (error.message === "Room not found") {
        next(new HttpError(404, error.message));
      } else if (error.message === "Minimum 2 players required to start" || error.message === "Only the host can start the game") {
        next(new HttpError(403, error.message));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/word", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, word } = selectWordSchema.parse(request.body);
      const result = selectWord(code.toUpperCase(), participantId, word);

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error: any) {
      if (error.message === "Room not found") {
        next(new HttpError(404, error.message));
      } else if (error.message === "Invalid room state" || error.message === "Only the drawer can select a word" || error.message === "Word already selected" || error.message === "Invalid word selection") {
        next(new HttpError(400, error.message));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = addStrokeSchema.parse(request.body);
      const result = addStroke(code.toUpperCase(), participantId, stroke);

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error: any) {
      if (error.message === "Invalid room state" || error.message === "Only the drawer can draw" || error.message === "Not currently drawing") {
        next(new HttpError(400, error.message));
      } else {
        next(error);
      }
    }
  });

  router.delete("/:code/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body); // use startGameSchema because it expects just participantId
      const result = clearStrokes(code.toUpperCase(), participantId);

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error: any) {
      if (error.message === "Invalid room state" || error.message === "Only the drawer can clear strokes" || error.message === "Not currently drawing") {
        next(new HttpError(400, error.message));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = addGuessSchema.parse(request.body);
      const result = addGuess(code.toUpperCase(), participantId, text);

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error: any) {
      if (error.message.startsWith("Rate limit") || error.message === "Invalid room state" || error.message === "The drawer cannot guess" || error.message === "Not currently drawing") {
        next(new HttpError(400, error.message));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/reset", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body); // Same shape as start game (just participantId)
      const result = resetRoomToLobby(code.toUpperCase(), participantId);

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error: any) {
      if (error.message === "Room not found") {
        next(new HttpError(404, error.message));
      } else if (error.message === "Only the host can reset the room" || error.message === "Room must be in results phase to reset") {
        next(new HttpError(403, error.message));
      } else {
        next(error);
      }
    }
  });

  return router;
}
