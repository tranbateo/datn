/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @Roles(Role.STUDENT, Role.TEACHER)
  getSchedules(@Req() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.schedulesService.getSchedules(userId);
  }

  @Post()
  @Roles(Role.STUDENT, Role.TEACHER)
  createSchedule(@Req() req: any, @Body() data: any) {
    const userId = req.user.userId || req.user.id;
    return this.schedulesService.createSchedule(userId, data);
  }

  @Put(':id')
  @Roles(Role.STUDENT, Role.TEACHER)
  updateSchedule(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    const userId = req.user.userId || req.user.id;
    return this.schedulesService.updateSchedule(userId, id, data);
  }

  @Delete(':id')
  @Roles(Role.STUDENT, Role.TEACHER)
  deleteSchedule(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId || req.user.id;
    return this.schedulesService.deleteSchedule(userId, id);
  }

  // API 1: Parse OCR
  @Post('ocr')
  @Roles(Role.STUDENT, Role.TEACHER)
  @UseInterceptors(FileInterceptor('file'))
  async parseOCR(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }
    return this.schedulesService.parseScheduleOCR(file);
  }

  // API 2: Bulk save after OCR verification
  @Post('bulk')
  @Roles(Role.STUDENT, Role.TEACHER)
  async bulkCreateSchedules(@Req() req: any, @Body() body: { events: any[] }) {
    const userId = req.user.userId || req.user.id;
    if (!body.events || !Array.isArray(body.events)) {
      throw new BadRequestException('Invalid events array');
    }
    return this.schedulesService.bulkCreateSchedules(userId, body.events);
  }
}
