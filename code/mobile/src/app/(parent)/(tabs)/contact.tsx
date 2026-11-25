import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  parentApi,
  type DirectMessageItem,
  type ParentTeacherItem,
  type ProposalItem,
} from '@/services/mobile.services';
import { useAuthStore } from '@/store/authStore';
import { getCached, invalidateCache, isCacheFresh, setCached } from '@/lib/ttl-cache';
import {
  ADAPTIVE_CONTENT_STYLE,
  Badge,
  Card,
  EmptyView,
  ErrorView,
  KeyboardSafeView,
  PrimaryButton,
  SkeletonDashboard,
  UserAvatar,
  usePalette,
} from '@/components/ui/mobile-ui';

const PARENT_CONTACT_CACHE_KEY = 'parent:contact';

interface ParentContactSnapshot {
  teachers: ParentTeacherItem[];
  children: ChildSummary[];
  proposals: ProposalItem[];
}

interface ChildSummary {
  id: string;
  fullName: string;
  className?: string | null;
  grade?: number | null;
}

export default function ParentContactScreen() {
  const p = usePalette();
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{
    teacherId?: string;
    childId?: string;
    t?: string;
  }>();
  const paramKey = `${params.childId ?? ''}|${params.teacherId ?? ''}|${params.t ?? ''}`;
  const cached = getCached<ParentContactSnapshot>(PARENT_CONTACT_CACHE_KEY);
  const autoOpenedTeacherRef = useRef<string | null>(null);

  const [tabOverride, setTabOverride] = useState<{
    key: string;
    tab: 'messages' | 'proposals';
  } | null>(null);
  const activeTab: 'messages' | 'proposals' =
    tabOverride && tabOverride.key === paramKey ? tabOverride.tab : 'messages';
  const setActiveTab = (tab: 'messages' | 'proposals') =>
    setTabOverride({ key: paramKey, tab });

  const [teachers, setTeachers] = useState<ParentTeacherItem[]>(cached?.teachers ?? []);
  const [children, setChildren] = useState<ChildSummary[]>(cached?.children ?? []);
  const [childOverride, setChildOverride] = useState<{
    key: string;
    id: string;
  } | null>(null);
  const selectedChildId =
    childOverride && childOverride.key === paramKey
      ? childOverride.id
      : params.childId && children.some((c) => c.id === params.childId)
        ? params.childId
        : 'ALL';
  const setSelectedChildId = (id: string) => setChildOverride({ key: paramKey, id });
  const [teacherSearch, setTeacherSearch] = useState('');
  const [proposals, setProposals] = useState<ProposalItem[]>(cached?.proposals ?? []);

  // Active Chat modal state
  const [activeTeacher, setActiveTeacher] = useState<ParentTeacherItem | null>(null);
  const [thread, setThread] = useState<DirectMessageItem[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatListRef = useRef<FlatList<DirectMessageItem>>(null);

  // Create Proposal modal state
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [propTeacherId, setPropTeacherId] = useState<string>(cached?.teachers?.[0]?.id ?? '');
  const [propStudentId, setPropStudentId] = useState<string>(cached?.children?.[0]?.id ?? '');
  const [propTitle, setPropTitle] = useState('');
  const [propContent, setPropContent] = useState('');
  const [submittingProp, setSubmittingProp] = useState(false);

  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (force = false) => {
    if (!force && isCacheFresh(PARENT_CONTACT_CACHE_KEY)) {
      const snap = getCached<ParentContactSnapshot>(PARENT_CONTACT_CACHE_KEY);
      if (snap) {
        setTeachers(snap.teachers);
        setChildren(snap.children);
        setProposals(snap.proposals);
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }
    try {
      const [tRes, dashRes, propRes] = await Promise.all([
        parentApi.getTeachers(),
        parentApi.getDashboard().catch(() => ({ students: [] })),
        parentApi.getProposals().catch(() => []),
      ]);
      const tList = Array.isArray(tRes?.teachers) ? tRes.teachers : [];
      const childList: ChildSummary[] = (dashRes?.students || []).map((s) => ({
        id: s.student.id,
        fullName: s.student.fullName,
        className: s.student.className,
        grade: s.student.grade,
      }));
      const safeProps = Array.isArray(propRes) ? propRes : [];
      setTeachers(tList);
      setChildren(childList);
      setProposals(safeProps);
      setCached<ParentContactSnapshot>(PARENT_CONTACT_CACHE_KEY, {
        teachers: tList,
        children: childList,
        proposals: safeProps,
      });
      setError(null);

      if (tList.length > 0) {
        setPropTeacherId((prev) => prev || tList[0].id);
      }
      if (childList.length > 0) {
        setPropStudentId((prev) => prev || childList[0].id);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Không thể tải danh sách giáo viên.',
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

  // Auto-poll direct chat thread every 5s while chat modal is open
  useEffect(() => {
    if (!activeTeacher) return;
    const teacherId = activeTeacher.id;
    const interval = setInterval(() => {
      parentApi
        .getMessages(teacherId)
        .then((msgs) => {
          if (Array.isArray(msgs)) {
            setThread((prev) => {
              const prevLastId = prev[prev.length - 1]?.id;
              const nextLastId = msgs[msgs.length - 1]?.id;
              return msgs.length !== prev.length || prevLastId !== nextLastId
                ? msgs
                : prev;
            });
          }
        })
        .catch(() => undefined);
    }, 5_000);
    return () => clearInterval(interval);
  }, [activeTeacher]);

  // Per-child scoped teacher display (prevents GVCN badge bleed between siblings)
  const scopedTeachers = useMemo(() => {
    const query = teacherSearch.trim().toLowerCase();
    return teachers
      .filter((t) => {
        if (selectedChildId === 'ALL') return true;
        if (Array.isArray(t.studentRoles) && t.studentRoles.length > 0) {
          return t.studentRoles.some((sr) => sr.studentId === selectedChildId);
        }
        if (Array.isArray(t.studentIds) && t.studentIds.length > 0) {
          return t.studentIds.includes(selectedChildId);
        }
        return true;
      })
      .map((t) => {
        const matchedRoles = Array.isArray(t.studentRoles)
          ? selectedChildId === 'ALL'
            ? t.studentRoles
            : t.studentRoles.filter((sr) => sr.studentId === selectedChildId)
          : [];
        const homeroomEntries = matchedRoles.filter((r) => r.isHomeroom);
        const isHomeroomForScope =
          matchedRoles.length > 0
            ? homeroomEntries.length > 0
            : Boolean(t.isHomeroom);
        const homeroomClassLabel = homeroomEntries
          .map((r) => r.homeroomClassName || r.className)
          .filter(Boolean)
          .join(', ');
        const roleSummary =
          matchedRoles.length > 0
            ? matchedRoles
              .map((r) => {
                const baseLabel =
                  r.summary ||
                  r.roleLabel ||
                  [
                    r.isHomeroom
                      ? r.homeroomClassName
                        ? `GVCN ${r.homeroomClassName}`
                        : 'GVCN'
                      : null,
                    Array.isArray(r.subjects) && r.subjects.length > 0
                      ? `GV Bộ môn ${r.subjects.join(', ')}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' • ') ||
                  'Giáo viên';
                return children.length > 1 || selectedChildId === 'ALL'
                  ? `${baseLabel} — ${r.studentName}`
                  : baseLabel;
              })
              .join(' • ')
            : t.roleSummary || (t.roleLabels || t.roles || []).join(' • ');

        return {
          ...t,
          isHomeroomForScope,
          homeroomClassLabel,
          roleSummary,
        };
      })
      .filter((t) => {
        if (!query) return true;
        return (
          t.fullName.toLowerCase().includes(query) ||
          t.roleSummary.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => Number(b.isHomeroomForScope) - Number(a.isHomeroomForScope));
  }, [teachers, selectedChildId, teacherSearch, children.length]);

  const openChat = useCallback(async (teacher: ParentTeacherItem) => {
    setActiveTeacher(teacher);
    setLoadingThread(true);
    try {
      const msgs = await parentApi.getMessages(teacher.id);
      setThread(Array.isArray(msgs) ? msgs : []);
    } catch (err: unknown) {
      Alert.alert(
        'Lỗi',
        err instanceof Error ? err.message : 'Không thể tải lịch sử tin nhắn.',
      );
    } finally {
      setLoadingThread(false);
    }
  }, []);

  // Auto-open homeroom teacher chat when navigated from Parent Dashboard
  useEffect(() => {
    if (!params.teacherId || teachers.length === 0) return;
    const openKey = `${params.teacherId}|${params.t ?? ''}`;
    if (autoOpenedTeacherRef.current === openKey) return;
    const target = teachers.find((t) => t.id === params.teacherId);
    if (!target) return;
    autoOpenedTeacherRef.current = openKey;
    const timer = setTimeout(() => {
      void openChat(target);
    }, 0);
    return () => clearTimeout(timer);
  }, [params.teacherId, params.t, teachers, openChat]);

  // Teachers strictly eligible for the child selected in the Create Proposal modal
  const proposalTeachers = useMemo(() => {
    if (!propStudentId) return teachers;
    return teachers.filter((t) => {
      if (Array.isArray(t.studentRoles) && t.studentRoles.length > 0) {
        return t.studentRoles.some((sr) => sr.studentId === propStudentId);
      }
      if (Array.isArray(t.studentIds) && t.studentIds.length > 0) {
        return t.studentIds.includes(propStudentId);
      }
      return true;
    });
  }, [teachers, propStudentId]);

  const effectivePropTeacherId = proposalTeachers.some((t) => t.id === propTeacherId)
    ? propTeacherId
    : proposalTeachers[0]?.id || '';

  const handleSendMessage = async () => {
    if (!activeTeacher || !msgInput.trim() || sendingMsg) return;
    const text = msgInput.trim();
    setMsgInput('');
    setSendingMsg(true);
    try {
      const sent = await parentApi.sendMessage(activeTeacher.id, text);
      setThread((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (err: unknown) {
      setMsgInput(text);
      Alert.alert(
        'Lỗi gửi tin',
        err instanceof Error ? err.message : 'Không thể gửi tin nhắn.',
      );
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!effectivePropTeacherId || !propTitle.trim() || !propContent.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn giáo viên, tiêu đề và nội dung đề xuất.');
      return;
    }
    setSubmittingProp(true);
    try {
      const created = await parentApi.createProposal({
        teacherId: effectivePropTeacherId,
        title: propTitle.trim(),
        content: propContent.trim(),
        studentId: propStudentId || undefined,
      });
      setProposals((prev) => [created, ...prev]);
      invalidateCache('parent:');
      setPropTitle('');
      setPropContent('');
      setShowProposalModal(false);
      Alert.alert('Đã gửi', 'Đề xuất / Đơn xin phép đã gửi tới giáo viên thành công!');
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể gửi đề xuất.');
    } finally {
      setSubmittingProp(false);
    }
  };

  if (loading && teachers.length === 0) {
    return <SkeletonDashboard label="Đang tải danh bạ giáo viên..." />;
  }
  if (error && teachers.length === 0) {
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
              void loadData(true);
            }}
            tintColor={p.indigo}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: p.text }]}>Liên lạc Giáo viên</Text>
            <Text style={{ fontSize: 12, color: p.textMuted }}>
              Nhắn tin trực tiếp & gửi đơn xin phép / kiến nghị
            </Text>
          </View>
          {activeTab === 'proposals' ? (
            <TouchableOpacity
              onPress={() => setShowProposalModal(true)}
              style={[styles.addBtn, { backgroundColor: p.indigo }]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>
                Tạo đơn
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: p.cardMuted, borderColor: p.border }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('messages')}
            style={[styles.tabBtn, activeTab === 'messages' && { backgroundColor: p.card }]}
          >
            <Text
              style={{
                color: activeTab === 'messages' ? p.indigo : p.textMuted,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              Nhắn tin GV ({scopedTeachers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('proposals')}
            style={[styles.tabBtn, activeTab === 'proposals' && { backgroundColor: p.card }]}
          >
            <Text
              style={{
                color: activeTab === 'proposals' ? p.indigo : p.textMuted,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              Đề xuất / Xin phép ({proposals.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'messages' ? (
          <>
            {/* Search teacher */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 14,
                borderRadius: 14,
                borderWidth: 1,
                backgroundColor: p.card,
                borderColor: p.border,
              }}
            >
              <Ionicons name="search-outline" size={18} color={p.textMuted} />
              <TextInput
                style={{ flex: 1, color: p.text, fontSize: 14, paddingVertical: 10 }}
                placeholder="Tìm tên giáo viên, môn học..."
                placeholderTextColor={p.textMuted}
                value={teacherSearch}
                onChangeText={setTeacherSearch}
              />
            </View>

            {/* Per-Child Filter */}
            {children.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedChildId('ALL')}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: selectedChildId === 'ALL' ? p.indigo : p.card,
                      borderColor: selectedChildId === 'ALL' ? p.indigo : p.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selectedChildId === 'ALL' ? '#FFFFFF' : p.text,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    Tất cả các con
                  </Text>
                </TouchableOpacity>
                {children.map((ch) => {
                  const active = selectedChildId === ch.id;
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      onPress={() => setSelectedChildId(ch.id)}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: active ? p.indigo : p.card,
                          borderColor: active ? p.indigo : p.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: active ? '#FFFFFF' : p.text,
                          fontWeight: '700',
                          fontSize: 12,
                        }}
                      >
                        {ch.fullName} ({formatClassLabel(ch.className, ch.grade)})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {scopedTeachers.length === 0 ? (
              <EmptyView
                icon="people-outline"
                title="Chưa có danh sách giáo viên"
                description="Hãy liên kết tài khoản con để hiển thị Giáo viên chủ nhiệm và Giáo viên bộ môn của lớp con."
              />
            ) : (
              <View style={{ gap: 10 }}>
                {scopedTeachers.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    activeOpacity={0.85}
                    onPress={() => void openChat(t)}
                  >
                    <Card style={styles.teacherCard}>
                      <UserAvatar
                        uri={t.avatarUrl}
                        name={t.fullName}
                        size={46}
                        bgColor={t.isHomeroomForScope ? p.indigoSoft : p.primarySoft}
                        textColor={t.isHomeroomForScope ? p.indigo : p.primary}
                      />
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }}>
                            {t.fullName}
                          </Text>
                          {t.isHomeroomForScope ? (
                            <Badge
                              label={
                                t.homeroomClassLabel
                                  ? `GVCN ${t.homeroomClassLabel}`
                                  : 'GVCN'
                              }
                              tone="indigo"
                            />
                          ) : null}
                        </View>
                        {t.roleSummary ? (
                          <Text style={{ fontSize: 12, color: p.textMuted }} numberOfLines={2}>
                            {t.roleSummary}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color={p.indigo} />
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : proposals.length === 0 ? (
          <EmptyView
            icon="document-text-outline"
            title="Chưa có đề xuất / đơn xin phép"
            description="Phụ huynh có thể gửi đơn xin phép nghỉ học hoặc kiến nghị trực tiếp tới giáo viên."
            actionLabel="Gửi đề xuất mới"
            onAction={() => setShowProposalModal(true)}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {proposals.map((prop) => {
              const statusMeta =
                prop.status === 'APPROVED'
                  ? { label: 'Đã duyệt', tone: 'emerald' as const }
                  : prop.status === 'REJECTED'
                    ? { label: 'Từ chối', tone: 'rose' as const }
                    : { label: 'Chờ duyệt', tone: 'amber' as const };
              return (
                <Card key={prop.id} style={{ gap: 8 }}>
                  <View style={styles.headerRow}>
                    <Badge label={statusMeta.label} tone={statusMeta.tone} />
                    <Text style={{ fontSize: 11, color: p.textMuted }}>
                      {new Date(prop.createdAt).toLocaleString('vi-VN')}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }}>
                    {prop.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: p.textMuted, lineHeight: 19 }}>
                    {prop.content}
                  </Text>
                  <Text style={{ fontSize: 12, color: p.indigo, fontWeight: '600' }}>
                    Gửi tới: {prop.teacher?.fullName || 'Giáo viên'}
                    {prop.student?.fullName ? ` • HS: ${prop.student.fullName}` : ''}
                  </Text>
                  {prop.teacherReply ? (
                    <View style={[styles.replyBox, { backgroundColor: p.emeraldSoft }]}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: p.emerald }}>
                        Phản hồi của Giáo viên:
                      </Text>
                      <Text style={{ fontSize: 13, color: p.text, marginTop: 2 }}>
                        {prop.teacherReply}
                      </Text>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}
        </ScrollView>
      </KeyboardSafeView>

      {/* Direct Chat Modal */}
      <Modal
        visible={Boolean(activeTeacher)}
        animationType="slide"
        onRequestClose={() => setActiveTeacher(null)}
      >
        <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
          <View style={[styles.chatHead, { backgroundColor: p.card, borderBottomColor: p.border }]}>
            <TouchableOpacity onPress={() => setActiveTeacher(null)} hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color={p.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }} numberOfLines={1}>
                {activeTeacher?.fullName}
              </Text>
              <Text style={{ fontSize: 11, color: p.textMuted }} numberOfLines={1}>
                Tin nhắn đồng bộ tức thì với Cổng Giáo viên
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => activeTeacher && void openChat(activeTeacher)}
              hitSlop={10}
            >
              <Ionicons name="refresh" size={20} color={p.indigo} />
            </TouchableOpacity>
          </View>

          <KeyboardSafeView style={{ flex: 1 }}>
            {loadingThread ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={p.indigo} />
              </View>
            ) : (
              <FlatList
                ref={chatListRef}
                data={thread}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: false })}
                contentContainerStyle={{ padding: 14, gap: 10, flexGrow: 1 }}
                ListEmptyComponent={
                  <EmptyView
                    icon="chatbubble-outline"
                    title="Chưa có tin nhắn nào"
                    description="Hãy gửi tin nhắn đầu tiên cho giáo viên. Giáo viên sẽ nhận thông báo ngay trên Cổng Giáo viên."
                  />
                }
                renderItem={({ item }) => {
                  const mine = item.senderId === user?.id;
                  return (
                    <View
                      style={{
                        alignSelf: mine ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        backgroundColor: mine ? p.indigo : p.card,
                        borderColor: p.border,
                        borderWidth: mine ? 0 : 1,
                        padding: 12,
                        borderRadius: 16,
                      }}
                    >
                      <Text style={{ color: mine ? '#FFFFFF' : p.text, fontSize: 14, lineHeight: 20 }}>
                        {item.content}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color: mine ? '#E0E7FF' : p.textMuted,
                          marginTop: 4,
                          alignSelf: 'flex-end',
                        }}
                      >
                        {new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  );
                }}
              />
            )}

            <View style={[styles.composer, { backgroundColor: p.card, borderTopColor: p.border }]}>
              <TextInput
                style={[styles.composerInput, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
                placeholder="Nhập tin nhắn gửi giáo viên..."
                placeholderTextColor={p.textMuted}
                value={msgInput}
                onChangeText={setMsgInput}
                multiline
              />
              <TouchableOpacity
                onPress={() => void handleSendMessage()}
                disabled={sendingMsg || !msgInput.trim()}
                style={[
                  styles.sendBtn,
                  { backgroundColor: msgInput.trim() ? p.indigo : p.cardMuted },
                ]}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color={msgInput.trim() ? '#FFFFFF' : p.textMuted}
                />
              </TouchableOpacity>
            </View>
          </KeyboardSafeView>
        </SafeAreaView>
      </Modal>

      {/* Create Proposal Modal */}
      <Modal
        visible={showProposalModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProposalModal(false)}
      >
        <KeyboardSafeView style={{ flex: 1 }}>
          <Pressable style={styles.backdrop} onPress={() => setShowProposalModal(false)}>
            <Pressable
              style={[
                styles.modalCard,
                { backgroundColor: p.card, borderColor: p.border, maxHeight: '88%' },
              ]}
              onPress={() => undefined}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                <Text style={{ fontSize: 18, fontWeight: '800', color: p.text }}>
                  Gửi Đề xuất / Đơn xin phép
                </Text>

            {children.length > 0 ? (
              <>
                <Text style={{ fontSize: 12, fontWeight: '700', color: p.textMuted }}>
                  Áp dụng cho học sinh:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {children.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setPropStudentId(c.id)}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: propStudentId === c.id ? p.primary : p.cardMuted,
                          borderColor: propStudentId === c.id ? p.primary : p.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: propStudentId === c.id ? '#FFFFFF' : p.text,
                          fontWeight: '700',
                          fontSize: 12,
                        }}
                      >
                        {c.fullName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <Text style={{ fontSize: 12, fontWeight: '700', color: p.textMuted }}>
              Chọn Giáo viên nhận (đúng lớp của con):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {proposalTeachers.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setPropTeacherId(t.id)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: effectivePropTeacherId === t.id ? p.indigo : p.cardMuted,
                      borderColor: effectivePropTeacherId === t.id ? p.indigo : p.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: effectivePropTeacherId === t.id ? '#FFFFFF' : p.text,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    {t.fullName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
              placeholder="Tiêu đề (VD: Xin phép nghỉ học buổi sáng...)"
              placeholderTextColor={p.textMuted}
              value={propTitle}
              onChangeText={setPropTitle}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: p.bg,
                  borderColor: p.border,
                  color: p.text,
                  minHeight: 88,
                  textAlignVertical: 'top',
                  paddingTop: 10,
                },
              ]}
              placeholder="Nội dung chi tiết gửi giáo viên..."
              placeholderTextColor={p.textMuted}
              value={propContent}
              onChangeText={setPropContent}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PrimaryButton
                title="Hủy"
                color={p.textMuted}
                onPress={() => setShowProposalModal(false)}
                style={{ flex: 1 }}
              />
                  <PrimaryButton
                    title="Gửi đơn"
                    color={p.indigo}
                    loading={submittingProp}
                    onPress={() => void handleCreateProposal()}
                    style={{ flex: 1 }}
                  />
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardSafeView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  teacherCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyBox: { padding: 10, borderRadius: 10 },
  chatHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  composerInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 46,
    fontSize: 14,
  },
});
