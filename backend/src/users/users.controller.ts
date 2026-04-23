import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VerifiedGuard } from '../common/guards/verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import {
  StorageService,
  makeDiskStorage,
  imageFileFilter,
  MAX_IMAGE_SIZE,
} from '../uploads/storage.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private users: UsersService,
    private storage: StorageService,
  ) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.users.findById(user.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    return this.users.update(user.sub, dto);
  }

  @Post('me/switch-role')
  @UseGuards(VerifiedGuard)
  switchRole(@CurrentUser() user: JwtPayload) {
    return this.users.switchRole(user.sub);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: makeDiskStorage('avatars'),
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const existing = await this.users.findById(user.sub);
    if (existing.avatarUrl) {
      const old = this.storage.filenameFromUrl(existing.avatarUrl, 'avatars');
      if (old) this.storage.remove('avatars', old);
    }
    const url = this.storage.publicUrl('avatars', file.filename);
    return this.users.update(user.sub, { avatarUrl: url });
  }

  @Delete('me/avatar')
  async removeAvatar(@CurrentUser() user: JwtPayload) {
    const existing = await this.users.findById(user.sub);
    if (existing.avatarUrl) {
      const old = this.storage.filenameFromUrl(existing.avatarUrl, 'avatars');
      if (old) this.storage.remove('avatars', old);
    }
    return this.users.update(user.sub, { avatarUrl: null });
  }
}
