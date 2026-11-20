import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

export type MasteryStatus = 'strong' | 'developing' | 'weak' | 'unassessed';

export interface SubjectMasteryAnalytics {
  subjectId: string;
  subjectName: string;
  grade: number;
  courseId: string | null;
  attemptsCount: number;
  averageScore: number | null;
  bestScore: number | null;
  latestScore: number | null;
  trend: 'up' | 'down' | 'stable' | 'none';
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  aiSessionsCount: number;
  aiMessagesCount: number;
  masteryStatus: MasteryStatus;
  recommendation: string;
  weakQuizzes: Array<{ quizId: string; title: string; score: number }>;
  recentMistakes: string[];
}

interface ParsedAnswerItem {
  questionContent?: string;
  isCorrect?: boolean;
}

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
  }

  getLevelThresholds(level: number, lifetimeXp: number) {
    const safeLevel = Math.max(1, level);
    const currentLevelMinXp = Math.pow(safeLevel - 1, 2) * 100;
    const nextLevelXp = Math.pow(safeLevel, 2) * 100;
    const xpSpan = Math.max(100, nextLevelXp - currentLevelMinXp);
    const xpInCurrentLevel = Math.max(0, lifetimeXp - currentLevelMinXp);
    const xpRemainingToNextLevel = Math.max(0, nextLevelXp - lifetimeXp);
    const levelProgressPercent = Math.min(
      100,
      Math.round((xpInCurrentLevel / xpSpan) * 100),
    );

    return {
      currentLevelMinXp,
      nextLevelXp,
      xpInCurrentLevel,
      xpRequiredForNextLevel: xpSpan,
      xpRemainingToNextLevel,
      levelProgressPercent,
    };
  }

  private calculateStreak(
    currentStreak: number,
    longestStreak: number,
    lastActiveAt: Date,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActiveDate = new Date(lastActiveAt);
    lastActiveDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastActiveDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let newCurrentStreak = currentStreak;
    let newLongestStreak = longestStreak;

    if (diffDays === 1) {
      newCurrentStreak += 1;
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }
    } else if (diffDays > 1) {
      newCurrentStreak = 1;
    }

    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }

    return {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveAt: new Date(),
    };
  }

  async getProfile(userId: string, schoolId?: string | null) {
    let profile = await this.prisma.gamificationProfile.findUnique({
      where: { userId },
      include: { badges: { include: { badge: true } } },
    });

    if (!profile) {
      profile = await this.prisma.gamificationProfile.create({
        data: { userId },
        include: { badges: { include: { badge: true } } },
      });
    } else {
      const streakData = this.calculateStreak(
        profile.currentStreak,
        profile.longestStreak,
        profile.lastActiveAt,
      );

      if (
        profile.currentStreak !== streakData.currentStreak ||
        profile.longestStreak !== streakData.longestStreak ||
        profile.lastActiveAt.toDateString() !==
          streakData.lastActiveAt.toDateString()
      ) {
        profile = await this.prisma.gamificationProfile.update({
          where: { userId },
          data: streakData,
          include: { badges: { include: { badge: true } } },
        });
      }
    }

    const rank =
      (await this.prisma.gamificationProfile.count({
        where: {
          lifetimeXp: {
            gt: profile.lifetimeXp,
          },
          user: {
            role: Role.STUDENT,
            ...(schoolId ? { schoolId } : {}),
          },
        },
      })) + 1;

    const thresholds = this.getLevelThresholds(
      profile.level,
      profile.lifetimeXp,
    );

    return {
      ...profile,
      currentXp: profile.lifetimeXp,
      xp: profile.lifetimeXp,
      ...thresholds,
      streakDays: profile.currentStreak,
      longestStreak: Math.max(profile.longestStreak, profile.currentStreak),
      lastActive: profile.lastActiveAt,
      rank,
      xpRules: {
        quizCorrectAnswerXp: 10,
        aiTutorQuestionXp: 2,
        graduationExamMinPercent: 50,
        formula: 'Cấp độ = ⌊√(Tổng XP / 100)⌋ + 1',
      },
    };
  }

  async addXp(userId: string, amount: number) {
    if (amount <= 0) return null;

    let profile = await this.prisma.gamificationProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      profile = await this.prisma.gamificationProfile.create({
        data: { userId },
      });
    }

    const newXp = profile.lifetimeXp + amount;
    const newSpendableXp = profile.spendableXp + amount;
    // Never decrease learning_level (e.g. if unlocked early via graduation exam)
    const calculatedLevel = this.calculateLevel(newXp);
    const newLevel = Math.max(profile.level, calculatedLevel);

    const streakData = this.calculateStreak(
      profile.currentStreak,
      profile.longestStreak,
      profile.lastActiveAt,
    );

    return this.prisma.gamificationProfile.update({
      where: { userId },
      data: {
        lifetimeXp: newXp,
        spendableXp: newSpendableXp,
        level: newLevel,
        ...streakData,
      },
    });
  }

  async getLeaderboard(
    limit: number = 10,
    schoolId?: string | null,
    grade?: number,
  ) {
    const entries = await this.prisma.gamificationProfile.findMany({
      where: {
        user: {
          role: Role.STUDENT,
          ...(schoolId ? { schoolId } : {}),
          ...(grade && Number.isFinite(grade) ? { grade } : {}),
        },
      },
      take: limit,
      orderBy: [{ lifetimeXp: 'desc' }, { currentStreak: 'desc' }],
      include: {
        user: {
          select: {
            fullName: true,
            studentCode: true,
            grade: true,
            avatarUrl: true,
            email: true,
            classEnrollments: {
              where: { status: 'ACTIVE' },
              take: 1,
              include: {
                class: { select: { name: true, grade: true } },
              },
            },
          },
        },
      },
    });

    return entries.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      xp: entry.lifetimeXp,
      lifetimeXp: entry.lifetimeXp,
      level: entry.level,
      currentStreak: entry.currentStreak,
      longestStreak: entry.longestStreak,
      user: {
        fullName: entry.user?.fullName || 'Học sinh',
        studentCode: entry.user?.studentCode || null,
        grade:
          entry.user?.classEnrollments?.[0]?.class?.grade ??
          entry.user?.grade ??
          null,
        className: entry.user?.classEnrollments?.[0]?.class?.name || null,
        avatarUrl: entry.user?.avatarUrl || null,
        email: entry.user?.email || '',
      },
    }));
  }

  /**
   * Real-data Student Learning Analytics & Adaptive Recommendations (FR-LEARN-001/002/003).
   * Aggregates actual QuizAttempts, per-question error details, and AI Tutor sessions per subject.
   */
  async getLearningAnalytics(userId: string, schoolId?: string | null) {
    const [student, activeClassEnrollment] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, grade: true, schoolId: true, fullName: true },
      }),
      this.prisma.classEnrollment.findFirst({
        where: { studentId: userId, status: 'ACTIVE' },
        include: {
          class: { select: { name: true, grade: true, schoolId: true } },
        },
      }),
    ]);

    const resolvedGrade =
      activeClassEnrollment?.class?.grade ?? student?.grade ?? 6;
    const resolvedSchoolId =
      activeClassEnrollment?.class?.schoolId ??
      student?.schoolId ??
      schoolId ??
      null;
    const resolvedClassName = activeClassEnrollment?.class?.name ?? null;

    const [subjects, courses, attempts, chatSessions] = await Promise.all([
      this.prisma.subject.findMany({
        where: { grade: resolvedGrade },
        orderBy: { name: 'asc' },
      }),
      this.prisma.course.findMany({
        where: {
          grade: resolvedGrade,
          ...(resolvedSchoolId ? { schoolId: resolvedSchoolId } : {}),
        },
        select: { id: true, subjectId: true, title: true },
      }),
      this.prisma.quizAttempt.findMany({
        where: { userId },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              subjectId: true,
              grade: true,
              isGraduation: true,
              subject: { select: { id: true, name: true, grade: true } },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      }),
      this.prisma.chatSession.findMany({
        where: { userId },
        select: {
          id: true,
          subjectId: true,
          _count: { select: { messages: true } },
        },
      }),
    ]);

    const courseBySubjectId = new Map<string, string>();
    for (const c of courses) {
      if (c.subjectId && !courseBySubjectId.has(c.subjectId)) {
        courseBySubjectId.set(c.subjectId, c.id);
      }
    }

    const attemptsBySubjectId = new Map<string, typeof attempts>();
    for (const att of attempts) {
      const sid = att.quiz?.subjectId;
      if (!sid) continue;
      const list = attemptsBySubjectId.get(sid) || [];
      list.push(att);
      attemptsBySubjectId.set(sid, list);
    }

    const chatStatsBySubjectId = new Map<
      string,
      { sessions: number; messages: number }
    >();
    for (const sess of chatSessions) {
      if (!sess.subjectId) continue;
      const prev = chatStatsBySubjectId.get(sess.subjectId) || {
        sessions: 0,
        messages: 0,
      };
      prev.sessions += 1;
      prev.messages += sess._count?.messages || 0;
      chatStatsBySubjectId.set(sess.subjectId, prev);
    }

    const subjectAnalytics: SubjectMasteryAnalytics[] = subjects.map((sub) => {
      const subAttempts = attemptsBySubjectId.get(sub.id) || [];
      const chatStats = chatStatsBySubjectId.get(sub.id) || {
        sessions: 0,
        messages: 0,
      };

      const attemptsCount = subAttempts.length;
      const scores = subAttempts.map((a) =>
        Math.max(0, Math.min(100, Number(a.score || 0))),
      );

      const averageScore =
        attemptsCount > 0
          ? Math.round(scores.reduce((sum, s) => sum + s, 0) / attemptsCount)
          : null;
      const bestScore = attemptsCount > 0 ? Math.max(...scores) : null;
      const latestScore = attemptsCount > 0 ? scores[0] : null;

      let trend: 'up' | 'down' | 'stable' | 'none' = 'none';
      if (attemptsCount >= 2 && latestScore !== null) {
        const prevScores = scores.slice(1);
        const prevAvg =
          prevScores.reduce((sum, s) => sum + s, 0) / prevScores.length;
        if (latestScore - prevAvg >= 5) trend = 'up';
        else if (prevAvg - latestScore >= 5) trend = 'down';
        else trend = 'stable';
      }

      let totalQuestionsAnswered = 0;
      let totalCorrectAnswers = 0;
      const recentMistakes: string[] = [];

      for (const att of subAttempts) {
        totalQuestionsAnswered += att.totalQuestions || 0;
        const parsedAnswers = Array.isArray(att.answers)
          ? (att.answers as ParsedAnswerItem[])
          : [];

        if (parsedAnswers.length > 0) {
          for (const ans of parsedAnswers) {
            if (ans?.isCorrect) {
              totalCorrectAnswers += 1;
            } else if (
              ans?.questionContent &&
              recentMistakes.length < 2 &&
              !recentMistakes.includes(ans.questionContent)
            ) {
              recentMistakes.push(
                ans.questionContent.length > 110
                  ? `${ans.questionContent.slice(0, 107).trim()}...`
                  : ans.questionContent,
              );
            }
          }
        } else if (att.totalQuestions > 0) {
          totalCorrectAnswers += Math.round(
            ((att.score || 0) / 100) * att.totalQuestions,
          );
        }
      }

      // Identify lowest-scoring quizzes (< 75%) to target revision
      const weakQuizzesMap = new Map<
        string,
        { quizId: string; title: string; score: number }
      >();
      for (const att of subAttempts) {
        if (att.score < 75 && att.quiz) {
          const existing = weakQuizzesMap.get(att.quiz.id);
          if (!existing || att.score < existing.score) {
            weakQuizzesMap.set(att.quiz.id, {
              quizId: att.quiz.id,
              title: att.quiz.title,
              score: att.score,
            });
          }
        }
      }
      const weakQuizzes = Array.from(weakQuizzesMap.values())
        .sort((a, b) => a.score - b.score)
        .slice(0, 2);

      let masteryStatus: MasteryStatus = 'unassessed';
      let recommendation =
        chatStats.sessions > 0
          ? `Em đã trao đổi ${chatStats.sessions} phiên với Gia sư AI môn ${sub.name}. Hãy làm 1 bài luyện tập để hệ thống chấm điểm năng lực chính xác!`
          : `Chưa có bài kiểm tra môn ${sub.name}. Hãy làm ngay 1 bài luyện tập đầu vào để hệ thống đánh giá mức độ nắm vững.`;

      if (averageScore !== null) {
        if (averageScore >= 80) {
          masteryStatus = 'strong';
          recommendation = `Nắm rất vững kiến thức môn ${sub.name} (TB ${averageScore}%, cao nhất ${bestScore}%). Hãy thử sức thêm các chuyên đề nâng cao hoặc bài thi vượt cấp.`;
        } else if (averageScore >= 60) {
          masteryStatus = 'developing';
          recommendation = weakQuizzes[0]
            ? `Đang tiến bộ ở mức khá (TB ${averageScore}%). Nên ôn kỹ lại phần "${weakQuizzes[0].title}" (${weakQuizzes[0].score}%) cùng Gia sư AI để bứt phá lên trên 80%.`
            : `Đang tiến bộ ổn định (TB ${averageScore}%). Hãy xem lại các câu làm sai và luyện thêm 1 đề để đạt mức vững kiến thức.`;
        } else {
          masteryStatus = 'weak';
          recommendation = weakQuizzes[0]
            ? `Cần ưu tiên củng cố môn ${sub.name} (TB ${averageScore}%). Trọng tâm cần ôn ngay: "${weakQuizzes[0].title}" (${weakQuizzes[0].score}%) — hãy mở Bài giảng & hỏi Gia sư AI giảng lại từng bước.`
            : `Cần củng cố lại kiến thức nền tảng môn ${sub.name} (TB ${averageScore}%). Hãy đọc lại bài giảng SGK và nhờ Gia sư AI hướng dẫn lại phần còn hổng.`;
        }
      }

      return {
        subjectId: sub.id,
        subjectName: sub.name,
        grade: sub.grade,
        courseId: courseBySubjectId.get(sub.id) || null,
        attemptsCount,
        averageScore,
        bestScore,
        latestScore,
        trend,
        totalQuestionsAnswered,
        totalCorrectAnswers,
        aiSessionsCount: chatStats.sessions,
        aiMessagesCount: chatStats.messages,
        masteryStatus,
        recommendation,
        weakQuizzes,
        recentMistakes,
      };
    });

    // Order: weak -> developing -> strong -> unassessed (so urgent subjects stand out clearly)
    const statusPriority: Record<MasteryStatus, number> = {
      weak: 0,
      developing: 1,
      strong: 2,
      unassessed: 3,
    };
    subjectAnalytics.sort((a, b) => {
      const pDiff =
        statusPriority[a.masteryStatus] - statusPriority[b.masteryStatus];
      if (pDiff !== 0) return pDiff;
      if (a.averageScore !== null && b.averageScore !== null) {
        return a.averageScore - b.averageScore;
      }
      return a.subjectName.localeCompare(b.subjectName, 'vi');
    });

    const assessedSubjects = subjectAnalytics.filter(
      (s) => s.averageScore !== null,
    );
    const overallAverageScore =
      attempts.length > 0
        ? Math.round(
            attempts.reduce((sum, a) => sum + (a.score || 0), 0) /
              attempts.length,
          )
        : null;

    const weakestSubject =
      assessedSubjects.length > 0
        ? [...assessedSubjects].sort(
            (a, b) => (a.averageScore ?? 100) - (b.averageScore ?? 100),
          )[0]
        : subjectAnalytics[0] || null;

    const recentAttempts = attempts.slice(0, 6).map((a) => ({
      id: a.id,
      quizId: a.quizId,
      quizTitle: a.quiz?.title || 'Bài luyện tập',
      subjectId: a.quiz?.subjectId || null,
      subjectName: a.quiz?.subject?.name || 'Tổng hợp',
      score: a.score,
      totalQuestions: a.totalQuestions,
      isGraduation: Boolean(a.quiz?.isGraduation),
      completedAt: (a.completedAt || a.startedAt).toISOString(),
    }));

    return {
      grade: resolvedGrade,
      className: resolvedClassName,
      summary: {
        totalAttempts: attempts.length,
        overallAverageScore,
        totalAiSessions: chatSessions.length,
        strongCount: subjectAnalytics.filter(
          (s) => s.masteryStatus === 'strong',
        ).length,
        developingCount: subjectAnalytics.filter(
          (s) => s.masteryStatus === 'developing',
        ).length,
        weakCount: subjectAnalytics.filter((s) => s.masteryStatus === 'weak')
          .length,
        unassessedCount: subjectAnalytics.filter(
          (s) => s.masteryStatus === 'unassessed',
        ).length,
      },
      weakestSubject: weakestSubject
        ? {
            subjectId: weakestSubject.subjectId,
            subjectName: weakestSubject.subjectName,
            grade: weakestSubject.grade,
            averageScore: weakestSubject.averageScore,
            masteryStatus: weakestSubject.masteryStatus,
          }
        : null,
      subjects: subjectAnalytics,
      recentAttempts,
      methodology: {
        strongThreshold: 80,
        developingThreshold: 60,
        xpPerCorrectAnswer: 10,
        xpPerAiQuestion: 2,
        levelFormula: 'Cấp độ = ⌊√(Tổng XP / 100)⌋ + 1',
      },
    };
  }
}
