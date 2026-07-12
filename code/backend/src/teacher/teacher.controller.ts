/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('dashboard/stats')
  async getDashboardStats(@Req() req: any) {
    const teacherId = req.user.id;
    return this.teacherService.getDashboardStats(teacherId);
  }

  @Get('students')
  async getStudents(@Req() req: any) {
    const teacherId = req.user.id;
    return this.teacherService.getStudents(teacherId);
  }

  @Get('courses')
  async getCourses(@Req() req: any) {
    const teacherId = req.user.id;
    return this.teacherService.getCourses(teacherId);
  }

  @Get('questions')
  async getQuestions(@Req() req: any) {
    const teacherId = req.user.id;
    return this.teacherService.getQuestions(teacherId);
  }

  @Get('documents')
  async getDocuments(@Req() req: any) {
    const teacherId = req.user.id;
    return this.teacherService.getDocuments(teacherId);
  }
}
