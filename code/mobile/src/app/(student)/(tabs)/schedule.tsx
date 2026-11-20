import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import * as ImagePicker from 'expo-image-picker';
import { calendarApi, type CalendarEvent } from '@/services/mobile.services';
import {
  Badge,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  PrimaryButton,
  usePalette,
} from '@/components/ui/mobile-ui';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function getStartOfWeek(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function StudentScheduleScreen() {
  const p = usePalette();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const [weekStart, setWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Create modal state
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'CLASS' | 'EXAM' | 'STUDY'>('CLASS');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [startStr, setStartStr] = useState('19:00');
  const [endStr, setEndStr] = useState('20:30');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const data = await calendarApi.list();
      setEvents(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải thời khóa biểu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await loadEvents();
    };
    void run();
  }, [loadEvents]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + idx);
      return d;
    });
  }, [weekStart]);

  const visibleEvents = useMemo(() => {
    if (!selectedDate) return events;
    return events.filter((ev) => isSameDay(new Date(ev.startTime), selectedDate));
  }, [events, selectedDate]);

  const handleOcrPick = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Cần cấp quyền', 'Vui lòng cấp quyền truy cập Camera/Thư viện ảnh để quét thời khóa biểu.');
      return;
    }

    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (res.canceled || !res.assets?.[0]) return;

    const asset = res.assets[0];
    setScanning(true);
    try {
      const parsed = await calendarApi.ocr(
        asset.uri,
        asset.fileName || 'schedule.jpg',
        asset.mimeType || 'image/jpeg',
      );
      if (!Array.isArray(parsed) || parsed.length === 0) {
        Alert.alert('Không tìm thấy lịch', 'Không nhận diện được tiết học nào trong ảnh.');
        return;
      }

      for (const item of parsed) {
        await calendarApi.create({
          title: item.title,
          type: item.type || 'CLASS',
          startTime: item.startTime,
          endTime: item.endTime,
          description: item.description,
        });
      }
      Alert.alert('Thành công', `Đã trích xuất và lưu ${parsed.length} buổi học từ ảnh!`);
      await loadEvents();
    } catch (err: unknown) {
      Alert.alert(
        'Lỗi quét OCR',
        err instanceof Error ? err.message : 'Không thể phân tích ảnh thời khóa biểu.',
      );
    } finally {
      setScanning(false);
    }
  };

  const handlePromptOcr = () => {
    Alert.alert('Quét Thời khóa biểu (OCR)', 'Chọn nguồn ảnh thời khóa biểu của em:', [
      { text: 'Chụp ảnh mới', onPress: () => void handleOcrPick(true) },
      { text: 'Chọn từ thư viện', onPress: () => void handleOcrPick(false) },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const handleCreateEvent = async () => {
    if (!title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên lịch học và ngày theo định dạng YYYY-MM-DD.');
      return;
    }

    setSaving(true);
    try {
      const startIso = new Date(`${dateStr.trim()}T${startStr.trim()}:00`).toISOString();
      const endIso = new Date(`${dateStr.trim()}T${endStr.trim()}:00`).toISOString();
      await calendarApi.create({
        title: title.trim(),
        type,
        startTime: startIso,
        endTime: endIso,
        description: description.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setShowAdd(false);
      await loadEvents();
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể lưu sự kiện.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (ev: CalendarEvent) => {
    Alert.alert('Xóa lịch học', `Xóa "${ev.title}" khỏi thời khóa biểu?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await calendarApi.remove(ev.id);
            setEvents((prev) => prev.filter((item) => item.id !== ev.id));
          } catch (err: unknown) {
            Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể xóa sự kiện.');
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingView label="Đang tải thời khóa biểu..." />;
  if (error) {
    return (
      <ErrorView
        message={error}
        onRetry={() => {
          setLoading(true);
          void loadEvents();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadEvents();
            }}
            tintColor={p.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: p.text }]}>Lịch học & TKB</Text>
            <Text style={{ fontSize: 12, color: p.textMuted }}>
              {weekStart.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handlePromptOcr}
              disabled={scanning}
              style={[styles.actionPill, { backgroundColor: p.indigoSoft }]}
            >
              <Ionicons name="scan-outline" size={16} color={p.indigo} />
              <Text style={{ color: p.indigo, fontSize: 12, fontWeight: '700' }}>
                {scanning ? 'Đang OCR...' : 'Quét OCR'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAdd(true)}
              style={[styles.actionPill, { backgroundColor: p.primary }]}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Thêm</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Navigation */}
        <Card style={{ gap: 12, padding: 14 }}>
          <View style={styles.weekNav}>
            <TouchableOpacity
              onPress={() => {
                const prev = new Date(weekStart);
                prev.setDate(prev.getDate() - 7);
                setWeekStart(prev);
              }}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={20} color={p.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedDate(null)}>
              <Text style={{ color: p.primary, fontSize: 13, fontWeight: '700' }}>
                {selectedDate
                  ? `Đang lọc ngày ${selectedDate.toLocaleDateString('vi-VN')} (Xem tất cả)`
                  : `Tất cả sự kiện (${events.length})`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const next = new Date(weekStart);
                next.setDate(next.getDate() + 7);
                setWeekStart(next);
              }}
              hitSlop={10}
            >
              <Ionicons name="chevron-forward" size={20} color={p.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.daysRow}>
            {weekDays.map((day, idx) => {
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const hasEvent = events.some((ev) => isSameDay(new Date(ev.startTime), day));
              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  onPress={() =>
                    setSelectedDate((prev) => (prev && isSameDay(prev, day) ? null : day))
                  }
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: isSelected
                        ? p.primary
                        : isToday
                          ? p.primarySoft
                          : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: isSelected ? '#DBEAFE' : p.textMuted,
                    }}
                  >
                    {DAY_LABELS[idx]}
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '800',
                      color: isSelected ? '#FFFFFF' : p.text,
                    }}
                  >
                    {day.getDate()}
                  </Text>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: hasEvent
                          ? isSelected
                            ? '#FFFFFF'
                            : p.primary
                          : 'transparent',
                      },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Event List */}
        {visibleEvents.length === 0 ? (
          <EmptyView
            icon="calendar-clear-outline"
            title="Chưa có lịch học"
            description="Nhấn 'Thêm' để tạo lịch tự học hoặc 'Quét OCR' từ ảnh thời khóa biểu giấy."
            actionLabel="Thêm lịch học mới"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {visibleEvents.map((ev) => (
              <Card key={ev.id} style={styles.eventCard}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Badge
                      label={ev.type || 'CLASS'}
                      tone={ev.type === 'EXAM' ? 'rose' : ev.type === 'STUDY' ? 'emerald' : 'blue'}
                    />
                    <Text style={{ fontSize: 12, color: p.textMuted, fontWeight: '600' }}>
                      {new Date(ev.startTime).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: p.text }}>
                    {ev.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: p.primary, fontWeight: '600' }}>
                    {new Date(ev.startTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(ev.endTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {ev.description ? (
                    <Text style={{ fontSize: 13, color: p.textMuted }}>{ev.description}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => handleDelete(ev)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={p.rose} />
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={showAdd}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAdd(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowAdd(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: p.card, borderColor: p.border }]}
            onPress={() => undefined}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: p.text }}>
              Thêm lịch học mới
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
              placeholder="Tên môn học / Sự kiện (VD: Ôn Toán giữa kỳ)"
              placeholderTextColor={p.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['CLASS', 'STUDY', 'EXAM'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: type === t ? p.primary : p.cardMuted,
                    },
                  ]}
                >
                  <Text style={{ color: type === t ? '#FFFFFF' : p.text, fontWeight: '700', fontSize: 12 }}>
                    {t === 'CLASS' ? 'Tiết học' : t === 'STUDY' ? 'Tự học' : 'Kiểm tra'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
              placeholder="Ngày (YYYY-MM-DD)"
              placeholderTextColor={p.textMuted}
              value={dateStr}
              onChangeText={setDateStr}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
                placeholder="Bắt đầu (19:00)"
                placeholderTextColor={p.textMuted}
                value={startStr}
                onChangeText={setStartStr}
              />
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
                placeholder="Kết thúc (20:30)"
                placeholderTextColor={p.textMuted}
                value={endStr}
                onChangeText={setEndStr}
              />
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
              placeholder="Ghi chú (phòng học, nội dung...)"
              placeholderTextColor={p.textMuted}
              value={description}
              onChangeText={setDescription}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <PrimaryButton
                title="Hủy"
                color={p.textMuted}
                onPress={() => setShowAdd(false)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Lưu lịch"
                loading={saving}
                onPress={() => void handleCreateEvent()}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  weekNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  eventCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
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
  typeBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
