/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { HumanMessage } from '@langchain/core/messages';
import {
  AiChatModelAdapter,
  createChatModelAdapter,
} from '../common/ai-provider.adapter';

@Injectable()
export class SchedulesService {
  private model: AiChatModelAdapter;

  constructor(private prisma: PrismaService) {
    this.model = createChatModelAdapter({
      isVisionTask: true,
      maxOutputTokens: 2048,
    });
  }

  async getSchedules(userId: string) {
    return this.prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startTime: 'asc' },
    });
  }

  private sanitizeEventPayload(data: any) {
    const allowed: Record<string, any> = {};
    if (typeof data?.title === 'string' && data.title.trim()) {
      allowed.title = data.title.trim();
    }
    if (data?.description !== undefined) {
      allowed.description =
        typeof data.description === 'string' ? data.description.trim() : null;
    }
    if (typeof data?.type === 'string' && data.type.trim()) {
      allowed.type = data.type.trim().toUpperCase();
    }
    if (typeof data?.color === 'string' && data.color.trim()) {
      allowed.color = data.color.trim();
    }
    if (data?.startTime) {
      allowed.startTime = new Date(data.startTime);
    }
    if (data?.endTime) {
      allowed.endTime = new Date(data.endTime);
    }
    return allowed;
  }

  async createSchedule(userId: string, data: any) {
    const clean = this.sanitizeEventPayload(data);
    if (!clean.title || !clean.startTime || !clean.endTime) {
      throw new BadRequestException(
        'Vui lòng nhập tiêu đề, thời gian bắt đầu và thời gian kết thúc.',
      );
    }

    return this.prisma.calendarEvent.create({
      data: {
        title: clean.title,
        description: clean.description ?? null,
        type: clean.type || 'CLASS',
        color: clean.color || 'bg-blue-500',
        startTime: clean.startTime,
        endTime: clean.endTime,
        userId,
      },
    });
  }

  async updateSchedule(userId: string, id: string, data: any) {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!event || event.userId !== userId)
      throw new BadRequestException('Event not found or unauthorized');

    const payload = this.sanitizeEventPayload(data);

    return this.prisma.calendarEvent.update({
      where: { id },
      data: payload,
    });
  }

  async deleteSchedule(userId: string, id: string) {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!event || event.userId !== userId)
      throw new BadRequestException('Event not found or unauthorized');

    return this.prisma.calendarEvent.delete({ where: { id } });
  }

  async parseScheduleOCR(file: Express.Multer.File) {
    try {
      const base64Image = file.buffer.toString('base64');
      const mimeType = file.mimetype;

      const response = await this.model.invoke([
        new HumanMessage({
          content: [
            {
              type: 'text',
              text: `Bạn là một trợ lý ảo chuyên trích xuất dữ liệu từ hình ảnh thời khóa biểu.
Nhiệm vụ của bạn là đọc ảnh này và trả về DỮ LIỆU ĐỊNH DẠNG JSON.
Tuyệt đối KHÔNG in ra bất cứ chữ nào khác ngoài JSON.

Cấu trúc JSON yêu cầu là một mảng các object như sau:
[
  {
    "title": "Tên môn học (Ví dụ: Toán, Lý, Lập trình Web)",
    "description": "Ghi chú thêm nếu có (ví dụ: Phòng học, Giáo viên)",
    "type": "CLASS", 
    "startTime": "2024-10-25T08:00:00Z", 
    "endTime": "2024-10-25T10:00:00Z",
    "color": "border-blue-500"
  }
]
Chú ý: type có thể là CLASS, EXAM, ASSIGNMENT, MEETING. color hãy random các màu Tailwind nhạt (ví dụ: border-blue-500, border-purple-500, border-rose-500, border-emerald-500). Ngày tháng hãy dùng ngày gần nhất hợp lý nếu trong ảnh chỉ có thứ.`,
            },
            {
              type: 'image_url',
              image_url: `data:${mimeType};base64,${base64Image}`,
            },
          ],
        }),
      ]);

      let contentStr = '';
      if (typeof response.content === 'string') {
        contentStr = response.content;
      } else if (Array.isArray(response.content)) {
        contentStr = response.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('');
      } else {
        contentStr = JSON.stringify(response.content);
      }

      const cleanedStr = contentStr
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsedSchedules = JSON.parse(cleanedStr);

      return parsedSchedules;
    } catch (error) {
      console.error('OCR Error:', error);
      throw new InternalServerErrorException('Failed to process image OCR');
    }
  }

  async bulkCreateSchedules(userId: string, events: any[]) {
    const dataToInsert = events.map((e) => ({
      ...e,
      startTime: new Date(e.startTime),
      endTime: new Date(e.endTime),
      userId,
    }));

    return this.prisma.calendarEvent.createMany({
      data: dataToInsert,
    });
  }
}
