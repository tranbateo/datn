import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { QuizModule } from './quiz/quiz.module';
import { ChatRagModule } from './chat-rag/chat-rag.module';
import { DocumentsModule } from './documents/documents.module';
import { SchedulesModule } from './schedules/schedules.module';
import { GamificationModule } from './gamification/gamification.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { CalendarModule } from './calendar/calendar.module';
import { ParentsModule } from './parents/parents.module';
import { AdminModule } from './admin/admin.module';
import { TeacherModule } from './teacher/teacher.module';
import { MessagesModule } from './messages/messages.module';
import { ProposalsModule } from './proposals/proposals.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    QuizModule,
    ChatRagModule,
    DocumentsModule,
    SchedulesModule,
    GamificationModule,
    NotificationsModule,
    CurriculumModule,
    CalendarModule,
    ParentsModule,
    AdminModule,
    TeacherModule,
    MessagesModule,
    ProposalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
