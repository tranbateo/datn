import { GamificationService } from './gamification.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('GamificationService', () => {
  const createService = (prismaOverrides: Record<string, unknown> = {}) => {
    const mockPrisma = {
      user: { findUnique: jest.fn() },
      classEnrollment: { findFirst: jest.fn() },
      subject: { findMany: jest.fn() },
      course: { findMany: jest.fn() },
      quizAttempt: { findMany: jest.fn() },
      chatSession: { findMany: jest.fn() },
      ...prismaOverrides,
    } as unknown as PrismaService;
    return new GamificationService(mockPrisma);
  };

  it('computes learning levels and XP thresholds accurately', () => {
    const service = createService();

    expect(service.calculateLevel(0)).toBe(1);
    expect(service.calculateLevel(99)).toBe(1);
    expect(service.calculateLevel(100)).toBe(2);
    expect(service.calculateLevel(399)).toBe(2);
    expect(service.calculateLevel(400)).toBe(3);
    expect(service.calculateLevel(900)).toBe(4);

    const level2Progress = service.getLevelThresholds(2, 250);
    expect(level2Progress.currentLevelMinXp).toBe(100);
    expect(level2Progress.nextLevelXp).toBe(400);
    expect(level2Progress.xpInCurrentLevel).toBe(150);
    expect(level2Progress.xpRequiredForNextLevel).toBe(300);
    expect(level2Progress.xpRemainingToNextLevel).toBe(150);
    expect(level2Progress.levelProgressPercent).toBe(50);
  });

  it('computes real per-subject mastery analytics from QuizAttempts and ChatSessions', async () => {
    const service = createService({
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'student-1',
          grade: 6,
          schoolId: 'school-1',
          fullName: 'Nguyễn Minh An',
        }),
      },
      classEnrollment: {
        findFirst: jest.fn().mockResolvedValue({
          class: { name: '6A', grade: 6, schoolId: 'school-1' },
        }),
      },
      subject: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'sub-math', name: 'Toán', grade: 6 },
          { id: 'sub-eng', name: 'Tiếng Anh', grade: 6 },
          { id: 'sub-lit', name: 'Ngữ văn', grade: 6 },
          { id: 'sub-sci', name: 'Khoa học tự nhiên', grade: 6 },
        ]),
      },
      course: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'course-math', subjectId: 'sub-math', title: 'Toán 6' },
          { id: 'course-eng', subjectId: 'sub-eng', title: 'Tiếng Anh 6' },
        ]),
      },
      quizAttempt: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'att-1',
            quizId: 'q-math-2',
            score: 90,
            totalQuestions: 10,
            answers: [{ questionContent: 'Câu 1', isCorrect: true }],
            completedAt: new Date('2026-11-20T10:00:00Z'),
            startedAt: new Date('2026-11-20T09:45:00Z'),
            quiz: {
              id: 'q-math-2',
              title: 'Kiểm tra Chương II Toán 6',
              subjectId: 'sub-math',
              grade: 6,
              isGraduation: false,
              subject: { id: 'sub-math', name: 'Toán', grade: 6 },
            },
          },
          {
            id: 'att-2',
            quizId: 'q-math-1',
            score: 80,
            totalQuestions: 10,
            answers: [],
            completedAt: new Date('2026-11-18T10:00:00Z'),
            startedAt: new Date('2026-11-18T09:45:00Z'),
            quiz: {
              id: 'q-math-1',
              title: 'Kiểm tra Chương I Toán 6',
              subjectId: 'sub-math',
              grade: 6,
              isGraduation: false,
              subject: { id: 'sub-math', name: 'Toán', grade: 6 },
            },
          },
          {
            id: 'att-3',
            quizId: 'q-eng-1',
            score: 45,
            totalQuestions: 10,
            answers: [
              {
                questionContent:
                  'Chia động từ ở thì hiện tại đơn: She (go) to school.',
                isCorrect: false,
              },
            ],
            completedAt: new Date('2026-11-19T10:00:00Z'),
            startedAt: new Date('2026-11-19T09:45:00Z'),
            quiz: {
              id: 'q-eng-1',
              title: 'Unit 1 Present Simple',
              subjectId: 'sub-eng',
              grade: 6,
              isGraduation: false,
              subject: { id: 'sub-eng', name: 'Tiếng Anh', grade: 6 },
            },
          },
          {
            id: 'att-4',
            quizId: 'q-lit-1',
            score: 70,
            totalQuestions: 10,
            answers: [],
            completedAt: new Date('2026-11-17T10:00:00Z'),
            startedAt: new Date('2026-11-17T09:45:00Z'),
            quiz: {
              id: 'q-lit-1',
              title: 'Truyện truyền thuyết',
              subjectId: 'sub-lit',
              grade: 6,
              isGraduation: false,
              subject: { id: 'sub-lit', name: 'Ngữ văn', grade: 6 },
            },
          },
        ]),
      },
      chatSession: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'cs-1', subjectId: 'sub-eng', _count: { messages: 6 } },
          ]),
      },
    });

    const result = await service.getLearningAnalytics('student-1', 'school-1');

    expect(result.grade).toBe(6);
    expect(result.className).toBe('6A');
    expect(result.summary.totalAttempts).toBe(4);
    expect(result.summary.strongCount).toBe(1);
    expect(result.summary.developingCount).toBe(1);
    expect(result.summary.weakCount).toBe(1);
    expect(result.summary.unassessedCount).toBe(1);
    expect(result.weakestSubject?.subjectId).toBe('sub-eng');

    // Sorted: weak (Tiếng Anh) -> developing (Ngữ văn) -> strong (Toán) -> unassessed (KHTN)
    expect(result.subjects.map((s) => s.masteryStatus)).toEqual([
      'weak',
      'developing',
      'strong',
      'unassessed',
    ]);

    const eng = result.subjects[0];
    expect(eng.averageScore).toBe(45);
    expect(eng.aiSessionsCount).toBe(1);
    expect(eng.recentMistakes[0]).toContain('thì hiện tại đơn');

    const math = result.subjects[2];
    expect(math.averageScore).toBe(85);
    expect(math.bestScore).toBe(90);
    expect(math.trend).toBe('up');

    const sci = result.subjects[3];
    expect(sci.averageScore).toBeNull();
    expect(sci.attemptsCount).toBe(0);
  });
});
