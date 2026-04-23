import { useEffect, useRef } from 'react';
import { lobbySocket } from '../services/realtime/lobbySocket';

export interface LobbySocketHandlers {
  onPlayerJoined?: (payload: unknown) => void;
  onPlayerLeft?: (payload: unknown) => void;
  onPaid?: (payload: unknown) => void;
  onPaymentUpdated?: (payload: unknown) => void;
  onBooked?: (payload: unknown) => void;
  onCancelled?: (payload: unknown) => void;
  onLobbyUpdated?: (payload: unknown) => void;
}

export function useLobbySocket(
  lobbyId: string | undefined,
  handlers: LobbySocketHandlers,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!lobbyId) return;
    let cancelled = false;
    const unsubs: Array<() => void> = [];

    (async () => {
      await lobbySocket.joinRoom(lobbyId);
      if (cancelled) return;

      const bind = (event: Parameters<typeof lobbySocket.on>[0], cb?: (p: unknown) => void) => {
        if (!cb) return;
        unsubs.push(lobbySocket.on(event, cb));
      };

      bind('lobby:player_joined', (p) => {
        handlersRef.current.onPlayerJoined?.(p);
        handlersRef.current.onLobbyUpdated?.(p);
      });
      bind('lobby:player_left', (p) => {
        handlersRef.current.onPlayerLeft?.(p);
        handlersRef.current.onLobbyUpdated?.(p);
      });
      bind('lobby:paid', (p) => {
        handlersRef.current.onPaid?.(p);
        handlersRef.current.onLobbyUpdated?.(p);
      });
      bind('payment:updated', (p) => handlersRef.current.onPaymentUpdated?.(p));
      bind('lobby:booked', (p) => {
        handlersRef.current.onBooked?.(p);
        handlersRef.current.onLobbyUpdated?.(p);
      });
      bind('lobby:cancelled', (p) => {
        handlersRef.current.onCancelled?.(p);
        handlersRef.current.onLobbyUpdated?.(p);
      });
    })();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
      lobbySocket.leaveRoom(lobbyId).catch(() => undefined);
    };
  }, [lobbyId]);
}
