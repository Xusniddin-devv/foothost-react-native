import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Field } from './field.entity';
import { FieldSlot } from './field-slot.entity';
import { CreateFieldDto } from './dto/create-field.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';

@Injectable()
export class FieldsService {
  constructor(
    @InjectRepository(Field) private fieldRepo: Repository<Field>,
    @InjectRepository(FieldSlot) private slotRepo: Repository<FieldSlot>,
  ) {}

  findAll(): Promise<Field[]> {
    return this.fieldRepo.find();
  }

  findByOwner(ownerId: string): Promise<Field[]> {
    return this.fieldRepo.find({ where: { ownerId } });
  }

  async findOne(id: string): Promise<Field> {
    const field = await this.fieldRepo.findOne({ where: { id } });
    if (!field) throw new NotFoundException('Field not found');
    return field;
  }

  create(ownerId: string, dto: CreateFieldDto): Promise<Field> {
    return this.fieldRepo.save(this.fieldRepo.create({ ...dto, ownerId }));
  }

  async update(
    id: string,
    ownerId: string,
    dto: Partial<CreateFieldDto>,
  ): Promise<Field> {
    const field = await this.findOne(id);
    if (field.ownerId !== ownerId) throw new ForbiddenException();
    await this.fieldRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const field = await this.findOne(id);
    if (field.ownerId !== ownerId) throw new ForbiddenException();
    await this.fieldRepo.delete(id);
  }

  async getSlots(fieldId: string, date?: string): Promise<FieldSlot[]> {
    const day = date ?? new Date().toISOString().slice(0, 10);
    const start = new Date(`${day}T00:00:00.000Z`);
    const end = new Date(`${day}T23:59:59.999Z`);
    return this.slotRepo.find({
      where: { fieldId, startTime: Between(start, end) },
      order: { startTime: 'ASC' },
    });
  }

  async generateSlots(
    fieldId: string,
    ownerId: string,
    dto: GenerateSlotsDto,
  ): Promise<FieldSlot[]> {
    const field = await this.findOne(fieldId);
    if (field.ownerId !== ownerId) throw new ForbiddenException();

    const [openH, openM] = dto.openTime.split(':').map(Number);
    const [closeH, closeM] = dto.closeTime.split(':').map(Number);

    const base = new Date(`${dto.date}T00:00:00.000Z`);
    let current = new Date(base);
    current.setUTCHours(openH, openM, 0, 0);
    const close = new Date(base);
    close.setUTCHours(closeH, closeM, 0, 0);

    const slots: Partial<FieldSlot>[] = [];
    while (current < close) {
      const end = new Date(current.getTime() + field.slotDuration * 60_000);
      if (end > close) break;
      slots.push({
        fieldId,
        startTime: new Date(current),
        endTime: new Date(end),
        status: 'available',
      });
      current = end;
    }

    if (slots.length === 0) return [];
    return this.slotRepo.save(slots as FieldSlot[]);
  }
}
