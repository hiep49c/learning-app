import * as fs from 'fs';
import * as path from 'path';

// ─── Interfaces ───

export interface ContentSection {
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
  children?: ContentSection[];
}

export interface LessonContent {
  sections: ContentSection[];
}

export interface ParsedKeyword {
  id: string;
  lessonId: string;
  name: string;
  definition: string;
  explanation: string;
  codeExample: string | null;
  category: string;
}

export interface ParsedCodeExample {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  code: string;
  language: string;
  fileName: string | null;
  orderIndex: number;
}

export interface ParsedLesson {
  id: string;
  moduleId: string;
  title: string;
  titleVi: string;
  description: string;
  orderIndex: number;
  contentJson: LessonContent;
  sourceFile: string;
  estimatedMinutes: number;
  keywords: ParsedKeyword[];
  codeExamples: ParsedCodeExample[];
}

export interface ParsedModule {
  id: string;
  title: string;
  titleVi: string;
  description: string;
  orderIndex: number;
  difficultyLevel: string;
  iconName: string;
  lessonCount: number;
  category: string;
  lessons: ParsedLesson[];
}

// ─── Module Mapping ───

interface ModuleInfo {
  folder: string;
  title: string;
  titleVi: string;
  difficulty: string;
  category: string;
  iconName: string;
}

const MODULE_MAP: Record<string, ModuleInfo> = {
  '01-java-core': {
    folder: '01-java-core',
    title: 'Java Core Fundamentals',
    titleVi: 'Java Cơ Bản',
    difficulty: 'beginner',
    category: 'java-core',
    iconName: 'language-java',
  },
  '02-java-oop': {
    folder: '02-java-oop',
    title: 'Java OOP',
    titleVi: 'Java Hướng Đối Tượng',
    difficulty: 'beginner',
    category: 'oop',
    iconName: 'shape-outline',
  },
  '03-java-advanced': {
    folder: '03-java-advanced',
    title: 'Java Advanced',
    titleVi: 'Java Nâng Cao',
    difficulty: 'intermediate',
    category: 'java-advanced',
    iconName: 'rocket-launch-outline',
  },
  '04-spring-core': {
    folder: '04-spring-core',
    title: 'Spring Framework Basics',
    titleVi: 'Spring Cơ Bản',
    difficulty: 'intermediate',
    category: 'spring-core',
    iconName: 'leaf',
  },
  '05-spring-boot': {
    folder: '05-spring-boot',
    title: 'Spring Boot',
    titleVi: 'Spring Boot',
    difficulty: 'intermediate',
    category: 'spring-boot',
    iconName: 'flash-outline',
  },
  '06-spring-data': {
    folder: '06-spring-data',
    title: 'Spring Data & Persistence',
    titleVi: 'Spring Data',
    difficulty: 'advanced',
    category: 'spring-data',
    iconName: 'database-outline',
  },
  '07-spring-security': {
    folder: '07-spring-security',
    title: 'Spring Security',
    titleVi: 'Spring Security',
    difficulty: 'advanced',
    category: 'spring-security',
    iconName: 'shield-lock-outline',
  },
  '08-spring-cloud': {
    folder: '08-spring-cloud',
    title: 'Spring Cloud & Microservices',
    titleVi: 'Spring Cloud',
    difficulty: 'advanced',
    category: 'spring-cloud',
    iconName: 'cloud-outline',
  },
  '09-real-world': {
    folder: '09-real-world',
    title: 'Real-world Project Patterns',
    titleVi: 'Dự Án Thực Tế',
    difficulty: 'expert',
    category: 'real-world',
    iconName: 'briefcase-outline',
  },
};


// ─── Utility Functions ───

/**
 * Generate a deterministic slug from a string.
 * e.g., "Object Memory Layout" → "object-memory-layout"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Truncate a string to maxLen characters, appending "…" if truncated.
 */
export function truncateDefinition(text: string, maxLen: number = 100): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) {
    return trimmed;
  }
  return trimmed.slice(0, maxLen - 1) + '…';
}

/**
 * Estimate reading time in minutes based on word count.
 * Assumes ~150 words/min for technical content.
 */
export function estimateReadingMinutes(content: string): number {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return Math.max(5, Math.ceil(wordCount / 150));
}

// ─── Markdown Parsing ───

/**
 * Parse a fenced code block, extracting language and optional file name.
 * Handles: ```java, ```xml, ``` (no language → default 'java'), ```java:FileName.java
 */
function parseCodeFenceInfo(info: string): { language: string; fileName: string | null } {
  const trimmed = info.trim();
  if (!trimmed) {
    return { language: 'text', fileName: null };
  }

  // Check for fileName pattern: ```java:FileName.java or ```java // FileName.java
  const colonMatch = trimmed.match(/^(\w+):(.+)$/);
  if (colonMatch) {
    return { language: colonMatch[1] ?? 'java', fileName: (colonMatch[2] ?? '').trim() };
  }

  // Check for comment-style file name: ```java // FileName.java
  const commentMatch = trimmed.match(/^(\w+)\s+\/\/\s*(.+)$/);
  if (commentMatch) {
    return { language: commentMatch[1] ?? 'java', fileName: (commentMatch[2] ?? '').trim() };
  }

  return { language: trimmed, fileName: null };
}

/**
 * Determine if a code block is a text-based diagram (no language or diagram-like content).
 */
function isDiagram(language: string, code: string): boolean {
  if (language !== 'text' && language !== '') {
    return false;
  }
  // Heuristic: contains box-drawing characters or arrow patterns
  const diagramPatterns = /[┌┐└┘├┤┬┴─│═║╔╗╚╝╠╣╦╩→←↑↓▶▼►◄┼╬╪╫]/;
  return diagramPatterns.test(code);
}

/**
 * Parse a markdown table into headers and rows.
 */
export function parseTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null;

  const headerLine = lines[0];
  const separatorLine = lines[1];

  if (!headerLine || !separatorLine) return null;

  // Verify separator line (e.g., |---|---|)
  if (!/^\|[\s\-:|]+\|$/.test(separatorLine.trim())) return null;

  const parseCells = (line: string): string[] => {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
  };

  const headers = parseCells(headerLine);
  const rows: string[][] = [];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim().startsWith('|')) break;
    rows.push(parseCells(line));
  }

  return { headers, rows };
}

/**
 * Parse a list block (ordered or unordered) from consecutive lines.
 */
function parseListItems(lines: string[]): { items: string[]; ordered: boolean } | null {
  if (lines.length === 0) return null;

  const firstLine = lines[0];
  if (!firstLine) return null;

  const isOrdered = /^\d+\.\s/.test(firstLine.trim());
  const isUnordered = /^[-*+]\s/.test(firstLine.trim());

  if (!isOrdered && !isUnordered) return null;

  const items: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (isOrdered) {
      const match = trimmed.match(/^\d+\.\s+(.*)$/);
      if (match) items.push(match[1] ?? '');
    } else {
      const match = trimmed.match(/^[-*+]\s+(.*)$/);
      if (match) items.push(match[1] ?? '');
    }
  }

  return items.length > 0 ? { items, ordered: isOrdered } : null;
}


/**
 * Parse markdown content into structured LessonContent sections.
 * Handles: headings, paragraphs, code blocks, tables, lists, diagrams, horizontal rules.
 */
export function parseMarkdownToSections(markdown: string): ContentSection[] {
  const lines = markdown.split('\n');
  const sections: ContentSection[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed === '') {
      i++;
      continue;
    }

    // Skip horizontal rules
    if (/^---+$/.test(trimmed)) {
      i++;
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = (headingMatch[1] ?? '#').length;
      const text = headingMatch[2] ?? '';
      sections.push({ type: 'heading', level, text });
      i++;
      continue;
    }

    // Fenced code blocks
    if (trimmed.startsWith('```')) {
      const fenceInfo = trimmed.slice(3);
      const { language, fileName } = parseCodeFenceInfo(fenceInfo);
      const codeLines: string[] = [];
      i++;

      while (i < lines.length) {
        const codeLine = lines[i] ?? '';
        if (codeLine.trim() === '```') {
          i++;
          break;
        }
        codeLines.push(codeLine);
        i++;
      }

      const code = codeLines.join('\n');

      if (isDiagram(language, code)) {
        sections.push({ type: 'diagram', code, text: code });
      } else {
        const section: ContentSection = {
          type: 'code_block',
          code,
          language: language || 'java',
        };
        if (fileName) {
          section.fileName = fileName;
        }
        sections.push(section);
      }
      continue;
    }

    // Tables
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length) {
        const tl = (lines[i] ?? '').trim();
        if (!tl.startsWith('|')) break;
        tableLines.push(tl);
        i++;
      }

      const table = parseTable(tableLines);
      if (table) {
        sections.push({
          type: 'table',
          headers: table.headers,
          rows: table.rows,
        });
      }
      continue;
    }

    // Lists (ordered and unordered)
    if (/^(\d+\.\s|[-*+]\s)/.test(trimmed)) {
      const listLines: string[] = [];
      const isOrdered = /^\d+\.\s/.test(trimmed);
      while (i < lines.length) {
        const ll = (lines[i] ?? '').trim();
        if (ll === '') break;
        if (isOrdered && !/^\d+\.\s/.test(ll)) break;
        if (!isOrdered && !/^[-*+]\s/.test(ll)) break;
        listLines.push(ll);
        i++;
      }

      const listData = parseListItems(listLines);
      if (listData) {
        sections.push({
          type: 'list',
          items: listData.items,
          ordered: listData.ordered,
        });
      }
      continue;
    }

    // Paragraphs — collect consecutive non-empty, non-special lines
    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const pl = (lines[i] ?? '').trim();
      if (pl === '') break;
      if (/^#{1,6}\s/.test(pl)) break;
      if (pl.startsWith('```')) break;
      if (pl.startsWith('|')) break;
      if (/^---+$/.test(pl)) break;
      if (/^(\d+\.\s|[-*+]\s)/.test(pl)) break;
      paragraphLines.push(pl);
      i++;
    }

    if (paragraphLines.length > 0) {
      sections.push({
        type: 'paragraph',
        text: paragraphLines.join('\n'),
      });
    }
  }

  return sections;
}


// ─── Keyword Extraction ───

interface RawKeywordSection {
  name: string;
  startLine: number;
  endLine: number;
  content: string;
}

/**
 * Extract keyword sections from markdown content.
 * Keyword sections start with `## Keyword: <name>` and end at the next `## ` heading or EOF.
 */
export function extractKeywordSections(markdown: string): RawKeywordSection[] {
  const lines = markdown.split('\n');
  const sections: RawKeywordSection[] = [];
  let currentKeyword: { name: string; startLine: number; lines: string[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    // Check for keyword heading
    const keywordMatch = trimmed.match(/^##\s+Keyword:\s+(.+)$/);
    if (keywordMatch) {
      // Close previous keyword section
      if (currentKeyword) {
        sections.push({
          name: currentKeyword.name,
          startLine: currentKeyword.startLine,
          endLine: i - 1,
          content: currentKeyword.lines.join('\n'),
        });
      }
      currentKeyword = {
        name: (keywordMatch[1] ?? '').trim(),
        startLine: i,
        lines: [],
      };
      continue;
    }

    // Check for "## Tóm Tắt Keywords" — stop collecting
    if (/^##\s+Tóm Tắt/.test(trimmed)) {
      if (currentKeyword) {
        sections.push({
          name: currentKeyword.name,
          startLine: currentKeyword.startLine,
          endLine: i - 1,
          content: currentKeyword.lines.join('\n'),
        });
        currentKeyword = null;
      }
      continue;
    }

    // Check for any other ## heading — close current keyword
    if (/^##\s+/.test(trimmed) && currentKeyword) {
      sections.push({
        name: currentKeyword.name,
        startLine: currentKeyword.startLine,
        endLine: i - 1,
        content: currentKeyword.lines.join('\n'),
      });
      currentKeyword = null;
      continue;
    }

    // Accumulate lines for current keyword
    if (currentKeyword) {
      currentKeyword.lines.push(line);
    }
  }

  // Close last keyword section
  if (currentKeyword) {
    sections.push({
      name: currentKeyword.name,
      startLine: currentKeyword.startLine,
      endLine: lines.length - 1,
      content: currentKeyword.lines.join('\n'),
    });
  }

  return sections;
}

/**
 * Extract definition text from a keyword section.
 * Looks for `**Định nghĩa:**` pattern.
 */
export function extractDefinition(content: string): string {
  // Match **Định nghĩa:** followed by text on the same line
  const match = content.match(/\*\*Định nghĩa:\*\*\s*(.+)/);
  if (!match) return '';
  return truncateDefinition((match[1] ?? '').trim());
}

/**
 * Extract explanation text from a keyword section.
 * First looks for `**Giải thích chi tiết:**` marker and collects text until next bold section or code block.
 * If no explicit marker is found, falls back to collecting paragraph text between the definition
 * and the first code block, skipping the definition line itself.
 */
export function extractExplanation(content: string): string {
  const lines = content.split('\n');

  // Strategy 1: Look for explicit **Giải thích chi tiết:** marker
  let collecting = false;
  const markerLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (/\*\*Giải thích chi tiết:\*\*/.test(trimmed)) {
      collecting = true;
      const afterMarker = trimmed.replace(/.*\*\*Giải thích chi tiết:\*\*\s*/, '').trim();
      if (afterMarker) {
        markerLines.push(afterMarker);
      }
      continue;
    }

    if (collecting) {
      if (trimmed.startsWith('```')) break;
      if (/^\*\*[^*]+:\*\*/.test(trimmed) && !/\*\*Giải thích/.test(trimmed)) break;
      if (trimmed !== '') {
        markerLines.push(trimmed);
      }
    }
  }

  if (markerLines.length > 0) {
    return markerLines.join('\n').trim();
  }

  // Strategy 2: Collect paragraph text after the definition line, before the first code block
  const fallbackLines: string[] = [];
  let pastDefinition = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip until we pass the definition line
    if (!pastDefinition) {
      if (/\*\*Định nghĩa:\*\*/.test(trimmed)) {
        pastDefinition = true;
      }
      continue;
    }

    // Stop at code block, horizontal rule, or next keyword heading
    if (trimmed.startsWith('```')) break;
    if (/^---+$/.test(trimmed)) break;
    if (/^##\s+/.test(trimmed)) break;

    // Collect non-empty paragraph lines
    if (trimmed !== '') {
      fallbackLines.push(trimmed);
    }
  }

  if (fallbackLines.length > 0) {
    return fallbackLines.join('\n').trim();
  }

  // Strategy 3: Extract leading comments from the first code block as explanation
  const commentLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inCodeBlock && trimmed.startsWith('```')) {
      inCodeBlock = true;
      continue;
    }

    if (inCodeBlock) {
      if (trimmed.startsWith('```')) break; // end of code block

      // Collect single-line comments (// ...) as explanation text
      const commentMatch = trimmed.match(/^\/\/\s*(.+)/);
      if (commentMatch) {
        const commentText = (commentMatch[1] ?? '').trim();
        if (commentText) {
          commentLines.push(commentText);
        }
      } else if (trimmed === '' && commentLines.length > 0) {
        // Allow blank lines between comment groups
        continue;
      } else if (commentLines.length > 0) {
        // Stop at first non-comment code line after collecting some comments
        break;
      }
    }
  }

  if (commentLines.length > 0) {
    return commentLines.join(' ').trim();
  }

  // Strategy 4: Extract bold section text after the first code block
  // or the first meaningful line from a diagram code block
  let afterFirstCodeBlock = false;
  let codeBlockCount = 0;
  const postCodeLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      codeBlockCount++;
      if (codeBlockCount === 2) {
        afterFirstCodeBlock = true;
      }
      continue;
    }

    if (afterFirstCodeBlock) {
      if (/^##\s+/.test(trimmed)) break;
      if (/^---+$/.test(trimmed)) break;

      const boldMatch = trimmed.match(/^\*\*([^*]+):\*\*/);
      if (boldMatch) {
        postCodeLines.push((boldMatch[1] ?? '').trim());
        continue;
      }

      if (trimmed !== '') {
        postCodeLines.push(trimmed);
      }

      if (postCodeLines.length >= 3) break;
    }
  }

  if (postCodeLines.length > 0) {
    return postCodeLines.join(' ').trim();
  }

  // Strategy 5: Use the first non-empty, non-decoration line from the first code block
  inCodeBlock = false;
  for (const line of lines) {
    const trimmed = line.trim();

    if (!inCodeBlock && trimmed.startsWith('```')) {
      inCodeBlock = true;
      continue;
    }

    if (inCodeBlock) {
      if (trimmed.startsWith('```')) break;
      if (trimmed !== '' && !/^[┌└├│─┐┘┤┬┴┼]+$/.test(trimmed)) {
        return trimmed;
      }
    }
  }

  return '';
}

/**
 * Extract the first code block from a keyword section.
 */
export function extractFirstCodeBlock(content: string): string | null {
  const match = content.match(/```[\w]*\n([\s\S]*?)```/);
  if (!match) return null;
  return (match[1] ?? '').trim();
}

/**
 * Extract all fenced code blocks from markdown content.
 */
export function extractAllCodeBlocks(
  markdown: string,
  lessonId: string
): ParsedCodeExample[] {
  const examples: ParsedCodeExample[] = [];
  const lines = markdown.split('\n');
  let i = 0;
  let orderIndex = 0;

  // Track the last heading before each code block for title context
  let lastHeading = '';

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    // Track headings for context
    const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      lastHeading = (headingMatch[1] ?? '').trim();
    }

    if (trimmed.startsWith('```')) {
      const fenceInfo = trimmed.slice(3);
      const { language, fileName } = parseCodeFenceInfo(fenceInfo);
      const codeLines: string[] = [];
      i++;

      while (i < lines.length) {
        const codeLine = lines[i] ?? '';
        if (codeLine.trim() === '```') {
          i++;
          break;
        }
        codeLines.push(codeLine);
        i++;
      }

      const code = codeLines.join('\n').trim();
      if (code.length === 0) continue;

      // Skip diagram-like blocks (no language, contains box-drawing chars)
      if (isDiagram(language, code)) continue;

      const resolvedLanguage = language || 'java';
      const exampleId = `code-${lessonId}-${String(orderIndex).padStart(2, '0')}`;

      examples.push({
        id: exampleId,
        lessonId,
        title: lastHeading || `Code Example ${orderIndex + 1}`,
        description: `Code example from ${lastHeading || 'lesson'}`,
        code,
        language: resolvedLanguage,
        fileName: fileName ?? null,
        orderIndex,
      });

      orderIndex++;
      continue;
    }

    i++;
  }

  return examples;
}


// ─── Lesson Parsing ───

/**
 * Extract lesson title and Vietnamese title from the first `# heading`.
 * Format: `# English Title — Vietnamese Title`
 */
export function parseLessonTitle(markdown: string): { title: string; titleVi: string } {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (!match) return { title: 'Untitled', titleVi: 'Không có tiêu đề' };

  const fullTitle = (match[1] ?? '').trim();

  // Split on " — " (em dash with spaces) or " - " (hyphen with spaces)
  const dashMatch = fullTitle.match(/^(.+?)\s*[—–-]\s+(.+)$/);
  if (dashMatch) {
    return {
      title: (dashMatch[1] ?? '').trim(),
      titleVi: (dashMatch[2] ?? '').trim(),
    };
  }

  return { title: fullTitle, titleVi: fullTitle };
}

/**
 * Extract description from the first paragraph after the `# heading`.
 * Typically the content under `## Tổng Quan`.
 */
export function parseLessonDescription(markdown: string): string {
  const lines = markdown.split('\n');
  let foundOverview = false;
  const descLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Look for ## Tổng Quan section
    if (/^##\s+Tổng Quan/.test(trimmed)) {
      foundOverview = true;
      continue;
    }

    if (foundOverview) {
      // Stop at next heading or horizontal rule
      if (/^##\s+/.test(trimmed)) break;
      if (/^---+$/.test(trimmed)) break;
      if (trimmed === '') {
        if (descLines.length > 0) break; // End of first paragraph
        continue;
      }
      descLines.push(trimmed);
    }
  }

  if (descLines.length > 0) {
    return descLines.join(' ').trim();
  }

  // Fallback: first paragraph after the # heading
  let foundTitle = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#\s+/.test(trimmed)) {
      foundTitle = true;
      continue;
    }
    if (foundTitle) {
      if (trimmed === '') continue;
      if (/^##\s+/.test(trimmed)) continue;
      if (/^---+$/.test(trimmed)) continue;
      return trimmed;
    }
  }

  return '';
}

/**
 * Filter out the "Tóm Tắt Keywords" section from markdown before parsing content.
 */
function removeSummarySection(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let inSummary = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^##\s+Tóm Tắt/.test(trimmed)) {
      inSummary = true;
      continue;
    }

    // If we hit another ## heading after summary, we're out of summary
    if (inSummary && /^##\s+/.test(trimmed) && !/^##\s+Tóm Tắt/.test(trimmed)) {
      inSummary = false;
    }

    if (!inSummary) {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Parse a single markdown file into a ParsedLesson.
 */
export function parseMarkdownFile(
  filePath: string,
  moduleId: string,
  category: string,
  lessonOrderIndex: number
): ParsedLesson {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.md');

  // Extract order prefix from filename (e.g., "01" from "01-variables-data-types")
  const orderMatch = fileName.match(/^(\d+)/);
  const orderIndex = orderMatch ? parseInt(orderMatch[1] ?? '0', 10) : lessonOrderIndex;

  // Generate lesson ID
  const modulePrefix = moduleId.replace('module-', '');
  const lessonId = `lesson-${modulePrefix}-${String(orderIndex).padStart(2, '0')}`;

  // Parse title
  const { title, titleVi } = parseLessonTitle(content);

  // Parse description
  const description = parseLessonDescription(content);

  // Extract keywords
  const keywordSections = extractKeywordSections(content);
  const keywords: ParsedKeyword[] = keywordSections.map((section) => {
    const keywordSlug = slugify(section.name);
    return {
      id: `keyword-${keywordSlug}`,
      lessonId,
      name: section.name,
      definition: extractDefinition(section.content),
      explanation: extractExplanation(section.content),
      codeExample: extractFirstCodeBlock(section.content),
      category,
    };
  });

  // Extract code examples
  const codeExamples = extractAllCodeBlocks(content, lessonId);

  // Parse content JSON (excluding summary section)
  const cleanedContent = removeSummarySection(content);
  const sections = parseMarkdownToSections(cleanedContent);
  const contentJson: LessonContent = { sections };

  // Estimate reading time
  const estimatedMinutes = estimateReadingMinutes(content);

  // Relative source file path
  const sourceFile = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

  return {
    id: lessonId,
    moduleId,
    title,
    titleVi,
    description,
    orderIndex,
    contentJson,
    sourceFile,
    estimatedMinutes,
    keywords,
    codeExamples,
  };
}


// ─── Module Parsing ───

/**
 * Discover and parse all modules from the doc/ directory.
 */
export function parseAllModules(docDir: string): ParsedModule[] {
  const modules: ParsedModule[] = [];

  // Read doc directory and find module folders
  const entries = fs.readdirSync(docDir, { withFileTypes: true });
  const moduleFolders = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => MODULE_MAP[name] !== undefined)
    .sort();

  for (const folderName of moduleFolders) {
    const moduleInfo = MODULE_MAP[folderName];
    if (!moduleInfo) continue;

    const orderMatch = folderName.match(/^(\d+)/);
    const orderIndex = orderMatch ? parseInt(orderMatch[1] ?? '0', 10) : 0;
    const moduleId = `module-${String(orderIndex).padStart(2, '0')}`;

    const modulePath = path.join(docDir, folderName);

    // Find all .md files in the module folder
    const mdFiles = fs.readdirSync(modulePath)
      .filter((f) => f.endsWith('.md'))
      .sort();

    const lessons: ParsedLesson[] = [];

    for (let i = 0; i < mdFiles.length; i++) {
      const mdFile = mdFiles[i];
      if (!mdFile) continue;
      const filePath = path.join(modulePath, mdFile);
      const lesson = parseMarkdownFile(filePath, moduleId, moduleInfo.category, i + 1);
      lessons.push(lesson);
    }

    modules.push({
      id: moduleId,
      title: moduleInfo.title,
      titleVi: moduleInfo.titleVi,
      description: `${moduleInfo.title} - ${moduleInfo.titleVi}`,
      orderIndex,
      difficultyLevel: moduleInfo.difficulty,
      iconName: moduleInfo.iconName,
      lessonCount: lessons.length,
      category: moduleInfo.category,
      lessons,
    });
  }

  return modules;
}

// ─── Main Entry Point ───

export interface ParseResult {
  modules: ParsedModule[];
  allLessons: ParsedLesson[];
  allKeywords: ParsedKeyword[];
  allCodeExamples: ParsedCodeExample[];
}

/**
 * Parse all content from the doc/ directory.
 * Returns structured data ready for JSON output.
 */
export function parseAllContent(docDir?: string): ParseResult {
  const resolvedDocDir = docDir ?? path.join(process.cwd(), 'doc');

  if (!fs.existsSync(resolvedDocDir)) {
    throw new Error(`Doc directory not found: ${resolvedDocDir}`);
  }

  const modules = parseAllModules(resolvedDocDir);

  // Flatten all lessons, keywords, and code examples
  const allLessons: ParsedLesson[] = [];
  const allKeywords: ParsedKeyword[] = [];
  const allCodeExamples: ParsedCodeExample[] = [];

  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      allLessons.push(lesson);
      allKeywords.push(...lesson.keywords);
      allCodeExamples.push(...lesson.codeExamples);
    }
  }

  return { modules, allLessons, allKeywords, allCodeExamples };
}

/**
 * Main function — runs when script is executed directly.
 */
export function main(): void {
  console.log('🔍 Parsing markdown content from doc/ ...\n');

  const result = parseAllContent();

  console.log(`📦 Modules: ${result.modules.length}`);
  console.log(`📖 Lessons: ${result.allLessons.length}`);
  console.log(`🔑 Keywords: ${result.allKeywords.length}`);
  console.log(`💻 Code Examples: ${result.allCodeExamples.length}`);
  console.log('');

  for (const mod of result.modules) {
    console.log(`  ${mod.id} — ${mod.title} (${mod.difficultyLevel})`);
    console.log(`    Lessons: ${mod.lessons.length}`);
    for (const lesson of mod.lessons) {
      const kwCount = lesson.keywords.length;
      const ceCount = lesson.codeExamples.length;
      console.log(`      ${lesson.id}: ${lesson.title} [${kwCount} keywords, ${ceCount} code examples]`);
    }
  }

  // Validate: every lesson has at least 1 code block
  const lessonsWithoutCode = result.allLessons.filter(
    (l) => l.codeExamples.length === 0
  );
  if (lessonsWithoutCode.length > 0) {
    console.warn('\n⚠️  Lessons without code examples:');
    for (const l of lessonsWithoutCode) {
      console.warn(`    ${l.id}: ${l.title}`);
    }
  }

  // Validate: every keyword has definition ≤ 100 chars
  const longDefinitions = result.allKeywords.filter(
    (k) => k.definition.length > 100
  );
  if (longDefinitions.length > 0) {
    console.warn('\n⚠️  Keywords with definition > 100 chars:');
    for (const k of longDefinitions) {
      console.warn(`    ${k.id}: "${k.definition}" (${k.definition.length} chars)`);
    }
  }

  console.log('\n✅ Parsing complete.');
}

// Run main when executed directly
if (require.main === module) {
  main();
}
