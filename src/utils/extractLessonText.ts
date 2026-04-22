/**
 * extractLessonText — extracts plain text from LessonContent sections
 * for Text-to-Speech reading.
 *
 * Strategy:
 * - headings → text
 * - paragraphs → text (strip markdown bold/code)
 * - code_blocks → "Đoạn code: [first line]"
 * - tables → read headers then rows
 * - lists → read items
 * - diagrams → skip
 * - keyword_ref → skip (no meaningful text)
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

/**
 * Strip basic markdown formatting from text:
 * - **bold** → bold
 * - `code` → code
 * - *italic* → italic
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
    .replace(/\*(.+?)\*/g, '$1')        // italic
    .replace(/`(.+?)`/g, '$1')          // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .trim();
}

/**
 * Extract plain text from lesson content sections for TTS.
 * Returns a single string suitable for speech synthesis.
 */
export function extractLessonText(content: LessonContent): string {
  const parts: string[] = [];

  for (const section of content.sections) {
    switch (section.type) {
      case 'heading':
        if (section.text) {
          parts.push(stripMarkdown(section.text));
        }
        break;

      case 'paragraph':
        if (section.text) {
          parts.push(stripMarkdown(section.text));
        }
        break;

      case 'code_block': {
        // Read just the first line of code as a brief mention
        if (section.code) {
          const firstLine = section.code.split('\n')[0]?.trim();
          if (firstLine) {
            const fileName = section.fileName ? `, file ${section.fileName}` : '';
            parts.push(`Đoạn code${fileName}: ${firstLine}`);
          }
        }
        break;
      }

      case 'table':
        if (section.headers && section.headers.length > 0) {
          parts.push(`Bảng: ${section.headers.join(', ')}`);
        }
        if (section.rows) {
          for (const row of section.rows) {
            parts.push(row.join(', '));
          }
        }
        break;

      case 'list':
        if (section.items) {
          for (let i = 0; i < section.items.length; i++) {
            const prefix = section.ordered ? `${i + 1}.` : '•';
            parts.push(`${prefix} ${stripMarkdown(section.items[i] ?? '')}`);
          }
        }
        break;

      case 'diagram':
        // Skip diagrams — not meaningful for TTS
        break;

      case 'keyword_ref':
        // Skip keyword references
        break;

      default:
        // Unknown section type — skip
        break;
    }
  }

  return parts.join('. ');
}
