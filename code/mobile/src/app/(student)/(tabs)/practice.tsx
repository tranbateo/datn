import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  curriculumApi,
  quizApi,
  usersApi,
  type Quiz,
  type QuizAttemptHistoryItem,
  type Subject,
} from '@/services/mobile.services';
import { useAuthStore } from '@/store/authStore';
import { getCached, isCacheFresh, setCached } from '@/lib/ttl-cache';
import {
  Badge,
  Card,
  EmptyView,
  ErrorView,
  PrimaryButton,
  SkeletonDashboard,
  usePalette,
} from '@/components/ui/mobile-ui';

const QUESTION_COUNTS = [30, 35, 40, 45, 50];

interface PracticeSubjectSnapshot {
  quizzes: Quiz[];
  history: QuizAttemptHistoryItem[];
}

export default function StudentPracticeScreen() {
  const p = usePalette();
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId?: string }>();
  const { user, updateUser } = useAuthStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const paramSubjectId = params.subjectId || '';
  const [pickedSubject, setPickedSubject] = useState<{
    param: string;
    id: string;
  } | null>(null);

  const pickedSubjectId =
    pickedSubject && pickedSubject.param === paramSubjectId
      ? pickedSubject.id
      : paramSubjectId || null;

  const selectedSubject =
    pickedSubjectId && subjects.some((s) => s.id === pickedSubjectId)
      ? pickedSubjectId
      : params.subjectId && subjects.some((s) => s.id === params.subjectId)
        ? params.subjectId
        : subjects[0]?.id ?? null;
  const [activeTab, setActiveTab] = useState<'exams' | 'history'>('exams');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [history, setHistory] = useState<QuizAttemptHistoryItem[]>([]);

  const [questionCount, setQuestionCount] = useState(30);
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    try {
      const profile = user?.grade ? user : await usersApi.getProfile();
      if (profile && !user?.grade) {
        void updateUser(profile);
      }
      const subs = profile?.grade
        ? await curriculumApi.getSubjectsByGrade(profile.grade)
        : [];
      setSubjects(Array.isArray(subs) ? subs : []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách môn học.');
    } finally {
      setLoading(false);
    }
  }, [user, updateUser]);

  useEffect(() => {
    const run = async () => {
      await loadSubjects();
    };
    void run();
  }, [loadSubjects]);

  const loadSubjectData = useCallback(async (subId: string, force = false) => {
    const cacheKey = `student:practice:${subId}`;
    if (!force && isCacheFresh(cacheKey)) {
      const snap = getCached<PracticeSubjectSnapshot>(cacheKey);
      if (snap) {
        setQuizzes(snap.quizzes);
        setHistory(snap.history);
        setLoadingList(false);
        setRefreshing(false);
        return;
      }
    }
    try {
      const [qRes, hRes] = await Promise.all([
        quizApi.getBySubject(subId).catch(() => []),
        quizApi.getHistory(subId).catch(() => []),
      ]);
      const safeQ = Array.isArray(qRes) ? qRes : [];
      const safeH = Array.isArray(hRes) ? hRes : [];
      setQuizzes(safeQ);
      setHistory(safeH);
      setCached<PracticeSubjectSnapshot>(cacheKey, { quizzes: safeQ, history: safeH });
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!selectedSubject) return;
      void loadSubjectData(selectedSubject, false);
    }, [selectedSubject, loadSubjectData]),
  );

  const handleGenerateRandom = async () => {
    if (!selectedSubject) return;
    setGenerating(true);
    try {
      const created = await quizApi.generateRandom({
        subjectId: selectedSubject,
        numQuestions: questionCount,
        topic: topic.trim() || undefined,
      });
      router.push({
        pathname: '/(student)/quiz/[quizId]',
        params: { quizId: created.id },
      });
    } catch (err: unknown) {
      Alert.alert(
        'Không thể tạo đề',
        err instanceof Error ? err.message : 'Vui lòng thử lại sau.',
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <SkeletonDashboard label="Đang tải kho đề kiểm tra..." />;
  if (error) {
    return (
      <ErrorView
        message={error}
        onRetry={() => {
          setLoading(true);
          void loadSubjects();
        }}
      />
    );
  }

  const activeSubject = subjects.find((s) => s.id === selectedSubject);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              if (!selectedSubject) return;
              setRefreshing(true);
              void loadSubjectData(selectedSubject, true);
            }}
            tintColor={p.primary}
          />
        }
      >
        <View>
          <Text style={[styles.title, { color: p.text }]}>Luyện tập & Kiểm tra</Text>
          <Text style={{ fontSize: 13, color: p.textMuted, marginTop: 2 }}>
            Trắc nghiệm + Tự luận chuẩn kiến thức • Chấm điểm & giải thích chi tiết
          </Text>
        </View>

        {/* Tab Switch */}
        <View style={[styles.tabBar, { backgroundColor: p.cardMuted, borderColor: p.border }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('exams')}
            style={[styles.tabBtn, activeTab === 'exams' && { backgroundColor: p.card }]}
          >
            <Text
              style={{
                color: activeTab === 'exams' ? p.primary : p.textMuted,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              Kho đề ({quizzes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            style={[styles.tabBtn, activeTab === 'history' && { backgroundColor: p.card }]}
          >
            <Text
              style={{
                color: activeTab === 'history' ? p.primary : p.textMuted,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              Đề đã làm ({history.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subject Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {subjects.map((sub) => {
            const active = sub.id === selectedSubject;
            return (
              <TouchableOpacity
                key={sub.id}
                onPress={() => {
                  setLoadingList(true);
                  setPickedSubject({ param: paramSubjectId, id: sub.id });
                }}
                style={[
                  styles.pill,
                  {
                    backgroundColor: active ? p.indigo : p.card,
                    borderColor: active ? p.indigo : p.border,
                  },
                ]}
              >
                <Text style={{ color: active ? '#FFFFFF' : p.text, fontSize: 13, fontWeight: '700' }}>
                  {sub.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activeTab === 'exams' ? (
          <>
            {/* Random AI Exam Builder */}
            <View style={[styles.aiBanner, { backgroundColor: p.indigo }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={16} color="#FDE68A" />
                <Text style={{ color: '#FDE68A', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
                  Sinh đề luyện tập ngẫu nhiên
                </Text>
              </View>
              <Text style={styles.aiBannerTitle}>
                Tạo đề môn {activeSubject?.name || ''}
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {QUESTION_COUNTS.map((cnt) => (
                  <TouchableOpacity
                    key={cnt}
                    onPress={() => setQuestionCount(cnt)}
                    style={[
                      styles.countChip,
                      {
                        backgroundColor:
                          questionCount === cnt ? '#FFFFFF' : 'rgba(255,255,255,0.18)',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: questionCount === cnt ? p.indigo : '#FFFFFF',
                        fontWeight: '800',
                        fontSize: 12,
                      }}
                    >
                      {cnt} câu
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.topicInput}
                placeholder="Chuyên đề muốn ôn (tùy chọn)..."
                placeholderTextColor="#CBD5E1"
                value={topic}
                onChangeText={setTopic}
              />

              <PrimaryButton
                title={generating ? 'Đang sinh đề...' : `Bắt đầu đề ${questionCount} câu`}
                icon="flash-outline"
                color="#F59E0B"
                loading={generating}
                onPress={() => void handleGenerateRandom()}
              />
            </View>

            {/* Quizzes List */}
            <Text style={[styles.sectionTitle, { color: p.text }]}>
              Đề kiểm tra đã giao & xuất bản
            </Text>

            {loadingList ? (
              <ActivityIndicator size="large" color={p.primary} style={{ marginVertical: 24 }} />
            ) : quizzes.length === 0 ? (
              <EmptyView
                icon="document-text-outline"
                title="Chưa có đề kiểm tra"
                description="Em có thể bấm tạo đề luyện tập ngẫu nhiên ở khung phía trên."
              />
            ) : (
              <View style={{ gap: 12 }}>
                {quizzes.map((q) => (
                  <Card key={q.id} style={{ gap: 10 }}>
                    <View style={styles.rowBetween}>
                      <Badge label={`${q.duration} phút`} tone="blue" />
                      {q.questions?.length ? (
                        <Badge label={`${q.questions.length} câu`} tone="indigo" />
                      ) : null}
                    </View>
                    <Text style={[styles.quizTitle, { color: p.text }]}>{q.title}</Text>
                    {q.description ? (
                      <Text style={{ fontSize: 13, color: p.textMuted }} numberOfLines={2}>
                        {q.description}
                      </Text>
                    ) : null}
                    <PrimaryButton
                      title="Vào phòng thi"
                      icon="play-circle-outline"
                      onPress={() =>
                        router.push({
                          pathname: '/(student)/quiz/[quizId]',
                          params: { quizId: q.id },
                        })
                      }
                    />
                  </Card>
                ))}
              </View>
            )}
          </>
        ) : loadingList ? (
          <ActivityIndicator size="large" color={p.primary} style={{ marginVertical: 24 }} />
        ) : history.length === 0 ? (
          <EmptyView
            icon="time-outline"
            title="Chưa có bài làm đã lưu"
            description="Mọi đề thi em đã hoàn thành sẽ được lưu tại đây để xem lại đáp án và chữa lỗi sai."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {history.map((item) => {
              const passed = item.normalizedScore >= 50;
              return (
                <Card key={item.attemptId} style={{ gap: 10 }}>
                  <View style={styles.rowBetween}>
                    <Badge
                      label={`${item.normalizedScore}/100 điểm`}
                      tone={passed ? 'emerald' : 'rose'}
                    />
                    <Text style={{ fontSize: 11, color: p.textMuted }}>
                      {item.completedAt
                        ? new Date(item.completedAt).toLocaleString('vi-VN')
                        : ''}
                    </Text>
                  </View>
                  <Text style={[styles.quizTitle, { color: p.text }]}>{item.quizTitle}</Text>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: p.emerald }}>
                      Đúng: {item.correctCount}/{item.totalQuestions}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: p.rose }}>
                      Sai: {item.wrongCount}
                    </Text>
                  </View>
                  <PrimaryButton
                    title="Xem lại đề & Chữa câu sai"
                    icon="document-text-outline"
                    color={p.indigo}
                    onPress={() =>
                      router.push({
                        pathname: '/(student)/quiz/[quizId]',
                        params: { quizId: item.quizId, attemptId: item.attemptId },
                      })
                    }
                  />
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800' },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  aiBanner: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  aiBannerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  countChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  topicInput: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 42,
    color: '#FFFFFF',
    fontSize: 13,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quizTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
});
