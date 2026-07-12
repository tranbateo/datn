import { View, Text, StyleSheet, useColorScheme } from 'react-native';

export default function ParentDashboardScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      <Text style={[styles.title, isDark ? styles.textLight : styles.textDark]}>Tổng quan học tập</Text>
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardTitle, isDark ? styles.textLight : styles.textDark]}>Chưa có dữ liệu</Text>
        <Text style={[styles.cardDesc, isDark ? styles.textGrayLight : styles.textGrayDark]}>
          Hãy chuyển sang tab Liên kết để thêm tài khoản học sinh.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  bgLight: { backgroundColor: '#f9fafb' },
  bgDark: { backgroundColor: '#111827' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  textDark: { color: '#111827' },
  textLight: { color: '#f9fafb' },
  textGrayDark: { color: '#4b5563' },
  textGrayLight: { color: '#9ca3af' },
  card: { padding: 20, borderRadius: 16, borderWidth: 1 },
  cardLight: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  cardDark: { backgroundColor: '#1f2937', borderColor: '#374151' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  cardDesc: { fontSize: 14 }
});
