import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('analytics/stats')
  async getAnalyticsStats() {
    return this.adminService.getAnalyticsStats();
  }

  @Get('users/students')
  async getStudents() {
    return this.adminService.getStudents();
  }

  @Get('users/teachers')
  async getTeachers() {
    return this.adminService.getTeachers();
  }

  @Get('users/parents')
  async getParents() {
    return this.adminService.getParents();
  }

  @Get('courses')
  async getCourses() {
    return this.adminService.getCourses();
  }

  @Get('quizzes')
  async getQuizzes() {
    return this.adminService.getQuizzes();
  }

  @Get('notifications')
  async getNotifications() {
    return this.adminService.getNotifications();
  }

  @Get('feedback')
  getFeedback() {
    return this.adminService.getFeedback();
  }

  @Get('ai-models')
  getAiModels() {
    return this.adminService.getAiModels();
  }

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
