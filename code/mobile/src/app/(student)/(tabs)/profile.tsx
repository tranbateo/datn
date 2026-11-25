import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  formatClassLabel,
  parentApi,
  usersApi,
} from '@/services/mobile.services';
import { useAuthStore, type MobileUser } from '@/store/authStore';
import {
  ADAPTIVE_CONTENT_STYLE,
  Badge,
  Card,
  KeyboardSafeView,
  LoadingView,
  PrimaryButton,
  ThemeSwitcherCard,
  UserAvatar,
  usePalette,
} from '@/components/ui/mobile-ui';

export default function StudentProfileScreen() {
  const p = usePalette();
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();

  const [profile, setProfile] = useState<MobileUser | null>(user);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!user);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await usersApi.getProfile();
      setProfile(data);
      setFullName(data.fullName || '');
      setPhone(data.phone || '');
      setLoadError(null);
      void updateUser(data);
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error ? err.message : 'Không thể đồng bộ hồ sơ cá nhân.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateUser]);

  useEffect(() => {
    const run = async () => {
      await loadProfile();
    };
    void run();
  }, [loadProfile]);

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await parentApi.generateLinkCode();
      setLinkCode(res.linkCode);
      Alert.alert(
        'Đã tạo mã liên kết',
        `Mã 6 số: ${res.linkCode}\nHãy gửi mã này cho Phụ huynh nhập trên Cổng Phụ huynh (hiệu lực 15 phút, dùng 1 lần).`,
      );
    } catch (err: unknown) {
      Alert.alert(
        'Lỗi',
        err instanceof Error ? err.message : 'Không thể tạo mã liên kết.',
      );
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Họ tên không được để trống.');
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
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
      void updateUser(updated);
      setNewPassword('');
      setConfirmPassword('');
      if (changedPassword) {
        // BR-AUTH-001: Backend revokes active sessions on password change
        Alert.alert(
          'Đã đổi mật khẩu thành công',
          'Vì lý do bảo mật (BR-AUTH-001), phiên cũ đã được thu hồi. Vui lòng đăng nhập lại bằng mật khẩu mới.',
          [{ text: 'Đăng nhập lại', onPress: () => void logout() }],
        );
      } else {
        Alert.alert('Thành công', 'Đã cập nhật hồ sơ cá nhân.');
      }
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể lưu hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    setSendingFeedback(true);
    try {
      await usersApi.submitFeedback('system', feedbackText.trim());
      setFeedbackText('');
      Alert.alert('Cảm ơn em!', 'Góp ý của em đã được gửi tới Quản trị viên nhà trường.');
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể gửi góp ý.');
    } finally {
      setSendingFeedback(false);
    }
  };

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
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
      void updateUser(updated);
      Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện mới!');
    } catch (err: unknown) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tải ảnh đại diện.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleShareCode = async () => {
    if (!linkCode) return;
    try {
      await Share.share({
        message: `Mã liên kết Phụ huynh AI Tutor của ${profile?.fullName || 'con'}: ${linkCode} (hiệu lực 15 phút).`,
      });
    } catch {
      // ignore
    }
  };

  const handleConfirmLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  if (loading && !profile) return <LoadingView label="Đang tải hồ sơ..." />;

  const activeClass = profile?.classEnrollments?.[0]?.class?.name;
  const linkedParents = profile?.studentLinks || [];

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
              void loadProfile();
            }}
            tintColor={p.primary}
          />
        }
      >
        {loadError ? (
          <Card
            style={{
              backgroundColor: p.roseSoft,
              borderColor: p.rose,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="alert-circle" size={18} color={p.rose} />
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: p.rose }}>
              {loadError}
            </Text>
            <TouchableOpacity onPress={() => void loadProfile()}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: p.rose }}>Thử lại</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {/* Identity Card */}
        <Card style={styles.identityCard}>
          <TouchableOpacity
            onPress={() => void handleChangeAvatar()}
            disabled={uploadingAvatar}
            style={{ position: 'relative' }}
          >
            <UserAvatar
              uri={profile?.avatarUrl}
              name={profile?.fullName}
              size={62}
              bgColor={p.primary}
            />
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
              <Ionicons name="camera" size={13} color={p.primary} />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: p.text }}>
              {profile?.fullName || 'Học sinh'}
            </Text>
            <Text style={{ fontSize: 12, color: p.textMuted }}>
              {profile?.school?.name || 'AI Tutor'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              <Badge label={formatClassLabel(activeClass, profile?.grade)} tone="blue" />
              {profile?.studentCode ? (
                <Badge label={`Mã: ${profile.studentCode}`} tone="indigo" />
              ) : null}
            </View>
          </View>
        </Card>

        {/* Quick Shortcuts */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push('/(student)/(tabs)/progress')}
            style={[styles.shortcutBtn, { backgroundColor: p.card, borderColor: p.border }]}
          >
            <Ionicons name="bar-chart-outline" size={20} color={p.emerald} />
            <Text style={{ color: p.text, fontWeight: '700', fontSize: 13 }}>
              Tiến độ học tập
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(student)/courses')}
            style={[styles.shortcutBtn, { backgroundColor: p.card, borderColor: p.border }]}
          >
            <Ionicons name="library-outline" size={20} color={p.indigo} />
            <Text style={{ color: p.text, fontWeight: '700', fontSize: 13 }}>
              Bài giảng & PDF
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appearance: Light / Dark / System */}
        <ThemeSwitcherCard accentColor={p.primary} />

        {/* Parent Link Code Card (BR-LINK-001) */}
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="link-outline" size={20} color={p.indigo} />
            <Text style={[styles.sectionTitle, { color: p.text }]}>
              Liên kết Phụ huynh (Mã 6 số)
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: p.textMuted, lineHeight: 18 }}>
            Tạo mã ngẫu nhiên dùng một lần (hiệu lực 15 phút) để Phụ huynh liên kết và theo dõi tiến độ học tập.
          </Text>

          {linkCode ? (
            <View
              style={[
                styles.codeBox,
                { backgroundColor: p.indigoSoft, borderColor: p.indigo },
              ]}
            >
              <Text style={[styles.codeText, { color: p.indigo }]}>{linkCode}</Text>
              <Text style={{ fontSize: 12, color: p.textMuted }}>
                Hiệu lực 15 phút • Dùng một lần
              </Text>
              <TouchableOpacity
                onPress={() => void handleShareCode()}
                style={{
                  marginTop: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: p.card,
                }}
              >
                <Ionicons name="share-social-outline" size={14} color={p.indigo} />
                <Text style={{ color: p.indigo, fontSize: 12, fontWeight: '800' }}>
                  Chia sẻ mã cho Phụ huynh
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <PrimaryButton
            title={linkCode ? 'Tạo mã liên kết mới' : 'Tạo mã liên kết 6 số'}
            icon="key-outline"
            color={p.indigo}
            loading={generatingCode}
            onPress={() => void handleGenerateCode()}
          />

          {linkedParents.length > 0 ? (
            <View style={{ gap: 6, marginTop: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: p.textMuted }}>
                Phụ huynh đã liên kết ({linkedParents.length}):
              </Text>
              {linkedParents.map((lp) => (
                <View
                  key={lp.id}
                  style={[styles.parentRow, { backgroundColor: p.cardMuted }]}
                >
                  <Ionicons name="person-circle-outline" size={20} color={p.indigo} />
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: p.text }}>
                    {lp.parent?.fullName || 'Phụ huynh'}{' '}
                    {lp.parent?.phone ? `(${lp.parent.phone})` : ''}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        {/* Edit Profile */}
        <Card style={{ gap: 12 }}>
          <Text style={[styles.sectionTitle, { color: p.text }]}>
            Thông tin cá nhân & Đổi mật khẩu
          </Text>
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
              placeholder="Tùy chọn"
              placeholderTextColor={p.textMuted}
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
            loading={saving}
            onPress={() => void handleSaveProfile()}
          />
        </Card>

        {/* Feedback */}
        <Card style={{ gap: 10 }}>
          <Text style={[styles.sectionTitle, { color: p.text }]}>Góp ý / Báo lỗi</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: p.bg,
                borderColor: p.border,
                color: p.text,
                minHeight: 72,
                textAlignVertical: 'top',
                paddingTop: 10,
              },
            ]}
            placeholder="Nhập góp ý gửi về nhà trường..."
            placeholderTextColor={p.textMuted}
            value={feedbackText}
            onChangeText={setFeedbackText}
            multiline
          />
          <PrimaryButton
            title="Gửi góp ý"
            icon="send-outline"
            color={p.emerald}
            loading={sendingFeedback}
            disabled={!feedbackText.trim()}
            onPress={() => void handleSendFeedback()}
          />
        </Card>

        {/* Logout */}
        <PrimaryButton
          title="Đăng xuất"
          icon="log-out-outline"
          color={p.rose}
          onPress={handleConfirmLogout}
        />
        </ScrollView>
      </KeyboardSafeView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 36 },
  identityCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  codeBox: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 4,
  },
  codeText: { fontSize: 34, fontWeight: '800', letterSpacing: 8 },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
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
