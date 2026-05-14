import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @Get('instructor-stats')
  getInstructorStats(@CurrentUser() user: any) {
    return this.adminService.getInstructorStats(user.id);
  }

  @Get('users')
  getUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getUsers(Number(page) || 1, Number(limit) || 20);
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  @Get('courses')
  getCourses(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getCourses(Number(page) || 1, Number(limit) || 20);
  }

  @Patch('courses/:id/archive')
  archiveCourse(@Param('id') id: string) {
    return this.adminService.archiveCourse(id);
  }

  @Patch('courses/:id/unarchive')
  unarchiveCourse(@Param('id') id: string) {
    return this.adminService.unarchiveCourse(id);
  }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateCourse(id, body);
  }
}
