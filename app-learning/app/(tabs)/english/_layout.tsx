import { Stack } from 'expo-router';

export default function EnglishLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerBackVisible: true, headerBackTitle: 'Quay lại' }}>
      <Stack.Screen name="index" options={{ title: 'Tiếng Anh', headerBackVisible: false }} />
      <Stack.Screen name="daily" options={{ title: 'Học hôm nay', headerShown: false }} />
      <Stack.Screen name="[lessonId]" options={{ title: 'Bài học', headerShown: true, headerBackVisible: true }} />
    </Stack>
  );
}
