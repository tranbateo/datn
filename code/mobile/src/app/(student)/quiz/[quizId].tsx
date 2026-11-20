import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  parseQuestionOptions,
  quizApi,
  type Question,
  type QuestionResult,
  type Quiz,
} from '@/services/mobile.services';
import {
  ADAPTIVE_CONTENT_STYLE,
  Badge,
  Card,
  ErrorView,
  LoadingView,
  PrimaryButton,
  RichText,
  usePalette,
} from '@/components/ui/mobile-ui';

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function isEssayQuestion(q: Question): boolean {
  const opts = parseQuestionOptions(q.options);
  return (
    q.questionType === 'ESSAY' ||
    opts.length === 0 ||
    String(q.content || '').includes('[Tự luận')
  );
}

export default function QuizExamScreen() {
  const p = usePalette();
  const router = useRouter();
  const { quizId, attemptId } = useLocalSearchParams<{
    quizId: string;
    attemptId?: string;
  }>();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(1800);
  const [filterMode, setFilterMode] = useState<'all' | 'focus'>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    score: number;
    normalizedScore: number;
    total: number;
    xp: number;
    resultsMap: Record<string, QuestionResult>;
  } | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const questionOffsets = useRef<Record<string, number>>({});
  const submittedRef = useRef(false);
  const answersRef = useRef<Record<string, string>>({});

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const loadQuiz = useCallback(async () => {
    if (!quizId) return;
    try {
      if (attemptId) {
        const detail = await quizApi.getAttemptDetail(attemptId);
        setQuiz(detail.quiz);
        const map: Record<string, QuestionResult> = {};
        const restored: Record<string, string> = {};
        for (const qr of detail.questionResults || []) {
          map[qr.questionId] = qr;
          if (qr.selectedOption) restored[qr.questionId] = qr.selectedOption;
        }
        setAnswers(restored);
        setResult({
          score: detail.score,
          normalizedScore: detail.normalizedScore,
          total: detail.totalQuestions,
          xp: 0,
          resultsMap: map,
        });
      } else {
        const data = await quizApi.getById(quizId);
        setQuiz(data);
        setTimeLeft(Math.max(60, (data.duration || 30) * 60));
      }
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải đề kiểm tra.');
    } finally {
      setLoading(false);
    }
  }, [quizId, attemptId]);

  useEffect(() => {
    const run = async () => {
      await loadQuiz();
    };
    void run();
  }, [loadQuiz]);

  const submitExam = useCallback(
    async (exitReason?: string) => {
      if (submittedRef.current || !quiz) return;
      submittedRef.current = true;
      setSubmitting(true);

      const questions = quiz.questions || [];
      const payload = questions.map((q) => {
        const val = (answersRef.current[q.id] || '').trim();
        const isEssay = isEssayQuestion(q);
        return {
          questionId: q.id,
          selectedOption: isEssay ? undefined : val,
          textAnswer: isEssay ? val : undefined,
        };
      });

      try {
        const res = await quizApi.submit(quiz.id, payload, exitReason);
        const map: Record<string, QuestionResult> = {};
        for (const qr of res.questionResults || []) {
          map[qr.questionId] = qr;
        }
        const normScore =
          res.normalizedScore ??
          (res.totalQuestions > 0
            ? Math.round((res.score / res.totalQuestions) * 100)
            : 0);
        setResult({
          score: res.score,
          normalizedScore: normScore,
          total: res.totalQuestions,
          xp: res.xpEarned || 0,
          resultsMap: map,
        });
        setFilterMode('all');
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } catch (err: unknown) {
        submittedRef.current = false;
        Alert.alert(
          'Lỗi nộp bài',
          err instanceof Error ? err.message : 'Không thể nộp bài. Vui lòng thử lại.',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [quiz],
  );

  // Countdown timer (only in active exam mode)
  useEffect(() => {
    if (loading || result || attemptId) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, result, attemptId]);

  useEffect(() => {
    if (!loading && !result && !attemptId && timeLeft === 0) {
      void submitExam('TIME_EXPIRED');
    }
  }, [timeLeft, loading, result, attemptId, submitExam]);

  const questions = useMemo(() => quiz?.questions || [], [quiz]);

  const displayedQuestions = useMemo(() => {
    if (filterMode === 'all') {
      return questions.map((q, idx) => ({ q, idx }));
    }
    return questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => {
        if (result) {
          const qr = result.resultsMap[q.id];
          return qr ? !qr.isCorrect : false;
        }
        return !(answers[q.id] || '').trim();
      });
  }, [questions, filterMode, result, answers]);

  const confirmSubmit = () => {
    const total = questions.length;
    const answered = Object.values(answers).filter((v) => v.trim().length > 0).length;
    Alert.alert(
      'Xác nhận nộp bài',
      `Em đã trả lời ${answered}/${total} câu hỏi. Chắc chắn muốn nộp bài ngay?`,
      [
        { text: 'Làm tiếp', style: 'cancel' },
        { text: 'Nộp bài', onPress: () => void submitExam('USER_SUBMIT') },
      ],
    );
  };

  const handleBack = () => {
    if (!result && !attemptId) {
      Alert.alert(
        'Thoát phòng thi?',
        'Bài làm chưa nộp sẽ không được lưu nếu em thoát ngay bây giờ.',
        [
          { text: 'Ở lại', style: 'cancel' },
          { text: 'Nộp bài luôn', onPress: () => void submitExam('AUTO_SUBMIT_ON_EXIT') },
          { text: 'Thoát', style: 'destructive', onPress: () => router.back() },
        ],
      );
      return;
    }
    router.back();
  };

  if (loading) return <LoadingView label="Đang tải phòng thi..." />;
  if (error || !quiz) {
    return (
      <ErrorView
        message={error || 'Không tìm thấy đề kiểm tra.'}
        onRetry={() => {
          setLoading(true);
          void loadQuiz();
        }}
      />
    );
  }

  const answeredCount = questions.filter((q) => (answers[q.id] || '').trim().length > 0).length;
  const progressPct =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const wrongCount = result
    ? questions.filter((q) => result.resultsMap[q.id] && !result.resultsMap[q.id].isCorrect).length
    : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]} edges={['top']}>
      {/* Sticky Exam Header */}
      <View style={[styles.header, { backgroundColor: p.card, borderBottomColor: p.border }]}>
        <TouchableOpacity onPress={handleBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={p.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }} numberOfLines={1}>
            {quiz.title}
          </Text>
          <Text style={{ fontSize: 12, color: p.textMuted }}>
            {result
              ? `Đúng ${result.score}/${result.total} câu • ${result.normalizedScore}/100 điểm`
              : `Đã làm ${answeredCount}/${questions.length} câu (${progressPct}%)`}
          </Text>
        </View>
        {!result ? (
          <View
            style={[
              styles.timerBadge,
              { backgroundColor: timeLeft < 180 ? p.roseSoft : p.primarySoft },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={15}
              color={timeLeft < 180 ? p.rose : p.primary}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: timeLeft < 180 ? p.rose : p.primary,
              }}
            >
              {formatClock(timeLeft)}
            </Text>
          </View>
        ) : (
          <Badge
            label={`${result.normalizedScore}/100`}
            tone={result.normalizedScore >= 50 ? 'emerald' : 'rose'}
          />
        )}
      </View>

      {/* Progress Bar + Quick Filter + Question Jump Strip */}
      <View style={[styles.toolbar, { backgroundColor: p.card, borderBottomColor: p.border }]}>
        {!result ? (
          <View style={[styles.progressTrack, { backgroundColor: p.cardMuted }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: p.primary, width: `${progressPct}%` },
              ]}
            />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setFilterMode('all')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filterMode === 'all' ? p.primary : p.cardMuted,
              },
            ]}
          >
            <Text
              style={{
                color: filterMode === 'all' ? '#FFFFFF' : p.text,
                fontSize: 11,
                fontWeight: '700',
              }}
            >
              Tất cả ({questions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterMode('focus')}
            style={[
              styles.filterPill,
              {
                backgroundColor:
                  filterMode === 'focus'
                    ? result
                      ? p.rose
                      : p.amber
                    : p.cardMuted,
              },
            ]}
          >
            <Text
              style={{
                color: filterMode === 'focus' ? '#FFFFFF' : p.text,
                fontSize: 11,
                fontWeight: '700',
              }}
            >
              {result
                ? `Chỉ câu sai (${wrongCount})`
                : `Chưa làm (${questions.length - answeredCount})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Question Jump Chips */}
        {filterMode === 'all' && questions.length > 5 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingTop: 2 }}
          >
            {questions.map((q, idx) => {
              const isDone = (answers[q.id] || '').trim().length > 0;
              const qr = result?.resultsMap[q.id];
              const bg = result
                ? qr?.isCorrect
                  ? p.emeraldSoft
                  : p.roseSoft
                : isDone
                  ? p.primary
                  : p.cardMuted;
              const fg = result
                ? qr?.isCorrect
                  ? p.emerald
                  : p.rose
                : isDone
                  ? '#FFFFFF'
                  : p.textMuted;

              return (
                <TouchableOpacity
                  key={`nav-${q.id}`}
                  onPress={() => {
                    const y = questionOffsets.current[q.id];
                    if (typeof y === 'number') {
                      scrollRef.current?.scrollTo({ y: Math.max(0, y - 10), animated: true });
                    }
                  }}
                  style={[styles.numChip, { backgroundColor: bg }]}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: fg }}>
                    {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, ADAPTIVE_CONTENT_STYLE]}
      >
        {/* Score Summary Banner */}
        {result ? (
          <Card
            style={{
              backgroundColor:
                result.normalizedScore >= 50 ? p.emeraldSoft : p.roseSoft,
              borderColor: result.normalizedScore >= 50 ? p.emerald : p.rose,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 19, fontWeight: '800', color: p.text }}>
              {attemptId ? 'Xem lại bài làm đã lưu' : 'Đã hoàn thành bài kiểm tra!'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Badge
                label={`Điểm: ${result.normalizedScore}/100`}
                tone={result.normalizedScore >= 50 ? 'emerald' : 'rose'}
              />
              <Badge label={`Đúng: ${result.score}/${result.total} câu`} tone="blue" />
              {result.xp > 0 ? <Badge label={`+${result.xp} XP`} tone="amber" /> : null}
            </View>
          </Card>
        ) : null}

        {displayedQuestions.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
            <Ionicons name="checkmark-circle" size={32} color={p.emerald} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }}>
              {result ? 'Tuyệt vời! Em không sai câu nào!' : 'Em đã trả lời hết tất cả các câu hỏi!'}
            </Text>
          </Card>
        ) : (
          displayedQuestions.map(({ q, idx }) => {
            const isEssay = isEssayQuestion(q);
            const options = parseQuestionOptions(q.options);
            const selected = answers[q.id] || '';
            const qr = result?.resultsMap[q.id];

            return (
              <View
                key={q.id}
                onLayout={(e) => {
                  questionOffsets.current[q.id] = e.nativeEvent.layout.y;
                }}
              >
                <Card style={{ gap: 10 }}>
                  <View style={styles.qHead}>
                    <Badge label={`Câu ${idx + 1}`} tone="indigo" />
                    <Badge
                      label={isEssay ? 'Tự luận' : 'Trắc nghiệm'}
                      tone="slate"
                    />
                    {qr ? (
                      <Badge
                        label={qr.isCorrect ? 'Đúng' : 'Sai'}
                        tone={qr.isCorrect ? 'emerald' : 'rose'}
                      />
                    ) : null}
                  </View>

                  <RichText content={q.content} color={p.text} boldColor={p.text} fontSize={15} />

                  {isEssay ? (
                    <TextInput
                      editable={!result}
                      style={[
                        styles.essayInput,
                        { backgroundColor: p.bg, borderColor: p.border, color: p.text },
                      ]}
                      placeholder="Nhập câu trả lời tự luận của em..."
                      placeholderTextColor={p.textMuted}
                      value={selected}
                      onChangeText={(txt) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: txt }))
                      }
                      multiline
                    />
                  ) : (
                    <View style={{ gap: 8 }}>
                      {options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isPicked = selected === opt || selected === letter;
                        const isCorrectOpt =
                          qr && (qr.correctOption === opt || qr.correctOption === letter);
                        let borderColor = p.border;
                        let bg = p.bg;
                        if (result) {
                          if (isCorrectOpt) {
                            borderColor = p.emerald;
                            bg = p.emeraldSoft;
                          } else if (isPicked && !qr?.isCorrect) {
                            borderColor = p.rose;
                            bg = p.roseSoft;
                          }
                        } else if (isPicked) {
                          borderColor = p.primary;
                          bg = p.primarySoft;
                        }

                        return (
                          <TouchableOpacity
                            key={`${q.id}-opt-${optIdx}`}
                            disabled={Boolean(result)}
                            onPress={() =>
                              setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                            }
                            style={[
                              styles.optionBtn,
                              { borderColor, backgroundColor: bg },
                            ]}
                          >
                            <Text
                              style={{
                                fontWeight: '800',
                                color: isPicked ? p.primary : p.textMuted,
                                width: 22,
                              }}
                            >
                              {letter}.
                            </Text>
                            <Text style={{ flex: 1, color: p.text, fontSize: 14, lineHeight: 20 }}>
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {qr ? (
                    <View style={[styles.explainBox, { backgroundColor: p.cardMuted, gap: 6 }]}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: p.emerald }}>
                        Đáp án đúng: {qr.correctOption}
                      </Text>
                      {qr.errorAnalysis ? (
                        <Text style={{ fontSize: 12, color: p.rose, lineHeight: 18 }}>
                          Phân tích lỗi: {qr.errorAnalysis}
                        </Text>
                      ) : null}
                      {qr.correction || qr.explanation ? (
                        <RichText
                          content={`**Giải thích:** ${qr.correction || qr.explanation}`}
                          color={p.text}
                          boldColor={p.text}
                          fontSize={12}
                        />
                      ) : null}
                    </View>
                  ) : null}
                </Card>
              </View>
            );
          })
        )}

        {!result ? (
          <PrimaryButton
            title={submitting ? 'Đang chấm điểm...' : 'Nộp bài kiểm tra'}
            icon="checkmark-done-outline"
            loading={submitting}
            onPress={confirmSubmit}
          />
        ) : (
          <PrimaryButton
            title="Quay lại danh sách đề"
            icon="arrow-back"
            color={p.indigo}
            onPress={() => router.back()}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toolbar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  numChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  qHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  essayInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  explainBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
});
