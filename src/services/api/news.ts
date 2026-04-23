import { apiRequest } from './client';
import type { News } from '../../types/api';

export const newsApi = {
  list: () => apiRequest<News[]>({ method: 'GET', url: '/news' }),
  get: (id: string) =>
    apiRequest<News>({ method: 'GET', url: `/news/${id}` }),
};
