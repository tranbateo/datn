import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  coursesApi,
  type CourseDocument,
  type CourseItem,
} from '@/services/mobile.services';
import {
  Badge,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  PrimaryButton,
  usePalette,
} from '@/components/ui/mobile-ui';

export default function StudentCourseDetailScreen() {
  const p = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [course, setCourse] = useState<CourseItem | null>(null);
  const [docs, setDocs] = useState<CourseDocument[]>([]);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    try {
      const [cData, dData] = await Promise.all([
        coursesApi.detail(id),
        coursesApi.documents(id).catch(() => []),
      ]);
      setCourse(cData);
      setDocs(Array.isArray(dData) ? dData : []);
      if (cData.lessons?.[0]?.id) {
        setExpandedLessonId(cData.lessons[0].id);
      }
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải chi tiết bài giảng.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const run = async () => {
      await loadDetail();
    };
    void run();
  }, [loadDetail]);

  if (loading) return <LoadingView label="Đang tải nội dung bài giảng..." />;
  if (error || !course) {
    return (
      <ErrorView
        message={error || 'Không tìm thấy khóa học.'}
        onRetry={() => {
          setLoading(true);
          void loadDetail();
        }}
      />
    );
  }

  const lessons = course.lessons || [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: p.card, borderBottomColor: p.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={p.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }} numberOfLines={1}>
            {course.title}
          </Text>
          <Text style={{ fontSize: 12, color: p.textMuted }}>
            {course.subject?.name || 'Môn học'} • Khối {course.grade || ''}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {course.description ? (
          <Card>
            <Text style={{ fontSize: 14, color: p.textMuted, lineHeight: 20 }}>
              {course.description}
            </Text>
          </Card>
        ) : null}

        {course.subject?.id ? (
          <PrimaryButton
            title={`Hỏi Gia sư AI về môn ${course.subject.name}`}
            icon="sparkles-outline"
            onPress={() =>
              router.push({
                pathname: '/(student)/(tabs)/explore',
                params: {
                  subjectId: course.subject?.id,
                  subjectName: course.subject?.name,
                },
              })
            }
          />
        ) : null}

        {/* Lessons */}
        <Text style={[styles.secTitle, { color: p.text }]}>
          Danh sách bài học ({lessons.length})
        </Text>
        {lessons.length === 0 ? (
          <EmptyView icon="book-outline" title="Chưa có bài học nào trong khóa này" />
        ) : (
          <View style={{ gap: 10 }}>
            {lessons.map((lesson, idx) => {
              const open = expandedLessonId === lesson.id;
              return (
                <Card key={lesson.id} style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setExpandedLessonId(open ? null : lesson.id)}
                    style={styles.lessonHead}
                  >
                    <Badge label={`Bài ${idx + 1}`} tone="blue" />
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: p.text }}>
                      {lesson.title}
                    </Text>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={p.textMuted}
                    />
                  </TouchableOpacity>
                  {open ? (
                    <Text style={{ fontSize: 14, color: p.text, lineHeight: 22 }}>
                      {lesson.content || 'Nội dung tóm tắt bài học đang được cập nhật.'}
                    </Text>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}

        {/* Published PDF Documents */}
        <Text style={[styles.secTitle, { color: p.text }]}>
          Tài liệu PDF đã xuất bản ({docs.length})
        </Text>
        {docs.length === 0 ? (
          <EmptyView
            icon="document-outline"
            title="Chưa có tài liệu PDF đính kèm"
          />
        ) : (
          <View style={{ gap: 10 }}>
            {docs.map((doc) => (
              <Card key={doc.id} style={styles.docRow}>
                <View style={[styles.docIcon, { backgroundColor: p.roseSoft }]}>
                  <Ionicons name="document-text-outline" size={20} color={p.rose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: p.text }} numberOfLines={2}>
                    {doc.fileName}
                  </Text>
                  <Text style={{ fontSize: 12, color: p.textMuted, marginTop: 2 }}>
                    {doc.fileSize || 'PDF'} • Đã đồng bộ vào Gia sư AI
                  </Text>
                </View>
                <Badge label="Sẵn sàng" tone="emerald" />
              </Card>
            ))}
          </View>
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
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  secTitle: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  lessonHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
