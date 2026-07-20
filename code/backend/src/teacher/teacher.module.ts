import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { PrismaModule } from '../prisma/prisma.module';

import { QuizModule } from '../quiz/quiz.module';

@Module({
  imports: [PrismaModule, QuizModule],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
