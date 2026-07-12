import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ParentsService } from './parents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Roles(Role.STUDENT)
  @Get('generate-link-code')
  generateLinkCode(@Req() req: { user: { id: string } }) {
    return this.parentsService.generateLinkCode(req.user.id);
  }

  @Roles(Role.PARENT)
  @Post('link-student')
  linkStudent(
    @Req() req: { user: { id: string } },
    @Body('linkCode') linkCode: string,
  ) {
    return this.parentsService.linkStudent(req.user.id, linkCode);
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
