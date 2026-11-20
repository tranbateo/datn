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
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/mobile.services';
import { getApiBaseUrl } from '@/constants/api';
import { Card, PrimaryButton, usePalette } from '@/components/ui/mobile-ui';

export default function LoginScreen() {
  const p = usePalette();
  const router = useRouter();
  const { setSession, saveCustomApiUrl } = useAuthStore();

  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Optional API server override for testing on physical phone via Expo Go
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());

  const handleLogin = async () => {
    const trimmed = identifier.trim();
    if (!trimmed || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const data = await authApi.login(trimmed, password);

      if (data.requireOtp) {
        setErrorMsg(
          'Tài khoản Giáo viên / Quản trị viên sử dụng Cổng Web để xác thực 2FA và quản lý lớp học.',
        );
        return;
      }

      const actualRole = (data.user?.role || '').toLowerCase();
      if (actualRole === 'teacher' || actualRole === 'admin' || actualRole === 'school_admin') {
        setErrorMsg(
          'Ứng dụng Mobile dành cho Học sinh và Phụ huynh. Giáo viên & Quản trị viên vui lòng đăng nhập trên Cổng Web.',
        );
        return;
      }

      if (actualRole !== role) {
        setErrorMsg(
          actualRole === 'parent'
            ? 'Tài khoản này là Phụ huynh. Hãy chuyển sang tab "Phụ huynh" để đăng nhập.'
            : 'Tài khoản này là Học sinh. Hãy chuyển sang tab "Học sinh" để đăng nhập.',
        );
        return;
      }

      await setSession(
        data.accessToken,
        data.user,
        data.refreshToken ?? null,
        Boolean(data.mustChangePassword || data.user?.mustChangePassword),
      );
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = async () => {
    if (!/^https?:\/\/.+/.test(serverUrl.trim())) {
      Alert.alert('Địa chỉ không hợp lệ', 'URL máy chủ phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    await saveCustomApiUrl(serverUrl);
    Alert.alert('Đã lưu máy chủ', `Ứng dụng sẽ kết nối tới:\n${getApiBaseUrl()}`);
    setShowServerConfig(false);
  };

  const accentColor = role === 'student' ? p.primary : p.indigo;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.brandWrap}>
            <View style={[styles.logoBox, { backgroundColor: accentColor }]}>
              <Ionicons name="school" size={30} color="#FFFFFF" />
            </View>
            <Text style={[styles.brandTitle, { color: p.text }]}>AI Tutor</Text>
            <Text style={[styles.brandSub, { color: p.textMuted }]}>
              Trợ lý học tập thông minh & Kết nối gia đình
            </Text>
          </View>

          <Card style={styles.formCard}>
            {/* Role Switcher */}
            <View
              style={[
                styles.roleSwitch,
                { backgroundColor: p.cardMuted, borderColor: p.border },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.roleBtn,
                  role === 'student' && { backgroundColor: p.primary },
                ]}
                onPress={() => {
                  setRole('student');
                  setErrorMsg('');
                }}
              >
                <Ionicons
                  name="book-outline"
                  size={16}
                  color={role === 'student' ? '#FFFFFF' : p.textMuted}
                />
                <Text
                  style={[
                    styles.roleText,
                    { color: role === 'student' ? '#FFFFFF' : p.textMuted },
                  ]}
                >
                  Học sinh
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleBtn,
                  role === 'parent' && { backgroundColor: p.indigo },
                ]}
                onPress={() => {
                  setRole('parent');
                  setErrorMsg('');
                }}
              >
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={role === 'parent' ? '#FFFFFF' : p.textMuted}
                />
                <Text
                  style={[
                    styles.roleText,
                    { color: role === 'parent' ? '#FFFFFF' : p.textMuted },
                  ]}
                >
                  Phụ huynh
                </Text>
              </TouchableOpacity>
            </View>

            {errorMsg ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: p.roseSoft, borderColor: p.rose },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color={p.rose} />
                <Text style={[styles.errorText, { color: p.rose }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Identifier Input */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: p.text }]}>
                {role === 'student'
                  ? 'Mã học sinh hoặc Email'
                  : 'Số điện thoại hoặc Email'}
              </Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: p.bg, borderColor: p.border },
                ]}
              >
                <Ionicons
                  name={role === 'student' ? 'id-card-outline' : 'call-outline'}
                  size={19}
                  color={p.textMuted}
                />
                <TextInput
                  style={[styles.input, { color: p.text }]}
                  placeholder={
                    role === 'student'
                      ? 'VD: HS0001 hoặc hs0001@truong.edu.vn'
                      : 'VD: 0901000001'
                  }
                  placeholderTextColor={p.textMuted}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: p.text }]}>Mật khẩu</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: p.bg, borderColor: p.border },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={19} color={p.textMuted} />
                <TextInput
                  style={[styles.input, { color: p.text }]}
                  placeholder="Nhập mật khẩu do nhà trường cấp"
                  placeholderTextColor={p.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleLogin()}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={10}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={p.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotLink}
            >
              <Text style={{ color: accentColor, fontSize: 13, fontWeight: '700' }}>
                Quên mật khẩu? Gửi yêu cầu cấp lại
              </Text>
            </TouchableOpacity>

            <PrimaryButton
              title={role === 'student' ? 'Đăng nhập Cổng Học sinh' : 'Đăng nhập Cổng Phụ huynh'}
              icon="log-in-outline"
              color={accentColor}
              loading={loading}
              onPress={() => void handleLogin()}
            />

            <Text style={[styles.schoolHint, { color: p.textMuted }]}>
              Tài khoản do Nhà trường khởi tạo và cấp phát. Liên hệ Giáo viên chủ nhiệm nếu chưa có tài khoản.
            </Text>
          </Card>

          {/* Optional API URL config for real-device demo */}
          <TouchableOpacity
            onPress={() => setShowServerConfig((v) => !v)}
            style={styles.serverToggle}
          >
            <Ionicons name="server-outline" size={15} color={p.textMuted} />
            <Text style={{ color: p.textMuted, fontSize: 12, fontWeight: '600' }}>
              Máy chủ API: {getApiBaseUrl()}
            </Text>
          </TouchableOpacity>

          {showServerConfig ? (
            <Card style={{ marginTop: 8, gap: 10 }}>
              <Text style={[styles.label, { color: p.text }]}>
                Địa chỉ Backend API (dùng khi test trên điện thoại thật qua Wi-Fi)
              </Text>
              <TextInput
                style={[
                  styles.plainInput,
                  { backgroundColor: p.bg, borderColor: p.border, color: p.text },
                ]}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.1.10:3001"
                placeholderTextColor={p.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <PrimaryButton
                title="Lưu địa chỉ máy chủ"
                icon="checkmark-circle-outline"
                onPress={() => void handleSaveServerUrl()}
              />
            </Card>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    gap: 14,
    padding: 20,
  },
  roleSwitch: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  roleBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  plainInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 46,
    fontSize: 14,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
  },
  schoolHint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  serverToggle: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
});
