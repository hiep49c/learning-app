/**
 * SearchScreen — search lessons, keywords, and code examples.
 *
 * Features:
 * - Search input with debounced query (300ms)
 * - Show recent searches when query is empty
 * - Display grouped results: Lessons, Keywords, Code Examples
 * - Show "Không tìm thấy kết quả" with suggestions when no results
 * - Minimum 2 characters to search
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Chip,
  Divider,
  List,
  Searchbar,
  Text,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';

import { useSearchStore } from '@/stores/searchStore';

// ─── Constants ───

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

// ─── Component ───

export default function SearchScreen() {
  const theme = useTheme<MD3Theme>();
  const {
    query: storeQuery,
    results,
    isSearching,
    recentSearches,
    search,
    clearSearch,
    addRecentSearch,
  } = useSearchStore();

  const [localQuery, setLocalQuery] = useState(storeQuery);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounced search ──

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const trimmed = localQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      if (trimmed.length === 0) {
        clearSearch();
      }
      return;
    }

    debounceTimer.current = setTimeout(() => {
      void search(trimmed);
      addRecentSearch(trimmed);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [localQuery, search, clearSearch, addRecentSearch]);

  // ── Handlers ──

  const handleRecentSearchPress = useCallback(
    (term: string) => {
      setLocalQuery(term);
    },
    [],
  );

  const handleLessonPress = useCallback((lessonId: string) => {
    router.push(`/(tabs)/course/${lessonId}`);
  }, []);

  const handleKeywordPress = useCallback((keywordId: string) => {
    router.push(`/keyword/${keywordId}`);
  }, []);

  const handleCodeExamplePress = useCallback((lessonId: string) => {
    router.push(`/(tabs)/course/${lessonId}`);
  }, []);

  const trimmedQuery = localQuery.trim();
  const hasResults =
    results.lessons.length > 0 ||
    results.keywords.length > 0 ||
    results.codeExamples.length > 0;
  const showHint = trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;
  const showNoResults = trimmedQuery.length >= MIN_QUERY_LENGTH && !isSearching && !hasResults;
  const showRecentSearches = trimmedQuery.length === 0 && recentSearches.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search bar */}
      <Searchbar
        placeholder="Tìm kiếm bài học, từ khóa..."
        value={localQuery}
        onChangeText={setLocalQuery}
        style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
        accessibilityLabel="Tìm kiếm"
        autoFocus
      />

      {/* Hint for minimum characters */}
      {showHint && (
        <View style={styles.hintContainer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Nhập ít nhất 2 ký tự
          </Text>
        </View>
      )}

      {/* Loading */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" accessibilityLabel="Đang tìm kiếm" />
        </View>
      )}

      {/* Recent searches */}
      {showRecentSearches && (
        <View style={styles.recentContainer}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Tìm kiếm gần đây
          </Text>
          <View style={styles.chipRow}>
            {recentSearches.map((term, index) => (
              <Chip
                key={`${term}-${index}`}
                mode="outlined"
                onPress={() => handleRecentSearchPress(term)}
                style={styles.recentChip}
                accessibilityLabel={`Tìm kiếm: ${term}`}
                accessibilityRole="button"
              >
                {term}
              </Chip>
            ))}
          </View>
        </View>
      )}

      {/* No results */}
      {showNoResults && (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="magnify-close"
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}
          >
            Không tìm thấy kết quả
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}
          >
            Thử tìm kiếm với từ khóa khác
          </Text>
        </View>
      )}

      {/* Results */}
      {hasResults && !isSearching && (
        <ScrollView
          style={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Lessons */}
          {results.lessons.length > 0 && (
            <View style={styles.resultSection}>
              <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                Bài học ({results.lessons.length})
              </Text>
              {results.lessons.map((lesson) => (
                <List.Item
                  key={lesson.id}
                  title={lesson.titleVi || lesson.title}
                  description={lesson.description}
                  descriptionNumberOfLines={2}
                  left={(props) => <List.Icon {...props} icon="book-open-variant" />}
                  onPress={() => handleLessonPress(lesson.id)}
                  style={styles.resultItem}
                  accessibilityLabel={`Bài học: ${lesson.titleVi || lesson.title}`}
                  accessibilityRole="button"
                />
              ))}
              <Divider />
            </View>
          )}

          {/* Keywords */}
          {results.keywords.length > 0 && (
            <View style={styles.resultSection}>
              <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                Từ khóa ({results.keywords.length})
              </Text>
              {results.keywords.map((keyword) => (
                <List.Item
                  key={keyword.id}
                  title={keyword.name}
                  description={keyword.definition}
                  descriptionNumberOfLines={2}
                  left={(props) => <List.Icon {...props} icon="key-variant" />}
                  onPress={() => handleKeywordPress(keyword.id)}
                  style={styles.resultItem}
                  accessibilityLabel={`Từ khóa: ${keyword.name}`}
                  accessibilityRole="button"
                />
              ))}
              <Divider />
            </View>
          )}

          {/* Code Examples */}
          {results.codeExamples.length > 0 && (
            <View style={styles.resultSection}>
              <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                Ví dụ code ({results.codeExamples.length})
              </Text>
              {results.codeExamples.map((example) => (
                <List.Item
                  key={example.id}
                  title={example.title}
                  description={example.description}
                  descriptionNumberOfLines={2}
                  left={(props) => <List.Icon {...props} icon="code-tags" />}
                  onPress={() => handleCodeExamplePress(example.lessonId)}
                  style={styles.resultItem}
                  accessibilityLabel={`Ví dụ code: ${example.title}`}
                  accessibilityRole="button"
                />
              ))}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    borderRadius: 12,
  },
  hintContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  recentContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  resultsContainer: {
    flex: 1,
  },
  resultSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultItem: {
    minHeight: 56,
  },
  bottomSpacer: {
    height: 32,
  },
});
