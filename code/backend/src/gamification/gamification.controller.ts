import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.gamificationService.getProfile(userId);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.gamificationService.getLeaderboard(parsedLimit);
  }
}
