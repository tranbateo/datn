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
  teacherApi,
  type NotificationItem,
  type TeacherDashboardStats,
} from '@/services/mobile.services';
import { useAuthStore } from '@/store/authStore';
import { getCached, invalidateCache, isCacheFresh, setCached } from '@/lib/ttl-cache';
import {
  ADAPTIVE_CONTENT_STYLE,
  Badge,
  Card,
  EmptyView,
  ErrorView,
  NotificationSheet,
  SkeletonDashboard,
  UserAvatar,
  usePalette,
} from '@/components/ui/mobile-ui';

const TEACHER_DASH_CACHE_KEY = 'teacher:dashboard';

interface TeacherDashSnapshot {
  stats: TeacherDashboardStats;
  notifications: NotificationItem[];
}

export default function TeacherDashboardScreen() {
  const p = usePalette();
  const router = useRouter();
  const { user } = useAuthStore();
  const cached = getCached<TeacherDashSnapshot>(TEACHER_DASH_CACHE_KEY);

  const [stats, setStats] = useState<TeacherDashboardStats | null>(
    cached?.stats ?? null,
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    cached?.notifications ?? [],
  );
  const [showNotifs, setShowNotifs] = useState(false);

  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (force = false) => {
    if (!force && isCacheFresh(TEACHER_DASH_CACHE_KEY)) {
      const snap = getCached<TeacherDashSnapshot>(TEACHER_DASH_CACHE_KEY);
      if (snap) {
        setStats(snap.stats);
        setNotifications(snap.notifications);
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }
    try {
      const [statsRes, notifsRes] = await Promise.all([
        teacherApi.getDashboardStats(),
        notificationsApi.list().catch(() => []),
      ]);
      const safeNotifs = Array.isArray(notifsRes) ? notifsRes : [];
      setStats(statsRes);
      setNotifications(safeNotifs);
      setCached<TeacherDashSnapshot>(TEACHER_DASH_CACHE_KEY, {
        stats: statsRes,
        notifications: safeNotifs,
      });
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải dữ liệu bảng điều khiển Giáo viên.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData(false);
    }, [loadData]),
  );

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    invalidateCache(TEACHER_DASH_CACHE_KEY);
    try {
      await notificationsApi.markRead(id);
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    invalidateCache(TEACHER_DASH_CACHE_KEY);
    try {
      await notificationsApi.markAllRead();
    } catch {
      // ignore
    }
  };

  if (loading && !stats) {
    return <SkeletonDashboard label="Đang tải Cổng Giáo viên..." />;
  }
  if (error && !stats) {
    return (
      <ErrorView
        message={error}
        onRetry={() => {
          setLoading(true);
          void loadData(true);
        }}
      />
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const pendingResets = stats?.pendingPasswordResetCount || 0;
  const pendingProps = stats?.pendingProposalsCount || 0;
  const homeroomClasses = stats?.homeroomClasses || [];
  const subjectClasses = stats?.subjectClasses || [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, ADAPTIVE_CONTENT_STYLE]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadData(true);
            }}
            tintColor={p.emerald}
          />
        }
      >
        {/* Top Bar */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.push('/(teacher)/(tabs)/settings')}>
            <UserAvatar
              uri={user?.avatarUrl}
              name={stats?.teacherProfile?.fullName || user?.fullName}
              size={44}
              bgColor={p.emerald}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: p.emerald }}>
              Cổng Giáo viên • {user?.school?.name || 'AI Tutor'}
            </Text>
            <Text style={{ fontSize: 21, fontWeight: '800', color: p.text }} numberOfLines={1}>
              {stats?.teacherProfile?.fullName || user?.fullName || 'Giáo viên'}
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

        {/* Hero Summary */}
        <View style={[styles.hero, { backgroundColor: p.emerald }]}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {homeroomClasses.map((hc) => (
              <View key={hc.id} style={styles.heroChip}>
                <Text style={styles.heroChipText}>
                  GVCN {formatClassLabel(hc.name)} ({hc.studentsCount} HS)
                </Text>
              </View>
            ))}
            {(stats?.teacherProfile?.primarySubjects || []).map((sub) => (
              <View key={sub} style={styles.heroChip}>
                <Text style={styles.heroChipText}>Bộ môn: {sub}</Text>
              </View>
            ))}
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(teacher)/(tabs)/communications',
                  params: { tab: 'broadcast', t: String(Date.now()) },
                })
              }
              style={styles.heroWhiteBtn}
            >
              <Ionicons name="megaphone-outline" size={16} color={p.emerald} />
              <Text style={{ color: p.emerald, fontWeight: '800', fontSize: 13 }}>
                Thông báo lớp
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(teacher)/(tabs)/communications',
                  params: { tab: 'parents', t: String(Date.now()) },
                })
              }
              style={styles.heroGhostBtn}
            >
              <Ionicons name="chatbubbles-outline" size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                Nhắn Phụ huynh
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Action Alerts */}
        {pendingResets > 0 || pendingProps > 0 ? (
          <Card
            style={{
              backgroundColor: p.amberSoft,
              borderColor: p.amber,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="alert-circle" size={20} color={p.amber} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }}>
                Việc cần xử lý ngay
              </Text>
            </View>
            {pendingResets > 0 ? (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(teacher)/(tabs)/communications',
                    params: { tab: 'resets', t: String(Date.now()) },
                  })
                }
                style={[styles.alertItem, { backgroundColor: p.card }]}
              >
                <Ionicons name="key-outline" size={18} color={p.amber} />
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: p.text }}>
                  {pendingResets} yêu cầu cấp lại mật khẩu từ học sinh
                </Text>
                <Ionicons name="chevron-forward" size={18} color={p.textMuted} />
              </TouchableOpacity>
            ) : null}
            {pendingProps > 0 ? (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(teacher)/(tabs)/communications',
                    params: { tab: 'parents', t: String(Date.now()) },
                  })
                }
                style={[styles.alertItem, { backgroundColor: p.card }]}
              >
                <Ionicons name="document-text-outline" size={18} color={p.indigo} />
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: p.text }}>
                  {pendingProps} đơn xin phép / kiến nghị Phụ huynh chờ duyệt
                </Text>
                <Ionicons name="chevron-forward" size={18} color={p.textMuted} />
              </TouchableOpacity>
            ) : null}
          </Card>
        ) : null}

        {/* 2x2 KPI Grid */}
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard}>
            <Text style={[styles.kpiLabel, { color: p.textMuted }]}>Học sinh</Text>
            <Text style={[styles.kpiVal, { color: p.primary }]}>
              {stats?.totalStudents || 0}
            </Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={[styles.kpiLabel, { color: p.textMuted }]}>Điểm TB</Text>
            <Text style={[styles.kpiVal, { color: p.emerald }]}>
              {stats?.averageScore || 0}
            </Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={[styles.kpiLabel, { color: p.textMuted }]}>Đề kiểm tra</Text>
            <Text style={[styles.kpiVal, { color: p.indigo }]}>
              {stats?.totalQuizzes || 0}
            </Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={[styles.kpiLabel, { color: p.textMuted }]}>Khóa học</Text>
            <Text style={[styles.kpiVal, { color: p.amber }]}>
              {stats?.totalCourses || 0}
            </Text>
          </Card>
        </View>

        {/* Assigned Classes */}
        <Text style={[styles.secTitle, { color: p.text }]}>
          Lớp học phụ trách ({homeroomClasses.length + subjectClasses.length})
        </Text>
        {homeroomClasses.length === 0 && subjectClasses.length === 0 ? (
          <EmptyView
            icon="school-outline"
            title="Chưa được phân công lớp"
            description="Liên hệ Quản trị viên nhà trường để phân công lớp chủ nhiệm hoặc lớp giảng dạy."
          />
        ) : (
          <View style={{ gap: 8 }}>
            {homeroomClasses.map((c) => (
              <TouchableOpacity
                key={`hr-${c.id}`}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/(teacher)/(tabs)/students',
                    params: { className: c.name, t: String(Date.now()) },
                  })
                }
              >
                <Card style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }}>
                      {formatClassLabel(c.name, c.grade)}
                    </Text>
                    <Text style={{ fontSize: 12, color: p.textMuted }}>
                      Sĩ số: {c.studentsCount} học sinh • Chạm để xem danh sách
                    </Text>
                  </View>
                  <Badge label="GVCN" tone="emerald" />
                  <Ionicons name="chevron-forward" size={16} color={p.textMuted} />
                </Card>
              </TouchableOpacity>
            ))}
            {subjectClasses.map((sc) => (
              <TouchableOpacity
                key={`sb-${sc.id}`}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/(teacher)/(tabs)/students',
                    params: { className: sc.className, t: String(Date.now()) },
                  })
                }
              >
                <Card style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: p.text }}>
                      {formatClassLabel(sc.className, sc.grade)} • {sc.subjectName}
                    </Text>
                    <Text style={{ fontSize: 12, color: p.textMuted }}>
                      Sĩ số: {sc.studentsCount} học sinh • Chạm để xem danh sách
                    </Text>
                  </View>
                  <Badge label="Bộ môn" tone="blue" />
                  <Ionicons name="chevron-forward" size={16} color={p.textMuted} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Students Needing Attention */}
        <Text style={[styles.secTitle, { color: p.text }]}>Học sinh cần lưu ý</Text>
        {!stats?.needsAttention || stats.needsAttention.length === 0 ? (
          <EmptyView
            icon="checkmark-circle-outline"
            title="Chưa có cảnh báo học tập"
            description="Học sinh cần hỗ trợ sẽ tự động hiển thị tại đây dựa trên kết quả bài làm."
          />
        ) : (
          <View style={{ gap: 8 }}>
            {stats.needsAttention.map((item, idx) => (
              <TouchableOpacity
                key={`att-${idx}`}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/(teacher)/(tabs)/students',
                    params: { search: item.name, t: String(Date.now()) },
                  })
                }
              >
                <Card style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: p.text }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: p.rose, marginTop: 2 }}>
                      {item.issues}
                    </Text>
                  </View>
                  <Badge label="Cần hỗ trợ" tone="rose" />
                  <Ionicons name="chevron-forward" size={16} color={p.textMuted} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <NotificationSheet
        visible={showNotifs}
        onClose={() => setShowNotifs(false)}
        notifications={notifications}
        onMarkRead={(id) => void handleMarkRead(id)}
        onMarkAllRead={() => void handleMarkAllRead()}
        onPressItem={(item) => {
          setShowNotifs(false);
          if (/cấp lại mật khẩu|quên mật khẩu/i.test(item.title || '')) {
            router.push({
              pathname: '/(teacher)/(tabs)/communications',
              params: { tab: 'resets', t: String(Date.now()) },
            });
          } else if (/tin nhắn|kiến nghị|đề xuất/i.test(item.title || '')) {
            router.push({
              pathname: '/(teacher)/(tabs)/communications',
              params: { tab: 'parents', t: String(Date.now()) },
            });
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
  hero: { borderRadius: 22, padding: 18, gap: 14 },
  heroChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  heroActions: { flexDirection: 'row', gap: 10 },
  heroWhiteBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    minHeight: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroGhostBtn: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
    minHeight: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { width: '48%', alignItems: 'center', gap: 4, paddingVertical: 14 },
  kpiLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  kpiVal: { fontSize: 24, fontWeight: '800' },
  secTitle: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
});
