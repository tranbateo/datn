import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  type QuestionResult,
  type Quiz,
} from '@/services/mobile.services';
import {
  Badge,
  Card,
  ErrorView,
  LoadingView,
  PrimaryButton,
  usePalette,
} from '@/components/ui/mobile-ui';

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
        const val = answersRef.current[q.id] || '';
        const isEssay = q.questionType === 'ESSAY';
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

  const confirmSubmit = () => {
    const total = quiz?.questions?.length || 0;
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

  const questions = quiz.questions || [];
  const answeredCount = Object.values(answers).filter((v) => v.trim().length > 0).length;

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
              ? `Kết quả: ${result.normalizedScore}/100 điểm`
              : `Đã làm ${answeredCount}/${questions.length} câu`}
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

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Score Summary Banner after submission / review */}
        {result ? (
          <Card
            style={{
              backgroundColor:
                result.normalizedScore >= 50 ? p.emeraldSoft : p.roseSoft,
              borderColor: result.normalizedScore >= 50 ? p.emerald : p.rose,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '800', color: p.text }}>
              {attemptId ? 'Xem lại bài làm đã lưu' : 'Đã hoàn thành bài kiểm tra!'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Badge
                label={`Điểm: ${result.normalizedScore}/100`}
                tone={result.normalizedScore >= 50 ? 'emerald' : 'rose'}
              />
              <Badge label={`Đúng: ${result.score}/${result.total} câu`} tone="blue" />
              {result.xp > 0 ? <Badge label={`+${result.xp} XP`} tone="amber" /> : null}
            </View>
          </Card>
        ) : null}

        {/* Questions */}
        {questions.map((q, idx) => {
          const isEssay = q.questionType === 'ESSAY';
          const options = parseQuestionOptions(q.options);
          const selected = answers[q.id] || '';
          const qr = result?.resultsMap[q.id];

          return (
            <Card key={q.id} style={{ gap: 10 }}>
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

              <Text style={{ fontSize: 15, fontWeight: '700', color: p.text, lineHeight: 22 }}>
                {q.content}
              </Text>

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

              {/* Explanation & Error analysis after grading */}
              {qr ? (
                <View style={[styles.explainBox, { backgroundColor: p.cardMuted }]}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: p.emerald }}>
                    Đáp án đúng: {qr.correctOption}
                  </Text>
                  {qr.errorAnalysis ? (
                    <Text style={{ fontSize: 12, color: p.rose, marginTop: 4 }}>
                      Phân tích lỗi: {qr.errorAnalysis}
                    </Text>
                  ) : null}
                  {qr.correction || qr.explanation ? (
                    <Text style={{ fontSize: 12, color: p.text, marginTop: 4, lineHeight: 18 }}>
                      Giải thích: {qr.correction || qr.explanation}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </Card>
          );
        })}

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
