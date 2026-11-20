import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usersApi } from '@/services/mobile.services';
import { useAuthStore } from '@/store/authStore';
import { Card, PrimaryButton, usePalette } from '@/components/ui/mobile-ui';

export default function ParentSettingsScreen() {
  const p = usePalette();
  const { user, updateUser, logout } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  useEffect(() => {
    usersApi
      .getProfile()
      .then((data) => {
        setFullName(data.fullName || '');
        setPhone(data.phone || '');
        void updateUser(data);
      })
      .catch(() => undefined);
  }, [updateUser]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên.');
      return;
    }
    if (newPassword.trim() && newPassword.trim().length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setSaving(true);
    try {
      const updated = await usersApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        ...(newPassword.trim() ? { password: newPassword.trim() } : {}),
      });
      void updateUser(updated);
      setNewPassword('');
      Alert.alert('Thành công', 'Đã cập nhật thông tin tài khoản Phụ huynh.');
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể lưu thay đổi.');
    } finally {
      setSaving(false);
    }
  };

  const handleFeedback = async () => {
    if (!feedback.trim()) return;
    setSendingFeedback(true);
    try {
      await usersApi.submitFeedback('system', feedback.trim());
      setFeedback('');
      Alert.alert('Đã gửi góp ý', 'Phản hồi của Quý phụ huynh đã được chuyển tới Nhà trường.');
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể gửi góp ý.');
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Quý phụ huynh có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: p.text }]}>Cài đặt tài khoản</Text>

        <Card style={{ gap: 12 }}>
          <Text style={[styles.secTitle, { color: p.text }]}>Hồ sơ Phụ huynh</Text>
          <View style={styles.field}>
            <Text style={[styles.label, { color: p.textMuted }]}>Họ và tên</Text>
            <TextInput
              style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: p.textMuted }]}>Số điện thoại</Text>
            <TextInput
              style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: p.textMuted }]}>
              Mật khẩu mới (để trống nếu không đổi)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Ít nhất 6 ký tự"
              placeholderTextColor={p.textMuted}
            />
          </View>
          <PrimaryButton
            title="Lưu thay đổi"
            icon="save-outline"
            color={p.indigo}
            loading={saving}
            onPress={() => void handleSave()}
          />
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={[styles.secTitle, { color: p.text }]}>
            Góp ý gửi Quản trị viên nhà trường
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: p.bg,
                borderColor: p.border,
                color: p.text,
                minHeight: 78,
                textAlignVertical: 'top',
                paddingTop: 10,
              },
            ]}
            placeholder="Nhập ý kiến đóng góp về ứng dụng hoặc quá trình học..."
            placeholderTextColor={p.textMuted}
            value={feedback}
            onChangeText={setFeedback}
            multiline
          />
          <PrimaryButton
            title="Gửi góp ý"
            icon="send-outline"
            color={p.emerald}
            loading={sendingFeedback}
            disabled={!feedback.trim()}
            onPress={() => void handleFeedback()}
          />
        </Card>

        <PrimaryButton
          title="Đăng xuất"
          icon="log-out-outline"
          color={p.rose}
          onPress={handleLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 36 },
  title: { fontSize: 22, fontWeight: '800' },
  secTitle: { fontSize: 16, fontWeight: '800' },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 46,
    fontSize: 14,
  },
});
