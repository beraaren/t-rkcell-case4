import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [CoursesModule],
  controllers: [UsersController],
})
export class UsersModule {}
