import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
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
import { useFocusEffect } from 'expo-router';
import {
  teacherApi,
  type CourseItem,
  type TeacherCourseItem,
  type TeacherDocumentItem,
  type TeacherQuizDetail,
  type TeacherQuizItem,
} from '@/services/mobile.services';
import {
  ADAPTIVE_CONTENT_STYLE,
  Badge,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  PrimaryButton,
  RichText,
  usePalette,
} from '@/components/ui/mobile-ui';

const QUIZ_STATUS_MAP: Record<
  string,
  { label: string; tone: 'slate' | 'blue' | 'emerald' | 'rose' }
> = {
  DRAFT: { label: 'Bản nháp', tone: 'slate' },
  PUBLISHED: { label: 'Đã duyệt', tone: 'blue' },
  ASSIGNED: { label: 'Đang giao', tone: 'emerald' },
  CLOSED: { label: 'Đã đóng', tone: 'rose' },
};

export default function TeacherContentScreen() {
  const p = usePalette();
  const [activeTab, setActiveTab] = useState<'quizzes' | 'courses' | 'documents'>('quizzes');
  const [quizzes, setQuizzes] = useState<TeacherQuizItem[]>([]);
  const [courses, setCourses] = useState<TeacherCourseItem[]>([]);
  const [documents, setDocuments] = useState<TeacherDocumentItem[]>([]);

  // Quiz Detail Modal
  const [selectedQuiz, setSelectedQuiz] = useState<TeacherQuizDetail | null>(null);
  const [loadingQuizDetail, setLoadingQuizDetail] = useState(false);

  // AI Build Quiz Modal (BR-QUIZ-001: Always created as DRAFT for teacher review)
  const [showAiBuilder, setShowAiBuilder] = useState(false);
  const [aiCourseId, setAiCourseId] = useState('');
  const [aiTitle, setAiTitle] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiNumQuestions, setAiNumQuestions] = useState(10);
  const [aiDuration, setAiDuration] = useState(15);
  const [buildingAiQuiz, setBuildingAiQuiz] = useState(false);

  // Course Lessons Modal
  const [activeCourse, setActiveCourse] = useState<CourseItem | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [savingLesson, setSavingLesson] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [qRes, cRes, dRes] = await Promise.all([
        teacherApi.getQuizzes().catch(() => []),
        teacherApi.getCourses().catch(() => []),
        teacherApi.getDocuments().catch(() => []),
      ]);
      const cList = Array.isArray(cRes) ? cRes : [];
      setQuizzes(Array.isArray(qRes) ? qRes : []);
      setCourses(cList);
      setDocuments(Array.isArray(dRes) ? dRes : []);
      if (cList.length > 0) {
        setAiCourseId((prev) => prev || cList[0].id);
      }
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải học liệu & đề kiểm tra.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        await loadData();
      };
      void run();
    }, [loadData]),
  );

  const openQuizDetail = async (quizId: string) => {
    setLoadingQuizDetail(true);
    try {
      const detail = await teacherApi.getQuizDetails(quizId);
      setSelectedQuiz(detail);
    } catch (err: unknown) {
      Alert.alert(
        'Lỗi',
        err instanceof Error ? err.message : 'Không thể xem chi tiết đề kiểm tra.',
      );
    } finally {
      setLoadingQuizDetail(false);
    }
  };

  const handleAiBuildQuiz = async () => {
    if (!aiCourseId || !aiTitle.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn khóa học và nhập tên đề kiểm tra.');
      return;
    }
    setBuildingAiQuiz(true);
    try {
      await teacherApi.aiBuildQuiz({
        courseId: aiCourseId,
        title: aiTitle.trim(),
        topic: aiTopic.trim() || aiTitle.trim(),
        numQuestions: aiNumQuestions,
        duration: aiDuration,
      });
      setShowAiBuilder(false);
      setAiTitle('');
      setAiTopic('');
      Alert.alert(
        'AI đã soạn xong bản nháp!',
        'Đề mới ở trạng thái Bản nháp (DRAFT) theo BR-QUIZ-001. Hãy kiểm tra nội dung câu hỏi rồi bấm Duyệt xuất bản / Giao cho lớp.',
      );
      await loadData();
    } catch (err: unknown) {
      Alert.alert(
        'Không thể sinh đề',
        err instanceof Error ? err.message : 'Vui lòng thử lại sau.',
      );
    } finally {
      setBuildingAiQuiz(false);
    }
  };

  const handleQuizStatus = async (
    quizId: string,
    status: 'PUBLISHED' | 'ASSIGNED' | 'CLOSED',
  ) => {
    setUpdatingId(quizId);
    try {
      await teacherApi.updateQuizStatus(quizId, status);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, status } : q)),
      );
      setSelectedQuiz((prev) =>
        prev && prev.id === quizId ? { ...prev, status } : prev,
      );
      Alert.alert(
        'Đã cập nhật trạng thái',
        status === 'ASSIGNED'
          ? 'Đã giao đề kiểm tra và gửi thông báo tới học sinh các lớp phụ trách!'
          : status === 'PUBLISHED'
            ? 'Đã duyệt xuất bản đề kiểm tra.'
            : 'Đã đóng đề kiểm tra.',
      );
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể đổi trạng thái đề.');
    } finally {
      setUpdatingId(null);
    }
  };

  const openCourseDetail = async (courseId: string) => {
    setLoadingCourse(true);
    try {
      const detail = await teacherApi.getCourseDetail(courseId);
      setActiveCourse(detail);
    } catch (err: unknown) {
      Alert.alert(
        'Lỗi',
        err instanceof Error ? err.message : 'Không thể mở danh sách bài học.',
      );
    } finally {
      setLoadingCourse(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!activeCourse || !newLessonTitle.trim()) {
      Alert.alert('Thiếu tiêu đề', 'Vui lòng nhập tiêu đề bài học.');
      return;
    }
    setSavingLesson(true);
    try {
      await teacherApi.createLesson(activeCourse.id, {
        title: newLessonTitle.trim(),
        content: newLessonContent.trim() || undefined,
        order: (activeCourse.lessons?.length || 0) + 1,
      });
      setNewLessonTitle('');
      setNewLessonContent('');
      await openCourseDetail(activeCourse.id);
      void loadData();
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể thêm bài học.');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = (courseId: string, lessonId: string, title: string) => {
    Alert.alert('Xóa bài học', `Xóa bài "${title}" khỏi khóa học?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await teacherApi.deleteLesson(courseId, lessonId);
            await openCourseDetail(courseId);
            void loadData();
          } catch (err: unknown) {
            Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể xóa bài học.');
          }
        },
      },
    ]);
  };

  const handleToggleDoc = async (doc: TeacherDocumentItem) => {
    const nextStatus = doc.status === 'ready' ? 'UNPUBLISHED' : 'Embedded';
    setUpdatingId(doc.id);
    try {
      await teacherApi.updateDocumentStatus(doc.id, nextStatus);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                status: nextStatus === 'Embedded' ? 'ready' : 'unpublished',
                rawStatus: nextStatus,
              }
            : d,
        ),
      );
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể đổi trạng thái tài liệu.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteDoc = (doc: TeacherDocumentItem) => {
    Alert.alert(
      'Xóa tài liệu',
      `Xóa "${doc.name}" khỏi hệ thống và kho tri thức Gia sư AI?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            setUpdatingId(doc.id);
            try {
              await teacherApi.deleteDocument(doc.id);
              setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
            } catch (err: unknown) {
              Alert.alert(
                'Lỗi',
                err instanceof Error ? err.message : 'Không thể xóa tài liệu.',
              );
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ],
    );
  };

  if (loading) return <LoadingView label="Đang tải học liệu & đề kiểm tra..." />;
  if (error) {
    return (
      <ErrorView
        message={error}
        onRetry={() => {
          setLoading(true);
          void loadData();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, ADAPTIVE_CONTENT_STYLE]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadData();
            }}
            tintColor={p.emerald}
          />
        }
      >
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: p.text }]}>Học liệu & Đề thi</Text>
            <Text style={{ fontSize: 12, color: p.textMuted }}>
              Soạn/duyệt đề (BR-QUIZ-001), quản lý bài giảng & tài liệu RAG
            </Text>
          </View>
          {activeTab === 'quizzes' && courses.length > 0 ? (
            <TouchableOpacity
              onPress={() => setShowAiBuilder(true)}
              style={[styles.aiBtn, { backgroundColor: p.indigo }]}
            >
              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
                AI Tạo đề
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 3 Sub-tabs */}
        <View style={[styles.tabBar, { backgroundColor: p.cardMuted, borderColor: p.border }]}>
          {(
            [
              { key: 'quizzes', label: `Đề (${quizzes.length})` },
              { key: 'courses', label: `Bài giảng (${courses.length})` },
              { key: 'documents', label: `PDF RAG (${documents.length})` },
            ] as const
          ).map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.tabBtn, activeTab === t.key && { backgroundColor: p.card }]}
            >
              <Text
                style={{
                  color: activeTab === t.key ? p.emerald : p.textMuted,
                  fontWeight: '700',
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'quizzes' ? (
          quizzes.length === 0 ? (
            <EmptyView
              icon="document-text-outline"
              title="Chưa có đề kiểm tra"
              description="Nhấn 'AI Tạo đề' để AI sinh bản nháp từ kho tài liệu lớp rồi duyệt và giao cho học sinh."
              actionLabel={courses.length > 0 ? 'Dùng AI tạo đề nháp' : undefined}
              onAction={courses.length > 0 ? () => setShowAiBuilder(true) : undefined}
            />
          ) : (
            <View style={{ gap: 12 }}>
              {quizzes.map((q) => {
                const st = QUIZ_STATUS_MAP[q.status] || QUIZ_STATUS_MAP.DRAFT;
                return (
                  <Card key={q.id} style={{ gap: 10 }}>
                    <View style={styles.rowBetween}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Badge label={st.label} tone={st.tone} />
                        <Badge label={`${q.subject} • K${q.grade}`} tone="indigo" />
                      </View>
                      <Text style={{ fontSize: 12, color: p.textMuted, fontWeight: '600' }}>
                        {q.duration} phút
                      </Text>
                    </View>

                    <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }}>
                      {q.title}
                    </Text>

                    <Text style={{ fontSize: 12, color: p.textMuted }}>
                      {q.questionsCount} câu hỏi • {q.attemptsCount} lượt học sinh nộp bài
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      <TouchableOpacity
                        onPress={() => void openQuizDetail(q.id)}
                        style={[styles.smallBtn, { backgroundColor: p.cardMuted }]}
                      >
                        <Ionicons name="eye-outline" size={15} color={p.text} />
                        <Text style={{ color: p.text, fontWeight: '700', fontSize: 12 }}>
                          Xem đề & điểm
                        </Text>
                      </TouchableOpacity>

                      {q.status === 'DRAFT' ? (
                        <TouchableOpacity
                          disabled={updatingId === q.id}
                          onPress={() => void handleQuizStatus(q.id, 'PUBLISHED')}
                          style={[styles.smallBtn, { backgroundColor: p.primarySoft }]}
                        >
                          <Text style={{ color: p.primary, fontWeight: '800', fontSize: 12 }}>
                            Duyệt xuất bản
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      {q.status !== 'ASSIGNED' && q.status !== 'CLOSED' ? (
                        <TouchableOpacity
                          disabled={updatingId === q.id}
                          onPress={() => void handleQuizStatus(q.id, 'ASSIGNED')}
                          style={[styles.smallBtn, { backgroundColor: p.emeraldSoft }]}
                        >
                          <Text style={{ color: p.emerald, fontWeight: '800', fontSize: 12 }}>
                            Giao cho lớp
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      {q.status === 'ASSIGNED' ? (
                        <TouchableOpacity
                          disabled={updatingId === q.id}
                          onPress={() => void handleQuizStatus(q.id, 'CLOSED')}
                          style={[styles.smallBtn, { backgroundColor: p.roseSoft }]}
                        >
                          <Text style={{ color: p.rose, fontWeight: '800', fontSize: 12 }}>
                            Đóng đề
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </Card>
                );
              })}
            </View>
          )
        ) : activeTab === 'courses' ? (
          courses.length === 0 ? (
            <EmptyView
              icon="library-outline"
              title="Chưa có khóa học / bài giảng"
              description="Các khóa học thuộc môn bạn giảng dạy sẽ hiển thị tại đây."
            />
          ) : (
            <View style={{ gap: 10 }}>
              {courses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.85}
                  onPress={() => void openCourseDetail(c.id)}
                >
                  <Card style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {c.subject ? <Badge label={c.subject} tone="blue" /> : null}
                      {c.grade ? <Badge label={c.grade} tone="indigo" /> : null}
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }}>
                      {c.title}
                    </Text>
                    <View style={styles.rowBetween}>
                      <Text style={{ fontSize: 12, color: p.textMuted }}>
                        {c.lessonsCount || 0} bài học • {c.documentsCount || 0} tài liệu PDF
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: p.emerald }}>
                        Quản lý bài →
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : documents.length === 0 ? (
          <EmptyView
            icon="folder-open-outline"
            title="Chưa có tài liệu PDF"
            description="Tải PDF mới trên Cổng Web Giáo viên; tại đây bạn có thể bật/tắt xuất bản cho Gia sư AI hoặc gỡ tài liệu."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {documents.map((doc) => {
              const isPublished = doc.status === 'ready';
              return (
                <Card key={doc.id} style={{ gap: 8 }}>
                  <View style={styles.rowBetween}>
                    <Badge
                      label={isPublished ? 'Đang xuất bản (RAG)' : 'Đang ẩn'}
                      tone={isPublished ? 'emerald' : 'slate'}
                    />
                    <Text style={{ fontSize: 11, color: p.textMuted }}>{doc.date}</Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }}>
                    {doc.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: p.textMuted }}>
                    {doc.courseTitle} • {doc.size} • {doc.chunksCount} đoạn kiến thức
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                    <TouchableOpacity
                      disabled={updatingId === doc.id}
                      onPress={() => void handleToggleDoc(doc)}
                      style={[
                        styles.smallBtn,
                        { backgroundColor: isPublished ? p.amberSoft : p.emeraldSoft },
                      ]}
                    >
                      <Text
                        style={{
                          color: isPublished ? p.amber : p.emerald,
                          fontWeight: '800',
                          fontSize: 12,
                        }}
                      >
                        {isPublished ? 'Gỡ khỏi Học sinh' : 'Xuất bản lại'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={updatingId === doc.id}
                      onPress={() => handleDeleteDoc(doc)}
                      style={[styles.smallBtn, { backgroundColor: p.roseSoft }]}
                    >
                      <Ionicons name="trash-outline" size={14} color={p.rose} />
                      <Text style={{ color: p.rose, fontWeight: '800', fontSize: 12 }}>
                        Xóa
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* AI Quiz Builder Modal */}
      <Modal
        visible={showAiBuilder}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAiBuilder(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowAiBuilder(false)}>
          <Pressable
            style={[styles.sheetCard, { backgroundColor: p.card, borderColor: p.border }]}
            onPress={() => undefined}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: p.text }}>
              AI Sinh đề kiểm tra (Bản nháp)
            </Text>
            <Text style={{ fontSize: 12, color: p.textMuted }}>
              Đề do AI tạo luôn ở trạng thái DRAFT để giáo viên duyệt trước khi giao (BR-QUIZ-001).
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {courses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setAiCourseId(c.id)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: aiCourseId === c.id ? p.indigo : p.cardMuted,
                      borderColor: aiCourseId === c.id ? p.indigo : p.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: aiCourseId === c.id ? '#FFFFFF' : p.text,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    {c.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
              placeholder="Tên đề kiểm tra (VD: Kiểm tra 15 phút Chương 1)"
              placeholderTextColor={p.textMuted}
              value={aiTitle}
              onChangeText={setAiTitle}
            />
            <TextInput
              style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
              placeholder="Chủ đề / Bài học trọng tâm (tùy chọn)"
              placeholderTextColor={p.textMuted}
              value={aiTopic}
              onChangeText={setAiTopic}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[5, 10, 15, 20].map((cnt) => (
                <TouchableOpacity
                  key={cnt}
                  onPress={() => {
                    setAiNumQuestions(cnt);
                    setAiDuration(cnt <= 10 ? 15 : cnt <= 15 ? 30 : 45);
                  }}
                  style={[
                    styles.countBtn,
                    { backgroundColor: aiNumQuestions === cnt ? p.indigo : p.cardMuted },
                  ]}
                >
                  <Text
                    style={{
                      color: aiNumQuestions === cnt ? '#FFFFFF' : p.text,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    {cnt} câu
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <PrimaryButton
                title="Hủy"
                color={p.textMuted}
                onPress={() => setShowAiBuilder(false)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title={buildingAiQuiz ? 'AI đang soạn...' : 'Sinh đề nháp'}
                icon="sparkles"
                color={p.indigo}
                loading={buildingAiQuiz}
                onPress={() => void handleAiBuildQuiz()}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Course Lessons Manager Modal */}
      <Modal
        visible={Boolean(activeCourse) || loadingCourse}
        animationType="slide"
        onRequestClose={() => setActiveCourse(null)}
      >
        <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
          <View style={[styles.modalHead, { backgroundColor: p.card, borderBottomColor: p.border }]}>
            <TouchableOpacity onPress={() => setActiveCourse(null)} hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color={p.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }} numberOfLines={1}>
                {activeCourse?.title || 'Quản lý bài giảng'}
              </Text>
              <Text style={{ fontSize: 12, color: p.textMuted }}>
                {activeCourse?.lessons?.length || 0} bài học trong khóa
              </Text>
            </View>
          </View>

          {loadingCourse && !activeCourse ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={p.emerald} />
            </View>
          ) : activeCourse ? (
            <ScrollView contentContainerStyle={[styles.scroll, ADAPTIVE_CONTENT_STYLE]}>
              <Card style={{ gap: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }}>
                  + Thêm bài học mới
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
                  placeholder="Tiêu đề bài học..."
                  placeholderTextColor={p.textMuted}
                  value={newLessonTitle}
                  onChangeText={setNewLessonTitle}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: p.bg,
                      borderColor: p.border,
                      color: p.text,
                      minHeight: 84,
                      textAlignVertical: 'top',
                      paddingTop: 10,
                    },
                  ]}
                  placeholder="Tóm tắt kiến thức trọng tâm bài học..."
                  placeholderTextColor={p.textMuted}
                  value={newLessonContent}
                  onChangeText={setNewLessonContent}
                  multiline
                />
                <PrimaryButton
                  title="Lưu bài học"
                  icon="add-circle-outline"
                  color={p.emerald}
                  loading={savingLesson}
                  onPress={() => void handleCreateLesson()}
                />
              </Card>

              {(activeCourse.lessons || []).length === 0 ? (
                <EmptyView icon="book-outline" title="Chưa có bài học nào" />
              ) : (
                (activeCourse.lessons || []).map((ls, idx) => (
                  <Card key={ls.id} style={{ gap: 8 }}>
                    <View style={styles.rowBetween}>
                      <Badge label={`Bài ${idx + 1}`} tone="blue" />
                      <TouchableOpacity
                        onPress={() =>
                          handleDeleteLesson(activeCourse.id, ls.id, ls.title)
                        }
                        hitSlop={10}
                      >
                        <Ionicons name="trash-outline" size={18} color={p.rose} />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }}>
                      {ls.title}
                    </Text>
                    {ls.content ? (
                      <RichText content={ls.content} color={p.textMuted} boldColor={p.text} fontSize={13} />
                    ) : null}
                  </Card>
                ))
              )}
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>

      {/* Quiz Details Modal */}
      <Modal
        visible={Boolean(selectedQuiz) || loadingQuizDetail}
        animationType="slide"
        onRequestClose={() => setSelectedQuiz(null)}
      >
        <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
          <View style={[styles.modalHead, { backgroundColor: p.card, borderBottomColor: p.border }]}>
            <TouchableOpacity onPress={() => setSelectedQuiz(null)} hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color={p.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }} numberOfLines={1}>
                {selectedQuiz?.title || 'Chi tiết đề kiểm tra'}
              </Text>
              {selectedQuiz ? (
                <Text style={{ fontSize: 12, color: p.textMuted }}>
                  {selectedQuiz.questions.length} câu • {selectedQuiz.attempts.length} lượt làm
                </Text>
              ) : null}
            </View>
          </View>

          {loadingQuizDetail && !selectedQuiz ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={p.emerald} />
            </View>
          ) : selectedQuiz ? (
            <ScrollView contentContainerStyle={[styles.scroll, ADAPTIVE_CONTENT_STYLE]}>
              {selectedQuiz.attempts.length > 0 ? (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }}>
                    Kết quả học sinh ({selectedQuiz.attempts.length})
                  </Text>
                  <View style={{ gap: 8 }}>
                    {selectedQuiz.attempts.slice(0, 15).map((a) => (
                      <Card key={a.id} style={styles.rowBetween}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: p.text }}>
                            {a.studentName}
                          </Text>
                          <Text style={{ fontSize: 11, color: p.textMuted }}>
                            {new Date(a.completedAt).toLocaleString('vi-VN')}
                          </Text>
                        </View>
                        <Badge
                          label={`${a.score}/100`}
                          tone={a.score >= 50 ? 'emerald' : 'rose'}
                        />
                      </Card>
                    ))}
                  </View>
                </>
              ) : null}

              <Text style={{ fontSize: 16, fontWeight: '800', color: p.text, marginTop: 4 }}>
                Nội dung câu hỏi ({selectedQuiz.questions.length})
              </Text>
              <View style={{ gap: 10 }}>
                {selectedQuiz.questions.map((q, idx) => (
                  <Card key={q.id} style={{ gap: 6 }}>
                    <RichText
                      content={`**Câu ${idx + 1}:** ${q.content}`}
                      color={p.text}
                      boldColor={p.text}
                      fontSize={14}
                    />
                    {q.correctOption ? (
                      <Text style={{ fontSize: 12, fontWeight: '800', color: p.emerald }}>
                        Đáp án đúng: {q.correctOption}
                      </Text>
                    ) : null}
                    {q.explanation ? (
                      <RichText
                        content={`**Giải thích:** ${q.explanation}`}
                        color={p.textMuted}
                        boldColor={p.text}
                        fontSize={12}
                      />
                    ) : null}
                  </Card>
                ))}
              </View>

              <PrimaryButton
                title="Đóng"
                color={p.emerald}
                onPress={() => setSelectedQuiz(null)}
              />
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800' },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
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
    paddingHorizontal: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 46,
    fontSize: 14,
  },
  countBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
