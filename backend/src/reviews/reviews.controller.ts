import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VerifiedGuard } from '../common/guards/verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller()
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Post('reviews/:bookingId')
  @UseGuards(JwtAuthGuard, VerifiedGuard)
  create(
    @Param('bookingId') id: string,
    @CurrentUser() u: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.create(id, u.sub, dto);
  }

  @Get('fields/:id/reviews')
  getFieldReviews(@Param('id') id: string) {
    return this.reviews.findByField(id);
  }
}
