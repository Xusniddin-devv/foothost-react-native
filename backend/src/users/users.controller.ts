import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VerifiedGuard } from '../common/guards/verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

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
}
