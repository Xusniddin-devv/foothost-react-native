import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NewsService } from './news.service';
import { CreateNewsDto, UpdateNewsDto } from './dto/create-news.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import {
  StorageService,
  makeDiskStorage,
  imageFileFilter,
  MAX_IMAGE_SIZE,
} from '../uploads/storage.service';

@Controller('news')
export class NewsController {
  constructor(
    private news: NewsService,
    private storage: StorageService,
  ) {}

  @Get()
  list() {
    return this.news.findPublished();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAll() {
    return this.news.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.news.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateNewsDto) {
    return this.news.create(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.news.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    const existing = await this.news.findOne(id);
    if (existing.imageUrl) {
      const name = this.storage.filenameFromUrl(existing.imageUrl, 'news');
      if (name) this.storage.remove('news', name);
    }
    await this.news.remove(id);
    return { deleted: true };
  }

  @Post(':id/image')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: makeDiskStorage('news'),
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const existing = await this.news.findOne(id);
    if (existing.imageUrl) {
      const name = this.storage.filenameFromUrl(existing.imageUrl, 'news');
      if (name) this.storage.remove('news', name);
    }
    const url = this.storage.publicUrl('news', file.filename);
    return this.news.updateImage(id, url);
  }

  @Delete(':id/image')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async removeImage(@Param('id') id: string) {
    const existing = await this.news.findOne(id);
    if (existing.imageUrl) {
      const name = this.storage.filenameFromUrl(existing.imageUrl, 'news');
      if (name) this.storage.remove('news', name);
    }
    return this.news.updateImage(id, null);
  }
}
