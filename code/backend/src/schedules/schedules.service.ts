import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';

@Injectable()
export class SchedulesService {
  private model: ChatGoogleGenerativeAI;

  constructor(private prisma: PrismaService) {
    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash-latest', // Use flash for fast vision
      maxOutputTokens: 2048,
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async getSchedules(userId: string) {
    return this.prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startTime: 'asc' },
    });
  }

  async createSchedule(userId: string, data: any) {
    const payload = { ...data, userId };
    if (payload.startTime) payload.startTime = new Date(payload.startTime);
    if (payload.endTime) payload.endTime = new Date(payload.endTime);

    return this.prisma.calendarEvent.create({
      data: payload,
    });
  }

  async updateSchedule(userId: string, id: string, data: any) {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!event || event.userId !== userId)
      throw new BadRequestException('Event not found or unauthorized');

    const payload = { ...data };
    if (payload.startTime) payload.startTime = new Date(payload.startTime);
    if (payload.endTime) payload.endTime = new Date(payload.endTime);

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
      // 1. Convert file to base64
      const base64Image = file.buffer.toString('base64');
      const mimeType = file.mimetype;

      // 2. Send to Gemini Vision
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

      // 3. Parse JSON from response
      let contentStr = '';
      if (typeof response.content === 'string') {
        contentStr = response.content;
      } else if (Array.isArray(response.content)) {
        contentStr = response.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('');
      } else {
        contentStr = JSON.stringify(response.content);
      }
      
      // Clean up potential markdown formatting (```json ... ```)
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
    // Convert string dates to Date objects if needed, and inject userId
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
