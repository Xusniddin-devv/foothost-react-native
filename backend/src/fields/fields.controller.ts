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
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FieldOwnerGuard } from '../common/guards/field-owner.guard';
import { VerifiedGuard } from '../common/guards/verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('fields')
export class FieldsController {
  constructor(private fields: FieldsService) {}

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
}
