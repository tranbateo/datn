/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GamificationService } from '../gamification/gamification.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Injectable()
export class QuizService {
  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {}

  async create(data: Prisma.QuizCreateInput) {
    if (data.grade && data.subject?.connect?.id) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: data.subject.connect.id },
      });
      if (subject && subject.grade !== data.grade) {
        throw new BadRequestException(
          `Môn ${subject.name} (lớp ${subject.grade}) không phù hợp với bài kiểm tra lớp ${data.grade}`,
        );
      }
    }
    return this.prisma.quiz.create({ data });
  }

  async findAll() {
    return this.prisma.quiz.findMany({
      include: { questions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { questions: true },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async update(id: string, data: Prisma.QuizUpdateInput) {
    if (data.grade || data.subject?.connect?.id) {
      const quiz = await this.prisma.quiz.findUnique({ where: { id } });
      const newGrade = data.grade !== undefined ? data.grade : quiz?.grade;
      const newSubjectId = data.subject?.connect?.id;

      if (newGrade && newSubjectId) {
        const subject = await this.prisma.subject.findUnique({
          where: { id: newSubjectId },
        });
        if (subject && subject.grade !== newGrade) {
          throw new BadRequestException(
            `Môn ${subject.name} (lớp ${subject.grade}) không phù hợp với bài kiểm tra lớp ${newGrade}`,
          );
        }
      }
    }
    return this.prisma.quiz.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.quiz.delete({
      where: { id },
    });
  }

  async submitQuiz(quizId: string, userId: string, dto: SubmitQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    let score = 0;
    const totalQuestions = quiz.questions.length;

    // Calculate score
    for (const answer of dto.answers) {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      if (question && question.correctOption === answer.selectedOption) {
        score++;
      }
    }

    // Save attempt
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        score,
        totalQuestions,
        answers: JSON.stringify(dto.answers),
        completedAt: new Date(),
      },
    });

    // Add XP for student (e.g. 10 XP per correct answer)
    const xpEarned = score * 10;
    if (xpEarned > 0) {
      await this.gamificationService.addXp(userId, xpEarned);
    }

    return {
      attemptId: attempt.id,
      score,
      totalQuestions,
      xpEarned,
    };
  }
}
