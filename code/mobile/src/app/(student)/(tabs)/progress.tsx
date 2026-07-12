import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProgressScreen() {
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
          <ThemedText type="subtitle">Tiến độ & Thành tích</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Theo dõi quá trình học tập của bạn
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.placeholderContainer}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <ThemedText type="small" themeColor="textSecondary">Cấp độ</ThemedText>
                <ThemedText type="subtitle">1</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText type="small" themeColor="textSecondary">XP</ThemedText>
                <ThemedText type="subtitle">150</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText type="small" themeColor="textSecondary">Streak</ThemedText>
                <ThemedText type="subtitle">3🔥</ThemedText>
              </View>
            </View>
          </ThemedView>

          <ThemedText type="smallBold" style={styles.sectionTitle}>Bảng xếp hạng (Sắp tới)</ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              Chức năng bảng xếp hạng trên mobile đang được phát triển...
            </ThemedText>
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
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  sectionTitle: {
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.two,
  }
});
