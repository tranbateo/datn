import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { token, role, setSession } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('auth-token');
        const storedUserData = await SecureStore.getItemAsync('user-data');
        if (storedToken && storedUserData) {
          const user = JSON.parse(storedUserData);
          setSession(storedToken, user);
        } else {
          setSession(null, null);
        }
      } catch (e) {
        setSession(null, null);
      } finally {
        setIsInitialized(true);
      }
    };
    initAuth();
  }, [setSession]);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!token && !inAuthGroup) {
      // Redirect to login
      router.replace('/(auth)/login');
    } else if (token) {
      if (role === 'parent' && segments[0] !== '(parent)') {
        router.replace('/(parent)/(tabs)');
      } else if (role === 'student' && segments[0] !== '(student)') {
        router.replace('/(student)/(tabs)');
      }
    }
  }, [token, isInitialized, segments, role, router]);

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <InitialLayout />
    </ThemeProvider>
  );
}
