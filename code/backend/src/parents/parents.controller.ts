import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { ParentsService } from './parents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parents')
export class ParentsController {
  constructor(
    private readonly parentsService: ParentsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Roles(Role.STUDENT)
  @Get('generate-link-code')
  generateLinkCode(@Req() req: { user: { id: string } }) {
    return this.parentsService.generateLinkCode(req.user.id);
  }

  @Roles(Role.PARENT)
  @Post('link-student')
  async linkStudent(
    @Req() req: { user: { id: string } },
    @Body('linkCode') linkCode: string,
  ) {
    const parentId = req.user.id;
    const result = await this.parentsService.linkStudent(parentId, linkCode);

    // Audit Log
    await this.auditLogService.logAction(
      parentId,
      'LINK_STUDENT',
      'ParentStudentLink',
      {
        studentId: result.student.id,
        linkCode,
      },
    );

    return result;
  }

  @Roles(Role.PARENT)
  @Delete('link-student/:studentId')
  async unlinkStudent(
    @Req() req: { user: { id: string } },
    @Param('studentId') studentId: string,
  ) {
    const parentId = req.user.id;
    const result = await this.parentsService.unlinkStudent(parentId, studentId);

    // Audit Log
    await this.auditLogService.logAction(
      parentId,
      'UNLINK_STUDENT',
      'ParentStudentLink',
      {
        studentId,
      },
    );

    return result;
  }

  @Roles(Role.PARENT)
  @Get('dashboard')
  async getDashboard(@Req() req: { user: { id: string } }) {
    return this.parentsService.getDashboard(req.user.id);
  }

  @Roles(Role.PARENT)
  @Get('teachers')
  async getTeachers(@Req() req: { user: { id: string } }) {
    return this.parentsService.getTeachers(req.user.id);
  }
}
