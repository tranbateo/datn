import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurriculumService {
  constructor(private prisma: PrismaService) {}

  async getSubjectsByGrade(grade: number) {
    return this.prisma.subject.findMany({
      where: { grade },
      orderBy: { name: 'asc' },
    });
  }
}
