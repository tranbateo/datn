import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

export default function StudentCourseDetailScreen() {
  const p = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [course, setCourse] = useState<CourseItem | null>(null);
  const [docs, setDocs] = useState<CourseDocument[]>([]);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [readingDoc, setReadingDoc] = useState<CourseDocument | null>(null);
  const [docSearch, setDocSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredChunks = useMemo(() => {
    const chunks = readingDoc?.chunks || [];
    const q = docSearch.trim().toLowerCase();
    if (!q) return chunks;
    return chunks.filter(
      (c) =>
        (c.content || '').toLowerCase().includes(q) ||
        `trang ${c.page}`.includes(q),
    );
  }, [readingDoc, docSearch]);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    try {
      const [cData, dData] = await Promise.all([
        coursesApi.detail(id),
        coursesApi.documents(id).catch(() => []),
      ]);
      setCourse(cData);
      // Prefer course.documents (includes extracted chunks for in-app reader)
      const mergedDocs =
        Array.isArray(cData.documents) && cData.documents.length > 0
          ? cData.documents
          : Array.isArray(dData)
            ? dData
            : [];
      setDocs(mergedDocs);
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

  const askAiAbout = (topicLabel: string) => {
    setReadingDoc(null);
    router.push({
      pathname: '/(student)/(tabs)/explore',
      params: {
        subjectId: course.subject?.id || '',
        subjectName: course.subject?.name || '',
        prefill: `Em hãy tóm tắt và giải thích những ý chính trong "${topicLabel}" giúp em nhé!`,
      },
    });
  };

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

      <ScrollView contentContainerStyle={[styles.scroll, ADAPTIVE_CONTENT_STYLE]}>
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
                    <View style={{ gap: 10 }}>
                      <RichText
                        content={
                          lesson.content || 'Nội dung tóm tắt bài học đang được cập nhật.'
                        }
                        color={p.text}
                        boldColor={p.text}
                      />
                      {Array.isArray(lesson.relatedExcerpts) &&
                      lesson.relatedExcerpts.length > 0 ? (
                        <View style={[styles.excerptBox, { backgroundColor: p.primarySoft }]}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: p.primary }}>
                            Trích dẫn từ sách / tài liệu lớp:
                          </Text>
                          {lesson.relatedExcerpts.slice(0, 2).map((ex, eIdx) => (
                            <Text
                              key={`${lesson.id}-ex-${eIdx}`}
                              style={{ fontSize: 12, color: p.text, lineHeight: 18, marginTop: 4 }}
                            >
                              • {ex.fileName} (Tr.{ex.page}): {ex.content.slice(0, 180)}...
                            </Text>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}

        {/* Published PDF Documents (Tappable to open in-app reader!) */}
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
              <TouchableOpacity
                key={doc.id}
                activeOpacity={0.85}
                onPress={() => setReadingDoc(doc)}
              >
                <Card style={styles.docRow}>
                  <View style={[styles.docIcon, { backgroundColor: p.roseSoft }]}>
                    <Ionicons name="document-text-outline" size={20} color={p.rose} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: p.text }} numberOfLines={2}>
                      {doc.fileName}
                    </Text>
                    <Text style={{ fontSize: 12, color: p.textMuted, marginTop: 2 }}>
                      {doc.size || doc.fileSize || 'PDF'} •{' '}
                      {doc.chunks?.length
                        ? `${doc.chunks.length} phần nội dung • Chạm để đọc`
                        : 'Chạm để xem & hỏi Gia sư AI'}
                    </Text>
                  </View>
                  <Ionicons name="book-outline" size={20} color={p.primary} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* In-App Document Reader Modal */}
      <Modal
        visible={Boolean(readingDoc)}
        animationType="slide"
        onRequestClose={() => {
          setReadingDoc(null);
          setDocSearch('');
        }}
      >
        <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
          <View style={[styles.header, { backgroundColor: p.card, borderBottomColor: p.border }]}>
            <TouchableOpacity
              onPress={() => {
                setReadingDoc(null);
                setDocSearch('');
              }}
              hitSlop={10}
            >
              <Ionicons name="close" size={24} color={p.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }} numberOfLines={1}>
                {readingDoc?.fileName}
              </Text>
              <Text style={{ fontSize: 11, color: p.textMuted }}>
                Trình đọc tài liệu lớp học (đã trích xuất văn bản)
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={[styles.scroll, ADAPTIVE_CONTENT_STYLE]}>
            {readingDoc ? (
              <PrimaryButton
                title="Hỏi Gia sư AI về tài liệu này"
                icon="sparkles-outline"
                onPress={() => askAiAbout(readingDoc.fileName)}
              />
            ) : null}

            {readingDoc?.chunks && readingDoc.chunks.length > 0 ? (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    backgroundColor: p.card,
                    borderColor: p.border,
                  }}
                >
                  <Ionicons name="search-outline" size={18} color={p.textMuted} />
                  <TextInput
                    style={{ flex: 1, color: p.text, fontSize: 13, paddingVertical: 10 }}
                    placeholder="Tìm từ khóa hoặc số trang trong tài liệu..."
                    placeholderTextColor={p.textMuted}
                    value={docSearch}
                    onChangeText={setDocSearch}
                  />
                  {docSearch ? (
                    <TouchableOpacity onPress={() => setDocSearch('')}>
                      <Ionicons name="close-circle" size={18} color={p.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {filteredChunks.length === 0 ? (
                  <EmptyView
                    icon="search-outline"
                    title="Không tìm thấy đoạn phù hợp"
                    description={`Không có nội dung nào khớp với từ khóa "${docSearch}".`}
                  />
                ) : (
                  filteredChunks.map((chunk, idx) => (
                    <Card key={`chunk-${chunk.page}-${idx}`} style={{ gap: 8 }}>
                      <Badge label={`Trang ${chunk.page || idx + 1}`} tone="blue" />
                      <RichText content={chunk.content} color={p.text} boldColor={p.text} />
                    </Card>
                  ))
                )}
              </>
            ) : (
              <EmptyView
                icon="document-text-outline"
                title="Tài liệu dạng ảnh scan hoặc chưa có bản trích xuất chữ"
                description="Em vẫn có thể bấm nút phía trên để hỏi Gia sư AI hoặc xem bản PDF gốc đầy đủ trên Cổng Web."
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  excerptBox: { padding: 12, borderRadius: 12 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
