import { IsString, IsInt, IsOptional, IsObject, Min } from 'class-validator';

export class CreateFieldDto {
  @IsString() name!: string;
  @IsString() address!: string;
  @IsInt() @Min(1000) pricePerHour!: number;
  @IsInt() slotDuration!: number;
  @IsOptional() @IsObject() amenities?: Record<string, boolean>;
  @IsOptional() @IsString() description?: string;
}
