import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '@/services/mobile.services';
import { useAuthStore } from '@/store/authStore';
import { Card, PrimaryButton, usePalette } from '@/components/ui/mobile-ui';

export default function ChangePasswordScreen() {
  const p = usePalette();
  const { user, setSession, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword) {
      setErrorMsg('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMsg('Mật khẩu mới phải khác mật khẩu tạm thời.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const res = await authApi.firstTimeChangePassword(currentPassword, newPassword);
      await setSession(
        res.accessToken,
        res.user || user,
        res.refreshToken ?? null,
        false,
      );
      Alert.alert('Thành công', 'Bạn đã thiết lập mật khẩu cá nhân thành công!');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: p.amberSoft }]}>
              <Ionicons name="shield-checkmark" size={30} color={p.amber} />
            </View>
            <Text style={[styles.title, { color: p.text }]}>Đổi mật khẩu lần đầu</Text>
            <Text style={[styles.sub, { color: p.textMuted }]}>
              Vì lý do bảo mật (BR-AUTH-001), bạn cần đổi mật khẩu khởi tạo do nhà trường cấp trước khi vào ứng dụng.
            </Text>
          </View>

          <Card style={{ gap: 14, padding: 20 }}>
            {errorMsg ? (
              <View style={[styles.errorBox, { backgroundColor: p.roseSoft, borderColor: p.rose }]}>
                <Ionicons name="alert-circle" size={18} color={p.rose} />
                <Text style={{ flex: 1, color: p.rose, fontSize: 13, fontWeight: '600' }}>
                  {errorMsg}
                </Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={[styles.label, { color: p.text }]}>Mật khẩu tạm hiện tại</Text>
              <TextInput
                style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
                placeholder="Nhập mật khẩu tạm vừa đăng nhập"
                placeholderTextColor={p.textMuted}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: p.text }]}>Mật khẩu mới (tối thiểu 6 ký tự)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
                placeholder="Nhập mật khẩu mới dễ nhớ, an toàn"
                placeholderTextColor={p.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: p.text }]}>Xác nhận mật khẩu mới</Text>
              <TextInput
                style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={p.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <PrimaryButton
              title="Lưu mật khẩu mới"
              icon="checkmark-circle-outline"
              loading={loading}
              onPress={() => void handleSubmit()}
            />

            <TouchableOpacity
              onPress={() => void logout()}
              style={styles.logoutLink}
            >
              <Text style={{ color: p.textMuted, fontSize: 13, fontWeight: '600' }}>
                Đăng xuất & quay lại trang đăng nhập
              </Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 22 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 15,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
