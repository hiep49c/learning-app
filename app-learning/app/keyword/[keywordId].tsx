/**
 * KeywordDetailScreen — shows keyword definition, explanation, code example, related keywords.
 *
 * Features:
 * - Load keyword from WatermelonDB by keywordId
 * - Show: keyword name, definition, detailed explanation, code example
 * - Display related keywords as tappable Chips
 * - "Xem bài học" link to parent lesson
 * - Bookmark toggle button
 *
 * Requirements: 11.1, 11.2, 11.4
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Chip,
  Divider,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type Keyword from '@/database/models/Keyword';
import type KeywordRelation from '@/database/models/KeywordRelation';
import { CodeBlock } from '@/components/CodeBlock';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/utils/toast';

// ─── Types ───

interface KeywordData {
  id: string;
  name: string;
  definition: string;
  explanation: string;
  codeExample: string | null;
  category: string;
  lessonId: string;
}

interface RelatedKeywordData {
  id: string;
  name: string;
}

// ─── Component ───

export default function KeywordDetailScreen() {
  const theme = useTheme<MD3Theme>();
  const { keywordId } = useLocalSearchParams<{ keywordId: string }>();
  const { currentUser } = useAuthStore();
  const { isBookmarked, toggleBookmark } = useBookmarkStore();

  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState<KeywordData | null>(null);
  const [relatedKeywords, setRelatedKeywords] = useState<RelatedKeywordData[]>([]);
  const [bookmarked, setBookmarked] = useState(false);

  // ── Load keyword data ──

  useEffect(() => {
    async function loadKeyword() {
      if (!keywordId || !currentUser) return;

      try {
        const record = await database.get<Keyword>('keywords').find(keywordId);
        const raw = record._raw as Record<string, unknown>;

        setKeyword({
          id: record.id,
          name: record.name,
          definition: record.definition,
          explanation: record.explanation,
          codeExample: record.codeExample,
          category: record.category,
          lessonId: raw.lesson_id as string,
        });

        // Load related keywords
        const relations = await database
          .get<KeywordRelation>('keyword_relations')
          .query(Q.where('keyword_id', keywordId))
          .fetch();

        const relatedIds = relations.map(
          (r) => (r._raw as Record<string, unknown>).related_keyword_id as string,
        );

        if (relatedIds.length > 0) {
          const relatedRecords = await database
            .get<Keyword>('keywords')
            .query(Q.where('id', Q.oneOf(relatedIds)))
            .fetch();

          setRelatedKeywords(
            relatedRecords.map((r) => ({ id: r.id, name: r.name })),
          );
        }

        // Check bookmark status
        const isBookmarkedResult = await isBookmarked(currentUser.id, keywordId);
        setBookmarked(isBookmarkedResult);
      } catch (error) {
        console.error('[KeywordDetailScreen] loadKeyword failed:', error);
        showToast('Không tìm thấy từ khóa');
      } finally {
        setIsLoading(false);
      }
    }

    void loadKeyword();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordId, currentUser]);

  // ── Handlers ──

  const handleToggleBookmark = useCallback(async () => {
    if (!keywordId || !currentUser) return;
    try {
      await toggleBookmark(currentUser.id, keywordId, 'keyword');
      setBookmarked((prev) => !prev);
    } catch {
      // Error handled by store
    }
  }, [keywordId, currentUser, toggleBookmark]);

  const handleRelatedKeywordPress = useCallback((id: string) => {
    router.push(`/keyword/${id}`);
  }, []);

  const handleViewLesson = useCallback(() => {
    if (keyword?.lessonId) {
      router.push(`/(tabs)/course/${keyword.lessonId}`);
    }
  }, [keyword]);

  // ── Loading state ──

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" accessibilityLabel="Đang tải từ khóa" />
      </View>
    );
  }

  // ── Error state ──

  if (!keyword) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Không tìm thấy từ khóa
        </Text>
        <Button
          mode="text"
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
          accessibilityLabel="Quay lại"
        >
          Quay lại
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: keyword.name,
          headerRight: () => (
            <IconButton
              icon={bookmarked ? 'heart' : 'heart-outline'}
              iconColor={bookmarked ? theme.colors.error : theme.colors.onSurfaceVariant}
              onPress={handleToggleBookmark}
              accessibilityLabel={bookmarked ? 'Bỏ đánh dấu từ khóa' : 'Đánh dấu từ khóa'}
              accessibilityRole="button"
            />
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Keyword name */}
        <Text
          variant="headlineMedium"
          style={[styles.keywordName, { color: theme.colors.onSurface }]}
          accessibilityRole="header"
        >
          {keyword.name}
        </Text>

        {/* Category badge */}
        <Chip
          mode="flat"
          compact
          style={[styles.categoryChip, { backgroundColor: theme.colors.primaryContainer }]}
          textStyle={{ color: theme.colors.onPrimaryContainer }}
        >
          {keyword.category}
        </Chip>

        {/* Definition */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Định nghĩa
        </Text>
        <Text variant="bodyLarge" style={[styles.bodyText, { color: theme.colors.onSurface }]}>
          {keyword.definition}
        </Text>

        <Divider style={styles.divider} />

        {/* Explanation */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Giải thích chi tiết
        </Text>
        <Text variant="bodyLarge" style={[styles.bodyText, { color: theme.colors.onSurface }]}>
          {keyword.explanation}
        </Text>

        {/* Code example */}
        {keyword.codeExample != null && keyword.codeExample.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Ví dụ code
            </Text>
            <CodeBlock
              code={keyword.codeExample}
              language="java"
              showLineNumbers
            />
          </>
        )}

        {/* Related keywords */}
        {relatedKeywords.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Từ khóa liên quan
            </Text>
            <View style={styles.relatedChips}>
              {relatedKeywords.map((related) => (
                <Chip
                  key={related.id}
                  mode="outlined"
                  icon="link-variant"
                  onPress={() => handleRelatedKeywordPress(related.id)}
                  style={styles.relatedChip}
                  accessibilityLabel={`Từ khóa liên quan: ${related.name}`}
                  accessibilityRole="link"
                >
                  {related.name}
                </Chip>
              ))}
            </View>
          </>
        )}

        <Divider style={styles.divider} />

        {/* View lesson link */}
        <Button
          mode="outlined"
          icon="book-open-variant"
          onPress={handleViewLesson}
          style={styles.lessonButton}
          contentStyle={styles.lessonButtonContent}
          accessibilityLabel="Xem bài học"
        >
          Xem bài học
        </Button>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  keywordName: {
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  bodyText: {
    lineHeight: 24,
  },
  divider: {
    marginVertical: 24,
  },
  relatedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedChip: {
    marginBottom: 4,
  },
  lessonButton: {
    borderRadius: 12,
  },
  lessonButtonContent: {
    minHeight: 48,
  },
  bottomSpacer: {
    height: 32,
  },
});
