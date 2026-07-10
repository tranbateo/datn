import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function PracticeScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Luyện tập</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Chọn môn học và bắt đầu làm bài trắc nghiệm.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.placeholderContainer}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Bài kiểm tra Toán học</ThemedText>
            <ThemedText type="small" style={{ marginTop: Spacing.two }}>2 bài kiểm tra</ThemedText>
          </ThemedView>
          
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Vật lý (Lớp 12)</ThemedText>
            <ThemedText type="small" style={{ marginTop: Spacing.two }}>1 bài kiểm tra</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  placeholderContainer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
  }
});
