import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import {
  chatApi,
  curriculumApi,
  usersApi,
  type ChatMessageItem,
  type ChatSessionItem,
  type Subject,
} from '@/services/mobile.services';
import { useAuthStore } from '@/store/authStore';
import { Badge, Card, EmptyView, PrimaryButton, usePalette } from '@/components/ui/mobile-ui';

export default function StudentAiTutorScreen() {
  const p = usePalette();
  const params = useLocalSearchParams<{ subjectId?: string; subjectName?: string }>();
  const { user } = useAuthStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    params.subjectId || null,
  );
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [pickedImage, setPickedImage] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);

  const [loadingInit, setLoadingInit] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [reportMsg, setReportMsg] = useState<ChatMessageItem | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const listRef = useRef<FlatList<ChatMessageItem>>(null);

  useEffect(() => {
    if (params.subjectId) {
      setSelectedSubjectId(params.subjectId);
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [params.subjectId]);

  const loadInitial = useCallback(async () => {
    setLoadingInit(true);
    try {
      const profile = user?.grade ? user : await usersApi.getProfile();
      const [subs, sessList] = await Promise.all([
        profile?.grade
          ? curriculumApi.getSubjectsByGrade(profile.grade).catch(() => [])
          : Promise.resolve([]),
        chatApi.getSessions().catch(() => []),
      ]);
      setSubjects(Array.isArray(subs) ? subs : []);
      setSessions(Array.isArray(sessList) ? sessList : []);

      if (!params.subjectId && subs.length > 0) {
        setSelectedSubjectId((prev) => prev || subs[0].id);
      }
    } finally {
      setLoadingInit(false);
    }
  }, [user, params.subjectId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const openSession = async (sessionId: string) => {
    setShowSessions(false);
    try {
      const detail = await chatApi.getSessionHistory(sessionId);
      setActiveSessionId(detail.id);
      if (detail.subjectId) setSelectedSubjectId(detail.subjectId);
      setMessages(Array.isArray(detail.messages) ? detail.messages : []);
    } catch (err: unknown) {
      Alert.alert(
        'Lỗi',
        err instanceof Error ? err.message : 'Không thể mở hội thoại.',
      );
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setPickedImage(null);
    setShowSessions(false);
  };

  const handlePickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Cần cấp quyền', 'Vui lòng cấp quyền truy cập Camera/Thư viện ảnh để gửi bài tập.');
      return;
    }

    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.75 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });

    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      setPickedImage({
        uri: asset.uri,
        name: asset.fileName || 'homework.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text && !pickedImage) return;
    if (sending) return;

    const promptText = text || 'Hãy giúp em giải bài tập trong ảnh đính kèm.';
    const tempUserMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: promptText,
      imageUrl: pickedImage?.uri || null,
      createdAt: new Date().toISOString(),
    };

    const imageToSend = pickedImage;
    setInputText('');
    setPickedImage(null);
    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      let sid = activeSessionId;
      if (!sid) {
        const subObj = subjects.find((s) => s.id === selectedSubjectId);
        const created = await chatApi.createSession({
          title: promptText.slice(0, 50),
          subjectId: selectedSubjectId || undefined,
        });
        sid = created.id;
        setActiveSessionId(sid);
        setSessions((prev) => [
          { ...created, subject: subObj ? { id: subObj.id, name: subObj.name } : undefined },
          ...prev,
        ]);
      }

      const reply = await chatApi.sendMessage(sid, promptText, imageToSend);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        { ...reply.userMsg, imageUrl: imageToSend?.uri || reply.userMsg.imageUrl },
        { ...reply.aiMsg, citations: reply.citations || reply.aiMsg.citations },
      ]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            err instanceof Error
              ? err.message
              : 'Xin lỗi, kết nối Gia sư AI đang tạm gián đoạn. Em thử lại nhé!',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportMsg || !reportReason.trim()) return;
    setSubmittingReport(true);
    try {
      await usersApi.submitFeedback(
        'ai',
        `[Báo cáo Gia sư AI Mobile]\nNội dung AI: ${reportMsg.content.slice(0, 200)}\nLý do: ${reportReason.trim()}`,
      );
      Alert.alert('Đã gửi báo cáo', 'Cảm ơn em đã phản hồi! Nhà trường sẽ xem xét câu trả lời này.');
      setReportMsg(null);
      setReportReason('');
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể gửi báo cáo.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: p.card, borderBottomColor: p.border }]}>
        <TouchableOpacity
          onPress={() => setShowSessions(true)}
          style={[styles.iconBtn, { backgroundColor: p.cardMuted }]}
        >
          <Ionicons name="time-outline" size={20} color={p.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: p.text }]} numberOfLines={1}>
            Gia sư AI (RAG)
          </Text>
          <Text style={{ fontSize: 12, color: p.textMuted }} numberOfLines={1}>
            {currentSubject ? `Môn ${currentSubject.name} • Khối ${currentSubject.grade}` : 'Trích dẫn tài liệu lớp học'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleNewChat}
          style={[styles.iconBtn, { backgroundColor: p.primarySoft }]}
        >
          <Ionicons name="add" size={22} color={p.primary} />
        </TouchableOpacity>
      </View>

      {/* Subject Pills */}
      {subjects.length > 0 ? (
        <View style={[styles.subjectStrip, { borderBottomColor: p.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}>
            {subjects.map((sub) => {
              const active = sub.id === selectedSubjectId;
              return (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => {
                    setSelectedSubjectId(sub.id);
                    setActiveSessionId(null);
                    setMessages([]);
                  }}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: active ? p.primary : p.card,
                      borderColor: active ? p.primary : p.border,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#FFFFFF' : p.text, fontSize: 12, fontWeight: '700' }}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loadingInit ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={p.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatList}
            ListEmptyComponent={
              <View style={{ paddingTop: 24, gap: 14 }}>
                <EmptyView
                  icon="sparkles-outline"
                  title="Đặt câu hỏi cho Gia sư AI"
                  description="AI chỉ tra cứu tài liệu chính khóa đã xuất bản của lớp em và đính kèm trích dẫn nguồn rõ ràng (BR-RAG-001)."
                />
                <View style={{ gap: 8 }}>
                  {[
                    `Tóm tắt kiến thức trọng tâm môn ${currentSubject?.name || 'này'}`,
                    'Giải thích ví dụ dễ hiểu kèm các bước làm bài',
                    'Cho em 3 câu hỏi ôn nhanh để tự kiểm tra',
                  ].map((prompt) => (
                    <TouchableOpacity
                      key={prompt}
                      onPress={() => setInputText(prompt)}
                      style={[
                        styles.suggestionBtn,
                        { backgroundColor: p.card, borderColor: p.border },
                      ]}
                    >
                      <Ionicons name="bulb-outline" size={16} color={p.primary} />
                      <Text style={{ flex: 1, color: p.text, fontSize: 13 }}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
            renderItem={({ item }) => {
              const isUser = item.role === 'user';
              return (
                <View style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}>
                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? { backgroundColor: p.primary, borderBottomRightRadius: 4 }
                        : {
                            backgroundColor: p.card,
                            borderColor: p.border,
                            borderWidth: 1,
                            borderBottomLeftRadius: 4,
                          },
                    ]}
                  >
                    {item.imageUrl && item.imageUrl !== 'uploaded' ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.msgImage}
                        resizeMode="cover"
                      />
                    ) : null}
                    <Text style={{ color: isUser ? '#FFFFFF' : p.text, fontSize: 14, lineHeight: 21 }}>
                      {item.content}
                    </Text>

                    {/* Citations (BR-RAG-001) */}
                    {!isUser && Array.isArray(item.citations) && item.citations.length > 0 ? (
                      <View style={[styles.citationsBox, { borderTopColor: p.border }]}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: p.primary, marginBottom: 6 }}>
                          Nguồn tài liệu tham chiếu:
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {item.citations.slice(0, 4).map((c, idx) => (
                            <Badge
                              key={`${item.id}-cit-${idx}`}
                              tone="blue"
                              label={`${c.fileName || c.title || c.lessonTitle || 'Tài liệu'}${c.page ? ` • Tr.${c.page}` : ''}`}
                            />
                          ))}
                        </View>
                      </View>
                    ) : null}

                    {/* Report AI answer (BR-RAG-002) */}
                    {!isUser ? (
                      <TouchableOpacity
                        onPress={() => setReportMsg(item)}
                        style={styles.reportBtn}
                      >
                        <Ionicons name="flag-outline" size={13} color={p.textMuted} />
                        <Text style={{ fontSize: 11, color: p.textMuted, fontWeight: '600' }}>
                          Báo cáo câu trả lời sai
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            }}
            ListFooterComponent={
              sending ? (
                <View style={[styles.typingBox, { backgroundColor: p.card, borderColor: p.border }]}>
                  <ActivityIndicator size="small" color={p.primary} />
                  <Text style={{ color: p.textMuted, fontSize: 13 }}>
                    Gia sư AI đang tra cứu tài liệu...
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Selected image preview */}
        {pickedImage ? (
          <View style={[styles.previewRow, { backgroundColor: p.card, borderTopColor: p.border }]}>
            <Image source={{ uri: pickedImage.uri }} style={styles.previewThumb} />
            <Text style={{ flex: 1, fontSize: 12, color: p.textMuted }} numberOfLines={1}>
              Ảnh bài tập đính kèm
            </Text>
            <TouchableOpacity onPress={() => setPickedImage(null)}>
              <Ionicons name="close-circle" size={22} color={p.rose} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Composer */}
        <View style={[styles.composer, { backgroundColor: p.card, borderTopColor: p.border }]}>
          <TouchableOpacity
            onPress={() => void handlePickImage(true)}
            style={[styles.mediaBtn, { backgroundColor: p.cardMuted }]}
          >
            <Ionicons name="camera-outline" size={20} color={p.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => void handlePickImage(false)}
            style={[styles.mediaBtn, { backgroundColor: p.cardMuted }]}
          >
            <Ionicons name="image-outline" size={20} color={p.text} />
          </TouchableOpacity>
          <TextInput
            style={[styles.composerInput, { backgroundColor: p.bg, color: p.text, borderColor: p.border }]}
            placeholder="Nhập câu hỏi bài học..."
            placeholderTextColor={p.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={() => void handleSend()}
            disabled={sending || (!inputText.trim() && !pickedImage)}
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  sending || (!inputText.trim() && !pickedImage)
                    ? p.cardMuted
                    : p.primary,
              },
            ]}
          >
            <Ionicons
              name="send"
              size={18}
              color={
                sending || (!inputText.trim() && !pickedImage) ? p.textMuted : '#FFFFFF'
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Session History Modal */}
      <Modal
        visible={showSessions}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSessions(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSessions(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: p.card, borderColor: p.border }]}
            onPress={() => undefined}
          >
            <View style={[styles.sheetHead, { borderBottomColor: p.border }]}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: p.text }}>
                Lịch sử hội thoại ({sessions.length})
              </Text>
              <TouchableOpacity onPress={handleNewChat}>
                <Text style={{ color: p.primary, fontWeight: '700', fontSize: 13 }}>
                  + Phiên mới
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 14, gap: 8 }}>
              {sessions.length === 0 ? (
                <EmptyView icon="chatbubbles-outline" title="Chưa có phiên hội thoại nào" />
              ) : (
                sessions.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => void openSession(s.id)}
                    style={[
                      styles.sessionRow,
                      {
                        backgroundColor:
                          s.id === activeSessionId ? p.primarySoft : p.bg,
                        borderColor: p.border,
                      },
                    ]}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={p.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: p.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                        {s.title || 'Cuộc trò chuyện mới'}
                      </Text>
                      <Text style={{ color: p.textMuted, fontSize: 11, marginTop: 2 }}>
                        {s.subject?.name ? `${s.subject.name} • ` : ''}
                        {s.updatedAt ? new Date(s.updatedAt).toLocaleString('vi-VN') : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={Boolean(reportMsg)}
        animationType="fade"
        transparent
        onRequestClose={() => setReportMsg(null)}
      >
        <Pressable style={styles.centerBackdrop} onPress={() => setReportMsg(null)}>
          <Card style={{ width: '90%', gap: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: p.text }}>
              Báo cáo câu trả lời AI
            </Text>
            <Text style={{ fontSize: 13, color: p.textMuted }}>
              Mô tả điểm chưa chính xác hoặc không phù hợp để giáo viên & nhà trường kiểm tra:
            </Text>
            <TextInput
              style={[
                styles.reportInput,
                { backgroundColor: p.bg, borderColor: p.border, color: p.text },
              ]}
              placeholder="VD: Công thức giải chưa đúng với sách giáo khoa..."
              placeholderTextColor={p.textMuted}
              value={reportReason}
              onChangeText={setReportReason}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PrimaryButton
                title="Hủy"
                color={p.textMuted}
                onPress={() => setReportMsg(null)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Gửi báo cáo"
                color={p.rose}
                loading={submittingReport}
                disabled={!reportReason.trim()}
                onPress={() => void handleSubmitReport()}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectStrip: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chatList: {
    padding: 14,
    gap: 12,
    flexGrow: 1,
  },
  suggestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  msgRow: { width: '100%', flexDirection: 'row' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '86%',
    padding: 13,
    borderRadius: 18,
  },
  msgImage: {
    width: 200,
    height: 140,
    borderRadius: 10,
    marginBottom: 8,
  },
  citationsBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  typingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  previewThumb: { width: 44, height: 44, borderRadius: 8 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  mediaBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    paddingBottom: 24,
  },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  centerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 88,
    textAlignVertical: 'top',
    fontSize: 14,
  },
});
