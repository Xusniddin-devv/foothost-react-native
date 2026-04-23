import { apiRequest } from './client';
import type {
  Lobby,
  LobbyPlayer,
  LobbyType,
  Team,
} from '../../types/api';

export interface CreateLobbyDto {
  fieldId: string;
  type: LobbyType;
  maxPlayers: number;
  teamCount: number;
  durationHours: number;
}

export const lobbiesApi = {
  listOpen: () => apiRequest<Lobby[]>({ method: 'GET', url: '/lobbies' }),
  mine: () => apiRequest<Lobby[]>({ method: 'GET', url: '/lobbies/mine' }),
  get: (id: string) =>
    apiRequest<Lobby>({ method: 'GET', url: `/lobbies/${id}` }),
  players: (id: string) =>
    apiRequest<LobbyPlayer[]>({
      method: 'GET',
      url: `/lobbies/${id}/players`,
    }),
  teams: (id: string) =>
    apiRequest<Team[]>({ method: 'GET', url: `/lobbies/${id}/teams` }),
  create: (dto: CreateLobbyDto) =>
    apiRequest<Lobby>({ method: 'POST', url: '/lobbies', data: dto }),
  publish: (id: string) =>
    apiRequest<Lobby>({ method: 'POST', url: `/lobbies/${id}/publish` }),
  join: (id: string, code?: string) =>
    apiRequest<Lobby>({
      method: 'POST',
      url: code ? `/lobbies/${id}/join/${code}` : `/lobbies/${id}/join`,
    }),
  leave: (id: string) =>
    apiRequest<void>({ method: 'DELETE', url: `/lobbies/${id}/leave` }),
  kick: (id: string, userId: string) =>
    apiRequest<void>({
      method: 'POST',
      url: `/lobbies/${id}/kick/${userId}`,
    }),
  cancel: (id: string) =>
    apiRequest<void>({ method: 'DELETE', url: `/lobbies/${id}` }),
  joinTeam: (id: string, teamId: string) =>
    apiRequest<void>({
      method: 'PATCH',
      url: `/lobbies/${id}/teams/${teamId}/join`,
    }),
  invite: (id: string, userId: string, teamId?: string) =>
    apiRequest<LobbyPlayer>({
      method: 'POST',
      url: `/lobbies/${id}/invite/${userId}`,
      params: teamId ? { teamId } : undefined,
    }),
  joinRequests: (id: string) =>
    apiRequest<LobbyPlayer[]>({
      method: 'GET',
      url: `/lobbies/${id}/requests`,
    }),
  approveJoinRequest: (id: string, userId: string) =>
    apiRequest<LobbyPlayer>({
      method: 'POST',
      url: `/lobbies/${id}/requests/${userId}/approve`,
    }),
  updateType: (id: string, type: LobbyType) =>
    apiRequest<Lobby>({
      method: 'PATCH',
      url: `/lobbies/${id}/type`,
      data: { type },
    }),
};
