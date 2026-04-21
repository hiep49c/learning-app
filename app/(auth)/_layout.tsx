import { Stack } from 'expo-router';

/**
 * Auth layout — Stack navigator without bottom tabs.
 * Contains login/profile selection screens.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
