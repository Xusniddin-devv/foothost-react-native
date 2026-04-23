import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsInt() @Min(1) @Max(5) fieldRating!: number;
  @IsInt() @Min(1) @Max(5) matchRating!: number;
  @IsOptional() @IsString() comment?: string;
}
