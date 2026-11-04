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

function isValidImageBuffer(buffer?: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return true;
  }
  return false;
}

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
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(
        'Kích thước ảnh không được vượt quá 10MB.',
      );
    }
    if (!isValidImageBuffer(file.buffer)) {
      throw new BadRequestException(
        'Định dạng ảnh không hợp lệ (chỉ chấp nhận JPEG, PNG hoặc WEBP).',
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.calendarService.ocrSchedule(file);
  }
}
