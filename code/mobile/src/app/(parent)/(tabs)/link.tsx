import React, { useCallback, useState } from 'react';
import {
  Alert,
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
import { useFocusEffect } from 'expo-router';
import {
  formatClassLabel,
  parentApi,
  type ParentDashboardData,
} from '@/services/mobile.services';
import {
  ADAPTIVE_CONTENT_STYLE,
  Badge,
  Card,
  EmptyView,
  PrimaryButton,
  usePalette,
} from '@/components/ui/mobile-ui';

export default function ParentLinkStudentScreen() {
  const p = usePalette();
  const [code, setCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [linked, setLinked] = useState<ParentDashboardData['students']>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLinked = useCallback(async () => {
    try {
      const dash = await parentApi.getDashboard();
      setLinked(Array.isArray(dash?.students) ? dash.students : []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        await loadLinked();
      };
      void run();
    }, [loadLinked]),
  );

  const handleLink = async () => {
    const clean = code.replace(/\D/g, '');
    if (clean.length !== 6) {
      Alert.alert('Mã không hợp lệ', 'Vui lòng nhập đủ 6 chữ số mã liên kết do học sinh cung cấp.');
      return;
    }

    setLinking(true);
    try {
      const res = await parentApi.linkStudent(clean);
      setCode('');
      Alert.alert(
        'Liên kết thành công!',
        `Đã kết nối với học sinh ${res.student?.fullName || ''}.`,
      );
      await loadLinked();
    } catch (err: unknown) {
      Alert.alert(
        'Không thể liên kết',
        err instanceof Error ? err.message : 'Mã liên kết không đúng hoặc đã hết hạn.',
      );
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = (studentId: string, fullName: string) => {
    Alert.alert(
      'Hủy liên kết học sinh',
      `Bạn có chắc chắn muốn hủy liên kết với tài khoản của ${fullName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            setUnlinkingId(studentId);
            try {
              await parentApi.unlinkStudent(studentId);
              setLinked((prev) => prev.filter((item) => item.student.id !== studentId));
              Alert.alert('Đã hủy liên kết', `Đã gỡ liên kết với ${fullName}.`);
            } catch (err: unknown) {
              Alert.alert(
                'Lỗi',
                err instanceof Error ? err.message : 'Không thể hủy liên kết.',
              );
            } finally {
              setUnlinkingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, ADAPTIVE_CONTENT_STYLE]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadLinked();
            }}
            tintColor={p.indigo}
          />
        }
      >
        <View>
          <Text style={[styles.title, { color: p.text }]}>Liên kết tài khoản con</Text>
          <Text style={{ fontSize: 13, color: p.textMuted, marginTop: 2 }}>
            Nhập mã 6 số dùng một lần (hiệu lực 15 phút) được tạo từ mục Hồ sơ của học sinh (BR-LINK-001).
          </Text>
        </View>

        <Card style={{ gap: 14 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: p.text }}>
            Mã liên kết 6 chữ số
          </Text>
          <TextInput
            style={[
              styles.codeInput,
              { backgroundColor: p.bg, borderColor: p.border, color: p.text },
            ]}
            placeholder="000000"
            placeholderTextColor={p.textMuted}
            value={code}
            onChangeText={(txt) => setCode(txt.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
          />
          <PrimaryButton
            title="Xác nhận liên kết"
            icon="link-outline"
            color={p.indigo}
            loading={linking}
            disabled={code.length !== 6}
            onPress={() => void handleLink()}
          />
        </Card>

        <Text style={[styles.secTitle, { color: p.text }]}>
          Các con đã liên kết ({linked.length})
        </Text>

        {linked.length === 0 ? (
          <EmptyView
            icon="person-add-outline"
            title="Chưa có học sinh nào được liên kết"
            description="Hãy bảo con mở mục Hồ sơ → Tạo mã liên kết 6 số, sau đó nhập vào ô trên."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {linked.map((entry) => (
              <Card key={entry.student.id} style={styles.childRow}>
                <View style={[styles.avatar, { backgroundColor: p.indigoSoft }]}>
                  <Text style={{ color: p.indigo, fontSize: 18, fontWeight: '800' }}>
                    {entry.student.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: p.text }}>
                    {entry.student.fullName}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    <Badge
                      label={formatClassLabel(
                        entry.student.className,
                        entry.student.grade,
                      )}
                      tone="blue"
                    />
                    {entry.student.studentCode ? (
                      <Badge label={entry.student.studentCode} tone="slate" />
                    ) : null}
                  </View>
                </View>
                <TouchableOpacity
                  disabled={unlinkingId === entry.student.id}
                  onPress={() =>
                    handleUnlink(entry.student.id, entry.student.fullName)
                  }
                  style={[styles.unlinkBtn, { backgroundColor: p.roseSoft }]}
                >
                  <Ionicons name="unlink-outline" size={18} color={p.rose} />
                </TouchableOpacity>
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
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800' },
  codeInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    minHeight: 58,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 10,
  },
  secTitle: { fontSize: 16, fontWeight: '800', marginTop: 6 },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlinkBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
