import React, { useCallback, useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import {
  gamificationApi,
  type GamificationProfile,
  type LearningAnalytics,
  type MasteryStatus,
} from '@/services/mobile.services';
import {
  Badge,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  usePalette,
} from '@/components/ui/mobile-ui';

const MASTERY_META: Record<
  MasteryStatus,
  { label: string; tone: 'emerald' | 'amber' | 'rose' | 'slate' }
> = {
  strong: { label: 'Vững kiến thức', tone: 'emerald' },
  developing: { label: 'Đang tiến bộ', tone: 'amber' },
  weak: { label: 'Cần ôn tập', tone: 'rose' },
  unassessed: { label: 'Chưa kiểm tra', tone: 'slate' },
};

export default function StudentProgressScreen() {
  const p = usePalette();
  const router = useRouter();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [gProf, gAnal] = await Promise.all([
        gamificationApi.getProfile(),
        gamificationApi.getAnalytics(),
      ]);
      setProfile(gProf);
      setAnalytics(gAnal);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải báo cáo tiến độ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await loadData();
    };
    void run();
  }, [loadData]);

  if (loading) return <LoadingView label="Đang tổng hợp tiến độ học tập..." />;
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

  const xp = profile?.currentXp ?? profile?.xp ?? 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadData();
            }}
            tintColor={p.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: p.card, borderColor: p.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={p.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: p.text }]}>Tiến độ & Thành tích</Text>
            <Text style={{ fontSize: 12, color: p.textMuted }}>
              Phân tích chủ đề mạnh / yếu và đề xuất ôn tập
            </Text>
          </View>
        </View>

        {/* KPI Row */}
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiItem}>
            <Text style={[styles.kpiLabel, { color: p.textMuted }]}>Cấp độ</Text>
            <Text style={[styles.kpiNum, { color: p.primary }]}>
              {profile?.level || 1}
            </Text>
          </Card>
          <Card style={styles.kpiItem}>
            <Text style={[styles.kpiLabel, { color: p.textMuted }]}>Tổng XP</Text>
            <Text style={[styles.kpiNum, { color: p.indigo }]}>{xp}</Text>
          </Card>
          <Card style={styles.kpiItem}>
            <Text style={[styles.kpiLabel, { color: p.textMuted }]}>Chuỗi ngày</Text>
            <Text style={[styles.kpiNum, { color: p.amber }]}>
              {profile?.streakDays || 0}
            </Text>
          </Card>
        </View>

        {/* Summary Card */}
        {analytics ? (
          <Card style={{ gap: 10 }}>
            <Text style={[styles.secTitle, { color: p.text }]}>Tổng quan kết quả</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Badge label={`${analytics.summary.totalAttempts} bài làm`} tone="blue" />
              <Badge
                label={
                  analytics.summary.overallAverageScore !== null
                    ? `TB: ${analytics.summary.overallAverageScore}/100`
                    : 'Chưa có điểm TB'
                }
                tone="indigo"
              />
              <Badge label={`${analytics.summary.strongCount} môn vững`} tone="emerald" />
              <Badge label={`${analytics.summary.weakCount} môn cần ôn`} tone="rose" />
            </View>
            {analytics.weakestSubject ? (
              <View style={[styles.recommendBox, { backgroundColor: p.amberSoft }]}>
                <Ionicons name="bulb-outline" size={18} color={p.amber} />
                <Text style={{ flex: 1, fontSize: 13, color: p.text, lineHeight: 18 }}>
                  Gợi ý ưu tiên ôn môn{' '}
                  <Text style={{ fontWeight: '800' }}>
                    {analytics.weakestSubject.subjectName}
                  </Text>
                  {analytics.weakestSubject.averageScore !== null
                    ? ` (điểm TB hiện tại: ${analytics.weakestSubject.averageScore}/100).`
                    : '.'}
                </Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {/* Per-Subject Mastery */}
        <Text style={[styles.secTitle, { color: p.text }]}>Phân tích từng môn học</Text>
        {!analytics || analytics.subjects.length === 0 ? (
          <EmptyView
            icon="analytics-outline"
            title="Chưa có dữ liệu phân tích"
            description="Hãy làm ít nhất 1 bài luyện tập để hệ thống đánh giá mức độ nắm vững kiến thức."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {analytics.subjects.map((sub) => {
              const meta = MASTERY_META[sub.masteryStatus] || MASTERY_META.unassessed;
              return (
                <Card key={sub.subjectId} style={{ gap: 8 }}>
                  <View style={styles.rowBetween}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: p.text, flex: 1 }}>
                      {sub.subjectName}
                    </Text>
                    <Badge label={meta.label} tone={meta.tone} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <Text style={{ fontSize: 12, color: p.textMuted }}>
                      Số bài: <Text style={{ fontWeight: '700', color: p.text }}>{sub.attemptsCount}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: p.textMuted }}>
                      Điểm TB:{' '}
                      <Text style={{ fontWeight: '700', color: p.text }}>
                        {sub.averageScore !== null ? `${sub.averageScore}/100` : '--'}
                      </Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: p.textMuted }}>
                      Cao nhất:{' '}
                      <Text style={{ fontWeight: '700', color: p.emerald }}>
                        {sub.bestScore !== null ? `${sub.bestScore}/100` : '--'}
                      </Text>
                    </Text>
                  </View>
                  {sub.recommendation ? (
                    <Text style={{ fontSize: 12, color: p.textMuted, lineHeight: 18 }}>
                      {sub.recommendation}
                    </Text>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}

        {/* Recent Attempts */}
        {analytics && analytics.recentAttempts.length > 0 ? (
          <>
            <Text style={[styles.secTitle, { color: p.text }]}>Bài làm gần đây</Text>
            <View style={{ gap: 10 }}>
              {analytics.recentAttempts.slice(0, 6).map((att) => (
                <TouchableOpacity
                  key={att.id}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/(student)/quiz/[quizId]',
                      params: { quizId: att.quizId, attemptId: att.id },
                    })
                  }
                >
                  <Card style={styles.rowBetween}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: p.text }} numberOfLines={1}>
                        {att.quizTitle}
                      </Text>
                      <Text style={{ fontSize: 12, color: p.textMuted, marginTop: 2 }}>
                        {att.subjectName} •{' '}
                        {new Date(att.completedAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    <Badge
                      label={`${att.score}/100`}
                      tone={att.score >= 50 ? 'emerald' : 'rose'}
                    />
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800' },
  kpiGrid: { flexDirection: 'row', gap: 10 },
  kpiItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14 },
  kpiLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  kpiNum: { fontSize: 22, fontWeight: '800' },
  secTitle: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  recommendBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
