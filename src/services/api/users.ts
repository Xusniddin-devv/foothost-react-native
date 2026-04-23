import { apiClient, apiRequest } from './client';
import type { User } from '../../types/api';

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  username?: string | null;
  position?: string | null;
  expoPushToken?: string;
  avatarUrl?: string | null;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const usersApi = {
  me: () => apiRequest<User>({ method: 'GET', url: '/users/me' }),
  update: (dto: UpdateUserDto) =>
    apiRequest<User>({ method: 'PATCH', url: '/users/me', data: dto }),
  changePassword: (dto: ChangePasswordDto) =>
    apiRequest<{ message: string }>({
      method: 'PATCH',
      url: '/users/me/password',
      data: dto,
    }),
  switchRole: () =>
    apiRequest<User>({ method: 'POST', url: '/users/me/switch-role' }),
  removeAvatar: () =>
    apiRequest<User>({ method: 'DELETE', url: '/users/me/avatar' }),
  uploadAvatar: async (uri: string, name?: string): Promise<User> => {
    const form = new FormData();
    const filename = name ?? uri.split('/').pop() ?? 'avatar.jpg';
    const match = /\.([a-z0-9]+)$/i.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    form.append('file', {
      uri,
      name: filename,
      type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    } as unknown as Blob);
    const res = await apiClient.post<User>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  friends: (q?: string) =>
    apiRequest<User[]>({
      method: 'GET',
      url: '/users/friends',
      params: q?.trim() ? { q: q.trim() } : undefined,
    }),
};
