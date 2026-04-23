import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type UserRole = 'player' | 'field_owner' | 'both';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() firstName!: string;
  @Column() lastName!: string;
  @Column({ unique: true }) phone!: string;
  @Column() passwordHash!: string;
  @Column({ type: 'varchar', default: 'player' }) role!: UserRole;
  @Column({ default: false }) isPhoneVerified!: boolean;
  @Column({ nullable: true }) expoPushToken!: string | null;
  @CreateDateColumn() createdAt!: Date;
}
