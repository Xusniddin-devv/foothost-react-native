import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Field } from './field.entity';

export type SlotStatus = 'available' | 'locked' | 'booked';

@Entity('field_slots')
export class FieldSlot {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() fieldId!: string;
  @ManyToOne(() => Field) @JoinColumn({ name: 'fieldId' }) field!: Field;
  @Column({ type: 'timestamptz' }) startTime!: Date;
  @Column({ type: 'timestamptz' }) endTime!: Date;
  @Column({ type: 'varchar', default: 'available' }) status!: SlotStatus;
}
