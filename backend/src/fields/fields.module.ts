import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Field } from './field.entity';
import { FieldSlot } from './field-slot.entity';
import { FieldsService } from './fields.service';
import { FieldsController } from './fields.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Field, FieldSlot])],
  controllers: [FieldsController],
  providers: [FieldsService],
  exports: [FieldsService, TypeOrmModule],
})
export class FieldsModule {}
