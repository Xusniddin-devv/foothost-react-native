import { apiRequest } from './client';
import type { Review } from '../../types/api';

export interface CreateReviewDto {
  fieldRating: number;
  matchRating: number;
  comment?: string;
}

export const reviewsApi = {
  create: (bookingId: string, dto: CreateReviewDto) =>
    apiRequest<Review>({
      method: 'POST',
      url: `/reviews/${bookingId}`,
      data: dto,
    }),
  byField: (fieldId: string) =>
    apiRequest<Review[]>({
      method: 'GET',
      url: `/fields/${fieldId}/reviews`,
    }),
};
