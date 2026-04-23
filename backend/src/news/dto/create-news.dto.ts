import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateNewsDto {
  @IsString() @MinLength(1) title!: string;
  @IsString() @MinLength(1) body!: string;
  @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdateNewsDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsBoolean() published?: boolean;
}
