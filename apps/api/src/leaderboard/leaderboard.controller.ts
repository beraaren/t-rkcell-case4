import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Public()
  @Get()
  get(@Query('limit') limit?: string) {
    return this.leaderboardService.getLeaderboard(limit ? Number(limit) : 50);
  }
}
