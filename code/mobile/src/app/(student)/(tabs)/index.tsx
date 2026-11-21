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
  calendarApi,
  curriculumApi,
  formatClassLabel,
  gamificationApi,
  notificationsApi,
  usersApi,
  type CalendarEvent,
  type GamificationProfile,
  type NotificationItem,
  type Subject,
} from '@/services/mobile.services';
import { useAuthStore, type MobileUser } from '@/store/authStore';
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

const STUDENT_HOME_CACHE_KEY = 'student:home';

interface StudentHomeSnapshot {
  profile: MobileUser;
  gamification: GamificationProfile | null;
  subjects: Subject[];
  upcomingEvents: CalendarEvent[];
  notifications: NotificationItem[];
}

export default function StudentHomeScreen() {
  const p = usePalette();
  const router = useRouter();
  const { user: storedUser, updateUser } = useAuthStore();
  const initialSnap = getCached<StudentHomeSnapshot>(STUDENT_HOME_CACHE_KEY);

  const [profile, setProfile] = useState<MobileUser | null>(
    initialSnap?.profile ?? storedUser,
  );
  const [gamification, setGamification] = useState<GamificationProfile | null>(
    initialSnap?.gamification ?? null,
  );
  const [subjects, setSubjects] = useState<Subject[]>(initialSnap?.subjects ?? []);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>(
    initialSnap?.upcomingEvents ?? [],
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialSnap?.notifications ?? [],
  );
  const [showNotifs, setShowNotifs] = useState(false);

  const [loading, setLoading] = useState(!initialSnap);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (force = false) => {
      if (!force && isCacheFresh(STUDENT_HOME_CACHE_KEY)) {
        const snap = getCached<StudentHomeSnapshot>(STUDENT_HOME_CACHE_KEY);
        if (snap) {
          setProfile(snap.profile);
          setGamification(snap.gamification);
          setSubjects(snap.subjects);
          setUpcomingEvents(snap.upcomingEvents);
          setNotifications(snap.notifications);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }
      try {
        const [userRes, gamifRes, eventsRes, notifsRes] = await Promise.all([
          usersApi.getProfile(),
          gamificationApi.getProfile().catch(() => null),
          calendarApi.list().catch(() => []),
          notificationsApi.list().catch(() => []),
        ]);

        const safeNotifs = Array.isArray(notifsRes) ? notifsRes : [];
        const now = Date.now();
        const upcoming = (Array.isArray(eventsRes) ? eventsRes : [])
          .filter((e) => new Date(e.startTime).getTime() >= now - 3_600_000)
          .sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
          )
          .slice(0, 3);

        let safeSubs: Subject[] = [];
        if (userRes?.grade) {
          const subs = await curriculumApi
            .getSubjectsByGrade(userRes.grade)
            .catch(() => []);
          safeSubs = Array.isArray(subs) ? subs : [];
        }

        setProfile(userRes);
        void updateUser(userRes);
        setGamification(gamifRes);
        setNotifications(safeNotifs);
        setUpcomingEvents(upcoming);
        setSubjects(safeSubs);
        setError(null);

        setCached<StudentHomeSnapshot>(STUDENT_HOME_CACHE_KEY, {
          profile: userRes,
          gamification: gamifRes,
          subjects: safeSubs,
          upcomingEvents: upcoming,
          notifications: safeNotifs,
        });
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Không thể tải dữ liệu trang chủ.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [updateUser],
  );

  useFocusEffect(
    useCallback(() => {
      void loadData(false);
    }, [loadData]),
  );

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    invalidateCache(STUDENT_HOME_CACHE_KEY);
    try {
      await notificationsApi.markRead(id);
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    invalidateCache(STUDENT_HOME_CACHE_KEY);
    try {
      await notificationsApi.markAllRead();
    } catch {
      // ignore
    }
  };

  if (loading && !profile) {
    return <SkeletonDashboard label="Đang tải không gian học tập..." />;
  }

  if (error && !profile) {
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

  const activeClass = profile?.classEnrollments?.[0]?.class;
  const currentXp = gamification?.currentXp ?? gamification?.xp ?? 0;
  const nextLevelXp = gamification?.nextLevelXp || 100;
  const xpPercent =
    typeof gamification?.levelProgressPercent === 'number'
      ? Math.max(0, Math.min(100, gamification.levelProgressPercent))
      : Math.min(100, Math.round((currentXp / nextLevelXp) * 100));
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
              void loadData(true);
            }}
            tintColor={p.primary}
          />
        }
      >
        {/* Top Bar */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/profile')}>
            <UserAvatar
              uri={profile?.avatarUrl}
              name={profile?.fullName}
              size={44}
              bgColor={p.primary}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.schoolText, { color: p.textMuted }]} numberOfLines={1}>
              {profile?.school?.name || 'AI Tutor Education'}
            </Text>
            <Text style={[styles.greeting, { color: p.text }]} numberOfLines={1}>
              Chào, {profile?.fullName || 'Học sinh'}!
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

        {/* Hero Banner */}
        <View style={[styles.hero, { backgroundColor: p.primary }]}>
          <View style={styles.heroBadges}>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>
                {formatClassLabel(activeClass?.name, profile?.grade)}
              </Text>
            </View>
            {profile?.studentCode ? (
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>Mã HS: {profile.studentCode}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.heroSub}>
            {activeClass?.homeroomTeacher?.fullName
              ? `GVCN: ${activeClass.homeroomTeacher.fullName}`
              : 'Hỏi đáp Gia sư AI trích dẫn tài liệu & luyện đề bám sát chương trình'}
          </Text>

          <View style={styles.heroActions}>
            <TouchableOpacity
              onPress={() => router.push('/(student)/(tabs)/explore')}
              style={styles.heroPrimaryBtn}
            >
              <Ionicons name="sparkles" size={16} color={p.primary} />
              <Text style={[styles.heroPrimaryBtnText, { color: p.primary }]}>
                Hỏi Gia sư AI
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(student)/(tabs)/practice')}
              style={styles.heroSecondaryBtn}
            >
              <Ionicons name="create-outline" size={16} color="#FFFFFF" />
              <Text style={styles.heroSecondaryBtnText}>Làm bài tập</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI Grid */}
        <View style={styles.kpiRow}>
          <Card style={{ flex: 1, gap: 6 }}>
            <View style={styles.kpiHead}>
              <Text style={[styles.kpiLabel, { color: p.textMuted }]}>Cấp độ</Text>
              <Ionicons name="trophy-outline" size={18} color={p.primary} />
            </View>
            <Text style={[styles.kpiValue, { color: p.text }]}>
              Cấp {gamification?.level || 1}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: p.cardMuted }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: p.primary, width: `${xpPercent}%` },
                ]}
              />
            </View>
            <Text style={{ fontSize: 11, color: p.textMuted, fontWeight: '600' }}>
              {currentXp} / {nextLevelXp} XP
            </Text>
          </Card>

          <Card style={{ flex: 1, gap: 6 }}>
            <View style={styles.kpiHead}>
              <Text style={[styles.kpiLabel, { color: p.textMuted }]}>Chuỗi học</Text>
              <Ionicons name="flame-outline" size={18} color={p.amber} />
            </View>
            <Text style={[styles.kpiValue, { color: p.text }]}>
              {gamification?.streakDays || 0} ngày
            </Text>
            <Text style={{ fontSize: 12, color: p.textMuted, lineHeight: 16 }}>
              Duy trì ôn tập mỗi ngày để tăng hạng
            </Text>
          </Card>
        </View>

        {/* Quick Access: Bài giảng & Tiến độ */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(student)/courses')}
            style={[styles.quickBtn, { backgroundColor: p.card, borderColor: p.border }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: p.indigoSoft }]}>
              <Ionicons name="library-outline" size={20} color={p.indigo} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickTitle, { color: p.text }]}>Bài giảng & PDF</Text>
              <Text style={{ fontSize: 11, color: p.textMuted }}>Tài liệu của lớp</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(student)/(tabs)/progress')}
            style={[styles.quickBtn, { backgroundColor: p.card, borderColor: p.border }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: p.emeraldSoft }]}>
              <Ionicons name="bar-chart-outline" size={20} color={p.emerald} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickTitle, { color: p.text }]}>Tiến độ học</Text>
              <Text style={{ fontSize: 11, color: p.textMuted }}>Mạnh / yếu theo môn</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Subjects */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: p.text }]}>
            Môn học Khối {profile?.grade || ''}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/practice')}>
            <Text style={{ color: p.primary, fontSize: 13, fontWeight: '700' }}>
              Tất cả đề →
            </Text>
          </TouchableOpacity>
        </View>

        {subjects.length === 0 ? (
          <EmptyView
            icon="book-outline"
            title="Chưa có môn học"
            description="Nhà trường chưa cấu hình môn học cho khối lớp hiện tại."
          />
        ) : (
          <View style={styles.subjectGrid}>
            {subjects.map((sub) => (
              <Card key={sub.id} style={styles.subjectCard}>
                <View style={styles.subjectTop}>
                  <View style={[styles.subjectAvatar, { backgroundColor: p.primarySoft }]}>
                    <Text style={{ color: p.primary, fontWeight: '800', fontSize: 16 }}>
                      {sub.name.charAt(0)}
                    </Text>
                  </View>
                  <Badge label={`Khối ${sub.grade}`} tone="slate" />
                </View>
                <Text style={[styles.subjectName, { color: p.text }]} numberOfLines={1}>
                  {sub.name}
                </Text>
                <View style={styles.subjectBtns}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/(student)/(tabs)/practice',
                        params: { subjectId: sub.id },
                      })
                    }
                    style={[styles.subActionBtn, { backgroundColor: p.cardMuted }]}
                  >
                    <Text style={{ color: p.text, fontSize: 12, fontWeight: '700' }}>
                      Luyện tập
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/(student)/(tabs)/explore',
                        params: { subjectId: sub.id, subjectName: sub.name },
                      })
                    }
                    style={[styles.subActionBtn, { backgroundColor: p.primarySoft }]}
                  >
                    <Text style={{ color: p.primary, fontSize: 12, fontWeight: '700' }}>
                      Hỏi AI
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Upcoming Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: p.text }]}>Lịch học sắp tới</Text>
          <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/schedule')}>
            <Text style={{ color: p.primary, fontSize: 13, fontWeight: '700' }}>
              Xem lịch →
            </Text>
          </TouchableOpacity>
        </View>

        {upcomingEvents.length === 0 ? (
          <EmptyView
            icon="calendar-outline"
            title="Chưa có lịch học sắp tới"
            description="Bạn có thể thêm lịch tự học hoặc chụp ảnh thời khóa biểu để quét OCR."
            actionLabel="Mở Thời khóa biểu"
            onAction={() => router.push('/(student)/(tabs)/schedule')}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {upcomingEvents.map((ev) => (
              <Card key={ev.id} style={styles.eventCard}>
                <View style={[styles.eventIcon, { backgroundColor: p.primarySoft }]}>
                  <Ionicons name="time-outline" size={20} color={p.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventTitle, { color: p.text }]} numberOfLines={1}>
                    {ev.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: p.textMuted, marginTop: 2 }}>
                    {new Date(ev.startTime).toLocaleDateString('vi-VN')} •{' '}
                    {new Date(ev.startTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Badge label={ev.type || 'CLASS'} tone="blue" />
              </Card>
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
          const text = `${item.title || ''} ${item.body || ''}`;
          if (/bài tập|kiểm tra|đề/i.test(text)) {
            router.push('/(student)/(tabs)/practice');
          } else if (/thăng cấp|cấp độ|xp/i.test(text)) {
            router.push('/(student)/(tabs)/progress');
          } else if (/lịch học|thời khóa biểu/i.test(text)) {
            router.push('/(student)/(tabs)/schedule');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  schoolText: { fontSize: 12, fontWeight: '600' },
  greeting: { fontSize: 22, fontWeight: '800', marginTop: 2 },
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
  hero: {
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  heroSub: { color: '#DBEAFE', fontSize: 13, lineHeight: 19 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  heroPrimaryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    minHeight: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroPrimaryBtnText: { fontWeight: '800', fontSize: 13 },
  heroSecondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    minHeight: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroSecondaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  kpiValue: { fontSize: 20, fontWeight: '800' },
  progressTrack: { height: 7, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontSize: 14, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  subjectCard: { width: '48%', gap: 10, padding: 14 },
  subjectTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectName: { fontSize: 15, fontWeight: '700' },
  subjectBtns: { flexDirection: 'row', gap: 6 },
  subActionBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: { fontSize: 14, fontWeight: '700' },
});
