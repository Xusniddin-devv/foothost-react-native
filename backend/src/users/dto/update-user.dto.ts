import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() expoPushToken?: string;
  @ValidateIf((o) => o.avatarUrl !== null) @IsOptional() @IsString() avatarUrl?: string | null;
}
