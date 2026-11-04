/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { Allow, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQuizInputDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  grade?: number;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsBoolean()
  isGraduation?: boolean;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Allow()
  subject?: { connect?: { id: string } };

  @IsOptional()
  @Allow()
  questions?: any;
}

@Controller('quiz')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN)
  create(@Request() req: any, @Body() createQuizDto: CreateQuizInputDto) {
    return this.quizService.create(createQuizDto as any, req.user);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.quizService.findAll(req.user);
  }

  @Get('subject/:subjectId')
  findBySubject(@Request() req: any, @Param('subjectId') subjectId: string) {
    return this.quizService.findBySubject(subjectId, req.user);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.quizService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateQuizDto: Partial<CreateQuizInputDto>,
  ) {
    return this.quizService.update(id, updateQuizDto as any);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN)
  remove(@Param('id') id: string) {
    return this.quizService.remove(id);
  }

  @Post('generate-ai-quiz')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN)
  async generateAiQuiz(@Body() generateQuizDto: GenerateQuizDto) {
    return this.quizService.generateAiQuiz(generateQuizDto);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  async submitQuiz(
    @Param('id') id: string,
    @Body() submitQuizDto: SubmitQuizDto,
    @Request() req: any,
  ) {
    const userId = req.user.id || req.user.userId;
    return this.quizService.submitQuiz(id, userId, submitQuizDto);
  }
}
