import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startTime: 'asc' },
    });
  }

  async create(userId: string, data: CreateCalendarEventDto) {
    return this.prisma.calendarEvent.create({
      data: {
        userId,
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      },
    });
  }

  async ocrSchedule(file: Express.Multer.File) {
    try {
      const model = new ChatGoogleGenerativeAI({
        model: 'gemini-1.5-flash',
        maxOutputTokens: 2048,
      });

      const base64Image = file.buffer.toString('base64');
      const mimeType = file.mimetype;

      const prompt = `Bạn là một trợ lý AI phân tích thời khoá biểu. 
Hãy đọc hình ảnh thời khoá biểu đính kèm và trích xuất tất cả các buổi học/lớp học.
Trả về dữ liệu DƯỚI DẠNG MỘT MẢNG JSON hợp lệ. Không trả về Markdown block (\`\`\`json), chỉ trả về nguyên văn text JSON.
Mỗi object trong mảng có cấu trúc sau:
{
  "title": "Tên môn học (ví dụ: Toán học)",
  "description": "Ghi chú thêm nếu có (tên giáo viên, phòng học...)",
  "type": "CLASS", // mặc định là CLASS
  "startTime": "2024-10-15T08:00:00Z", // Ngày giờ bắt đầu (định dạng ISO 8601). Nếu lịch không có ngày cụ thể mà chỉ có Thứ, hãy tự động gán vào ngày của tuần hiện tại.
  "endTime": "2024-10-15T10:00:00Z"
}`;

      const message = new HumanMessage({
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: `data:${mimeType};base64,${base64Image}`,
          },
        ],
      });

      const response = await model.invoke([message]);
      let jsonString = response.content as string;

      // Clean up markdown block if model still outputs it
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```/g, '').trim();
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(jsonString);
    } catch (error) {
      this.logger.error('OCR Schedule Error', error);
      throw new Error('Failed to process schedule image');
    }
  }
}
