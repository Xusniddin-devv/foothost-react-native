import { apiClient, apiRequest } from './client';
import type { Field, FieldSlot, Review } from '../../types/api';

export interface CreateFieldDto {
  name: string;
  address: string;
  pricePerHour: number;
  slotDuration: number;
  amenities?: Record<string, boolean>;
  description?: string;
}

export interface GenerateSlotsDto {
  date: string; // YYYY-MM-DD
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
}

export const fieldsApi = {
  list: () => apiRequest<Field[]>({ method: 'GET', url: '/fields' }),
  mine: () => apiRequest<Field[]>({ method: 'GET', url: '/fields/mine' }),
  get: (id: string) =>
    apiRequest<Field>({ method: 'GET', url: `/fields/${id}` }),
  slots: (id: string, date?: string) =>
    apiRequest<FieldSlot[]>({
      method: 'GET',
      url: `/fields/${id}/slots`,
      params: date ? { date } : undefined,
    }),
  create: (dto: CreateFieldDto) =>
    apiRequest<Field>({ method: 'POST', url: '/fields', data: dto }),
  update: (id: string, dto: Partial<CreateFieldDto>) =>
    apiRequest<Field>({ method: 'PATCH', url: `/fields/${id}`, data: dto }),
  remove: (id: string) =>
    apiRequest<void>({ method: 'DELETE', url: `/fields/${id}` }),
  generateSlots: (id: string, dto: GenerateSlotsDto) =>
    apiRequest<FieldSlot[]>({
      method: 'POST',
      url: `/fields/${id}/slots/generate`,
      data: dto,
    }),
  reviews: (id: string) =>
    apiRequest<Review[]>({ method: 'GET', url: `/fields/${id}/reviews` }),
  uploadPhoto: async (id: string, uri: string, name?: string): Promise<Field> => {
    const form = new FormData();
    const filename = name ?? uri.split('/').pop() ?? 'photo.jpg';
    const match = /\.([a-z0-9]+)$/i.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    form.append('file', {
      uri,
      name: filename,
      type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    } as unknown as Blob);
    const res = await apiClient.post<Field>(`/fields/${id}/photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  removePhoto: (id: string, url: string) =>
    apiRequest<Field>({
      method: 'DELETE',
      url: `/fields/${id}/photos`,
      data: { url },
    }),
};
