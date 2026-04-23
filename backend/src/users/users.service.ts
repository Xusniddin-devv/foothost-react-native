import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.userRepo.update(id, dto);
    return this.findById(id);
  }

  async switchRole(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user.isPhoneVerified) {
      throw new BadRequestException('Phone verification required to switch role');
    }
    const newRole: UserRole =
      user.role === 'player'
        ? 'field_owner'
        : user.role === 'field_owner'
          ? 'player'
          : 'both';
    await this.userRepo.update(id, { role: newRole });
    return this.findById(id);
  }
}
