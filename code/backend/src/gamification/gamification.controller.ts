/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.gamificationService.getProfile(userId, req.user.schoolId);
  }

  @Get('analytics')
  async getLearningAnalytics(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.gamificationService.getLearningAnalytics(
      userId,
      req.user.schoolId,
    );
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('grade') grade?: string,
  ) {
    const parsedLimit = Math.min(50, limit ? parseInt(limit, 10) : 10);
    const parsedGrade = grade ? parseInt(grade, 10) : undefined;
    return this.gamificationService.getLeaderboard(
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10,
      req.user.schoolId,
      parsedGrade && Number.isFinite(parsedGrade) ? parsedGrade : undefined,
    );
  }
}
