import { IsString, IsInt, IsIn, Min, Max } from 'class-validator';

export type CreateLobbyType = 'open' | 'invite_only' | 'closed';

export class CreateLobbyDto {
  @IsString() fieldId!: string;
  @IsIn(['open', 'invite_only', 'closed']) type!: CreateLobbyType;
  @IsInt() @Min(2) @Max(30) maxPlayers!: number;
  @IsInt() @Min(2) @Max(10) teamCount!: number;
  @IsInt() @Min(1) @Max(4) durationHours!: number;
}
