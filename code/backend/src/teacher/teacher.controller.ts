/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateQuizDto, CreateQuestionDto } from './dto/teacher.dto';

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
    const teacherId = req.user.id;
    return this.teacherService.getDashboardStats(teacherId);
  }

  @Get('students')
  async getStudents(@Req() req: any) {
    const teacherId = req.user.id;
    return this.teacherService.getStudents(teacherId);
  }

  @Get('courses')
  async getCourses(@Req() req: any) {
    const teacherId = req.user.id;
    return this.teacherService.getCourses(teacherId);
  }

  @Get('questions')
  async getQuestions(@Req() req: any) {
    const teacherId = req.user.id;
    return this.teacherService.getQuestions(teacherId);
  }

  @Get('quizzes')
  async getQuizzes(@Req() req: any) {
    const teacherId = req.user.id;
    return this.teacherService.getQuizzes(teacherId);
  }

  @Post('quizzes')
  async createQuiz(@Req() req: any, @Body() dto: CreateQuizDto) {
    const teacherId = req.user.id;
    return this.teacherService.createQuiz(teacherId, dto);
  }

  @Post('questions')
  async createQuestions(@Req() req: any, @Body() dtos: CreateQuestionDto[]) {
    const teacherId = req.user.id;
    return this.teacherService.createQuestions(teacherId, dtos);
  }

  @Get('documents')
  async getDocuments(@Req() req: any) {
    const teacherId = req.user.id;
    return this.teacherService.getDocuments(teacherId);
  }

  @Post('quizzes/ai-build')
  async createQuizWithAiQuestions(@Req() req: any, @Body() dto: any) {
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

    // 1. Generate questions using AI if not provided
    let generatedQuestions = questions;
    if (!generatedQuestions || generatedQuestions.length === 0) {
      generatedQuestions = await this.quizService.generateAiQuiz({
        courseId,
        topic,
        numQuestions,
      });
    }

    // 2. Save the quiz and questions
    return this.teacherService.createQuizWithAiQuestions(teacherId, {
      title,
      courseId,
      duration,
      isGraduation,
      questions: generatedQuestions,
    });
  }
}
