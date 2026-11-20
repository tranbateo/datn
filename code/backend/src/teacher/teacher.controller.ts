/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  CreateQuizDto,
  CreateQuestionDto,
  AiBuildQuizDto,
} from './dto/teacher.dto';
import { QuizService } from '../quiz/quiz.service';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly quizService: QuizService,
  ) {}

  @Get('dashboard/stats')
  async getDashboardStats(@Req() req: any) {
    return this.teacherService.getDashboardStats(req.user.id);
  }

  @Get('classes')
  async getMyClasses(@Req() req: any) {
    return this.teacherService.getMyClasses(req.user.id);
  }

  @Get('students')
  async getStudents(@Req() req: any) {
    return this.teacherService.getStudents(req.user.id);
  }

  @Get('password-reset-requests')
  async getPasswordResetRequests(@Req() req: any) {
    return this.teacherService.getHomeroomPasswordResetRequests(req.user.id);
  }

  @Post('students/:studentId/reset-password')
  async resetHomeroomStudentPassword(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    return this.teacherService.resetHomeroomStudentPassword(
      req.user.id,
      studentId,
    );
  }

  @Get('parents')
  async getScopedParents(@Req() req: any) {
    return this.teacherService.getScopedParents(req.user.id);
  }

  @Post('notifications/send')
  async sendScopedNotification(
    @Req() req: any,
    @Body()
    body: {
      targetType: 'CLASS' | 'STUDENT';
      classId?: string;
      studentId?: string;
      audience: 'PARENTS' | 'STUDENTS' | 'BOTH';
      title: string;
      body: string;
    },
  ) {
    return this.teacherService.sendScopedNotification(req.user.id, body);
  }

  @Get('courses')
  async getCourses(@Req() req: any) {
    return this.teacherService.getCourses(req.user.id);
  }

  @Get('questions')
  async getQuestions(@Req() req: any) {
    return this.teacherService.getQuestions(req.user.id);
  }

  @Get('quizzes')
  async getQuizzes(@Req() req: any) {
    return this.teacherService.getQuizzes(req.user.id);
  }

  @Post('quizzes')
  async createQuiz(@Req() req: any, @Body() dto: CreateQuizDto) {
    return this.teacherService.createQuiz(req.user.id, dto);
  }

  @Patch('quizzes/:id/status')
  async updateQuizStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.teacherService.updateQuizStatus(req.user.id, id, status);
  }

  @Patch('attempts/:attemptId/score')
  async updateAttemptScore(
    @Req() req: any,
    @Param('attemptId') attemptId: string,
    @Body() body: { score: number; reason: string },
  ) {
    return this.teacherService.updateAttemptScore(
      req.user.id,
      attemptId,
      body.score,
      body.reason,
    );
  }

  @Post('questions')
  async createQuestions(@Req() req: any, @Body() dtos: CreateQuestionDto[]) {
    return this.teacherService.createQuestions(req.user.id, dtos);
  }

  @Get('documents')
  async getDocuments(@Req() req: any) {
    return this.teacherService.getDocuments(req.user.id);
  }

  @Patch('documents/:id/status')
  async updateDocumentStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.teacherService.updateDocumentStatus(req.user.id, id, status);
  }

  @Delete('documents/:id')
  async deleteDocument(@Req() req: any, @Param('id') id: string) {
    return this.teacherService.deleteDocument(req.user.id, id);
  }

  @Get('students/:studentId/attempts')
  async getStudentAttempts(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    return this.teacherService.getStudentAttempts(req.user.id, studentId);
  }

  @Get('quizzes/:id/details')
  async getQuizDetails(@Req() req: any, @Param('id') id: string) {
    return this.teacherService.getQuizDetails(req.user.id, id);
  }

  @Post('quizzes/solve-manual')
  async solveManualQuizQuestions(
    @Req() req: any,
    @Body()
    body: {
      courseId?: string;
      questions: Array<{
        content: string;
        options?: string[];
        correctOption?: string | number | null;
        explanation?: string | null;
      }>;
    },
  ) {
    let subjectName: string | null = null;
    let grade: number | null = null;
    if (body.courseId) {
      const courses = await this.teacherService.getCourses(req.user.id);
      const matched = courses.find((c) => c.id === body.courseId);
      if (matched) {
        subjectName = matched.subject;
        grade = matched.gradeNum || null;
      }
    }
    return this.quizService.solveManualQuestionsWithAi({
      subjectName,
      grade,
      questions: body.questions || [],
    });
  }

  @Post('quizzes/ai-build')
  async createQuizWithAiQuestions(
    @Req() req: any,
    @Body() dto: AiBuildQuizDto & { autoSolveWithAi?: boolean },
  ) {
    const teacherId = req.user.id;
    const {
      title,
      courseId,
      topic,
      numQuestions,
      duration,
      isGraduation,
      questions,
      autoSolveWithAi,
    } = dto;

    let generatedQuestions = questions;
    if (!generatedQuestions || generatedQuestions.length === 0) {
      generatedQuestions = await this.quizService.generateAiQuiz({
        courseId: courseId || '',
        topic: topic || title,
        numQuestions: numQuestions || 5,
      });
    } else if (
      autoSolveWithAi ||
      generatedQuestions.some(
        (q: any) =>
          q.correctOption === undefined ||
          q.correctOption === null ||
          String(q.correctOption).trim() === '',
      )
    ) {
      let subjectName: string | null = null;
      let grade: number | null = null;
      if (courseId) {
        const courses = await this.teacherService.getCourses(teacherId);
        const matched = courses.find((c) => c.id === courseId);
        if (matched) {
          subjectName = matched.subject;
          grade = matched.gradeNum || null;
        }
      }
      generatedQuestions = await this.quizService.solveManualQuestionsWithAi({
        subjectName,
        grade,
        questions: generatedQuestions,
      });
    }

    return this.teacherService.createQuizWithAiQuestions(teacherId, {
      title,
      courseId,
      duration,
      isGraduation,
      questions: generatedQuestions,
    });
  }
}
