import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('otp_codes')
@Index(['phone'])
export class OtpCode {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() phone!: string;
  @Column() code!: string;
  @Column({ type: 'timestamptz' }) expiresAt!: Date;
  @Column({ default: false }) used!: boolean;
}
