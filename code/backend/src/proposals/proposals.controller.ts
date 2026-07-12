/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Roles(Role.PARENT)
  @Post()
  async createProposal(
    @Req() req: any,
    @Body('teacherId') teacherId: string,
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('studentId') studentId?: string,
  ) {
    return this.proposalsService.createProposal(
      req.user.id,
      teacherId,
      title,
      content,
      studentId,
    );
  }

  @Roles(Role.PARENT)
  @Get('parent')
  async getMyProposals(@Req() req: any) {
    return this.proposalsService.getProposalsByParent(req.user.id);
  }

  @Roles(Role.TEACHER)
  @Get('teacher')
  async getTeacherProposals(@Req() req: any) {
    return this.proposalsService.getProposalsByTeacher(req.user.id);
  }

  @Roles(Role.TEACHER)
  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') proposalId: string,
    @Body('status') status: string,
  ) {
    return this.proposalsService.updateProposalStatus(
      req.user.id,
      proposalId,
      status,
    );
  }
}
