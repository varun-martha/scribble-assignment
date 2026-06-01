import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import { api, type RoomSessionResponse, type RoomSnapshot } from "../services/api";
import type { Stroke } from "../services/api";

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  error: string | null;
  isLoading: boolean;
}

type Listener = () => void;

class RoomStore {
  private state: RoomState = {
    room: null,
    participantId: null,
    error: null,
    isLoading: false
  };

  private listeners = new Set<Listener>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  private setState(nextState: Partial<RoomState>) {
    this.state = {
      ...this.state,
      ...nextState
    };
    this.listeners.forEach((listener) => listener());
  }

  private async withLoading<T>(operation: () => Promise<T>) {
    this.setState({
      isLoading: true,
      error: null
    });

    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected request failure";
      this.setState({ error: message });
      throw error;
    } finally {
      this.setState({ isLoading: false });
    }
  }

  setRoomSession(response: RoomSessionResponse) {
    this.setState({
      participantId: response.participantId,
      room: response.room,
      error: null
    });
  }

  setRoomSnapshot(room: RoomSnapshot) {
    this.setState({
      room,
      error: null
    });
  }

  async createRoom(playerName: string) {
    const response = await this.withLoading(() => api.createRoom(playerName));
    this.setRoomSession(response);
    return response;
  }

  async joinRoom(code: string, playerName: string) {
    const response = await this.withLoading(() => api.joinRoom(code, playerName));
    this.setRoomSession(response);
    return response;
  }

  async fetchRoom() {
    if (!this.state.room) {
      return null;
    }

    const response = await api.fetchRoom(this.state.room.code, this.state.participantId ?? undefined);
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async startGame() {
    if (!this.state.room || !this.state.participantId) return;
    const response = await this.withLoading(() => api.startGame(this.state.room!.code, this.state.participantId!));
    this.setRoomSession(response);
    return response;
  }

  async selectWord(word: string) {
    if (!this.state.room || !this.state.participantId) return;
    const response = await this.withLoading(() => api.selectWord(this.state.room!.code, this.state.participantId!, word));
    this.setRoomSession(response);
    return response;
  }

  async addStroke(stroke: Stroke) {
    if (!this.state.room || !this.state.participantId) return;
    
    // Optimistic UI update
    const newRoom = { ...this.state.room, strokes: [...this.state.room.strokes] };
    const existingIndex = newRoom.strokes.findIndex(s => s.id === stroke.id);
    if (existingIndex >= 0) {
      newRoom.strokes[existingIndex] = stroke;
    } else {
      newRoom.strokes.push(stroke);
    }
    this.setRoomSnapshot(newRoom);

    // Background sync
    api.addStroke(this.state.room.code, this.state.participantId, stroke).catch(err => {
      console.error("Failed to sync stroke", err);
    });
  }

  async clearCanvas() {
    if (!this.state.room || !this.state.participantId) return;

    // Optimistic UI update
    const newRoom = { ...this.state.room, strokes: [] };
    this.setRoomSnapshot(newRoom);

    api.clearStrokes(this.state.room.code, this.state.participantId).catch(err => {
      console.error("Failed to clear canvas", err);
    });
  }

  async addGuess(text: string) {
    if (!this.state.room || !this.state.participantId) return;
    const response = await this.withLoading(() => api.addGuess(this.state.room!.code, this.state.participantId!, text));
    this.setRoomSession(response);
    return response;
  }

  async resetRoom() {
    if (!this.state.room || !this.state.participantId) return;
    const response = await this.withLoading(() => api.resetRoom(this.state.room!.code, this.state.participantId!));
    this.setRoomSession(response);
    return response;
  }
}

const RoomStoreContext = createContext<RoomStore | null>(null);

export function RoomStoreProvider({ children }: PropsWithChildren) {
  const storeRef = useRef<RoomStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = new RoomStore();
  }

  useEffect(() => undefined, []);

  return createElement(RoomStoreContext.Provider, { value: storeRef.current }, children);
}

export function useRoomStore() {
  const store = useContext(RoomStoreContext);

  if (!store) {
    throw new Error("RoomStoreProvider is missing");
  }

  return store;
}

export function useRoomState() {
  const store = useRoomStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function useRoomPolling(intervalMs = 1000) {
  const store = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room || !participantId) return;
    
    // Disable polling if the round ended, just as an optimization (optional, we can keep polling)
    if (room.currentRound?.roundStatus === "Ended") return;

    const interval = setInterval(() => {
      store.fetchRoom().catch(console.error);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [store, room?.code, participantId, intervalMs, room?.currentRound?.roundStatus]);
}
