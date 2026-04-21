/**
 * BookmarksScreen — saved lessons and keywords with filtering.
 *
 * Features:
 * - List all bookmarks sorted by creation time (newest first)
 * - Filter chips: "Tất cả", "Bài học", "Từ khóa"
 * - Delete button on each item
 * - Tap to navigate to bookmarked item
 * - Empty state with bookmark icon
 *
 * Requirements: 14.1, 14.2, 14.3
 */
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  IconButton,
  List,
  Text,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';

import { useBookmarkStore } from '@/stores/bookmarkStore';
import type { BookmarkData } from '@/stores/bookmarkStore';
import { useAuthStore } from '@/stores/authStore';
import type { BookmarkItemType } from '@/services/BookmarkService';

// ─── Filter type ───

type FilterValue = 'all' | 'lesson' | 'keyword';

// ─── Component ───

export default function BookmarksScreen() {
  const theme = useTheme<MD3Theme>();
  const { currentUser } = useAuthStore();
  const { bookmarks, loadBookmarks, deleteBookmark, setFilter } = useBookmarkStore();

  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

  // ── Load bookmarks on mount ──

  useEffect(() => {
    async function init() {
      if (!currentUser) return;
      try {
        await loadBookmarks(currentUser.id);
      } catch {
        // Error handled by store
      } finally {
        setIsLoading(false);
      }
    }
    void init();
  }, [currentUser, loadBookmarks]);

  // ── Filter handler ──

  const handleFilterChange = useCallback(
    async (filter: FilterValue) => {
      setActiveFilter(filter);
      if (!currentUser) return;

      const filterType: BookmarkItemType | null =
        filter === 'all' ? null : filter;
      setFilter(undefined, filterType);

      setIsLoading(true);
      try {
        await loadBookmarks(currentUser.id);
      } catch {
        // Error handled by store
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser, setFilter, loadBookmarks],
  );

  // ── Delete handler ──

  const handleDelete = useCallback(
    async (bookmarkId: string) => {
      if (!currentUser) return;
      try {
        await deleteBookmark(bookmarkId, currentUser.id);
      } catch {
        // Error handled by store
      }
    },
    [currentUser, deleteBookmark],
  );

  // ── Navigate handler ──

  const handlePress = useCallback((bookmark: BookmarkData) => {
    if (bookmark.itemType === 'lesson') {
      router.push(`/(tabs)/course/${bookmark.itemId}`);
    } else if (bookmark.itemType === 'keyword') {
      router.push(`/keyword/${bookmark.itemId}`);
    }
  }, []);

  // ── Render bookmark item ──

  const renderItem = useCallback(
    ({ item }: { item: BookmarkData }) => {
      const isLesson = item.itemType === 'lesson';
      return (
        <Card
          style={[styles.bookmarkCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => handlePress(item)}
          accessibilityLabel={`Đánh dấu ${isLesson ? 'bài học' : 'từ khóa'}`}
          accessibilityRole="button"
        >
          <View style={styles.bookmarkRow}>
            <MaterialCommunityIcons
              name={isLesson ? 'book-open-variant' : 'key-variant'}
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.bookmarkInfo}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {isLesson ? 'Bài học' : 'Từ khóa'}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.createdAt.toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <IconButton
              icon="delete-outline"
              iconColor={theme.colors.error}
              onPress={() => handleDelete(item.id)}
              accessibilityLabel="Xóa đánh dấu"
              accessibilityRole="button"
              size={20}
            />
          </View>
        </Card>
      );
    },
    [theme, handlePress, handleDelete],
  );

  // ── Loading state ──

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" accessibilityLabel="Đang tải đánh dấu" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Filter chips */}
      <View style={styles.filterRow}>
        <Chip
          selected={activeFilter === 'all'}
          onPress={() => handleFilterChange('all')}
          style={styles.filterChip}
          accessibilityLabel="Lọc tất cả"
          accessibilityRole="button"
        >
          Tất cả
        </Chip>
        <Chip
          selected={activeFilter === 'lesson'}
          onPress={() => handleFilterChange('lesson')}
          style={styles.filterChip}
          accessibilityLabel="Lọc bài học"
          accessibilityRole="button"
        >
          Bài học
        </Chip>
        <Chip
          selected={activeFilter === 'keyword'}
          onPress={() => handleFilterChange('keyword')}
          style={styles.filterChip}
          accessibilityLabel="Lọc từ khóa"
          accessibilityRole="button"
        >
          Từ khóa
        </Chip>
      </View>

      {/* Empty state */}
      {bookmarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="bookmark-outline"
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}
          >
            Chưa có đánh dấu nào
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}
          >
            Đánh dấu bài học hoặc từ khóa để xem lại sau
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(tabs)/course')}
            style={{ marginTop: 24 }}
            accessibilityLabel="Khám phá khóa học"
          >
            Khám phá khóa học
          </Button>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    borderRadius: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  bookmarkCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 64,
  },
  bookmarkInfo: {
    flex: 1,
    marginLeft: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
});
