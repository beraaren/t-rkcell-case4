import { Controller, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString } from 'class-validator';

class UpsertNoteDto {
  @IsString() text: string;
}

@Controller()
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get('lessons/:lessonId/notes')
  get(@Param('lessonId') lessonId: string, @CurrentUser() user: any) {
    return this.notesService.getByLesson(lessonId, user.id);
  }

  @Put('lessons/:lessonId/notes')
  upsert(@Param('lessonId') lessonId: string, @CurrentUser() user: any, @Body() dto: UpsertNoteDto) {
    return this.notesService.upsertNote(lessonId, user.id, dto.text);
  }

  @Delete('lessons/:lessonId/notes')
  remove(@Param('lessonId') lessonId: string, @CurrentUser() user: any) {
    return this.notesService.deleteNote(lessonId, user.id);
  }

  @Get('me/notes')
  myNotes(@CurrentUser() user: any) {
    return this.notesService.listMyNotes(user.id);
  }
}
