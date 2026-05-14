import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller()
export class ModulesController {
  constructor(private modulesService: ModulesService) {}

  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post('courses/:courseId/modules')
  create(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateModuleDto,
  ) {
    return this.modulesService.create(courseId, user.id, dto);
  }

  @Get('courses/:courseId/modules')
  findByCourse(@Param('courseId') courseId: string) {
    return this.modulesService.findByCourse(courseId);
  }

  @Get('modules/:id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }
}
