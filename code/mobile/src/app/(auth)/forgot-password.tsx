import React, { useState } from 'react';
import {
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
import { authApi } from '@/services/mobile.services';
import { Card, PrimaryButton, usePalette } from '@/components/ui/mobile-ui';

export default function ForgotPasswordScreen() {
  const p = usePalette();
  const router = useRouter();
  const [role, setRole] = useState<'STUDENT' | 'PARENT'>('STUDENT');
  const [identifier, setIdentifier] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{
    handlerText: string;
    message: string;
    role: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (!identifier.trim()) {
      setErrorMsg('Vui lòng nhập Mã học sinh, Số điện thoại hoặc Email.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await authApi.requestPasswordReset({
        role,
        identifier: identifier.trim(),
        reason: reason.trim() || undefined,
      });
      setResult(res);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Không thể gửi yêu cầu. Vui lòng thử lại.',
      );
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={p.text} />
            <Text style={{ color: p.text, fontWeight: '700', fontSize: 14 }}>
              Quay lại đăng nhập
            </Text>
          </TouchableOpacity>

          {result ? (
            <Card style={{ gap: 14, padding: 22 }}>
              <View style={[styles.iconBox, { backgroundColor: p.emeraldSoft }]}>
                <Ionicons name="checkmark-circle" size={32} color={p.emerald} />
              </View>
              <Text style={[styles.title, { color: p.text }]}>
                Đã gửi yêu cầu cấp lại mật khẩu
              </Text>
              <Text style={{ color: p.textMuted, fontSize: 14, lineHeight: 20 }}>
                {result.message}
              </Text>
              <View style={[styles.infoBox, { backgroundColor: p.primarySoft }]}>
                <Text style={{ color: p.primary, fontWeight: '700', fontSize: 13 }}>
                  Đơn vị tiếp nhận: {result.handlerText}
                </Text>
                <Text style={{ color: p.text, fontSize: 13, marginTop: 6, lineHeight: 19 }}>
                  {result.role === 'STUDENT'
                    ? 'Hãy nhận mật khẩu tạm từ Giáo viên chủ nhiệm hoặc xem thông báo trên Cổng Phụ huynh đã liên kết.'
                    : 'Liên hệ Văn phòng nhà trường / Quản trị viên để nhận mật khẩu tạm.'}
                </Text>
              </View>
              <PrimaryButton
                title="Quay lại đăng nhập"
                icon="log-in-outline"
                onPress={() => router.replace('/(auth)/login')}
              />
            </Card>
          ) : (
            <Card style={{ gap: 14, padding: 20 }}>
              <View style={[styles.iconBox, { backgroundColor: p.primarySoft }]}>
                <Ionicons name="key-outline" size={28} color={p.primary} />
              </View>
              <Text style={[styles.title, { color: p.text }]}>
                Yêu cầu cấp lại mật khẩu
              </Text>
              <Text style={{ color: p.textMuted, fontSize: 13, lineHeight: 19 }}>
                Chọn đúng vai trò để gửi yêu cầu tới Giáo viên chủ nhiệm hoặc Quản trị viên nhà trường.
              </Text>

              <View style={[styles.roleSwitch, { backgroundColor: p.cardMuted, borderColor: p.border }]}>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'STUDENT' && { backgroundColor: p.primary }]}
                  onPress={() => setRole('STUDENT')}
                >
                  <Text style={[styles.roleText, { color: role === 'STUDENT' ? '#FFFFFF' : p.textMuted }]}>
                    Học sinh
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'PARENT' && { backgroundColor: p.indigo }]}
                  onPress={() => setRole('PARENT')}
                >
                  <Text style={[styles.roleText, { color: role === 'PARENT' ? '#FFFFFF' : p.textMuted }]}>
                    Phụ huynh
                  </Text>
                </TouchableOpacity>
              </View>

              {errorMsg ? (
                <View style={[styles.errorBox, { backgroundColor: p.roseSoft, borderColor: p.rose }]}>
                  <Text style={{ color: p.rose, fontSize: 13, fontWeight: '600' }}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={[styles.label, { color: p.text }]}>
                  {role === 'STUDENT' ? 'Mã học sinh hoặc Email *' : 'Số điện thoại hoặc Email *'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: p.bg, borderColor: p.border, color: p.text }]}
                  placeholder={role === 'STUDENT' ? 'VD: HS0001' : 'VD: 0901000001'}
                  placeholderTextColor={p.textMuted}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: p.text }]}>Ghi chú (tùy chọn)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: p.bg,
                      borderColor: p.border,
                      color: p.text,
                      minHeight: 76,
                      textAlignVertical: 'top',
                      paddingTop: 12,
                    },
                  ]}
                  placeholder="VD: Em quên mật khẩu đăng nhập..."
                  placeholderTextColor={p.textMuted}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                />
              </View>

              <PrimaryButton
                title="Gửi yêu cầu cấp lại"
                icon="send-outline"
                loading={loading}
                onPress={() => void handleSubmit()}
              />
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 6,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800' },
  roleSwitch: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  roleBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: { fontSize: 14, fontWeight: '700' },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 15,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBox: {
    padding: 14,
    borderRadius: 14,
  },
});
