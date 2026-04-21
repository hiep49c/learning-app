/**
 * BookmarkService — manages bookmarks for lessons and keywords.
 *
 * Supports toggle (create/delete), notes (max 500 chars), filtering, and sorting.
 * All bookmarks are stored in WatermelonDB, sorted by created_at descending.
 *
 * Requirements: 14.1, 14.2, 14.3
 */
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type Bookmark from '@/database/models/Bookmark';

/** Maximum character length for bookmark notes. */
const MAX_NOTE_LENGTH = 500;

export type BookmarkItemType = 'lesson' | 'keyword';

export interface BookmarkFilter {
  moduleId?: string;
  itemType?: BookmarkItemType;
}

/**
 * Toggle a bookmark: create if it doesn't exist, delete if it does.
 * Returns true if bookmark was created, false if it was removed.
 */
export async function toggleBookmark(
  userId: string,
  itemId: string,
  itemType: BookmarkItemType,
): Promise<boolean> {
  const collection = database.get<Bookmark>('bookmarks');

  const existing = await collection
    .query(Q.where('user_id', userId), Q.where('item_id', itemId))
    .fetch();

  if (existing.length > 0) {
    // Delete existing bookmark
    await database.write(async () => {
      await existing[0]!.markAsDeleted();
    });
    return false;
  }

  // Create new bookmark
  await database.write(async () => {
    await collection.create((r) => {
      const raw = r._raw as Record<string, unknown>;
      raw.user_id = userId;
      raw.item_id = itemId;
      raw.item_type = itemType;
      raw.created_at = Date.now();
    });
  });
  return true;
}

/**
 * Update the note on an existing bookmark.
 * Truncates to MAX_NOTE_LENGTH characters.
 */
export async function updateNote(
  bookmarkId: string,
  note: string,
): Promise<void> {
  const bookmark = await database.get<Bookmark>('bookmarks').find(bookmarkId);
  const truncated = note.slice(0, MAX_NOTE_LENGTH);

  await database.write(async () => {
    await bookmark.update((r) => {
      const raw = r._raw as Record<string, unknown>;
      raw.note = truncated;
    });
  });
}

/**
 * Delete a bookmark by ID.
 */
export async function deleteBookmark(bookmarkId: string): Promise<void> {
  const bookmark = await database.get<Bookmark>('bookmarks').find(bookmarkId);

  await database.write(async () => {
    await bookmark.markAsDeleted();
  });
}

/**
 * Get bookmarks for a user, sorted by created_at descending (newest first).
 * Optionally filter by item type.
 */
export async function getBookmarks(
  userId: string,
  filter?: BookmarkFilter,
): Promise<Bookmark[]> {
  const conditions = [Q.where('user_id', userId)];

  if (filter?.itemType) {
    conditions.push(Q.where('item_type', filter.itemType));
  }

  const bookmarks = await database
    .get<Bookmark>('bookmarks')
    .query(...conditions, Q.sortBy('created_at', Q.desc))
    .fetch();

  return bookmarks;
}

/**
 * Check if an item is bookmarked by the user.
 */
export async function isBookmarked(
  userId: string,
  itemId: string,
): Promise<boolean> {
  const count = await database
    .get<Bookmark>('bookmarks')
    .query(Q.where('user_id', userId), Q.where('item_id', itemId))
    .fetchCount();

  return count > 0;
}

/** Exported for testing */
export const _testing = {
  MAX_NOTE_LENGTH,
};
