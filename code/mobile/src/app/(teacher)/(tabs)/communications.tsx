import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
  teacherApi,
  type DirectMessageItem,
  type TeacherClassOption,
  type TeacherProposalItem,
  type TeacherResetRequestItem,
  type TeacherScopedParent,
  type TeacherStudentItem,
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
  usePalette,
} from '@/components/ui/mobile-ui';

const TEACHER_COMMS_CACHE_KEY = 'teacher:comms';

interface TeacherCommsSnapshot {
  classes: TeacherClassOption[];
  students: TeacherStudentItem[];
  parents: TeacherScopedParent[];
  proposals: TeacherProposalItem[];
  resetRequests: TeacherResetRequestItem[];
}

type CommTab = 'parents' | 'broadcast' | 'resets';

const TEMPLATES = [
  {
    label: 'Thông báo lớp chủ nhiệm',
    title: 'Thông báo quan trọng của lớp chủ nhiệm',
    body: 'Kính gửi Quý phụ huynh, giáo viên chủ nhiệm xin thông báo lịch sinh hoạt và các khoản/nội dung cần phối hợp trong tuần tới. Rất mong nhận được sự đồng hành của gia đình.',
  },
  {
    label: 'Nhắc ôn tập kiểm tra',
    title: 'Nhắc nhở ôn tập bài kiểm tra sắp tới',
    body: 'Kính gửi Quý phụ huynh và các em học sinh, lớp sắp có bài kiểm tra định kỳ. Mong gia đình nhắc các em ôn tập tài liệu và luyện đề trên hệ thống AI Tutor.',
  },
];

export default function TeacherCommunicationsScreen() {
  const p = usePalette();
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{ tab?: string; t?: string }>();
  const cached = getCached<TeacherCommsSnapshot>(TEACHER_COMMS_CACHE_KEY);

  const paramKey = `${params.tab ?? ''}|${params.t ?? ''}`;
  const defaultParamTab: CommTab =
    params.tab === 'broadcast'
      ? 'broadcast'
      : params.tab === 'resets'
        ? 'resets'
        : 'parents';
  const [pickedTabState, setPickedTabState] = useState<{
    key: string;
    tab: CommTab;
  } | null>(null);
  const activeTab: CommTab =
    pickedTabState && pickedTabState.key === paramKey
      ? pickedTabState.tab
      : defaultParamTab;
  const setPickedTab = (tab: CommTab) => setPickedTabState({ key: paramKey, tab });

  const [classes, setClasses] = useState<TeacherClassOption[]>(cached?.classes ?? []);
  const [students, setStudents] = useState<TeacherStudentItem[]>(cached?.students ?? []);
  const [parents, setParents] = useState<TeacherScopedParent[]>(cached?.parents ?? []);
  const [proposals, setProposals] = useState<TeacherProposalItem[]>(cached?.proposals ?? []);
  const [resetRequests, setResetRequests] = useState<TeacherResetRequestItem[]>(
    cached?.resetRequests ?? [],
  );

  // Broadcast form
  const [targetType, setTargetType] = useState<'CLASS' | 'STUDENT'>('CLASS');
  const [selectedClassId, setSelectedClassId] = useState(cached?.classes?.[0]?.id ?? '');
  const [selectedStudentId, setSelectedStudentId] = useState(cached?.students?.[0]?.id ?? '');
  const [audience, setAudience] = useState<'PARENTS' | 'STUDENTS' | 'BOTH'>('PARENTS');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Parent chat modal
  const [chatParent, setChatParent] = useState<TeacherScopedParent | null>(null);
  const [thread, setThread] = useState<DirectMessageItem[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatListRef = useRef<FlatList<DirectMessageItem>>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (force = false) => {
    if (!force && isCacheFresh(TEACHER_COMMS_CACHE_KEY)) {
      const snap = getCached<TeacherCommsSnapshot>(TEACHER_COMMS_CACHE_KEY);
      if (snap) {
        setClasses(snap.classes);
        setStudents(snap.students);
        setParents(snap.parents);
        setProposals(snap.proposals);
        setResetRequests(snap.resetRequests);
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }
    try {
      const [clsRes, stuRes, parRes, propRes, rstRes] = await Promise.all([
        teacherApi.getClasses().catch(() => []),
        teacherApi.getStudents().catch(() => []),
        teacherApi.getParents().catch(() => []),
        teacherApi.getProposals().catch(() => []),
        teacherApi.getPasswordResetRequests().catch(() => []),
      ]);
      const clsList = Array.isArray(clsRes) ? clsRes : [];
      const stuList = Array.isArray(stuRes) ? stuRes : [];
      const parList = Array.isArray(parRes) ? parRes : [];
      const propList = Array.isArray(propRes) ? propRes : [];
      const rstList = Array.isArray(rstRes) ? rstRes : [];
      setClasses(clsList);
      setStudents(stuList);
      setParents(parList);
      setProposals(propList);
      setResetRequests(rstList);
      setCached<TeacherCommsSnapshot>(TEACHER_COMMS_CACHE_KEY, {
        classes: clsList,
        students: stuList,
        parents: parList,
        proposals: propList,
        resetRequests: rstList,
      });
      if (clsList.length > 0) {
        setSelectedClassId((prev) => prev || clsList[0].id);
      }
      if (stuList.length > 0) {
        setSelectedStudentId((prev) => prev || stuList[0].id);
      }
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải trung tâm liên lạc.');
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

  // Auto-poll parent chat thread every 5s while chat modal is open
  useEffect(() => {
    if (!chatParent) return;
    const parentId = chatParent.id;
    const interval = setInterval(() => {
      teacherApi
        .getMessages(parentId)
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
  }, [chatParent]);

  const openChat = async (parent: TeacherScopedParent) => {
    setChatParent(parent);
    setLoadingThread(true);
    try {
      const msgs = await teacherApi.getMessages(parent.id);
      setThread(Array.isArray(msgs) ? msgs : []);
    } catch (err: unknown) {
      Alert.alert(
        'Lỗi',
        err instanceof Error ? err.message : 'Không thể tải lịch sử trò chuyện.',
      );
    } finally {
      setLoadingThread(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatParent || !msgText.trim() || sendingMsg) return;
    const text = msgText.trim();
    setMsgText('');
    setSendingMsg(true);
    try {
      const sent = await teacherApi.sendMessage(chatParent.id, text);
      setThread((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (err: unknown) {
      setMsgText(text);
      Alert.alert('Lỗi gửi tin', err instanceof Error ? err.message : 'Thử lại sau.');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleProposalAction = async (
    prop: TeacherProposalItem,
    status: 'APPROVED' | 'REJECTED',
  ) => {
    setProcessingId(prop.id);
    try {
      await teacherApi.updateProposalStatus(prop.id, status);
      setProposals((prev) =>
        prev.map((item) => (item.id === prop.id ? { ...item, status } : item)),
      );
      invalidateCache('teacher:');
      Alert.alert(
        'Đã cập nhật',
        status === 'APPROVED'
          ? 'Đã duyệt đơn và gửi thông báo tới Phụ huynh.'
          : 'Đã từ chối đơn và thông báo tới Phụ huynh.',
      );
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể xử lý đơn.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBroadcast = async () => {
    if (targetType === 'CLASS' && !selectedClassId) {
      Alert.alert('Chưa chọn lớp', 'Vui lòng chọn lớp muốn gửi thông báo.');
      return;
    }
    if (targetType === 'STUDENT' && !selectedStudentId) {
      Alert.alert('Chưa chọn học sinh', 'Vui lòng chọn học sinh muốn gửi thông báo.');
      return;
    }
    if (!notifTitle.trim() || !notifBody.trim()) {
      Alert.alert('Thiếu nội dung', 'Vui lòng nhập tiêu đề và nội dung thông báo.');
      return;
    }

    setSendingBroadcast(true);
    try {
      const res = await teacherApi.sendNotification({
        targetType,
        classId: targetType === 'CLASS' ? selectedClassId : undefined,
        studentId: targetType === 'STUDENT' ? selectedStudentId : undefined,
        audience,
        title: notifTitle.trim(),
        body: notifBody.trim(),
      });
      setNotifTitle('');
      setNotifBody('');
      Alert.alert(
        'Gửi thông báo thành công!',
        res.message ||
          `Đã gửi tới ${res.sentCount} người nhận (${res.parentRecipientsCount} Phụ huynh, ${res.studentRecipientsCount} Học sinh).`,
      );
    } catch (err: unknown) {
      Alert.alert(
        'Không thể gửi',
        err instanceof Error ? err.message : 'Vui lòng thử lại.',
      );
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleResetRequest = async (reqItem: TeacherResetRequestItem) => {
    setProcessingId(reqItem.id);
    try {
      const res = await teacherApi.resetStudentPassword(reqItem.userId);
      const pwd = res.temporaryPassword || res.tempPassword || '';
      setResetRequests((prev) => prev.filter((r) => r.userId !== reqItem.userId));
      invalidateCache('teacher:');
      Alert.alert(
        'Đã cấp mật khẩu tạm',
        `Học sinh: ${reqItem.fullName} (${reqItem.studentCode || ''})\nMật khẩu tạm: ${pwd}\n\nPhụ huynh đã liên kết cũng đã nhận thông báo tự động.`,
      );
    } catch (err: unknown) {
      Alert.alert(
        'Lỗi',
        err instanceof Error ? err.message : 'Không thể cấp mật khẩu tạm.',
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && parents.length === 0 && classes.length === 0) {
    return <SkeletonDashboard label="Đang tải trung tâm liên lạc..." />;
  }
  if (error && parents.length === 0 && classes.length === 0) {
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
            tintColor={p.emerald}
          />
        }
      >
        <View>
          <Text style={[styles.title, { color: p.text }]}>Liên lạc & Thông báo</Text>
          <Text style={{ fontSize: 12, color: p.textMuted }}>
            Nhắn tin Phụ huynh, duyệt đơn, thông báo cả lớp & cấp mật khẩu
          </Text>
        </View>

        {/* 3 Sub-Tabs */}
        <View style={[styles.tabBar, { backgroundColor: p.cardMuted, borderColor: p.border }]}>
          {(
            [
              { key: 'parents', label: `Phụ huynh (${parents.length})` },
              { key: 'broadcast', label: 'Thông báo lớp' },
              { key: 'resets', label: `Mật khẩu (${resetRequests.length})` },
            ] as const
          ).map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setPickedTab(t.key)}
              style={[styles.tabBtn, activeTab === t.key && { backgroundColor: p.card }]}
            >
              <Text
                style={{
                  color: activeTab === t.key ? p.emerald : p.textMuted,
                  fontWeight: '700',
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'parents' ? (
          <>
            {/* Proposals section */}
            <Text style={[styles.secTitle, { color: p.text }]}>
              Đơn xin phép / Kiến nghị Phụ huynh ({proposals.length})
            </Text>
            {proposals.length === 0 ? (
              <EmptyView
                icon="document-text-outline"
                title="Chưa có đơn kiến nghị nào"
              />
            ) : (
              <View style={{ gap: 10 }}>
                {proposals.map((prop) => (
                  <Card key={prop.id} style={{ gap: 8 }}>
                    <View style={styles.rowBetween}>
                      <Badge
                        label={
                          prop.status === 'APPROVED'
                            ? 'Đã duyệt'
                            : prop.status === 'REJECTED'
                              ? 'Từ chối'
                              : 'Chờ duyệt'
                        }
                        tone={
                          prop.status === 'APPROVED'
                            ? 'emerald'
                            : prop.status === 'REJECTED'
                              ? 'rose'
                              : 'amber'
                        }
                      />
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
                      PH: {prop.parent?.fullName || 'Phụ huynh'}
                      {prop.student?.fullName ? ` • HS: ${prop.student.fullName}` : ''}
                    </Text>
                    {prop.status === 'PENDING' ? (
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        <PrimaryButton
                          title="Duyệt đơn"
                          icon="checkmark"
                          color={p.emerald}
                          loading={processingId === prop.id}
                          onPress={() => void handleProposalAction(prop, 'APPROVED')}
                          style={{ flex: 1, minHeight: 40 }}
                        />
                        <PrimaryButton
                          title="Từ chối"
                          icon="close"
                          color={p.rose}
                          loading={processingId === prop.id}
                          onPress={() => void handleProposalAction(prop, 'REJECTED')}
                          style={{ flex: 1, minHeight: 40 }}
                        />
                      </View>
                    ) : null}
                  </Card>
                ))}
              </View>
            )}

            {/* Scoped Parents Chat List */}
            <Text style={[styles.secTitle, { color: p.text }]}>
              Nhắn tin trực tiếp Phụ huynh ({parents.length})
            </Text>
            {parents.length === 0 ? (
              <EmptyView
                icon="people-outline"
                title="Chưa có Phụ huynh liên kết"
                description="Danh sách Phụ huynh của các lớp bạn phụ trách sẽ hiển thị tại đây."
              />
            ) : (
              <View style={{ gap: 10 }}>
                {parents.map((par) => (
                  <TouchableOpacity
                    key={par.id}
                    activeOpacity={0.85}
                    onPress={() => void openChat(par)}
                  >
                    <Card style={styles.parentCard}>
                      <View style={[styles.avatar, { backgroundColor: p.indigoSoft }]}>
                        <Text style={{ color: p.indigo, fontWeight: '800', fontSize: 16 }}>
                          {par.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }}>
                          {par.fullName}
                        </Text>
                        {par.phone ? (
                          <Text style={{ fontSize: 12, color: p.textMuted }}>{par.phone}</Text>
                        ) : null}
                        <Text style={{ fontSize: 12, color: p.emerald, fontWeight: '600' }} numberOfLines={2}>
                          {par.students
                            .map((s) => `${s.fullName} (${formatClassLabel(s.className)} • ${s.teacherRole})`)
                            .join(' • ')}
                        </Text>
                      </View>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color={p.emerald} />
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : activeTab === 'broadcast' ? (
          <Card style={{ gap: 12 }}>
            <Text style={[styles.secTitle, { color: p.text, marginTop: 0 }]}>
              Gửi thông báo lớp / cá nhân
            </Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(
                [
                  { key: 'CLASS', label: 'Cả lớp' },
                  { key: 'STUDENT', label: '1 Học sinh' },
                ] as const
              ).map((m) => (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setTargetType(m.key)}
                  style={[
                    styles.audBtn,
                    { backgroundColor: targetType === m.key ? p.primary : p.cardMuted },
                  ]}
                >
                  <Text
                    style={{
                      color: targetType === m.key ? '#FFFFFF' : p.text,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {targetType === 'CLASS' ? (
              <>
                <Text style={[styles.label, { color: p.textMuted }]}>Chọn lớp nhận thông báo:</Text>
                {classes.length === 0 ? (
                  <Text style={{ fontSize: 13, color: p.rose }}>
                    Bạn chưa được phân công lớp nào.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {classes.map((c) => {
                      const active = c.id === selectedClassId;
                      return (
                        <TouchableOpacity
                          key={`${c.id}-${c.role}-${c.subjectName || ''}`}
                          onPress={() => setSelectedClassId(c.id)}
                          style={[
                            styles.pill,
                            {
                              backgroundColor: active ? p.emerald : p.cardMuted,
                              borderColor: active ? p.emerald : p.border,
                            },
                          ]}
                        >
                          <Text style={{ color: active ? '#FFFFFF' : p.text, fontWeight: '700', fontSize: 12 }}>
                            {formatClassLabel(c.name)} ({c.role})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: p.textMuted }]}>Chọn học sinh nhận thông báo:</Text>
                {students.length === 0 ? (
                  <Text style={{ fontSize: 13, color: p.rose }}>
                    Chưa có học sinh nào trong các lớp phụ trách.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {students.slice(0, 40).map((s) => {
                      const active = s.id === selectedStudentId;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => setSelectedStudentId(s.id)}
                          style={[
                            styles.pill,
                            {
                              backgroundColor: active ? p.emerald : p.cardMuted,
                              borderColor: active ? p.emerald : p.border,
                            },
                          ]}
                        >
                          <Text style={{ color: active ? '#FFFFFF' : p.text, fontWeight: '700', fontSize: 12 }}>
                            {s.name} ({formatClassLabel(s.className)})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            )}

            <Text style={[styles.label, { color: p.textMuted }]}>Đối tượng nhận:</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(
                [
                  { key: 'PARENTS', label: 'Phụ huynh' },
                  { key: 'STUDENTS', label: 'Học sinh' },
                  { key: 'BOTH', label: 'Cả hai' },
                ] as const
              ).map((aud) => (
                <TouchableOpacity
                  key={aud.key}
                  onPress={() => setAudience(aud.key)}
                  style={[
                    styles.audBtn,
                    { backgroundColor: audience === aud.key ? p.emerald : p.cardMuted },
                  ]}
                >
                  <Text style={{ color: audience === aud.key ? '#FFFFFF' : p.text, fontWeight: '700', fontSize: 12 }}>
                    {aud.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: p.textMuted }]}>Mẫu nội dung nhanh:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TEMPLATES.map((tpl) => (
                <TouchableOpacity
                  key={tpl.label}
                  onPress={() => {
                    setNotifTitle(tpl.title);
                    setNotifBody(tpl.body);
                  }}
                  style={[styles.tplBtn, { backgroundColor: p.primarySoft }]}
                >
                  <Text style={{ color: p.primary, fontSize: 12, fontWeight: '700' }}>
                    + {tpl.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
              placeholder="Tiêu đề thông báo..."
              placeholderTextColor={p.textMuted}
              value={notifTitle}
              onChangeText={setNotifTitle}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: p.bg,
                  borderColor: p.border,
                  color: p.text,
                  minHeight: 100,
                  textAlignVertical: 'top',
                  paddingTop: 10,
                },
              ]}
              placeholder="Nội dung chi tiết gửi tới lớp..."
              placeholderTextColor={p.textMuted}
              value={notifBody}
              onChangeText={setNotifBody}
              multiline
            />

            <PrimaryButton
              title="Gửi thông báo ngay"
              icon="send-outline"
              color={p.emerald}
              loading={sendingBroadcast}
              onPress={() => void handleBroadcast()}
            />
          </Card>
        ) : resetRequests.length === 0 ? (
          <EmptyView
            icon="key-outline"
            title="Không có yêu cầu cấp lại mật khẩu"
            description="Khi học sinh lớp chủ nhiệm báo quên mật khẩu, yêu cầu sẽ hiển thị tại đây."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {resetRequests.map((reqItem) => (
              <Card key={reqItem.id} style={{ gap: 8 }}>
                <View style={styles.rowBetween}>
                  <Badge label={formatClassLabel(reqItem.className)} tone="amber" />
                  <Text style={{ fontSize: 11, color: p.textMuted }}>
                    {new Date(reqItem.createdAt).toLocaleString('vi-VN')}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }}>
                  {reqItem.fullName} {reqItem.studentCode ? `(${reqItem.studentCode})` : ''}
                </Text>
                {reqItem.reason ? (
                  <Text style={{ fontSize: 13, color: p.textMuted }}>
                    Ghi chú: {reqItem.reason}
                  </Text>
                ) : null}
                <PrimaryButton
                  title="Cấp mật khẩu tạm ngay"
                  icon="key-outline"
                  color={p.amber}
                  loading={processingId === reqItem.id}
                  onPress={() => void handleResetRequest(reqItem)}
                />
              </Card>
            ))}
          </View>
        )}
        </ScrollView>
      </KeyboardSafeView>

      {/* Parent Direct Chat Modal */}
      <Modal
        visible={Boolean(chatParent)}
        animationType="slide"
        onRequestClose={() => setChatParent(null)}
      >
        <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
          <View style={[styles.chatHead, { backgroundColor: p.card, borderBottomColor: p.border }]}>
            <TouchableOpacity onPress={() => setChatParent(null)} hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color={p.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }} numberOfLines={1}>
                PH: {chatParent?.fullName}
              </Text>
              <Text style={{ fontSize: 11, color: p.textMuted }} numberOfLines={1}>
                {chatParent?.students.map((s) => `${s.fullName} (${s.className})`).join(' • ')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => chatParent && void openChat(chatParent)}
              hitSlop={10}
            >
              <Ionicons name="refresh" size={20} color={p.emerald} />
            </TouchableOpacity>
          </View>

          <KeyboardSafeView style={{ flex: 1 }}>
            {loadingThread ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={p.emerald} />
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
                    description="Tin nhắn gửi đi sẽ báo chuông ngay trên Cổng Phụ huynh."
                  />
                }
                renderItem={({ item }) => {
                  const mine = item.senderId === user?.id;
                  return (
                    <View
                      style={{
                        alignSelf: mine ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        backgroundColor: mine ? p.emerald : p.card,
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
                          color: mine ? '#D1FAE5' : p.textMuted,
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
                placeholder="Nhập tin nhắn trả lời Phụ huynh..."
                placeholderTextColor={p.textMuted}
                value={msgText}
                onChangeText={setMsgText}
                multiline
              />
              <TouchableOpacity
                onPress={() => void handleSendMessage()}
                disabled={sendingMsg || !msgText.trim()}
                style={[
                  styles.sendBtn,
                  { backgroundColor: msgText.trim() ? p.emerald : p.cardMuted },
                ]}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color={msgText.trim() ? '#FFFFFF' : p.textMuted}
                />
              </TouchableOpacity>
            </View>
          </KeyboardSafeView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800' },
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
    paddingHorizontal: 4,
  },
  secTitle: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parentCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, fontWeight: '700' },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  audBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tplBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 46,
    fontSize: 14,
  },
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
});
