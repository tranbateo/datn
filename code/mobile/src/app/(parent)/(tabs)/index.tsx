import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  formatClassLabel,
  notificationsApi,
  parentApi,
  type MasteryStatus,
  type NotificationItem,
  type ParentDashboardData,
} from '@/services/mobile.services';
import { useAuthStore } from '@/store/authStore';
import {
  ADAPTIVE_CONTENT_STYLE,
  Badge,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  NotificationSheet,
  UserAvatar,
  usePalette,
} from '@/components/ui/mobile-ui';

const MASTERY_MAP: Record<
  MasteryStatus,
  { label: string; tone: 'emerald' | 'amber' | 'rose' | 'slate' }
> = {
  strong: { label: 'Vững', tone: 'emerald' },
  developing: { label: 'Tiến bộ', tone: 'amber' },
  weak: { label: 'Cần ôn', tone: 'rose' },
  unassessed: { label: 'Chưa KT', tone: 'slate' },
};

export default function ParentDashboardScreen() {
  const p = usePalette();
  const router = useRouter();
  const { user } = useAuthStore();

  const [dashboard, setDashboard] = useState<ParentDashboardData | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [dash, notifs] = await Promise.all([
        parentApi.getDashboard(),
        notificationsApi.list().catch(() => []),
      ]);
      setDashboard(dash);
      setNotifications(Array.isArray(notifs) ? notifs : dash.parentNotifications || []);
      setSelectedIdx((prev) =>
        dash.students && prev >= dash.students.length ? 0 : prev,
      );
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Không thể tải báo cáo học tập của con.',
      );
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

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await notificationsApi.markRead(id);
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationsApi.markAllRead();
    } catch {
      // ignore
    }
  };

  if (loading && !dashboard) {
    return <LoadingView label="Đang tải báo cáo Phụ huynh..." />;
  }
  if (error && !dashboard) {
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

  const students = dashboard?.students || [];
  const activeEntry = students[selectedIdx] || null;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
            tintColor={p.indigo}
          />
        }
      >
        {/* Top Bar */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.push('/(parent)/(tabs)/settings')}>
            <UserAvatar
              uri={user?.avatarUrl}
              name={user?.fullName}
              size={44}
              bgColor={p.indigo}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: p.textMuted }}>
              Cổng Phụ huynh
            </Text>
            <Text style={{ fontSize: 21, fontWeight: '800', color: p.text }} numberOfLines={1}>
              {user?.fullName || 'Phụ huynh'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowNotifs(true)}
            style={[styles.bellBtn, { backgroundColor: p.card, borderColor: p.border }]}
          >
            <Ionicons name="notifications-outline" size={22} color={p.text} />
            {unreadCount > 0 ? (
              <View style={[styles.bellBadge, { backgroundColor: p.rose }]}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {students.length === 0 ? (
          <EmptyView
            icon="people-outline"
            title="Chưa liên kết tài khoản học sinh"
            description="Vui lòng chuyển sang tab Liên kết để nhập mã 6 số do học sinh tạo."
            actionLabel="Đi tới Liên kết tài khoản"
            onAction={() => router.push('/(parent)/(tabs)/link')}
          />
        ) : (
          <>
            {/* Child Selector Chips */}
            {students.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {students.map((entry, idx) => {
                  const active = idx === selectedIdx;
                  return (
                    <TouchableOpacity
                      key={entry.student.id}
                      onPress={() => setSelectedIdx(idx)}
                      style={[
                        styles.childChip,
                        {
                          backgroundColor: active ? p.indigo : p.card,
                          borderColor: active ? p.indigo : p.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: active ? '#FFFFFF' : p.text,
                          fontSize: 13,
                          fontWeight: '700',
                        }}
                      >
                        {entry.student.fullName} (
                        {formatClassLabel(entry.student.className, entry.student.grade)})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {activeEntry ? (
              <>
                {/* Child Hero Card */}
                <View style={[styles.hero, { backgroundColor: p.indigo }]}>
                  <View style={styles.heroRow}>
                    <View style={styles.heroAvatar}>
                      <Text style={{ color: p.indigo, fontSize: 22, fontWeight: '800' }}>
                        {activeEntry.student.fullName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 19, fontWeight: '800' }}>
                        {activeEntry.student.fullName}
                      </Text>
                      <Text style={{ color: '#E0E7FF', fontSize: 12, fontWeight: '600' }}>
                        {formatClassLabel(
                          activeEntry.student.className,
                          activeEntry.student.grade,
                        )}
                        {activeEntry.student.studentCode
                          ? ` • ${activeEntry.student.studentCode}`
                          : ''}
                      </Text>
                      {activeEntry.student.school?.name ? (
                        <Text style={{ color: '#C7D2FE', fontSize: 12 }}>
                          {activeEntry.student.school.name}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {activeEntry.student.homeroomTeacher ? (
                    <View style={styles.gvcnRow}>
                      <Ionicons name="person-circle-outline" size={16} color="#E0E7FF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600', flex: 1 }}>
                        GVCN: {activeEntry.student.homeroomTeacher.fullName}
                      </Text>
                      <TouchableOpacity
                        onPress={() => router.push('/(parent)/(tabs)/contact')}
                        style={styles.msgPill}
                      >
                        <Text style={{ color: p.indigo, fontSize: 11, fontWeight: '800' }}>
                          Nhắn tin
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>

                {/* KPI Stats */}
                <View style={styles.kpiRow}>
                  <Card style={styles.kpiCard}>
                    <Text style={[styles.kpiLabel, { color: p.textMuted }]}>Tổng XP</Text>
                    <Text style={[styles.kpiVal, { color: p.primary }]}>
                      {activeEntry.student.gamificationProfile?.xp ??
                        activeEntry.student.gamificationProfile?.lifetimeXp ??
                        0}
                    </Text>
                    <Text style={{ fontSize: 11, color: p.textMuted }}>
                      Cấp {activeEntry.student.gamificationProfile?.level || 1}
                    </Text>
                  </Card>

                  <Card style={styles.kpiCard}>
                    <Text style={[styles.kpiLabel, { color: p.textMuted }]}>Điểm TB</Text>
                    <Text style={[styles.kpiVal, { color: p.emerald }]}>
                      {activeEntry.summary?.overallAverageScore !== null &&
                      activeEntry.summary?.overallAverageScore !== undefined
                        ? `${activeEntry.summary.overallAverageScore}`
                        : '--'}
                    </Text>
                    <Text style={{ fontSize: 11, color: p.textMuted }}>
                      {activeEntry.summary?.totalAttempts || 0} bài kiểm tra
                    </Text>
                  </Card>

                  <Card style={styles.kpiCard}>
                    <Text style={[styles.kpiLabel, { color: p.textMuted }]}>Chuỗi học</Text>
                    <Text style={[styles.kpiVal, { color: p.amber }]}>
                      {activeEntry.student.gamificationProfile?.currentStreak || 0}
                    </Text>
                    <Text style={{ fontSize: 11, color: p.textMuted }}>ngày liên tiếp</Text>
                  </Card>
                </View>

                {/* Per-Subject Mastery */}
                <Text style={[styles.secTitle, { color: p.text }]}>
                  Mức độ nắm vững từng môn
                </Text>
                {!activeEntry.subjectAnalytics ||
                activeEntry.subjectAnalytics.length === 0 ? (
                  <EmptyView
                    icon="analytics-outline"
                    title="Chưa có dữ liệu môn học"
                    description="Khi con làm bài kiểm tra, điểm mạnh/yếu từng môn sẽ cập nhật tự động."
                  />
                ) : (
                  <View style={{ gap: 8 }}>
                    {activeEntry.subjectAnalytics.map((sub) => {
                      const meta = MASTERY_MAP[sub.masteryStatus] || MASTERY_MAP.unassessed;
                      return (
                        <Card key={sub.subjectId} style={styles.subRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: p.text }}>
                              {sub.subjectName}
                            </Text>
                            <Text style={{ fontSize: 12, color: p.textMuted, marginTop: 2 }}>
                              {sub.attemptsCount} bài làm • TB:{' '}
                              {sub.averageScore !== null ? `${sub.averageScore}/100` : '--'}
                            </Text>
                          </View>
                          <Badge label={meta.label} tone={meta.tone} />
                        </Card>
                      );
                    })}
                  </View>
                )}

                {/* Recent Quizzes */}
                <Text style={[styles.secTitle, { color: p.text }]}>
                  Bài kiểm tra gần đây
                </Text>
                {activeEntry.recentQuizzes.length === 0 ? (
                  <EmptyView icon="document-text-outline" title="Con chưa làm bài kiểm tra nào" />
                ) : (
                  <View style={{ gap: 8 }}>
                    {activeEntry.recentQuizzes.slice(0, 5).map((q, idx) => (
                      <Card key={q.id || `quiz-${idx}`} style={styles.subRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: p.text }} numberOfLines={1}>
                            {q.quiz?.title || 'Bài kiểm tra'}
                          </Text>
                          <Text style={{ fontSize: 11, color: p.textMuted, marginTop: 2 }}>
                            {q.startedAt ? new Date(q.startedAt).toLocaleString('vi-VN') : ''}
                          </Text>
                        </View>
                        <Badge
                          label={`${q.score}/100`}
                          tone={q.score >= 50 ? 'emerald' : 'rose'}
                        />
                      </Card>
                    ))}
                  </View>
                )}

                {/* Upcoming Events */}
                <Text style={[styles.secTitle, { color: p.text }]}>
                  Lịch học & kiểm tra sắp tới
                </Text>
                {activeEntry.upcomingEvents.length === 0 ? (
                  <EmptyView icon="calendar-outline" title="Không có lịch sắp tới" />
                ) : (
                  <View style={{ gap: 8 }}>
                    {activeEntry.upcomingEvents.slice(0, 4).map((ev) => (
                      <Card key={ev.id} style={styles.subRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: p.text }}>
                            {ev.title}
                          </Text>
                          <Text style={{ fontSize: 12, color: p.textMuted, marginTop: 2 }}>
                            {new Date(ev.startTime).toLocaleString('vi-VN')}
                          </Text>
                        </View>
                        <Badge label={ev.type || 'CLASS'} tone="blue" />
                      </Card>
                    ))}
                  </View>
                )}
                {/* Child Recent Notifications */}
                {activeEntry.recentNotifications &&
                activeEntry.recentNotifications.length > 0 ? (
                  <>
                    <Text style={[styles.secTitle, { color: p.text }]}>
                      Thông báo gần đây của con
                    </Text>
                    <View style={{ gap: 8 }}>
                      {activeEntry.recentNotifications.slice(0, 4).map((n) => (
                        <Card key={n.id} style={{ gap: 4 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: p.text }}>
                            {n.title}
                          </Text>
                          <Text style={{ fontSize: 12, color: p.textMuted, lineHeight: 18 }}>
                            {n.body}
                          </Text>
                          <Text style={{ fontSize: 11, color: p.indigo, fontWeight: '600' }}>
                            {new Date(n.createdAt).toLocaleString('vi-VN')}
                          </Text>
                        </Card>
                      ))}
                    </View>
                  </>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <NotificationSheet
        visible={showNotifs}
        onClose={() => setShowNotifs(false)}
        notifications={notifications}
        onMarkRead={(id) => void handleMarkRead(id)}
        onMarkAllRead={() => void handleMarkAllRead()}
        onPressItem={(item) => {
          if (/tin nhắn|kiến nghị|đề xuất|phản hồi/i.test(item.title || '')) {
            setShowNotifs(false);
            router.push('/(parent)/(tabs)/contact');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  childChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  hero: {
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gvcnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  msgPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 14 },
  kpiLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  kpiVal: { fontSize: 22, fontWeight: '800' },
  secTitle: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
});
