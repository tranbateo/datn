import { Stack } from 'expo-router';

export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="quiz/[quizId]" />
      <Stack.Screen name="courses/index" />
      <Stack.Screen name="courses/[id]" />
    </Stack>
  );
}
