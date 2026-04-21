import { Stack } from 'expo-router';

/**
 * Course section layout — Stack navigator for course tree → lesson drill-down.
 */
export default function CourseLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Khóa học' }}
      />
      <Stack.Screen
        name="[lessonId]"
        options={{ title: 'Bài học' }}
      />
    </Stack>
  );
}
