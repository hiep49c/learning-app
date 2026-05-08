/**
 * LessonScreen — full-featured with next/previous navigation.
 * TTS, bookmark, quiz, mark complete, scroll position, prev/next lesson.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  FAB,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import { ContentRenderer } from '@/components/ContentRenderer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TTSControls } from '@/components/TTSControls';
import { useProgressStore } from '@/stores/progressStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useAuthStore } from '@/stores/authStore';
import { useTTSStore } from '@/stores/ttsStore';
import { showToast } from '@/utils/toast';
import { extractLessonText } from '@/utils/extractLessonText';

interface ContentSection {
  type: 'heading' | 'paragraph' | 'code_block' | 'table' | 'list' | 'keyword_ref' | 'diagram';
  level?: number; text?: string; code?: string; language?: string; fileName?: string;
  rows?: string[][]; headers?: string[]; items?: string[]; ordered?: boolean; keywordId?: string;
}
interface LessonContent { sections: ContentSection[]; }

export default function LessonScreen() {
  const theme = useTheme<MD3Theme>();
  const params = useLocalSearchParams();
  const rawId = params.lessonId;
  const lessonId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;

  const { currentUser } = useAuthStore();
  const { markLessonComplete, updateScrollPosition } = useProgressStore();
  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const { isSpeaking, stop: stopTTS, speak: speakTTS, loadPreferences: loadTTSPrefs } = useTTSStore();

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [title, setTitle] = useState('Bài học');
  const [content, setContent] = useState<LessonContent>({ sections: [] });
  const [quizId, setQuizId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [initialScroll, setInitialScroll] = useState(0);
  const [isMarking, setIsMarking] = useState(false);
  const [showTTS, setShowTTS] = useState(false);
  const [prevLessonId, setPrevLessonId] = useState<string | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);

  const startTime = useRef(Date.now());
  const lastScroll = useRef(0);

  // ── Load lesson + find prev/next ──
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!lessonId) { setErrorMsg('Không có lesson ID'); setStatus('error'); return; }

      try {
        const record = await database.get('lessons').find(lessonId);
        if (cancelled) return;

        const raw = record._raw as Record<string, unknown>;
        const moduleId = raw['module_id'] as string;
        const orderIndex = raw['order_index'] as number;
        setTitle((raw['title_vi'] as string) || (raw['title'] as string) || 'Bài học');

        // Parse content_json
        const contentStr = raw['content_json'];
        if (typeof contentStr === 'string' && contentStr.length > 2) {
          const parsed = JSON.parse(contentStr);
          if (parsed?.sections?.length > 0) setContent(parsed as LessonContent);
        }

        // Find prev/next lessons in same module
        try {
          const allLessons = await database.get('lessons')
            .query(Q.where('module_id', moduleId), Q.sortBy('order_index', Q.asc))
            .fetch();
          const currentIdx = allLessons.findIndex(l => l.id === lessonId);
          setPrevLessonId(currentIdx > 0 ? allLessons[currentIdx - 1]!.id : null);
          setNextLessonId(currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1]!.id : null);

          // If no next in this module, check next module's first lesson
          if (currentIdx === allLessons.length - 1) {
            try {
              const allModules = await database.get('modules')
                .query(Q.sortBy('order_index', Q.asc)).fetch();
              const modIdx = allModules.findIndex(m => m.id === moduleId);
              if (modIdx < allModules.length - 1) {
                const nextModId = allModules[modIdx + 1]!.id;
                const nextModLessons = await database.get('lessons')
                  .query(Q.where('module_id', nextModId), Q.sortBy('order_index', Q.asc)).fetch();
                if (nextModLessons.length > 0) setNextLessonId(nextModLessons[0]!.id);
              }
            } catch { /* ignore */ }
          }
        } catch { /* ignore */ }

        // Load quiz
        try {
          const quizzes = await database.get('quizzes').query(Q.where('lesson_id', lessonId)).fetch();
          if (quizzes.length > 0) setQuizId(quizzes[0]!.id);
        } catch { /* ignore */ }

        // Load progress + bookmark
        if (currentUser) {
          try {
            const progress = await database.get('lesson_progress')
              .query(Q.where('user_id', currentUser.id), Q.where('lesson_id', lessonId)).fetch();
            if (progress.length > 0) {
              const p = progress[0]!._raw as Record<string, unknown>;
              setIsCompleted(p['is_completed'] === true || p['is_completed'] === 1);
              setInitialScroll((p['scroll_position'] as number) ?? 0);
            }
          } catch { /* ignore */ }
          try { setBookmarked(await isBookmarked(currentUser.id, lessonId)); } catch { /* ignore */ }
        }

        setStatus('ready');
      } catch (e) {
        if (!cancelled) { setErrorMsg(`Lỗi: ${String(e)}`); setStatus('error'); }
      }
    }

    // Reset state for new lesson
    setStatus('loading');
    setContent({ sections: [] });
    setQuizId(null);
    setIsCompleted(false);
    setBookmarked(false);
    setInitialScroll(0);
    setPrevLessonId(null);
    setNextLessonId(null);
    startTime.current = Date.now();
    lastScroll.current = 0;

    void load();
    void loadTTSPrefs();
    return () => { cancelled = true; };
  }, [lessonId, currentUser]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (lessonId && currentUser) void updateScrollPosition(lessonId, lastScroll.current);
      void stopTTS();
    };
  }, [lessonId, currentUser]);

  // ── Handlers ──
  const handleScroll = useCallback((pos: number) => { lastScroll.current = pos; }, []);

  const handleMarkComplete = useCallback(async () => {
    if (!lessonId || !currentUser || isMarking) return;
    setIsMarking(true);
    try {
      await markLessonComplete(lessonId, Math.round((Date.now() - startTime.current) / 1000));
      setIsCompleted(true);
      showToast('Đã đánh dấu hoàn thành!');
    } catch { showToast('Lưu thất bại'); }
    finally { setIsMarking(false); }
  }, [lessonId, currentUser, isMarking, markLessonComplete]);

  const handleToggleBookmark = useCallback(async () => {
    if (!lessonId || !currentUser) return;
    try { await toggleBookmark(currentUser.id, lessonId, 'lesson'); setBookmarked(prev => !prev); }
    catch { /* ignore */ }
  }, [lessonId, currentUser, toggleBookmark]);

  const handleTTSPlay = useCallback(() => {
    const text = extractLessonText(content);
    if (text.length > 0) void speakTTS(text);
    else showToast('Không có nội dung để đọc');
  }, [content, speakTTS]);

  const navigateToLesson = useCallback((id: string) => {
    void stopTTS();
    router.replace({ pathname: '/(tabs)/english/[lessonId]', params: { lessonId: id } });
  }, [stopTTS]);

  // ── Loading ──
  if (status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ title: 'Đang tải...', headerShown: true, headerBackVisible: true }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ── Error ──
  if (status === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ title: 'Lỗi', headerShown: true, headerBackVisible: true }} />
        <Text variant="titleMedium" style={{ color: theme.colors.error }}>{errorMsg}</Text>
        <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 24 }}>Quay lại</Button>
      </View>
    );
  }

  // ── Content ──
  return (
    <ErrorBoundary fallbackMessage="Lỗi hiển thị bài học">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen
          options={{
            title,
            headerShown: true,
            headerBackVisible: true,
            headerRight: () => (
              <IconButton
                icon={bookmarked ? 'heart' : 'heart-outline'}
                iconColor={bookmarked ? theme.colors.error : theme.colors.onSurfaceVariant}
                onPress={handleToggleBookmark}
                accessibilityLabel={bookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu'}
              />
            ),
          }}
        />

        <ContentRenderer
          content={content}
          onKeywordPress={(kid) => router.push({ pathname: '/keyword/[keywordId]', params: { keywordId: kid } })}
          onScrollPositionChange={handleScroll}
          initialScrollPosition={initialScroll}
        />

        {/* TTS Controls */}
        <TTSControls visible={showTTS} onPlay={handleTTSPlay} onDismiss={() => setShowTTS(false)} />

        {/* TTS FAB */}
        {!showTTS && (
          <FAB
            icon={isSpeaking ? 'volume-high' : 'text-to-speech'}
            onPress={() => setShowTTS(true)}
            style={styles.fab}
            size="small"
            accessibilityLabel="Đọc bài"
          />
        )}

        {/* Bottom bar — prev/next + quiz + complete */}
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
          {/* Row 1: Previous / Next */}
          <View style={styles.navRow}>
            <Button
              mode="text"
              icon="chevron-left"
              onPress={() => prevLessonId && navigateToLesson(prevLessonId)}
              disabled={!prevLessonId}
              compact
              style={styles.navBtn}
              accessibilityLabel="Bài trước"
            >
              Bài trước
            </Button>
            <Button
              mode="text"
              icon="chevron-right"
              contentStyle={{ flexDirection: 'row-reverse' }}
              onPress={() => nextLessonId && navigateToLesson(nextLessonId)}
              disabled={!nextLessonId}
              compact
              style={styles.navBtn}
              accessibilityLabel="Bài sau"
            >
              Bài sau
            </Button>
          </View>

          {/* Row 2: Quiz + Complete */}
          <View style={styles.actionRow}>
            {quizId && (
              <Button
                mode="outlined"
                icon="pencil"
                onPress={() => router.push({ pathname: '/quiz/[quizId]', params: { quizId } })}
                style={styles.btn}
                contentStyle={styles.btnContent}
              >
                Quiz
              </Button>
            )}
            <Button
              mode={isCompleted ? 'outlined' : 'contained'}
              icon={isCompleted ? 'check-circle' : 'check'}
              onPress={handleMarkComplete}
              disabled={isCompleted || isMarking}
              loading={isMarking}
              style={styles.btn}
              contentStyle={styles.btnContent}
            >
              {isCompleted ? 'Đã xong' : 'Hoàn thành'}
            </Button>
          </View>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  fab: { position: 'absolute', right: 16, bottom: 130, borderRadius: 16 },
  bottomBar: { paddingHorizontal: 12, paddingBottom: 8, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  navBtn: { minWidth: 100 },
  actionRow: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, borderRadius: 12 },
  btnContent: { minHeight: 40 },
});
