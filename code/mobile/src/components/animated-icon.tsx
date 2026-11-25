import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const DURATION = 450;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const [opacity] = useState(() => new Animated.Value(1));
  const [scale] = useState(() => new Animated.Value(1));
  const startedRef = useRef(false);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => {});
      setVisible(false);
    }, 2500);
    return () => clearTimeout(fallbackTimer);
  }, []);

  if (!visible) return null;

  const handleLayout = () => {
    if (startedRef.current) return;
    startedRef.current = true;

    void SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.06,
            duration: DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setVisible(false);
        });
      });
  };

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={handleLayout}
      style={[
        styles.splashOverlay,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={styles.brandCenter}>
        <View style={styles.logoBadge}>
          <Ionicons name="school" size={44} color="#2563EB" />
        </View>
        <Text style={styles.brandTitle}>AI Tutor</Text>
        <Text style={styles.brandSub}>Trợ giảng học tập thông minh K-12</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  brandCenter: {
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSub: {
    color: '#DBEAFE',
    fontSize: 13,
    fontWeight: '600',
  },
});
