import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, useColorScheme } from 'react-native';

export default function LinkStudentScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const handleLink = async () => {
    if (code.length !== 6) {
      Alert.alert('Lỗi', 'Mã liên kết phải gồm 6 chữ số');
      return;
    }
    setLoading(true);
    // TODO: Call backend to link student
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Thành công', 'Đã liên kết với học sinh thành công!');
      setCode('');
    }, 1500);
  };

  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      <Text style={[styles.title, isDark ? styles.textLight : styles.textDark]}>Liên kết tài khoản</Text>
      
      <View style={styles.form}>
        <Text style={[styles.label, isDark ? styles.textLight : styles.textDark]}>Nhập mã liên kết (6 số)</Text>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          placeholder="Ví dụ: 123456"
          placeholderTextColor={isDark ? '#888' : '#aaa'}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        <TouchableOpacity style={styles.btn} onPress={handleLink} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Liên Kết</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  bgLight: { backgroundColor: '#f9fafb' },
  bgDark: { backgroundColor: '#111827' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8 },
  textDark: { color: '#111827' },
  textLight: { color: '#f9fafb' },
  form: { marginTop: 20 },
  input: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 16 },
  inputLight: { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#111827' },
  inputDark: { backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb' },
  btn: { height: 52, backgroundColor: '#8b5cf6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
