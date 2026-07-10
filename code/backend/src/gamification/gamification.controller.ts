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
    let userId = req.user.userId || req.user.id;
    // Bổ sung logic lấy ID thực từ DB cho Mock User (test UI)
    if (userId === 'student1@test.com') {
      const user = await this.gamificationService['prisma'].user.findUnique({
        where: { email: 'student1@test.com' },
      });
      if (user) userId = user.id;
    }
    return this.gamificationService.getProfile(userId);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.gamificationService.getLeaderboard(parsedLimit);
  }
}
