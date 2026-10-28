/**
 * Shared media references.
 *
 * NOTE ON VIDEO SOURCES:
 * We avoid hard-embedding a single YouTube ID that could go offline. Each form
 * exposes a precise YouTube search query so the user can open an up-to-date,
 * reputable demonstration. The VideoBlock component renders a tappable card that
 * opens the search (or a specific video when `videoId` is provided and verified).
 *
 * The canonical reference for form names/sequence is Wikipedia's
 * "24-form tai chi" article. Reputable demonstration sources include
 * world Taijiquan champions and certified masters (e.g. Li Deyin lineage).
 */

export const CANONICAL_SOURCE = {
  name: 'Wikipedia — 24-form tai chi',
  url: 'https://en.wikipedia.org/wiki/24-form_tai_chi',
};

/** Build a YouTube search URL targeting a specific form demonstration. */
export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/** Full-form demonstration search (whole 24-form routine). */
export const FULL_FORM_QUERY = 'Thái cực quyền 24 thức chuẩn hướng dẫn';
