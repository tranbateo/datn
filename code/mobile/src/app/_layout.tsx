import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { token, role, mustChangePassword, isInitialized, hydrate } = useAuthStore();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isInitialized) return;

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
  }, [token, role, mustChangePassword, isInitialized, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
      <InitialLayout />
    </SafeAreaProvider>
  );
}
