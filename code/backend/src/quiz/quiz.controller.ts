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
  submitQuiz(
    @Param('id') id: string,
    @Body() submitQuizDto: SubmitQuizDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId; // assuming JwtAuthGuard sets user on req
    return this.quizService.submitQuiz(id, userId, submitQuizDto);
  }
}
