import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FieldOwnerGuard } from '../common/guards/field-owner.guard';
import { VerifiedGuard } from '../common/guards/verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import {
  StorageService,
  makeDiskStorage,
  imageFileFilter,
  MAX_IMAGE_SIZE,
} from '../uploads/storage.service';

@Controller('fields')
export class FieldsController {
  constructor(
    private fields: FieldsService,
    private storage: StorageService,
  ) {}

  @Get()
  getAll() {
    return this.fields.findAll();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, VerifiedGuard, FieldOwnerGuard)
  getMine(@CurrentUser() user: JwtPayload) {
    return this.fields.findByOwner(user.sub);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.fields.findOne(id);
  }

  @Get(':id/slots')
  getSlots(@Param('id') id: string, @Query('date') date?: string) {
    return this.fields.getSlots(id, date);
  }

  @Post()
  @UseGuards(JwtAuthGuard, VerifiedGuard, FieldOwnerGuard)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFieldDto) {
    return this.fields.create(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, VerifiedGuard, FieldOwnerGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: Partial<CreateFieldDto>,
  ) {
    return this.fields.update(id, user.sub, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, VerifiedGuard, FieldOwnerGuard)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.fields.remove(id, user.sub);
  }

  @Post(':id/slots/generate')
  @UseGuards(JwtAuthGuard, VerifiedGuard, FieldOwnerGuard)
  generateSlots(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateSlotsDto,
  ) {
    return this.fields.generateSlots(id, user.sub, dto);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard, VerifiedGuard, FieldOwnerGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: makeDiskStorage('fields'),
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  async uploadPhoto(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = this.storage.publicUrl('fields', file.filename);
    return this.fields.addPhoto(id, user.sub, url);
  }

  @Delete(':id/photos')
  @UseGuards(JwtAuthGuard, VerifiedGuard, FieldOwnerGuard)
  async removePhoto(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body('url') url: string,
  ) {
    if (!url) throw new BadRequestException('url is required');
    const name = this.storage.filenameFromUrl(url, 'fields');
    if (name) this.storage.remove('fields', name);
    return this.fields.removePhoto(id, user.sub, url);
  }
}
