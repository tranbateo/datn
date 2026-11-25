import React, { useCallback, useMemo, useState } from 'react';
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
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  formatClassLabel,
  quizApi,
  teacherApi,
  type QuizAttemptDetail,
  type TeacherStudentAttemptsResponse,
  type TeacherStudentItem,
} from '@/services/mobile.services';
import { invalidateCache } from '@/lib/ttl-cache';
import {
  ADAPTIVE_CONTENT_STYLE,
  Badge,
  Card,
  EmptyView,
  ErrorView,
  KeyboardSafeView,
  LoadingView,
  PrimaryButton,
  QuizAttemptViewerModal,
  usePalette,
} from '@/components/ui/mobile-ui';

export default function TeacherStudentsScreen() {
  const p = usePalette();
  const params = useLocalSearchParams<{
    className?: string;
    search?: string;
    t?: string;
  }>();
  const paramKey = `${params.className ?? ''}|${params.search ?? ''}|${params.t ?? ''}`;

  const [students, setStudents] = useState<TeacherStudentItem[]>([]);
  const [searchOverride, setSearchOverride] = useState<{ key: string; value: string } | null>(
    null,
  );
  const [classOverride, setClassOverride] = useState<{ key: string; value: string } | null>(
    null,
  );

  const search =
    searchOverride && searchOverride.key === paramKey
      ? searchOverride.value
      : params.search || '';
  const classFilter =
    classOverride && classOverride.key === paramKey
      ? classOverride.value
      : params.className || 'ALL';

  const setSearch = (value: string) => setSearchOverride({ key: paramKey, value });
  const setClassFilter = (value: string) => setClassOverride({ key: paramKey, value });

  const [selectedStudent, setSelectedStudent] = useState<TeacherStudentItem | null>(null);
  const [attemptsData, setAttemptsData] = useState<TeacherStudentAttemptsResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);

  // Attempt Detail Viewer Modal (read-only inspection before manual grade override)
  const [attemptViewerOpen, setAttemptViewerOpen] = useState(false);
  const [attemptDetail, setAttemptDetail] = useState<QuizAttemptDetail | null>(null);
  const [loadingAttemptDetail, setLoadingAttemptDetail] = useState(false);
  const [attemptDetailError, setAttemptDetailError] = useState<string | null>(null);

  // Manual Grade Override modal (BR-QUIZ-002)
  const [editAttempt, setEditAttempt] = useState<{
    id: string;
    quizTitle: string;
    score: number;
  } | null>(null);
  const [newScore, setNewScore] = useState('');
  const [scoreReason, setScoreReason] = useState('');
  const [savingScore, setSavingScore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    try {
      const data = await teacherApi.getStudents();
      setStudents(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách học sinh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStudents();
    }, [loadStudents]),
  );

  const openAttemptDetail = async (attemptId: string) => {
    setAttemptViewerOpen(true);
    setAttemptDetail(null);
    setAttemptDetailError(null);
    setLoadingAttemptDetail(true);
    try {
      const detail = await quizApi.getAttemptDetail(attemptId);
      setAttemptDetail(detail);
    } catch (err: unknown) {
      setAttemptDetailError(
        err instanceof Error ? err.message : 'Không thể tải chi tiết bài làm.',
      );
    } finally {
      setLoadingAttemptDetail(false);
    }
  };

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.className) set.add(s.className);
    });
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchClass = classFilter === 'ALL' || s.className === classFilter;
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.studentCode || '').toLowerCase().includes(q) ||
        (s.className || '').toLowerCase().includes(q);
      return matchClass && matchSearch;
    });
  }, [students, search, classFilter]);

  const openStudentDetail = async (student: TeacherStudentItem) => {
    setSelectedStudent(student);
    setAttemptsData(null);
    setLoadingDetail(true);
    try {
      const res = await teacherApi.getStudentAttempts(student.id);
      setAttemptsData(res);
    } catch (err: unknown) {
      Alert.alert(
        'Lỗi',
        err instanceof Error ? err.message : 'Không thể tải lịch sử bài làm.',
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleResetPassword = (student: TeacherStudentItem) => {
    Alert.alert(
      'Cấp mật khẩu tạm cho học sinh',
      `Tạo mật khẩu tạm mới cho ${student.name} (${student.studentCode})? Học sinh sẽ phải đổi mật khẩu khi đăng nhập lại.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Cấp mật khẩu tạm',
          onPress: async () => {
            setResettingPwd(true);
            try {
              const res = await teacherApi.resetStudentPassword(student.id);
              const pwd = res.temporaryPassword || res.tempPassword || '';
              invalidateCache('teacher:');
              Alert.alert(
                'Đã cấp mật khẩu tạm',
                `Học sinh: ${student.name}\nMã HS: ${student.studentCode}\nMật khẩu tạm: ${pwd}\n\nHãy gửi cho học sinh hoặc phụ huynh.`,
              );
            } catch (err: unknown) {
              Alert.alert(
                'Lỗi',
                err instanceof Error ? err.message : 'Không thể cấp lại mật khẩu.',
              );
            } finally {
              setResettingPwd(false);
            }
          },
        },
      ],
    );
  };

  const handleSaveOverrideScore = async () => {
    if (!editAttempt) return;
    const numeric = Number(newScore);
    if (Number.isNaN(numeric) || numeric < 0 || numeric > 100) {
      Alert.alert('Điểm không hợp lệ', 'Điểm phải nằm trong khoảng 0 đến 100.');
      return;
    }
    if (!scoreReason.trim()) {
      Alert.alert('Thiếu lý do', 'Bắt buộc nhập lý do sửa điểm để lưu nhật ký kiểm toán (BR-QUIZ-002).');
      return;
    }

    setSavingScore(true);
    try {
      await teacherApi.overrideAttemptScore(
        editAttempt.id,
        numeric,
        scoreReason.trim(),
      );
      setAttemptsData((prev) =>
        prev
          ? {
              ...prev,
              attempts: prev.attempts.map((a) =>
                a.id === editAttempt.id ? { ...a, score: numeric } : a,
              ),
            }
          : prev,
      );
      setEditAttempt(null);
      setScoreReason('');
      invalidateCache('teacher:');
      Alert.alert('Đã cập nhật điểm', 'Điểm mới và lý do đã được ghi nhận vào Audit Log.');
      void loadStudents();
    } catch (err: unknown) {
      Alert.alert(
        'Lỗi',
        err instanceof Error ? err.message : 'Không thể cập nhật điểm.',
      );
    } finally {
      setSavingScore(false);
    }
  };

  if (loading) return <LoadingView label="Đang tải danh sách học sinh..." />;
  if (error) {
    return (
      <ErrorView
        message={error}
        onRetry={() => {
          setLoading(true);
          void loadStudents();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <KeyboardSafeView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, ADAPTIVE_CONTENT_STYLE]}
          keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadStudents();
            }}
            tintColor={p.emerald}
          />
        }
      >
        <View>
          <Text style={[styles.title, { color: p.text }]}>
            Học sinh phụ trách ({filtered.length})
          </Text>
          <Text style={{ fontSize: 12, color: p.textMuted }}>
            Chạm vào học sinh để xem lịch sử bài làm, sửa điểm hoặc cấp mật khẩu tạm (GVCN)
          </Text>
        </View>

        {/* Search Box */}
        <View style={[styles.searchRow, { backgroundColor: p.card, borderColor: p.border }]}>
          <Ionicons name="search-outline" size={18} color={p.textMuted} />
          <TextInput
            style={{ flex: 1, color: p.text, fontSize: 14, paddingVertical: 10 }}
            placeholder="Tìm theo tên hoặc mã học sinh..."
            placeholderTextColor={p.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Class Filter */}
        {classOptions.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => setClassFilter('ALL')}
              style={[
                styles.pill,
                {
                  backgroundColor: classFilter === 'ALL' ? p.emerald : p.card,
                  borderColor: classFilter === 'ALL' ? p.emerald : p.border,
                },
              ]}
            >
              <Text style={{ color: classFilter === 'ALL' ? '#FFFFFF' : p.text, fontWeight: '700', fontSize: 12 }}>
                Tất cả lớp
              </Text>
            </TouchableOpacity>
            {classOptions.map((cls) => (
              <TouchableOpacity
                key={cls}
                onPress={() => setClassFilter(cls)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: classFilter === cls ? p.emerald : p.card,
                    borderColor: classFilter === cls ? p.emerald : p.border,
                  },
                ]}
              >
                <Text style={{ color: classFilter === cls ? '#FFFFFF' : p.text, fontWeight: '700', fontSize: 12 }}>
                  {formatClassLabel(cls)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyView
            icon="people-outline"
            title="Không tìm thấy học sinh"
            description="Thử thay đổi bộ lọc lớp hoặc từ khóa tìm kiếm."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {filtered.map((s) => (
              <TouchableOpacity
                key={s.id}
                activeOpacity={0.85}
                onPress={() => void openStudentDetail(s)}
              >
                <Card style={styles.studentCard}>
                  <View style={[styles.avatar, { backgroundColor: p.emeraldSoft }]}>
                    <Text style={{ color: p.emerald, fontWeight: '800', fontSize: 15 }}>
                      {s.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }}>
                        {s.name}
                      </Text>
                      <Badge
                        label={s.isHomeroomTeacher ? 'GVCN' : 'GVBM'}
                        tone={s.isHomeroomTeacher ? 'emerald' : 'blue'}
                      />
                    </View>
                    <Text style={{ fontSize: 12, color: p.textMuted }}>
                      {formatClassLabel(s.className)} • {s.studentCode || s.email}
                    </Text>
                    <Text style={{ fontSize: 12, color: p.textMuted }}>
                      Điểm TB:{' '}
                      <Text style={{ fontWeight: '800', color: s.avgScore >= 50 ? p.emerald : p.rose }}>
                        {s.avgScore}/100
                      </Text>{' '}
                      • {s.xp} XP
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={p.textMuted} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
        </ScrollView>
      </KeyboardSafeView>

      {/* Student Detail Modal */}
      <Modal
        visible={Boolean(selectedStudent) && !attemptViewerOpen}
        animationType="slide"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
          <View style={[styles.modalHead, { backgroundColor: p.card, borderBottomColor: p.border }]}>
            <TouchableOpacity onPress={() => setSelectedStudent(null)} hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color={p.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }} numberOfLines={1}>
                {selectedStudent?.name}
              </Text>
              <Text style={{ fontSize: 12, color: p.textMuted }}>
                {formatClassLabel(selectedStudent?.className)} • {selectedStudent?.studentCode}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={[styles.scroll, ADAPTIVE_CONTENT_STYLE]}>
            {selectedStudent?.isHomeroomTeacher ? (
              <PrimaryButton
                title="Cấp mật khẩu tạm cho học sinh này"
                icon="key-outline"
                color={p.amber}
                loading={resettingPwd}
                onPress={() => handleResetPassword(selectedStudent)}
              />
            ) : null}

            <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }}>
              Lịch sử bài kiểm tra
            </Text>

            {loadingDetail ? (
              <ActivityIndicator size="large" color={p.emerald} style={{ marginTop: 24 }} />
            ) : !attemptsData?.attempts || attemptsData.attempts.length === 0 ? (
              <EmptyView
                icon="document-text-outline"
                title="Chưa có bài kiểm tra nào"
                description="Học sinh chưa hoàn thành bài kiểm tra thuộc phạm vi phụ trách."
              />
            ) : (
              <View style={{ gap: 10 }}>
                {attemptsData.attempts.map((att) => (
                  <Card key={att.id} style={{ gap: 8 }}>
                    <View style={styles.rowBetween}>
                      <Badge label={att.subjectName || 'Môn học'} tone="blue" />
                      <Badge
                        label={`${att.score}/100 điểm`}
                        tone={att.score >= 50 ? 'emerald' : 'rose'}
                      />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: p.text }}>
                      {att.quizTitle}
                    </Text>
                    <Text style={{ fontSize: 11, color: p.textMuted }}>
                      Nộp lúc: {new Date(att.completedAt).toLocaleString('vi-VN')}
                    </Text>
                    <View style={[styles.rowBetween, { flexWrap: 'wrap', gap: 8 }]}>
                      <TouchableOpacity
                        onPress={() => void openAttemptDetail(att.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 9,
                          backgroundColor: p.cardMuted,
                        }}
                      >
                        <Ionicons name="eye-outline" size={14} color={p.text} />
                        <Text style={{ color: p.text, fontSize: 12, fontWeight: '700' }}>
                          Xem bài làm
                        </Text>
                      </TouchableOpacity>
                      {att.canEditScore !== false ? (
                        <TouchableOpacity
                          onPress={() => {
                            setEditAttempt({
                              id: att.id,
                              quizTitle: att.quizTitle,
                              score: att.score,
                            });
                            setNewScore(String(att.score));
                            setScoreReason('');
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 9,
                            backgroundColor: p.primarySoft,
                          }}
                        >
                          <Ionicons name="create-outline" size={14} color={p.primary} />
                          <Text style={{ color: p.primary, fontSize: 12, fontWeight: '800' }}>
                            Sửa điểm thủ công
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Badge label="Chỉ xem (GVCN)" tone="slate" />
                      )}
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Manual Grade Override Sub-Modal */}
          <Modal
            visible={Boolean(editAttempt)}
            animationType="fade"
            transparent
            onRequestClose={() => setEditAttempt(null)}
          >
            <KeyboardSafeView style={{ flex: 1 }}>
              <Pressable style={styles.backdrop} onPress={() => setEditAttempt(null)}>
                <Pressable onPress={() => undefined} style={{ width: '90%', maxWidth: 440 }}>
                  <Card style={{ gap: 12 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: p.text }}>
                    Chỉnh sửa điểm (Audit Log)
                  </Text>
                  <Text style={{ fontSize: 13, color: p.textMuted }} numberOfLines={2}>
                    Bài: {editAttempt?.quizTitle}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
                    placeholder="Điểm mới (0 - 100)"
                    placeholderTextColor={p.textMuted}
                    keyboardType="numeric"
                    value={newScore}
                    onChangeText={setNewScore}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: p.bg,
                        borderColor: p.border,
                        color: p.text,
                        minHeight: 74,
                        textAlignVertical: 'top',
                        paddingTop: 10,
                      },
                    ]}
                    placeholder="Lý do điều chỉnh điểm (bắt buộc)..."
                    placeholderTextColor={p.textMuted}
                    value={scoreReason}
                    onChangeText={setScoreReason}
                    multiline
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <PrimaryButton
                      title="Hủy"
                      color={p.textMuted}
                      onPress={() => setEditAttempt(null)}
                      style={{ flex: 1 }}
                    />
                    <PrimaryButton
                      title="Lưu điểm"
                      color={p.emerald}
                      loading={savingScore}
                      onPress={() => void handleSaveOverrideScore()}
                      style={{ flex: 1 }}
                    />
                  </View>
                  </Card>
                </Pressable>
              </Pressable>
            </KeyboardSafeView>
          </Modal>
        </SafeAreaView>
      </Modal>

      <QuizAttemptViewerModal
        visible={attemptViewerOpen}
        loading={loadingAttemptDetail}
        detail={attemptDetail}
        error={attemptDetailError}
        onClose={() => setAttemptViewerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 46,
    fontSize: 14,
  },
});
