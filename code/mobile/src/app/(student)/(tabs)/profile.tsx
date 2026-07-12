import { useState } from 'react';
import { StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';



// Simulate an API call to your backend
const generateLinkCode = async (): Promise<string> => {
  // In a real app, use fetch with Authorization header to call /parents/generate-link-code
  // For demo:
  try {
    // const res = await fetch(`${BACKEND_URL}/parents/generate-link-code`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    // });
    // const data = await res.json();
    // return data.linkCode;
    
    // Fallback stub:
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(Math.floor(100000 + Math.random() * 900000).toString());
      }, 1000);
    });
  } catch (error) {
    throw error;
  }
};

export default function ProfileScreen() {
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const code = await generateLinkCode();
      setLinkCode(code);
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo mã liên kết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>Hồ sơ</ThemedText>

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold" style={{ marginBottom: Spacing.two }}>
            Liên kết Phụ huynh
          </ThemedText>
          <ThemedText type="small" style={{ marginBottom: Spacing.four, opacity: 0.8 }}>
            Tạo mã liên kết 6 số để phụ huynh có thể theo dõi quá trình học tập của bạn qua ứng dụng Web.
          </ThemedText>
          
          {linkCode ? (
            <ThemedView style={styles.codeContainer}>
              <ThemedText type="title" style={styles.codeText}>{linkCode}</ThemedText>
              <ThemedText type="small" style={{ marginTop: Spacing.two, opacity: 0.7, textAlign: 'center' }}>
                Mã này có hiệu lực ngay lập tức. Hãy gửi cho phụ huynh.
              </ThemedText>
            </ThemedView>
          ) : (
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleGenerateCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                  Tạo Mã Liên Kết
                </ThemedText>
              )}
            </TouchableOpacity>
          )}
        </ThemedView>

      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    marginBottom: Spacing.four,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  codeContainer: {
    padding: Spacing.four,
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Blue tint
    borderRadius: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  codeText: {
    fontSize: 40,
    letterSpacing: 8,
    color: '#3b82f6',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: 'white',
  }
});
