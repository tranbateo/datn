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

type LoginRole = 'student' | 'teacher' | 'parent';

export default function LoginScreen() {
  const p = usePalette();
  const router = useRouter();
  const { setSession, saveCustomApiUrl } = useAuthStore();

  const [role, setRole] = useState<LoginRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [showSchoolCode, setShowSchoolCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Teacher 2FA OTP step (BR-AUTH-001)
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');

  // Optional API server override for physical device via Expo Go
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
      const data = await authApi.login(trimmed, password, schoolCode);

      if (data.requireOtp && data.email) {
        setOtpEmail(data.email);
        setOtpCode('');
        return;
      }

      const actualRole = (data.user?.role || '').toLowerCase();
      if (actualRole === 'admin' || actualRole === 'school_admin') {
        setErrorMsg(
          'Tài khoản Quản trị viên nhà trường vui lòng đăng nhập trên Cổng Web Quản trị.',
        );
        return;
      }

      if (actualRole !== role) {
        const label =
          actualRole === 'teacher'
            ? 'Giáo viên'
            : actualRole === 'parent'
              ? 'Phụ huynh'
              : 'Học sinh';
        setErrorMsg(
          `Tài khoản này thuộc vai trò ${label}. Hãy chuyển sang tab "${label}" để đăng nhập.`,
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

  const handleVerifyOtp = async () => {
    if (!otpEmail || otpCode.trim().length < 4) {
      setErrorMsg('Vui lòng nhập mã xác thực OTP đã gửi về email.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const data = await authApi.verifyLoginOtp(otpEmail, otpCode.trim());
      const actualRole = (data.user?.role || '').toLowerCase();
      if (actualRole === 'admin' || actualRole === 'school_admin') {
        setErrorMsg(
          'Tài khoản Quản trị viên nhà trường vui lòng sử dụng Cổng Web Quản trị.',
        );
        setOtpEmail(null);
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
        err instanceof Error ? err.message : 'Mã OTP không chính xác hoặc đã hết hạn.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = async () => {
    if (!/^https?:\/\/.+/.test(serverUrl.trim())) {
      Alert.alert(
        'Địa chỉ không hợp lệ',
        'URL máy chủ phải bắt đầu bằng http:// hoặc https://',
      );
      return;
    }
    await saveCustomApiUrl(serverUrl);
    Alert.alert('Đã lưu máy chủ', `Ứng dụng sẽ kết nối tới:\n${getApiBaseUrl()}`);
    setShowServerConfig(false);
  };

  const accentColor =
    role === 'student'
      ? p.primary
      : role === 'teacher'
        ? p.emerald
        : p.indigo;

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
              Nền tảng học tập & kết nối Học sinh • Giáo viên • Phụ huynh
            </Text>
          </View>

          {otpEmail ? (
            <Card style={styles.formCard}>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <View style={[styles.otpIcon, { backgroundColor: p.emeraldSoft }]}>
                  <Ionicons name="shield-checkmark" size={28} color={p.emerald} />
                </View>
                <Text style={{ fontSize: 19, fontWeight: '800', color: p.text }}>
                  Xác thực 2 lớp (OTP)
                </Text>
                <Text style={{ fontSize: 13, color: p.textMuted, textAlign: 'center' }}>
                  Nhập mã OTP 6 chữ số đã gửi về email {otpEmail}
                </Text>
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

              <TextInput
                style={[
                  styles.otpInput,
                  { backgroundColor: p.bg, borderColor: p.border, color: p.text },
                ]}
                placeholder="000000"
                placeholderTextColor={p.textMuted}
                value={otpCode}
                onChangeText={(t) => setOtpCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />

              <PrimaryButton
                title="Xác nhận & Đăng nhập"
                icon="checkmark-circle-outline"
                color={p.emerald}
                loading={loading}
                onPress={() => void handleVerifyOtp()}
              />

              <TouchableOpacity
                onPress={() => {
                  setOtpEmail(null);
                  setOtpCode('');
                  setErrorMsg('');
                }}
                style={{ alignItems: 'center', paddingVertical: 6 }}
              >
                <Text style={{ color: p.textMuted, fontWeight: '700', fontSize: 13 }}>
                  ← Quay lại nhập tài khoản
                </Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <Card style={styles.formCard}>
              {/* 3-Role Switcher */}
              <View
                style={[
                  styles.roleSwitch,
                  { backgroundColor: p.cardMuted, borderColor: p.border },
                ]}
              >
                {(
                  [
                    { key: 'student', label: 'Học sinh', icon: 'book-outline', color: p.primary },
                    { key: 'teacher', label: 'Giáo viên', icon: 'easel-outline', color: p.emerald },
                    { key: 'parent', label: 'Phụ huynh', icon: 'people-outline', color: p.indigo },
                  ] as const
                ).map((tab) => {
                  const active = role === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[
                        styles.roleBtn,
                        active && { backgroundColor: tab.color },
                      ]}
                      onPress={() => {
                        setRole(tab.key);
                        setErrorMsg('');
                      }}
                    >
                      <Ionicons
                        name={tab.icon}
                        size={15}
                        color={active ? '#FFFFFF' : p.textMuted}
                      />
                      <Text
                        style={[
                          styles.roleText,
                          { color: active ? '#FFFFFF' : p.textMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
                    : role === 'teacher'
                      ? 'Mã giáo viên, Email hoặc SĐT'
                      : 'Số điện thoại hoặc Email'}
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    { backgroundColor: p.bg, borderColor: p.border },
                  ]}
                >
                  <Ionicons
                    name={
                      role === 'parent'
                        ? 'call-outline'
                        : role === 'teacher'
                          ? 'mail-outline'
                          : 'id-card-outline'
                    }
                    size={19}
                    color={p.textMuted}
                  />
                  <TextInput
                    style={[styles.input, { color: p.text }]}
                    placeholder={
                      role === 'student'
                        ? 'VD: HS0001 hoặc hs0001@truong.edu.vn'
                        : role === 'teacher'
                          ? 'VD: GV01 hoặc mai.nguyen@nguyentrai.edu.vn'
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

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setShowSchoolCode((v) => !v)}
                  style={{ paddingVertical: 2 }}
                >
                  <Text style={{ color: p.textMuted, fontSize: 12, fontWeight: '600' }}>
                    {showSchoolCode ? 'Ẩn mã trường' : '+ Nhập mã trường (nếu có)'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  style={styles.forgotLink}
                >
                  <Text style={{ color: accentColor, fontSize: 13, fontWeight: '700' }}>
                    Quên mật khẩu?
                  </Text>
                </TouchableOpacity>
              </View>

              {showSchoolCode ? (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: p.text }]}>Mã trường học (tùy chọn)</Text>
                  <View
                    style={[
                      styles.inputRow,
                      { backgroundColor: p.bg, borderColor: p.border },
                    ]}
                  >
                    <Ionicons name="business-outline" size={19} color={p.textMuted} />
                    <TextInput
                      style={[styles.input, { color: p.text }]}
                      placeholder="VD: THCS01 (dùng khi trùng mã HS giữa các trường)"
                      placeholderTextColor={p.textMuted}
                      value={schoolCode}
                      onChangeText={setSchoolCode}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              ) : null}

              <PrimaryButton
                title={
                  role === 'student'
                    ? 'Đăng nhập Cổng Học sinh'
                    : role === 'teacher'
                      ? 'Đăng nhập Cổng Giáo viên'
                      : 'Đăng nhập Cổng Phụ huynh'
                }
                icon="log-in-outline"
                color={accentColor}
                loading={loading}
                onPress={() => void handleLogin()}
              />

              <Text style={[styles.schoolHint, { color: p.textMuted }]}>
                Tài khoản do Nhà trường khởi tạo và phân quyền. Quản trị viên nhà trường sử dụng Cổng Web.
              </Text>
            </Card>
          )}

          {/* Optional API URL config */}
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
    fontSize: 13,
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
    gap: 4,
    paddingHorizontal: 4,
  },
  roleText: {
    fontSize: 12,
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
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 10 },
  plainInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 46,
    fontSize: 14,
  },
  forgotLink: { alignSelf: 'flex-end', paddingVertical: 2 },
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
  otpIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  otpInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    minHeight: 56,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 10,
  },
});
