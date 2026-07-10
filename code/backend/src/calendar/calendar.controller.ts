import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  async findAll(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    return this.calendarService.findAll(req.user.id);
  }

  @Post()
  async create(@Req() req: any, @Body() data: CreateCalendarEventDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    return this.calendarService.create(req.user.id, data);
  }

  @Post('ocr')
  @UseInterceptors(FileInterceptor('file'))
  async ocrSchedule(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.calendarService.ocrSchedule(file);
  }
}
