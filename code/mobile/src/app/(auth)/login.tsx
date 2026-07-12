import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, useColorScheme } from 'react-native';
import { useAuthStore } from '@/store/authStore';

const API_URL = 'http://10.0.2.2:3001'; // Default Android emulator localhost

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [loading, setLoading] = useState(false);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const setSession = useAuthStore((state) => state.setSession);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Đăng nhập thất bại', errorData.message || 'Lỗi mạng');
        setLoading(false);
        return;
      }

      const data = await response.json();
      const actualRole = data.user?.role?.toLowerCase() || 'student';
      
      if (actualRole !== role) {
        Alert.alert('Lỗi', 'Vai trò không khớp với tài khoản. Vui lòng chọn đúng vai trò.');
        setLoading(false);
        return;
      }

      // Save token and user to store (which saves to SecureStore)
      await setSession(data.accessToken, data.user);
      
    } catch (error: any) {
      Alert.alert('Lỗi kết nối', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, isDark ? styles.bgDark : styles.bgLight]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={[styles.title, isDark ? styles.textLight : styles.textDark]}>
          Đăng Nhập
        </Text>
        <Text style={[styles.subtitle, isDark ? styles.textGrayLight : styles.textGrayDark]}>
          Chào mừng bạn quay trở lại AI Tutor
        </Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'student' && styles.roleActiveStudent]}
            onPress={() => setRole('student')}
          >
            <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>👨‍🎓 Học sinh</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'parent' && styles.roleActiveParent]}
            onPress={() => setRole('parent')}
          >
            <Text style={[styles.roleText, role === 'parent' && styles.roleTextActive]}>👨‍👩‍👧 Phụ huynh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="Email"
            placeholderTextColor={isDark ? '#888' : '#aaa'}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="Mật khẩu"
            placeholderTextColor={isDark ? '#888' : '#aaa'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginText}>Đăng Nhập</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: '#f9fafb' },
  bgDark: { backgroundColor: '#111827' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 32, textAlign: 'center' },
  textDark: { color: '#111827' },
  textLight: { color: '#f9fafb' },
  textGrayDark: { color: '#4b5563' },
  textGrayLight: { color: '#9ca3af' },
  roleContainer: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 4, marginBottom: 24 },
  roleBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  roleActiveStudent: { backgroundColor: '#3b82f6', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  roleActiveParent: { backgroundColor: '#8b5cf6', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  roleText: { fontWeight: '600', color: '#6b7280' },
  roleTextActive: { color: '#fff' },
  form: { gap: 16 },
  input: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  inputLight: { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#111827' },
  inputDark: { backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb' },
  loginBtn: { height: 52, backgroundColor: '#3b82f6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  loginText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
