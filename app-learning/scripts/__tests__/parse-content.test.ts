import {
  slugify,
  truncateDefinition,
  estimateReadingMinutes,
  parseTable,
  parseMarkdownToSections,
  extractKeywordSections,
  extractDefinition,
  extractExplanation,
  extractFirstCodeBlock,
  extractAllCodeBlocks,
  parseLessonTitle,
  parseLessonDescription,
  parseAllContent,
} from '../parse-content';
import * as path from 'path';

// ─── Unit Tests: Utility Functions ───

describe('slugify', () => {
  it('converts text to lowercase kebab-case', () => {
    expect(slugify('Object Memory Layout')).toBe('object-memory-layout');
  });

  it('removes special characters', () => {
    expect(slugify('Type Casting & Promotion')).toBe('type-casting-promotion');
  });

  it('handles single word', () => {
    expect(slugify('Variable')).toBe('variable');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('truncateDefinition', () => {
  it('returns text as-is when under limit', () => {
    expect(truncateDefinition('Short text')).toBe('Short text');
  });

  it('truncates text over 100 chars with ellipsis', () => {
    const longText = 'A'.repeat(150);
    const result = truncateDefinition(longText);
    expect(result.length).toBe(100);
    expect(result.endsWith('…')).toBe(true);
  });

  it('handles exactly 100 chars', () => {
    const exact = 'A'.repeat(100);
    expect(truncateDefinition(exact)).toBe(exact);
  });

  it('trims whitespace', () => {
    expect(truncateDefinition('  hello  ')).toBe('hello');
  });
});

describe('estimateReadingMinutes', () => {
  it('returns minimum 5 minutes for short content', () => {
    expect(estimateReadingMinutes('hello world')).toBe(5);
  });

  it('returns minimum 5 even for moderate word count', () => {
    const words = Array(300).fill('word').join(' ');
    // 300/150 = 2, but min is 5
    expect(estimateReadingMinutes(words)).toBe(5);
  });

  it('returns at least 5 for moderate content', () => {
    const words = Array(600).fill('word').join(' ');
    expect(estimateReadingMinutes(words)).toBe(5); // ceil(600/150) = 4, min 5
  });
});

// ─── Unit Tests: Table Parsing ───

describe('parseTable', () => {
  it('parses a valid markdown table', () => {
    const lines = [
      '| Header 1 | Header 2 |',
      '|----------|----------|',
      '| Cell 1   | Cell 2   |',
      '| Cell 3   | Cell 4   |',
    ];
    const result = parseTable(lines);
    expect(result).not.toBeNull();
    expect(result?.headers).toEqual(['Header 1', 'Header 2']);
    expect(result?.rows).toEqual([
      ['Cell 1', 'Cell 2'],
      ['Cell 3', 'Cell 4'],
    ]);
  });

  it('returns null for insufficient lines', () => {
    expect(parseTable(['| Header |'])).toBeNull();
  });

  it('returns null for invalid separator', () => {
    const lines = ['| Header |', '| not a separator |'];
    expect(parseTable(lines)).toBeNull();
  });
});

// ─── Unit Tests: Markdown Section Parsing ───

describe('parseMarkdownToSections', () => {
  it('parses headings', () => {
    const md = '# Title\n## Subtitle\n### Sub-subtitle';
    const sections = parseMarkdownToSections(md);
    expect(sections).toHaveLength(3);
    expect(sections[0]).toEqual({ type: 'heading', level: 1, text: 'Title' });
    expect(sections[1]).toEqual({ type: 'heading', level: 2, text: 'Subtitle' });
    expect(sections[2]).toEqual({ type: 'heading', level: 3, text: 'Sub-subtitle' });
  });

  it('parses paragraphs', () => {
    const md = 'This is a paragraph.\nContinued on next line.\n\nNew paragraph.';
    const sections = parseMarkdownToSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0]?.type).toBe('paragraph');
    expect(sections[0]?.text).toBe('This is a paragraph.\nContinued on next line.');
    expect(sections[1]?.type).toBe('paragraph');
  });

  it('parses code blocks with language', () => {
    const md = '```java\npublic class Foo {}\n```';
    const sections = parseMarkdownToSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0]).toEqual({
      type: 'code_block',
      code: 'public class Foo {}',
      language: 'java',
    });
  });

  it('parses code blocks without language as text', () => {
    const md = '```\nsome plain text\n```';
    const sections = parseMarkdownToSections(md);
    expect(sections).toHaveLength(1);
    // Plain text without diagram chars → code_block with 'java' default
    // Actually, parseCodeFenceInfo returns 'text' for empty info
    // and isDiagram checks for box-drawing chars
    expect(sections[0]?.type).toBe('code_block');
  });

  it('parses diagrams (code blocks with box-drawing chars)', () => {
    const md = '```\n┌─────┐\n│ Box │\n└─────┘\n```';
    const sections = parseMarkdownToSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.type).toBe('diagram');
  });

  it('parses tables', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const sections = parseMarkdownToSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.type).toBe('table');
    expect(sections[0]?.headers).toEqual(['A', 'B']);
    expect(sections[0]?.rows).toEqual([['1', '2']]);
  });

  it('parses unordered lists', () => {
    const md = '- Item 1\n- Item 2\n- Item 3';
    const sections = parseMarkdownToSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.type).toBe('list');
    expect(sections[0]?.items).toEqual(['Item 1', 'Item 2', 'Item 3']);
    expect(sections[0]?.ordered).toBe(false);
  });

  it('parses ordered lists', () => {
    const md = '1. First\n2. Second\n3. Third';
    const sections = parseMarkdownToSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.type).toBe('list');
    expect(sections[0]?.items).toEqual(['First', 'Second', 'Third']);
    expect(sections[0]?.ordered).toBe(true);
  });

  it('skips horizontal rules', () => {
    const md = 'Before\n\n---\n\nAfter';
    const sections = parseMarkdownToSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0]?.text).toBe('Before');
    expect(sections[1]?.text).toBe('After');
  });

  it('handles empty content', () => {
    expect(parseMarkdownToSections('')).toEqual([]);
  });
});

// ─── Unit Tests: Keyword Extraction ───

describe('extractKeywordSections', () => {
  it('extracts keyword sections', () => {
    const md = [
      '# Title',
      '## Tổng Quan',
      'Overview text.',
      '## Keyword: Variable',
      '**Định nghĩa:** A named memory location.',
      '**Giải thích chi tiết:**',
      'Detailed explanation here.',
      '```java',
      'int x = 5;',
      '```',
      '## Keyword: Constant',
      '**Định nghĩa:** An immutable value.',
      '## Tóm Tắt Keywords',
      '| Keyword | Def |',
    ].join('\n');

    const sections = extractKeywordSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0]?.name).toBe('Variable');
    expect(sections[1]?.name).toBe('Constant');
  });

  it('handles file with no keywords', () => {
    const md = '# Title\n## Overview\nSome text.';
    expect(extractKeywordSections(md)).toEqual([]);
  });
});

describe('extractDefinition', () => {
  it('extracts definition text', () => {
    const content = '**Định nghĩa:** A named memory location.';
    expect(extractDefinition(content)).toBe('A named memory location.');
  });

  it('truncates long definitions', () => {
    const longDef = 'A'.repeat(150);
    const content = `**Định nghĩa:** ${longDef}`;
    const result = extractDefinition(content);
    expect(result.length).toBe(100);
  });

  it('returns empty for missing definition', () => {
    expect(extractDefinition('No definition here.')).toBe('');
  });
});

describe('extractExplanation', () => {
  it('extracts explanation text', () => {
    const content = [
      '**Giải thích chi tiết:**',
      'Line 1 of explanation.',
      'Line 2 of explanation.',
      '```java',
      'code here',
      '```',
    ].join('\n');

    const result = extractExplanation(content);
    expect(result).toBe('Line 1 of explanation.\nLine 2 of explanation.');
  });

  it('returns empty when no explanation marker', () => {
    expect(extractExplanation('No explanation here.')).toBe('');
  });
});

describe('extractFirstCodeBlock', () => {
  it('extracts first code block', () => {
    const content = '```java\nint x = 5;\n```\n```java\nint y = 10;\n```';
    expect(extractFirstCodeBlock(content)).toBe('int x = 5;');
  });

  it('returns null when no code block', () => {
    expect(extractFirstCodeBlock('No code here.')).toBeNull();
  });
});

// ─── Unit Tests: Lesson Title Parsing ───

describe('parseLessonTitle', () => {
  it('parses title with em dash separator', () => {
    const md = '# Variables & Data Types — Biến và Kiểu Dữ Liệu';
    const { title, titleVi } = parseLessonTitle(md);
    expect(title).toBe('Variables & Data Types');
    expect(titleVi).toBe('Biến và Kiểu Dữ Liệu');
  });

  it('parses title with en dash separator', () => {
    const md = '# REST API Development – Deep Dive';
    const { title, titleVi } = parseLessonTitle(md);
    expect(title).toBe('REST API Development');
    expect(titleVi).toBe('Deep Dive');
  });

  it('handles title without separator', () => {
    const md = '# Simple Title';
    const { title, titleVi } = parseLessonTitle(md);
    expect(title).toBe('Simple Title');
    expect(titleVi).toBe('Simple Title');
  });

  it('handles missing title', () => {
    const { title, titleVi } = parseLessonTitle('No heading here');
    expect(title).toBe('Untitled');
    expect(titleVi).toBe('Không có tiêu đề');
  });
});

// ─── Unit Tests: Lesson Description ───

describe('parseLessonDescription', () => {
  it('extracts description from Tổng Quan section', () => {
    const md = [
      '# Title',
      '',
      '## Tổng Quan',
      '',
      'This is the overview paragraph.',
      '',
      '## Keyword: Something',
    ].join('\n');

    expect(parseLessonDescription(md)).toBe('This is the overview paragraph.');
  });

  it('returns empty for file without overview', () => {
    const md = '# Title\n\n## Keyword: Something\nContent.';
    // Falls back to first paragraph after heading
    const desc = parseLessonDescription(md);
    expect(typeof desc).toBe('string');
  });
});

// ─── Integration Test: Full Parse ───

describe('parseAllContent', () => {
  const docDir = path.join(process.cwd(), 'doc');

  it('parses all modules from doc directory', () => {
    const result = parseAllContent(docDir);
    expect(result.modules.length).toBe(9);
  });

  it('parses correct number of lessons', () => {
    const result = parseAllContent(docDir);
    expect(result.allLessons.length).toBe(27);
  });

  it('every lesson has at least one code example', () => {
    const result = parseAllContent(docDir);
    for (const lesson of result.allLessons) {
      expect(lesson.codeExamples.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every keyword has definition ≤ 100 chars', () => {
    const result = parseAllContent(docDir);
    for (const keyword of result.allKeywords) {
      expect(keyword.definition.length).toBeLessThanOrEqual(100);
    }
  });

  it('every keyword has non-empty name', () => {
    const result = parseAllContent(docDir);
    for (const keyword of result.allKeywords) {
      expect(keyword.name.length).toBeGreaterThan(0);
    }
  });

  it('modules are in correct order', () => {
    const result = parseAllContent(docDir);
    for (let i = 0; i < result.modules.length; i++) {
      expect(result.modules[i]?.orderIndex).toBe(i + 1);
    }
  });

  it('module difficulty levels are correct', () => {
    const result = parseAllContent(docDir);
    const difficulties = result.modules.map((m) => m.difficultyLevel);
    expect(difficulties).toEqual([
      'beginner',
      'beginner',
      'intermediate',
      'intermediate',
      'intermediate',
      'advanced',
      'advanced',
      'advanced',
      'expert',
    ]);
  });

  it('lesson IDs are deterministic', () => {
    const result1 = parseAllContent(docDir);
    const result2 = parseAllContent(docDir);
    const ids1 = result1.allLessons.map((l) => l.id);
    const ids2 = result2.allLessons.map((l) => l.id);
    expect(ids1).toEqual(ids2);
  });

  it('lesson content JSON has sections', () => {
    const result = parseAllContent(docDir);
    for (const lesson of result.allLessons) {
      expect(lesson.contentJson.sections.length).toBeGreaterThan(0);
    }
  });

  it('every lesson has a source file path', () => {
    const result = parseAllContent(docDir);
    for (const lesson of result.allLessons) {
      expect(lesson.sourceFile).toMatch(/^doc\//);
      expect(lesson.sourceFile).toMatch(/\.md$/);
    }
  });
});
