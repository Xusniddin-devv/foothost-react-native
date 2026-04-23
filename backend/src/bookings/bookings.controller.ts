import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VerifiedGuard } from '../common/guards/verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import { JwtPayload } from '../auth/jwt.strategy';

class BookDto {
  @IsString() fieldSlotId!: string;
}

@Controller('bookings')
@UseGuards(JwtAuthGuard, VerifiedGuard)
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Post(':lobbyId/book')
  book(
    @Param('lobbyId') lobbyId: string,
    @Body() body: BookDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.bookings.book(lobbyId, body.fieldSlotId, user.sub);
  }

  @Get(':lobbyId')
  get(@Param('lobbyId') lobbyId: string) {
    return this.bookings.findByLobby(lobbyId);
  }

  @Delete(':lobbyId')
  cancel(
    @Param('lobbyId') lobbyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.bookings.cancel(lobbyId, user.sub);
  }
}
