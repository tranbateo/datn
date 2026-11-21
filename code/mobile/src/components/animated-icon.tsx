import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 500;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    30: {
      opacity: 1,
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1.06 }],
      easing: Easing.out(Easing.cubic),
    },
  });

  const brand = (
    <View style={styles.brandCenter}>
      <View style={styles.logoBadge}>
        <Ionicons name="school" size={44} color="#2563EB" />
      </View>
      <Text style={styles.brandTitle}>AI Tutor</Text>
      <Text style={styles.brandSub}>Trợ giảng học tập thông minh K-12</Text>
    </View>
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}
    >
      {brand}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}
    >
      {brand}
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
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
