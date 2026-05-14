import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@Controller()
export class InteractionsController {
  constructor(private interactionsService: InteractionsService) {}

  @Public()
  @Get('lessons/:lessonId/comments')
  getComments(@Param('lessonId') lessonId: string) {
    return this.interactionsService.getComments(lessonId);
  }

  @Post('lessons/:lessonId/comments')
  createComment(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.interactionsService.createComment(lessonId, user.id, dto);
  }

  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.STUDENT)
  @Post('comments/:commentId/reply')
  replyToComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.interactionsService.replyToComment(commentId, user.id, dto);
  }

  @Roles(Role.STUDENT)
  @Post('courses/:courseId/reviews')
  createReview(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.interactionsService.createReview(courseId, user.id, dto);
  }

  @Public()
  @Get('courses/:courseId/reviews')
  getReviews(@Param('courseId') courseId: string) {
    return this.interactionsService.getReviews(courseId);
  }
}
