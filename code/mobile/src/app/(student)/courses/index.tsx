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
import { coursesApi, type CourseItem } from '@/services/mobile.services';
import {
  Badge,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  usePalette,
} from '@/components/ui/mobile-ui';

export default function StudentCoursesScreen() {
  const p = usePalette();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    try {
      const data = await coursesApi.list();
      setCourses(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách bài giảng.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await loadCourses();
    };
    void run();
  }, [loadCourses]);

  if (loading) return <LoadingView label="Đang tải bài giảng & tài liệu..." />;
  if (error) {
    return (
      <ErrorView
        message={error}
        onRetry={() => {
          setLoading(true);
          void loadCourses();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: p.card, borderBottomColor: p.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={p.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: p.text }}>
            Bài giảng & Tài liệu lớp
          </Text>
          <Text style={{ fontSize: 12, color: p.textMuted }}>
            Chỉ hiển thị bài giảng và tài liệu đã xuất bản của khối lớp em
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadCourses();
            }}
            tintColor={p.primary}
          />
        }
      >
        {courses.length === 0 ? (
          <EmptyView
            icon="library-outline"
            title="Chưa có bài giảng nào"
            description="Giáo viên bộ môn sẽ sớm xuất bản bài giảng và tài liệu ôn tập cho lớp."
          />
        ) : (
          courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/(student)/courses/[id]',
                  params: { id: course.id },
                })
              }
            >
              <Card style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {course.subject?.name ? (
                    <Badge label={course.subject.name} tone="blue" />
                  ) : null}
                  {course.grade ? (
                    <Badge label={`Khối ${course.grade}`} tone="indigo" />
                  ) : null}
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }}>
                  {course.title}
                </Text>
                {course.description ? (
                  <Text style={{ fontSize: 13, color: p.textMuted }} numberOfLines={2}>
                    {course.description}
                  </Text>
                ) : null}
                <View style={styles.metaRow}>
                  <Text style={{ fontSize: 12, color: p.textMuted }}>
                    GV: {course.teacher?.fullName || 'Bộ môn'}
                  </Text>
                  <Text style={{ fontSize: 12, color: p.primary, fontWeight: '700' }}>
                    {course._count?.lessons || 0} bài học • {course._count?.documents || 0} tài liệu →
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))
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
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
});
