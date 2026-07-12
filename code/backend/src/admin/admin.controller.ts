import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
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
  getAnalyticsStats() {
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
}
