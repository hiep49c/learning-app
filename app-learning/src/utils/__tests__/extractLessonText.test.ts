/**
 * Tests for extractLessonText utility.
 *
 * Validates text extraction from LessonContent sections for TTS.
 */
import { extractLessonText } from '../extractLessonText';

describe('extractLessonText', () => {
  it('extracts text from headings', () => {
    const content = {
      sections: [
        { type: 'heading', text: 'Introduction to Java', level: 1 },
      ],
    };
    expect(extractLessonText(content)).toBe('Introduction to Java');
  });

  it('extracts text from paragraphs and strips markdown', () => {
    const content = {
      sections: [
        { type: 'paragraph', text: 'This is **bold** and `code` text.' },
      ],
    };
    expect(extractLessonText(content)).toBe('This is bold and code text.');
  });

  it('extracts first line from code blocks', () => {
    const content = {
      sections: [
        {
          type: 'code_block',
          code: 'public class Main {\n  public static void main(String[] args) {}\n}',
          language: 'java',
          fileName: 'Main.java',
        },
      ],
    };
    const result = extractLessonText(content);
    expect(result).toContain('Đoạn code');
    expect(result).toContain('Main.java');
    expect(result).toContain('public class Main {');
  });

  it('extracts table headers and rows', () => {
    const content = {
      sections: [
        {
          type: 'table',
          headers: ['Type', 'Size'],
          rows: [['int', '4 bytes'], ['long', '8 bytes']],
        },
      ],
    };
    const result = extractLessonText(content);
    expect(result).toContain('Bảng: Type, Size');
    expect(result).toContain('int, 4 bytes');
    expect(result).toContain('long, 8 bytes');
  });

  it('extracts list items', () => {
    const content = {
      sections: [
        {
          type: 'list',
          items: ['First item', 'Second item'],
          ordered: true,
        },
      ],
    };
    const result = extractLessonText(content);
    expect(result).toContain('1. First item');
    expect(result).toContain('2. Second item');
  });

  it('skips diagrams and keyword_ref sections', () => {
    const content = {
      sections: [
        { type: 'diagram', text: 'some diagram' },
        { type: 'keyword_ref', keywordId: 'kw-1' },
        { type: 'paragraph', text: 'Visible text' },
      ],
    };
    expect(extractLessonText(content)).toBe('Visible text');
  });

  it('returns empty string for empty sections', () => {
    const content = { sections: [] };
    expect(extractLessonText(content)).toBe('');
  });

  it('joins multiple sections with period separator', () => {
    const content = {
      sections: [
        { type: 'heading', text: 'Title' },
        { type: 'paragraph', text: 'Body text' },
      ],
    };
    expect(extractLessonText(content)).toBe('Title. Body text');
  });
});
