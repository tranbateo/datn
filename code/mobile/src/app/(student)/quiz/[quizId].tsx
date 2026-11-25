import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  BackHandler,
  FlatList,
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
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
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
  formatReadableMath,
  KeyboardSafeView,
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
                  {formatReadableMath(opt)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {qr ? (
        <View style={[styles.explainBox, { backgroundColor: p.cardMuted, gap: 6 }]}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: p.emerald }}>
            Đáp án đúng: {formatReadableMath(qr.correctOption)}
          </Text>
          {qr.errorAnalysis ? (
            <Text style={{ fontSize: 12, color: p.rose, lineHeight: 18 }}>
              Phân tích lỗi: {formatReadableMath(qr.errorAnalysis)}
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
  const navigation = useNavigation();
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
  const [lockedByAntiCheat, setLockedByAntiCheat] = useState(false);
  const [exitTerminationNotice, setExitTerminationNotice] = useState<string | null>(null);
  const [autoSubmitRetryNeeded, setAutoSubmitRetryNeeded] = useState(false);

  const [result, setResult] = useState<{
    score: number;
    normalizedScore: number;
    total: number;
    xp: number;
    resultsMap: Record<string, QuestionResult>;
  } | null>(null);

  const listRef = useRef<FlatList<{ q: Question; idx: number }>>(null);
  const submittedRef = useRef(false);
  const examLockedRef = useRef(false);
  const isConfirmAlertOpenRef = useRef(false);
  const pendingAutoSubmitReasonRef = useRef<string | null>(null);
  const leftExamAtRef = useRef<number | null>(null);
  const submitStartedAtRef = useRef<number>(0);
  const violationAlertShownRef = useRef(false);
  const pendingViolationNoticeRef = useRef<string | null>(null);
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
    if (examLockedRef.current || submittedRef.current) return;
    setAnswers((prev) =>
      prev[questionId] === value ? prev : { ...prev, [questionId]: value },
    );
  }, []);

  const submitExam = useCallback(
    async (exitReason?: string, customNotice?: string, forceRetry = false) => {
      if ((submittedRef.current && !forceRetry) || !quiz) return;
      submittedRef.current = true;
      examLockedRef.current = true;
      submitStartedAtRef.current = Date.now();
      setSubmitting(true);
      setAutoSubmitRetryNeeded(false);

      const finalNotice =
        customNotice ||
        pendingViolationNoticeRef.current ||
        'Bài thi đã tự động kết thúc và chấm điểm ngay lập tức do phát hiện thoát ứng dụng hoặc chuyển sang ứng dụng khác!';

      if (exitReason === 'AUTO_SUBMIT_ON_EXIT') {
        pendingViolationNoticeRef.current = finalNotice;
        setLockedByAntiCheat(true);
        setExitTerminationNotice(finalNotice);
      } else if (exitReason === 'TIME_EXPIRED') {
        setLockedByAntiCheat(true);
        setExitTerminationNotice(
          'Đã hết thời gian làm bài! Hệ thống tự động thu bài và trả kết quả ngay lập tức.',
        );
      }

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
        pendingAutoSubmitReasonRef.current = null;
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
        if (
          exitReason === 'AUTO_SUBMIT_ON_EXIT' &&
          AppState.currentState === 'active' &&
          !violationAlertShownRef.current
        ) {
          violationAlertShownRef.current = true;
          Alert.alert(
            'Bài thi đã tự động kết thúc!',
            `${finalNotice}\n\nKết quả tạm tính: ${normScore}/100 điểm (${res.score}/${res.totalQuestions} câu đúng).`,
          );
        }
      } catch (err: unknown) {
        submittedRef.current = false;
        const isForcedTermination =
          exitReason === 'AUTO_SUBMIT_ON_EXIT' || exitReason === 'TIME_EXPIRED';
        if (isForcedTermination) {
          // Keep exam permanently locked; auto-retry when app returns to foreground or user taps retry
          pendingAutoSubmitReasonRef.current = exitReason;
          setAutoSubmitRetryNeeded(true);
          if (AppState.currentState === 'active') {
            Alert.alert(
              'Mất kết nối khi tự động nộp bài',
              'Bài thi đã bị khóa do rời khỏi phòng thi. Hãy bấm "Gửi lại bài thi đã khóa" khi có mạng để lưu kết quả.',
            );
          }
        } else {
          examLockedRef.current = false;
          Alert.alert(
            'Lỗi nộp bài',
            err instanceof Error ? err.message : 'Không thể nộp bài. Vui lòng thử lại.',
          );
        }
      } finally {
        setSubmitting(false);
      }
    },
    [quiz],
  );

  const handleTimeExpire = useCallback(() => {
    void submitExam('TIME_EXPIRED');
  }, [submitExam]);

  const isExamActive = Boolean(!result && !attemptId && !loading && quiz && !lockedByAntiCheat);

  // Chế độ phòng thi nghiêm ngặt trên Mobile (tương đương chuyển tab trên Web):
  // Kết hợp 3 lớp độc lập:
  // 1) AppState 'background' -> khóa & nộp bài NGAY LẬP TỨC (0ms)
  // 2) Android 'blur' / 'inactive' -> phát hiện đa nhiệm, chia đôi màn hình, cửa sổ nổi (>= 500ms)
  // 3) Kiểm tra đồng hồ thực (Date.now()) khi quay lại 'active'/'focus' -> miễn nhiễm hoàn toàn
  //    với việc Xiaomi HyperOS / Android đóng băng setTimeout hoặc socket ở chế độ nền!
  useEffect(() => {
    if (loading || result || attemptId || !quiz) return;

    let pendingLeaveTimer: ReturnType<typeof setTimeout> | null = null;

    const clearPendingTimer = () => {
      if (pendingLeaveTimer) {
        clearTimeout(pendingLeaveTimer);
        pendingLeaveTimer = null;
      }
    };

    const triggerAppSwitchTermination = (notice: string) => {
      clearPendingTimer();
      pendingViolationNoticeRef.current = notice;
      if (examLockedRef.current) return;
      examLockedRef.current = true;
      setLockedByAntiCheat(true);
      setExitTerminationNotice(notice);
      void submitExam('AUTO_SUBMIT_ON_EXIT', notice);
    };

    const handleReturnToExam = () => {
      clearPendingTimer();
      const leftAt = leftExamAtRef.current;
      leftExamAtRef.current = null;
      const awayMs = leftAt ? Date.now() - leftAt : 0;

      // Wall-clock failsafe: catches app switch / Recent Apps peek even if OS froze JS timers
      if (
        !examLockedRef.current &&
        !submittedRef.current &&
        !isConfirmAlertOpenRef.current &&
        awayMs >= 500
      ) {
        triggerAppSwitchTermination(
          'Bài thi đã tự động kết thúc và chấm điểm ngay lập tức do phát hiện thoát ứng dụng hoặc chuyển sang ứng dụng khác!',
        );
        return;
      }

      if (examLockedRef.current && !result) {
        const notice =
          pendingViolationNoticeRef.current ||
          'Bài thi đã tự động kết thúc do phát hiện rời khỏi ứng dụng khi đang làm bài!';
        if (!violationAlertShownRef.current) {
          violationAlertShownRef.current = true;
          Alert.alert('Bài thi đã tự động kết thúc!', notice);
        }
        // Retry immediately if background network failed OR socket froze while backgrounded (>2.5s)
        if (pendingAutoSubmitReasonRef.current && !submittedRef.current) {
          void submitExam(pendingAutoSubmitReasonRef.current, notice);
        } else if (
          submittedRef.current &&
          Date.now() - submitStartedAtRef.current >= 2500
        ) {
          void submitExam('AUTO_SUBMIT_ON_EXIT', notice, true);
        }
      }
    };

    const scheduleGraceTermination = (delayMs: number, notice: string) => {
      if (isConfirmAlertOpenRef.current || examLockedRef.current || submittedRef.current) {
        return;
      }
      if (!leftExamAtRef.current) {
        leftExamAtRef.current = Date.now();
      }
      if (!pendingLeaveTimer) {
        pendingLeaveTimer = setTimeout(() => {
          pendingLeaveTimer = null;
          if (!isConfirmAlertOpenRef.current && !examLockedRef.current) {
            triggerAppSwitchTermination(notice);
          }
        }, delayMs);
      }
    };

    const changeSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        handleReturnToExam();
      } else if (nextState === 'background') {
        leftExamAtRef.current = leftExamAtRef.current ?? Date.now();
        triggerAppSwitchTermination(
          'Bài thi đã tự động kết thúc và chấm điểm ngay lập tức do phát hiện thoát ứng dụng hoặc chuyển sang ứng dụng khác!',
        );
      } else if (nextState === 'inactive') {
        scheduleGraceTermination(
          500,
          'Bài thi đã tự động kết thúc và chấm điểm ngay lập tức do rời khỏi màn hình phòng thi!',
        );
      }
    });

    // Android Recent Apps (□), split-screen, and floating windows fire 'blur' immediately
    const blurSub =
      Platform.OS === 'android'
        ? AppState.addEventListener('blur', () => {
            scheduleGraceTermination(
              600,
              'Bài thi đã tự động kết thúc và chấm điểm ngay lập tức do phát hiện rời khỏi màn hình phòng thi (đa nhiệm / chia đôi màn hình / chuyển ứng dụng)!',
            );
          })
        : null;

    const focusSub =
      Platform.OS === 'android'
        ? AppState.addEventListener('focus', () => {
            handleReturnToExam();
          })
        : null;

    return () => {
      clearPendingTimer();
      changeSub.remove();
      blurSub?.remove();
      focusSub?.remove();
    };
  }, [loading, result, attemptId, quiz, submitExam]);

  // Show unmistakable alert once student returns to app even if auto-submit already completed while backgrounded
  useEffect(() => {
    if (!exitTerminationNotice || violationAlertShownRef.current) return;
    const showIfActive = (state: string) => {
      if (state === 'active' && !violationAlertShownRef.current) {
        violationAlertShownRef.current = true;
        Alert.alert('Bài thi đã tự động kết thúc!', exitTerminationNotice);
      }
    };
    if (AppState.currentState === 'active') {
      showIfActive('active');
      return;
    }
    const sub = AppState.addEventListener('change', showIfActive);
    return () => sub.remove();
  }, [exitTerminationNotice]);

  const handleBack = useCallback(() => {
    if (isExamActive) {
      isConfirmAlertOpenRef.current = true;
      Alert.alert(
        'Chế độ phòng thi nghiêm ngặt',
        'Khi đang làm bài kiểm tra không thể thoát tự do. Nếu rời khỏi phòng thi lúc này, hệ thống sẽ kết thúc và chấm điểm ngay bài làm hiện tại.',
        [
          {
            text: 'Tiếp tục làm bài',
            style: 'cancel',
            onPress: () => {
              isConfirmAlertOpenRef.current = false;
            },
          },
          {
            text: 'Kết thúc & Nộp bài ngay',
            style: 'destructive',
            onPress: () => {
              isConfirmAlertOpenRef.current = false;
              void submitExam(
                'AUTO_SUBMIT_ON_EXIT',
                'Bài thi đã tự động kết thúc và chấm điểm ngay lập tức do thao tác rời khỏi phòng thi!',
              );
            },
          },
        ],
        {
          cancelable: true,
          onDismiss: () => {
            isConfirmAlertOpenRef.current = false;
          },
        },
      );
      return;
    }
    router.back();
  }, [isExamActive, submitExam, router]);

  // Intercept Android hardware back button during active exam
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isExamActive) {
        handleBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isExamActive, handleBack]);

  // Intercept gesture swipe-back navigation during active exam
  useEffect(() => {
    if (!isExamActive) return;
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!examLockedRef.current && !submittedRef.current) {
        e.preventDefault();
        handleBack();
      }
    });
    return unsubscribe;
  }, [navigation, isExamActive, handleBack]);

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
    isConfirmAlertOpenRef.current = true;
    Alert.alert(
      'Xác nhận nộp bài',
      `Em đã trả lời ${answered}/${total} câu hỏi. Chắc chắn muốn nộp bài ngay?`,
      [
        {
          text: 'Làm tiếp',
          style: 'cancel',
          onPress: () => {
            isConfirmAlertOpenRef.current = false;
          },
        },
        {
          text: 'Nộp bài',
          onPress: () => {
            isConfirmAlertOpenRef.current = false;
            void submitExam('USER_SUBMIT');
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          isConfirmAlertOpenRef.current = false;
        },
      },
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: p.text, flexShrink: 1 }} numberOfLines={1}>
              {quiz.title}
            </Text>
            {isExamActive ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: p.amberSoft,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 999,
                }}
              >
                <Ionicons name="shield-checkmark" size={11} color={p.amber} />
                <Text style={{ fontSize: 10, fontWeight: '800', color: p.amber }}>
                  Giám sát
                </Text>
              </View>
            ) : null}
          </View>
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
            active={!loading && !result && !attemptId && !lockedByAntiCheat}
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

      <KeyboardSafeView style={{ flex: 1 }}>
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
            <View style={{ gap: 10 }}>
              {/* Banner Cảnh báo Chế độ Phòng thi Nghiêm ngặt khi đang làm bài */}
              {!result && !attemptId && !lockedByAntiCheat ? (
                <Card
                  style={{
                    backgroundColor: p.amberSoft,
                    borderColor: p.amber,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: 12,
                  }}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={20}
                    color={p.amber}
                    style={{ marginTop: 1 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12.5,
                      lineHeight: 18,
                      color: p.text,
                    }}
                  >
                    <Text style={{ fontWeight: '800', color: p.amber }}>
                      Chế độ phòng thi nghiêm ngặt đang bật:{' '}
                    </Text>
                    Nếu em thoát ứng dụng, chuyển sang ứng dụng khác hoặc chia đôi màn hình khi đang làm bài, hệ thống sẽ{' '}
                    <Text style={{ fontWeight: '800' }}>
                      kết thúc bài thi ngay lập tức
                    </Text>{' '}
                    và chấm điểm các câu đã làm!
                  </Text>
                </Card>
              ) : null}

              {/* Thông báo kết thúc tự động do vi phạm quy chế / hết giờ */}
              {exitTerminationNotice ? (
                <Card
                  style={{
                    backgroundColor: p.roseSoft,
                    borderColor: p.rose,
                    gap: 10,
                    padding: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <Ionicons
                      name="warning"
                      size={20}
                      color={p.rose}
                      style={{ marginTop: 1 }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: '700',
                        lineHeight: 19,
                        color: p.rose,
                      }}
                    >
                      {exitTerminationNotice}
                    </Text>
                  </View>
                  {autoSubmitRetryNeeded && !result ? (
                    <PrimaryButton
                      title={submitting ? 'Đang nộp bài...' : 'Gửi lại bài thi đã khóa'}
                      icon="cloud-upload-outline"
                      color={p.rose}
                      loading={submitting}
                      onPress={() =>
                        void submitExam(
                          pendingAutoSubmitReasonRef.current || 'AUTO_SUBMIT_ON_EXIT',
                        )
                      }
                    />
                  ) : null}
                </Card>
              ) : null}

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
            </View>
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
              hasResult={Boolean(result) || lockedByAntiCheat}
              onAnswerChange={handleAnswerChange}
            />
          )}
          ListFooterComponent={
            <View style={{ paddingTop: 4 }}>
              {!result ? (
                <PrimaryButton
                  title={
                    submitting
                      ? lockedByAntiCheat
                        ? 'Đang tự động nộp bài...'
                        : 'Đang chấm điểm...'
                      : lockedByAntiCheat
                        ? 'Nộp bài thi đã khóa'
                        : 'Nộp bài kiểm tra'
                  }
                  icon="checkmark-done-outline"
                  color={lockedByAntiCheat ? p.rose : p.primary}
                  loading={submitting}
                  onPress={
                    lockedByAntiCheat
                      ? () =>
                          void submitExam(
                            pendingAutoSubmitReasonRef.current || 'AUTO_SUBMIT_ON_EXIT',
                          )
                      : confirmSubmit
                  }
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
      </KeyboardSafeView>
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
