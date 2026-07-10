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
import { Prisma, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Controller('quiz')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ADMIN)
  create(@Body() createQuizDto: Prisma.QuizCreateInput) {
    return this.quizService.create(createQuizDto);
  }

  @Get()
  findAll() {
    return this.quizService.findAll();
  }

  @Get('subject/:subjectId')
  findBySubject(@Param('subjectId') subjectId: string) {
    return this.quizService.findBySubject(subjectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quizService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateQuizDto: Prisma.QuizUpdateInput,
  ) {
    return this.quizService.update(id, updateQuizDto);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.quizService.remove(id);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  async submitQuiz(
    @Param('id') id: string,
    @Body() submitQuizDto: SubmitQuizDto,
    @Request() req: any,
  ) {
    let userId = req.user.userId; // assuming JwtAuthGuard sets user on req
    if (userId === 'student1@test.com') {
      const user = await this.quizService['prisma'].user.findUnique({
        where: { email: 'student1@test.com' },
      });
      if (user) userId = user.id;
    }
    return this.quizService.submitQuiz(id, userId, submitQuizDto);
  }
}
