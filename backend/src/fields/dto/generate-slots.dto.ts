import { IsDateString, Matches } from 'class-validator';

export class GenerateSlotsDto {
  @IsDateString() date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'openTime must be HH:mm' })
  openTime!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'closeTime must be HH:mm' })
  closeTime!: string;
}
