import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { AppState, Platform, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  Slot,
  useRootNavigationState,
  useRouter,
  useSegments,
  type ErrorBoundaryProps,
} from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
        Ứng dụng gặp sự cố hiển thị
      </Text>
      <Text style={{ fontSize: 13, color: '#475569', textAlign: 'center' }}>
        {error?.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'}
      </Text>
      <TouchableOpacity
        onPress={retry}
        style={{
          backgroundColor: '#2563EB',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 12,
          marginTop: 4,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Thử tải lại</Text>
      </TouchableOpacity>
    </View>
  );
}

function InitialLayout() {
  const { token, role, mustChangePassword, isInitialized, hydrate } = useAuthStore();
  const segments = useSegments() as string[];
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const isNavigationReady = Boolean(rootNavigationState?.key);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Silently fetch OTA updates in background when returning to app (applies on next relaunch without interrupting quizzes)
  useEffect(() => {
    if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) return;

    const checkInBackground = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
        }
      } catch {
        // Ignore offline or transient EAS Update errors
      }
    };

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void checkInBackground();
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isInitialized || !isNavigationReady) return;

    const rootSegment = segments[0];
    const subSegment = segments[1];
    const inAuthGroup = rootSegment === '(auth)';

    if (!token) {
      if (!inAuthGroup || subSegment === 'change-password') {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (mustChangePassword) {
      if (!(inAuthGroup && subSegment === 'change-password')) {
        router.replace('/(auth)/change-password');
      }
      return;
    }

    if (role === 'parent' && rootSegment !== '(parent)') {
      router.replace('/(parent)/(tabs)');
    } else if (role === 'teacher' && rootSegment !== '(teacher)') {
      router.replace('/(teacher)/(tabs)');
    } else if (role === 'student' && rootSegment !== '(student)') {
      router.replace('/(student)/(tabs)');
    }
  }, [token, role, mustChangePassword, isInitialized, isNavigationReady, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <InitialLayout />
        <AnimatedSplashOverlay />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
