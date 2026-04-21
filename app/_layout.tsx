import React, { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DatabaseProvider } from '@/database/DatabaseProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useAppTheme } from '@/theme/useAppTheme';
import { ToastProvider } from '@/components/ToastProvider';
import { SeedingScreen } from '@/components/SeedingScreen';
import { isSeeded, seed, resumeSeed } from '@/services/SeedService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEED_LAST_MODULE_KEY = '@seed_last_module';

/**
 * Inner layout that reads the resolved theme to set StatusBar style.
 */
function AppStack() {
  const { isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="quiz/[quizId]"
          options={{ presentation: 'modal', headerShown: true, title: 'Quiz' }}
        />
        <Stack.Screen
          name="quiz/result/[attemptId]"
          options={{ headerShown: true, title: 'Kết quả' }}
        />
        <Stack.Screen
          name="keyword/[keywordId]"
          options={{ presentation: 'modal', headerShown: true, title: 'Từ khóa' }}
        />
      </Stack>
    </>
  );
}

/**
 * Manages seed state and renders either SeedingScreen or the main app.
 */
function SeedGate({ children }: { children: React.ReactNode }) {
  const [seedState, setSeedState] = useState<'checking' | 'seeding' | 'done' | 'error'>('checking');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const runSeed = useCallback(async () => {
    try {
      setSeedState('seeding');
      setError(null);
      setProgress(0);

      // Check if there's a partial seed to resume
      const lastModule = await AsyncStorage.getItem(SEED_LAST_MODULE_KEY);
      if (lastModule !== null) {
        await resumeSeed((percent) => setProgress(percent));
      } else {
        await seed((percent) => setProgress(percent));
      }

      setSeedState('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(`Không thể nạp dữ liệu: ${message}`);
      setSeedState('error');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkSeed() {
      try {
        const seeded = await isSeeded();
        if (cancelled) return;

        if (seeded) {
          setSeedState('done');
        } else {
          await runSeed();
        }
      } catch {
        if (!cancelled) {
          setSeedState('error');
          setError('Không thể kiểm tra trạng thái dữ liệu');
        }
      }
    }

    void checkSeed();

    return () => {
      cancelled = true;
    };
  }, [runSeed]);

  if (seedState === 'done') {
    return <>{children}</>;
  }

  return (
    <SeedingScreen
      progress={progress}
      error={error}
      onRetry={runSeed}
    />
  );
}

/**
 * Root layout — wraps the entire app with providers.
 * Provider hierarchy: SafeAreaProvider → DatabaseProvider → ThemeProvider → SeedGate → AppStack
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <ThemeProvider>
          <ToastProvider>
            <SeedGate>
              <AppStack />
            </SeedGate>
          </ToastProvider>
        </ThemeProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
