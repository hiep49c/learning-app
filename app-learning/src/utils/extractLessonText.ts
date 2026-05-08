/**
 * extractLessonText — extracts clean plain text from LessonContent for TTS.
 * Removes special characters, limits code blocks, skips diagrams.
 */

interface ContentSection {
  type: string;
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

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/[─│┌┐└┘├┤┬┴═║╔╗╚╝╠╣╦╩→←↑↓▶▼►◄┼╬╪╫]/g, '')
    .replace(/[#~_]/g, '')
    .trim();
}

export function extractLessonText(content: LessonContent): string {
  const parts: string[] = [];

  for (const section of content.sections) {
    switch (section.type) {
      case 'heading':
        if (section.text) {
          const clean = stripMarkdown(section.text);
          if (clean.length > 0) parts.push(clean);
        }
        break;

      case 'paragraph':
        if (section.text) {
          const clean = stripMarkdown(section.text);
          if (clean.length > 0) parts.push(clean);
        }
        break;

      case 'code_block':
        // Only mention code briefly — don't read full code
        if (section.fileName) {
          parts.push(`Đoạn code file ${section.fileName}`);
        }
        break;

      case 'table':
        if (section.headers && section.headers.length > 0) {
          parts.push(`Bảng: ${section.headers.join(', ')}`);
        }
        // Skip table rows — too verbose for TTS
        break;

      case 'list':
        if (section.items) {
          for (let i = 0; i < Math.min(section.items.length, 5); i++) {
            const prefix = section.ordered ? `${i + 1}.` : '';
            const clean = stripMarkdown(section.items[i] ?? '');
            if (clean.length > 0) parts.push(`${prefix} ${clean}`);
          }
          if (section.items.length > 5) {
            parts.push(`và ${section.items.length - 5} mục khác`);
          }
        }
        break;

      // Skip diagrams and keyword_ref
      default:
        break;
    }
  }

  return parts.join('. ');
}
