import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { tokenStorage } from '../auth/tokenStorage';

export type LobbyEvent =
  | 'lobby:player_joined'
  | 'lobby:player_left'
  | 'lobby:paid'
  | 'payment:updated'
  | 'lobby:booked'
  | 'lobby:cancelled';

let socket: Socket | null = null;

async function connect(): Promise<Socket> {
  if (socket?.connected) return socket;
  const token = await tokenStorage.getAccess();
  socket = io(`${SOCKET_URL}/lobbies`, {
    transports: ['websocket'],
    auth: { token },
    forceNew: false,
    reconnection: true,
  });
  return socket;
}

export const lobbySocket = {
  async joinRoom(lobbyId: string): Promise<Socket> {
    const s = await connect();
    s.emit('lobby:join_room', { lobbyId });
    return s;
  },

  async leaveRoom(lobbyId: string): Promise<void> {
    if (!socket) return;
    socket.emit('lobby:leave_room', { lobbyId });
  },

  on<T = unknown>(event: LobbyEvent, cb: (payload: T) => void): () => void {
    if (!socket) return () => undefined;
    socket.on(event, cb as (...args: unknown[]) => void);
    return () => socket?.off(event, cb as (...args: unknown[]) => void);
  },

  disconnect(): void {
    socket?.disconnect();
    socket = null;
  },
};
