/**
 * LessonScreen — SIMPLIFIED version to fix white screen bug.
 * Minimal dependencies, maximum error handling.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { database } from '@/database';
import { ContentRenderer } from '@/components/ContentRenderer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// ─── Types ───

interface ContentSection {
  type: 'heading' | 'paragraph' | 'code_block' | 'table' | 'list' | 'keyword_ref' | 'diagram';
  level?: number;
  text?: string;
  code?: string;
  language?: string;
  fileName?: string;
  rows?: string[][];
  headers?: string[];
  items?: string[];
  ordered?: boolean;
  keywordId?: string;
}

interface LessonContent {
  sections: ContentSection[];
}

// ─── Component ───

export default function LessonScreen() {
  const theme = useTheme<MD3Theme>();
  const params = useLocalSearchParams();

  // Normalize lessonId — Expo Router may return string or string[]
  const rawId = params.lessonId;
  const lessonId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [title, setTitle] = useState('Bài học');
  const [content, setContent] = useState<LessonContent>({ sections: [] });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!lessonId) {
        setErrorMsg(`Không có lesson ID (params: ${JSON.stringify(params)})`);
        setStatus('error');
        return;
      }

      try {
        // Find lesson record
        const record = await database.get('lessons').find(lessonId);
        if (cancelled) return;

        // Read fields from _raw — most reliable way
        const raw = record._raw as Record<string, unknown>;
        const titleVi = (raw['title_vi'] as string) ?? '';
        const titleEn = (raw['title'] as string) ?? '';
        setTitle(titleVi || titleEn || 'Bài học');

        // Parse content_json
        const contentStr = raw['content_json'];
        if (typeof contentStr === 'string' && contentStr.length > 2) {
          try {
            const parsed = JSON.parse(contentStr);
            if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
              setContent(parsed as LessonContent);
            } else {
              setErrorMsg('Nội dung bài học trống (sections rỗng)');
              setStatus('error');
              return;
            }
          } catch (e) {
            setErrorMsg(`Lỗi parse JSON: ${String(e)}`);
            setStatus('error');
            return;
          }
        } else {
          setErrorMsg(`content_json không hợp lệ (type: ${typeof contentStr}, length: ${typeof contentStr === 'string' ? contentStr.length : 'N/A'})`);
          setStatus('error');
          return;
        }

        setStatus('ready');
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(`Lỗi tải bài học: ${String(e)}`);
          setStatus('error');
        }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [lessonId]);

  // ── Loading ──
  if (status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ title: 'Đang tải...', headerShown: true, headerBackVisible: true }} />
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
          Đang tải bài học...
        </Text>
      </View>
    );
  }

  // ── Error ──
  if (status === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ title: 'Lỗi', headerShown: true, headerBackVisible: true }} />
        <Text variant="titleMedium" style={{ color: theme.colors.error, textAlign: 'center' }}>
          Không thể hiển thị bài học
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
          {errorMsg}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
          ID: {lessonId ?? 'undefined'}
        </Text>
        <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 24 }}>
          Quay lại
        </Button>
      </View>
    );
  }

  // ── Content ──
  return (
    <ErrorBoundary fallbackMessage="Lỗi hiển thị bài học">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ title, headerShown: true, headerBackVisible: true }} />
        <ContentRenderer
          content={content}
          onKeywordPress={(keywordId) => {
            router.push({ pathname: '/keyword/[keywordId]', params: { keywordId } });
          }}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});
