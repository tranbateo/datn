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

  @Post('quizzes/ai-build')
  async createQuizWithAiQuestions(
    @Req() req: any,
    @Body() dto: AiBuildQuizDto,
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
    } = dto;

    let generatedQuestions = questions;
    if (!generatedQuestions || generatedQuestions.length === 0) {
      generatedQuestions = await this.quizService.generateAiQuiz({
        courseId: courseId || '',
        topic: topic || title,
        numQuestions: numQuestions || 5,
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
