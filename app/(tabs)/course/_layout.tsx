import { Stack } from 'expo-router';

/**
 * Course section layout — Stack navigator for course tree → lesson drill-down.
 * headerBackVisible ensures the back button is always shown on lesson screens.
 */
export default function CourseLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackVisible: true,
        headerBackTitle: 'Quay lại',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Khóa học',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="[lessonId]"
        options={{
          title: 'Bài học',
          headerBackVisible: true,
        }}
      />
    </Stack>
  );
}
