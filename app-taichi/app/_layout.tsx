import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { lightTheme, darkTheme } from '@/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';

export default function RootLayout() {
  const system = useColorScheme();
  const { themeMode, load: loadSettings } = useSettingsStore();
  const loadBookmarks = useBookmarkStore((s) => s.load);

  useEffect(() => {
    loadSettings();
    loadBookmarks();
  }, [loadSettings, loadBookmarks]);

  const dark = themeMode === 'system' ? system === 'dark' : themeMode === 'dark';
  const theme = dark ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '600' },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Thái Cực Quyền 24 Thức' }} />
          <Stack.Screen name="form/[id]" options={{ title: '', headerBackVisible: true }} />
          <Stack.Screen name="bookmarks" options={{ title: 'Đã lưu' }} />
          <Stack.Screen name="search" options={{ title: 'Tìm kiếm' }} />
          <Stack.Screen name="settings" options={{ title: 'Cài đặt' }} />
        </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
