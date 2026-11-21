import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Platform,
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
  generateClientUuid,
  matchesQuizOption,
  parseQuestionOptions,
  quizApi,
  type Question,
  type QuestionResult,
  type Quiz,
} from '@/services/mobile.services';
import { invalidateCache } from '@/lib/ttl-cache';
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

/**
 * Isolated countdown timer component so ticking every second NEVER re-renders 30–50 question cards.
 */
const ExamTimer = React.memo(function ExamTimer({
  initialSeconds,
  active,
  onExpire,
}: {
  initialSeconds: number;
  active: boolean;
  onExpire: () => void;
}) {
  const p = usePalette();
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!active) return;
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
  }, [active]);

  useEffect(() => {
    if (active && timeLeft === 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
    }
  }, [active, timeLeft, onExpire]);

  const urgent = timeLeft < 180;

  return (
    <View
      style={[
        styles.timerBadge,
        { backgroundColor: urgent ? p.roseSoft : p.primarySoft },
      ]}
    >
      <Ionicons name="time-outline" size={15} color={urgent ? p.rose : p.primary} />
      <Text
        style={{
          fontSize: 13,
          fontWeight: '800',
          color: urgent ? p.rose : p.primary,
        }}
      >
        {formatClock(timeLeft)}
      </Text>
    </View>
  );
});

interface QuestionCardProps {
  q: Question;
  idx: number;
  selected: string;
  qr?: QuestionResult;
  hasResult: boolean;
  onAnswerChange: (questionId: string, value: string) => void;
}

const QuestionCard = React.memo(function QuestionCard({
  q,
  idx,
  selected,
  qr,
  hasResult,
  onAnswerChange,
}: QuestionCardProps) {
  const p = usePalette();
  const isEssay = isEssayQuestion(q);
  const options = useMemo(() => parseQuestionOptions(q.options), [q.options]);

  return (
    <Card style={{ gap: 10 }}>
      <View style={styles.qHead}>
        <Badge label={`Câu ${idx + 1}`} tone="indigo" />
        <Badge label={isEssay ? 'Tự luận' : 'Trắc nghiệm'} tone="slate" />
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
          editable={!hasResult}
          style={[
            styles.essayInput,
            { backgroundColor: p.bg, borderColor: p.border, color: p.text },
          ]}
          placeholder="Nhập câu trả lời tự luận của em..."
          placeholderTextColor={p.textMuted}
          value={selected}
          onChangeText={(txt) => onAnswerChange(q.id, txt)}
          multiline
        />
      ) : (
        <View style={{ gap: 8 }}>
          {options.map((opt, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const isPicked = matchesQuizOption(selected, opt, letter);
            const isCorrectOpt = Boolean(
              qr && matchesQuizOption(qr.correctOption, opt, letter),
            );
            let borderColor = p.border;
            let bg = p.bg;
            if (hasResult) {
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
                disabled={hasResult}
                onPress={() => onAnswerChange(q.id, opt)}
                style={[styles.optionBtn, { borderColor, backgroundColor: bg }]}
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
  );
});

export default function QuizExamScreen() {
  const p = usePalette();
  const router = useRouter();
  const { quizId, attemptId } = useLocalSearchParams<{
    quizId: string;
    attemptId?: string;
  }>();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [initialDurationSec, setInitialDurationSec] = useState<number>(1800);
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

  const listRef = useRef<FlatList<{ q: Question; idx: number }>>(null);
  const submittedRef = useRef(false);
  const answersRef = useRef<Record<string, string>>({});
  // BR-QUIZ-002: Stable client-side UUID guarantees idempotent submission even on retry
  const idempotentAttemptIdRef = useRef<string>(generateClientUuid());

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
        setInitialDurationSec(Math.max(60, (data.duration || 30) * 60));
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

  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setAnswers((prev) =>
      prev[questionId] === value ? prev : { ...prev, [questionId]: value },
    );
  }, []);

  const submitExam = useCallback(
    async (exitReason?: string) => {
      if (submittedRef.current || !quiz) return;
      submittedRef.current = true;
      setSubmitting(true);

      const questionsList = quiz.questions || [];
      const payload = questionsList.map((q) => {
        const val = (answersRef.current[q.id] || '').trim();
        const isEssay = isEssayQuestion(q);
        return {
          questionId: q.id,
          selectedOption: isEssay ? undefined : val,
          textAnswer: isEssay ? val : undefined,
        };
      });

      try {
        const res = await quizApi.submit(
          quiz.id,
          payload,
          exitReason,
          idempotentAttemptIdRef.current,
        );
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
        invalidateCache('student:');
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
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

  const handleTimeExpire = useCallback(() => {
    void submitExam('TIME_EXPIRED');
  }, [submitExam]);

  const handleBack = useCallback(() => {
    if (!result && !attemptId && !loading && quiz) {
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
  }, [result, attemptId, loading, quiz, submitExam, router]);

  // Intercept Android hardware back button during active exam so student cannot accidentally lose progress
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!result && !attemptId && !loading && quiz) {
        handleBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [result, attemptId, loading, quiz, handleBack]);

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

  const confirmSubmit = useCallback(() => {
    const total = questions.length;
    const answered = Object.values(answersRef.current).filter(
      (v) => v.trim().length > 0,
    ).length;
    Alert.alert(
      'Xác nhận nộp bài',
      `Em đã trả lời ${answered}/${total} câu hỏi. Chắc chắn muốn nộp bài ngay?`,
      [
        { text: 'Làm tiếp', style: 'cancel' },
        { text: 'Nộp bài', onPress: () => void submitExam('USER_SUBMIT') },
      ],
    );
  }, [questions.length, submitExam]);

  const jumpToQuestionIndex = useCallback((index: number) => {
    listRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.05,
    });
  }, []);

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
          <ExamTimer
            key={`${quiz.id}-${initialDurationSec}`}
            initialSeconds={initialDurationSec}
            active={!loading && !result && !attemptId}
            onExpire={handleTimeExpire}
          />
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
                  onPress={() => jumpToQuestionIndex(idx)}
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={displayedQuestions}
          keyExtractor={(item) => item.q.id}
          contentContainerStyle={[styles.scroll, ADAPTIVE_CONTENT_STYLE]}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({
              offset: Math.max(0, info.averageItemLength * info.index),
              animated: true,
            });
          }}
          ListHeaderComponent={
            result ? (
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
            ) : null
          }
          ListEmptyComponent={
            <Card style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
              <Ionicons name="checkmark-circle" size={32} color={p.emerald} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }}>
                {result
                  ? 'Tuyệt vời! Em không sai câu nào!'
                  : 'Em đã trả lời hết tất cả các câu hỏi!'}
              </Text>
            </Card>
          }
          renderItem={({ item }) => (
            <QuestionCard
              q={item.q}
              idx={item.idx}
              selected={answers[item.q.id] || ''}
              qr={result?.resultsMap[item.q.id]}
              hasResult={Boolean(result)}
              onAnswerChange={handleAnswerChange}
            />
          )}
          ListFooterComponent={
            <View style={{ paddingTop: 4 }}>
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
            </View>
          }
        />
      </KeyboardAvoidingView>
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
