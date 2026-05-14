import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  chat(@CurrentUser() user: any, @Body() dto: ChatDto) {
    return this.aiService.chat(user.id, dto);
  }

  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post('generate-questions')
  generateQuestions(@CurrentUser() user: any, @Body() dto: GenerateQuestionsDto) {
    return this.aiService.generateQuestions(user.id, dto);
  }
}
