import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { usersApi } from '@/services/mobile.services';
import { useAuthStore } from '@/store/authStore';
import {
  ADAPTIVE_CONTENT_STYLE,
  Card,
  KeyboardSafeView,
  PrimaryButton,
  UserAvatar,
  usePalette,
} from '@/components/ui/mobile-ui';

export default function ParentSettingsScreen() {
  const p = usePalette();
  const { user, updateUser, logout } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  useEffect(() => {
    usersApi
      .getProfile()
      .then((data) => {
        setFullName(data.fullName || '');
        setPhone(data.phone || '');
        setAvatarUrl(data.avatarUrl || '');
        void updateUser(data);
      })
      .catch(() => undefined);
  }, [updateUser]);

  const handleChangeAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Cần cấp quyền', 'Vui lòng cấp quyền Thư viện ảnh để đổi ảnh đại diện.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled || !res.assets?.[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = res.assets[0];
      const updated = await usersApi.uploadAvatar(
        asset.uri,
        asset.fileName || 'avatar.jpg',
        asset.mimeType || 'image/jpeg',
      );
      setAvatarUrl(updated.avatarUrl || '');
      void updateUser(updated);
      Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện!');
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tải ảnh.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên.');
      return;
    }
    const changedPassword = Boolean(newPassword.trim());
    if (changedPassword && newPassword.trim().length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (changedPassword && newPassword.trim() !== confirmPassword.trim()) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    setSaving(true);
    try {
      const updated = await usersApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        ...(changedPassword ? { password: newPassword.trim() } : {}),
      });
      void updateUser(updated);
      setNewPassword('');
      setConfirmPassword('');
      if (changedPassword) {
        Alert.alert(
          'Đã đổi mật khẩu thành công',
          'Vì lý do bảo mật (BR-AUTH-001), phiên cũ đã được thu hồi. Quý phụ huynh vui lòng đăng nhập lại bằng mật khẩu mới.',
          [{ text: 'Đăng nhập lại', onPress: () => void logout() }],
        );
      } else {
        Alert.alert('Thành công', 'Đã cập nhật thông tin tài khoản Phụ huynh.');
      }
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
      <KeyboardSafeView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, ADAPTIVE_CONTENT_STYLE]}
          keyboardShouldPersistTaps="handled"
        >
        <Text style={[styles.title, { color: p.text }]}>Cài đặt tài khoản</Text>

        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TouchableOpacity
            onPress={() => void handleChangeAvatar()}
            disabled={uploadingAvatar}
            style={{ position: 'relative' }}
          >
            <UserAvatar uri={avatarUrl} name={fullName || 'P'} size={62} bgColor={p.indigo} />
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: p.card,
                borderWidth: 1,
                borderColor: p.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="camera" size={13} color={p.indigo} />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: p.text }}>
              {fullName || 'Phụ huynh'}
            </Text>
            <Text style={{ fontSize: 12, color: p.textMuted, marginTop: 2 }}>
              Chạm vào ảnh đại diện để tải ảnh mới
            </Text>
          </View>
        </Card>

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
          {newPassword.trim() ? (
            <View style={styles.field}>
              <Text style={[styles.label, { color: p.textMuted }]}>Xác nhận mật khẩu mới</Text>
              <TextInput
                style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={p.textMuted}
              />
            </View>
          ) : null}
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
      </KeyboardSafeView>
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
