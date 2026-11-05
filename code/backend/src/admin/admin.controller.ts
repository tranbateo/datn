import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

interface AuthenticatedRequest {
  user: {
    id: string;
    role: Role;
    schoolId: string | null;
  };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  async getDashboardStats(@Req() req: AuthenticatedRequest) {
    return this.adminService.getDashboardStats(req.user.schoolId);
  }

  @Get('analytics/stats')
  async getAnalyticsStats(@Req() req: AuthenticatedRequest) {
    return this.adminService.getAnalyticsStats(req.user.schoolId);
  }

  @Get('users/students')
  async getStudents(@Req() req: AuthenticatedRequest) {
    return this.adminService.getStudents(req.user.schoolId);
  }

  @Get('users/teachers')
  async getTeachers(@Req() req: AuthenticatedRequest) {
    return this.adminService.getTeachers(req.user.schoolId);
  }

  @Get('users/parents')
  async getParents(@Req() req: AuthenticatedRequest) {
    return this.adminService.getParents(req.user.schoolId);
  }

  @Get('classes')
  async getClasses(@Req() req: AuthenticatedRequest) {
    return this.adminService.getClasses(req.user.schoolId);
  }

  @Post('classes')
  async createClass(
    @Req() req: AuthenticatedRequest,
    @Body()
    dto: {
      name: string;
      grade: number;
      homeroomTeacherId?: string;
      academicYearName?: string;
      schoolId?: string;
    },
  ) {
    const schoolId = req.user.schoolId || dto.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Vui lòng chọn trường học.');
    }
    return this.adminService.createClass(schoolId, req.user.id, dto);
  }

  @Patch('classes/:id')
  async updateClass(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      grade?: number;
      homeroomTeacherId?: string | null;
    },
  ) {
    return this.adminService.updateClass(
      req.user.schoolId,
      req.user.id,
      id,
      dto,
    );
  }

  @Delete('classes/:id')
  async deleteClass(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.adminService.deleteClass(req.user.schoolId, req.user.id, id);
  }

  @Post('classes/:id/subject-teachers')
  async assignSubjectTeacher(
    @Req() req: AuthenticatedRequest,
    @Param('id') classId: string,
    @Body() dto: { subjectId: string; teacherId: string },
  ) {
    return this.adminService.assignSubjectTeacher(
      req.user.schoolId,
      req.user.id,
      classId,
      dto,
    );
  }

  @Delete('classes/:id/subject-teachers/:subjectId')
  async removeSubjectTeacher(
    @Req() req: AuthenticatedRequest,
    @Param('id') classId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.adminService.removeSubjectTeacher(
      req.user.schoolId,
      req.user.id,
      classId,
      subjectId,
    );
  }

  @Get('academic-years')
  async getAcademicYears(@Req() req: AuthenticatedRequest) {
    return this.adminService.getAcademicYears(req.user.schoolId);
  }

  @Post('academic-years')
  async createAcademicYear(
    @Req() req: AuthenticatedRequest,
    @Body()
    dto: {
      name: string;
      startDate?: string;
      endDate?: string;
      isCurrent?: boolean;
    },
  ) {
    return this.adminService.createAcademicYear(
      req.user.schoolId,
      req.user.id,
      dto,
    );
  }

  @Patch('academic-years/:id/current')
  async setCurrentAcademicYear(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.adminService.setCurrentAcademicYear(
      req.user.schoolId,
      req.user.id,
      id,
    );
  }

  @Delete('academic-years/:id')
  async deleteAcademicYear(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.adminService.deleteAcademicYear(
      req.user.schoolId,
      req.user.id,
      id,
    );
  }

  @Get('subjects')
  async getSubjects() {
    return this.adminService.getSubjects();
  }

  @Post('subjects')
  async createSubject(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; grade: number; description?: string },
  ) {
    return this.adminService.createSubject(req.user.id, dto);
  }

  @Delete('subjects/:id')
  async deleteSubject(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.adminService.deleteSubject(req.user.id, id);
  }

  @Post('students/:studentId/transfer-class')
  async transferStudentClass(
    @Req() req: AuthenticatedRequest,
    @Param('studentId') studentId: string,
    @Body('targetClassId') targetClassId: string,
  ) {
    return this.adminService.transferStudentClass(
      req.user.schoolId,
      req.user.id,
      studentId,
      targetClassId,
    );
  }

  @Get('courses')
  async getCourses(@Req() req: AuthenticatedRequest) {
    return this.adminService.getCourses(req.user.schoolId);
  }

  @Get('quizzes')
  async getQuizzes(@Req() req: AuthenticatedRequest) {
    return this.adminService.getQuizzes(req.user.schoolId);
  }

  @Get('notifications')
  async getNotifications(@Req() req: AuthenticatedRequest) {
    return this.adminService.getNotifications(req.user.schoolId);
  }

  @Post('notifications')
  async broadcastNotification(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { title: string; body: string; targetRole?: string },
  ) {
    return this.adminService.broadcastNotification(
      req.user.schoolId,
      req.user.id,
      dto,
    );
  }

  @Get('feedback')
  getFeedback(@Req() req: AuthenticatedRequest) {
    return this.adminService.getFeedback(req.user.schoolId);
  }

  @Patch('feedback/:id/status')
  updateFeedbackStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateFeedbackStatus(
      req.user.schoolId,
      req.user.id,
      id,
      status,
    );
  }

  @Get('audit-logs')
  getAuditLogs(@Req() req: AuthenticatedRequest) {
    return this.adminService.getAuditLogs(req.user.schoolId);
  }

  @Get('ai-models')
  getAiModels(@Req() req: AuthenticatedRequest) {
    return this.adminService.getAiModels(req.user.schoolId);
  }

  @Get('settings')
  getSettings(@Req() req: AuthenticatedRequest) {
    return this.adminService.getSettings(req.user.schoolId);
  }

  @Post('users')
  async createUser(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateUserDto,
  ) {
    return this.adminService.createUser(dto, req.user.schoolId, req.user.id);
  }

  @Put('users/:id')
  async updateUser(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(
      id,
      dto,
      req.user.schoolId,
      req.user.id,
    );
  }

  @Delete('users/:id')
  async deleteUser(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.adminService.deleteUser(id, req.user.schoolId, req.user.id);
  }
}
