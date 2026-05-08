/**
 * ContentRenderer — renders LessonContent JSON into React Native components.
 *
 * Supports section types: heading, paragraph, code_block, table, list,
 * keyword_ref, and diagram. Wraps content in a ScrollView with scroll
 * position tracking for resume-learning support.
 *
 * Requirements: 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2, 9.2, 10.2, 11.4, 16.1, 16.3, 16.4
 */
import React, { useCallback, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Chip, Divider, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { MONOSPACE_FONT } from '@/theme';
import { CodeBlock } from './CodeBlock';

// ─── Content interfaces ──────────────────────────────────────────────────────

interface ContentSection {
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
}

interface LessonContent {
  sections: ContentSection[];
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ContentRendererProps {
  /** Parsed lesson content JSON. */
  content: LessonContent;
  /** Called when a keyword reference is tapped. */
  onKeywordPress?: (keywordId: string) => void;
  /** Called when code is copied from a CodeBlock. */
  onCodeCopy?: (code: string) => void;
  /** Called with the current scroll Y offset. */
  onScrollPositionChange?: (position: number) => void;
  /** Initial scroll position to restore (resume learning). */
  initialScrollPosition?: number;
}

// ─── Heading variant mapping ─────────────────────────────────────────────────

type TextVariant = 'headlineMedium' | 'titleLarge' | 'titleMedium';

function getHeadingVariant(level: number | undefined): TextVariant {
  switch (level) {
    case 1:
      return 'headlineMedium';
    case 2:
      return 'titleLarge';
    default:
      return 'titleMedium';
  }
}

// ─── Inline text parser (bold + code) ────────────────────────────────────────

interface InlineSegment {
  type: 'text' | 'bold' | 'code';
  value: string;
}

function parseInlineText(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  // Match **bold** or `code` patterns
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Plain text before this match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    if (match[2] != null) {
      // **bold**
      segments.push({ type: 'bold', value: match[2] });
    } else if (match[3] != null) {
      // `code`
      segments.push({ type: 'code', value: match[3] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ContentRenderer({
  content,
  onKeywordPress,
  onCodeCopy,
  onScrollPositionChange,
  initialScrollPosition,
}: ContentRendererProps) {
  const theme = useTheme<MD3Theme>();
  const scrollViewRef = useRef<ScrollView>(null);
  const hasRestoredScroll = useRef(false);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScrollPositionChange?.(event.nativeEvent.contentOffset.y);
    },
    [onScrollPositionChange],
  );

  const handleContentSizeChange = useCallback(() => {
    if (
      !hasRestoredScroll.current &&
      initialScrollPosition != null &&
      initialScrollPosition > 0
    ) {
      hasRestoredScroll.current = true;
      scrollViewRef.current?.scrollTo({ y: initialScrollPosition, animated: false });
    }
  }, [initialScrollPosition]);

  const handleCodeCopy = useCallback(
    (code: string) => {
      onCodeCopy?.(code);
    },
    [onCodeCopy],
  );

  const renderInlineText = useCallback(
    (text: string) => {
      const segments = parseInlineText(text);
      return segments.map((segment, idx) => {
        switch (segment.type) {
          case 'bold':
            return (
              <Text key={idx} style={styles.boldText}>
                {segment.value}
              </Text>
            );
          case 'code':
            return (
              <Text
                key={idx}
                style={[
                  styles.inlineCode,
                  {
                    fontFamily: MONOSPACE_FONT,
                    backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    color: theme.colors.onSurface,
                  },
                ]}
              >
                {segment.value}
              </Text>
            );
          default:
            return <Text key={idx}>{segment.value}</Text>;
        }
      });
    },
    [theme.dark, theme.colors.onSurface],
  );

  const renderSection = useCallback(
    (section: ContentSection, index: number) => {
      switch (section.type) {
        case 'heading':
          return (
            <Text
              key={index}
              variant={getHeadingVariant(section.level)}
              style={[
                styles.heading,
                { color: theme.colors.onSurface },
                section.level === 1 && styles.headingLevel1,
              ]}
              accessibilityRole="header"
            >
              {section.text ?? ''}
            </Text>
          );

        case 'paragraph':
          return (
            <Text
              key={index}
              variant="bodyLarge"
              style={[styles.paragraph, { color: theme.colors.onSurface }]}
            >
              {renderInlineText(section.text ?? '')}
            </Text>
          );

        case 'code_block':
          return (
            <CodeBlock
              key={index}
              code={section.code ?? ''}
              language={section.language ?? 'java'}
              fileName={section.fileName}
              showLineNumbers
              onCopy={() => handleCodeCopy(section.code ?? '')}
            />
          );

        case 'table':
          return (
            <ScrollView
              key={index}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tableContainer}
            >
              <View>
                {/* Header row */}
                {section.headers != null && section.headers.length > 0 && (
                  <View
                    style={[
                      styles.tableRow,
                      { backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
                    ]}
                  >
                    {section.headers.map((header, colIdx) => (
                      <View key={colIdx} style={styles.tableCell}>
                        <Text
                          variant="labelLarge"
                          style={[styles.tableHeaderText, { color: theme.colors.onSurface }]}
                        >
                          {header}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {/* Data rows */}
                {section.rows?.map((row, rowIdx) => (
                  <View
                    key={rowIdx}
                    style={[
                      styles.tableRow,
                      rowIdx % 2 === 1 && {
                        backgroundColor: theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                      },
                    ]}
                  >
                    {row.map((cell, colIdx) => (
                      <View key={colIdx} style={styles.tableCell}>
                        <Text
                          variant="bodyMedium"
                          style={{ color: theme.colors.onSurface }}
                        >
                          {cell}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          );

        case 'list':
          return (
            <View key={index} style={styles.listContainer}>
              {section.items?.map((item, itemIdx) => (
                <View key={itemIdx} style={styles.listItem}>
                  <Text
                    variant="bodyLarge"
                    style={[styles.listBullet, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {section.ordered === true ? `${itemIdx + 1}.` : '•'}
                  </Text>
                  <Text
                    variant="bodyLarge"
                    style={[styles.listItemText, { color: theme.colors.onSurface }]}
                  >
                    {renderInlineText(item)}
                  </Text>
                </View>
              ))}
            </View>
          );

        case 'diagram':
          return (
            <CodeBlock
              key={index}
              code={section.code ?? section.text ?? ''}
              language="text"
              showLineNumbers={false}
            />
          );

        case 'keyword_ref':
          return (
            <Chip
              key={index}
              mode="outlined"
              icon="book-open-variant"
              onPress={() => {
                if (section.keywordId != null) {
                  onKeywordPress?.(section.keywordId);
                }
              }}
              style={styles.keywordChip}
              accessibilityLabel={`Từ khóa: ${section.text ?? ''}`}
              accessibilityRole="link"
            >
              {section.text ?? ''}
            </Chip>
          );

        default:
          return null;
      }
    },
    [theme, renderInlineText, handleCodeCopy, onKeywordPress],
  );

  const sections = content.sections;

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      onScroll={handleScroll}
      scrollEventThrottle={200}
      onContentSizeChange={handleContentSizeChange}
      showsVerticalScrollIndicator
    >
      {sections.map((section, index) => {
        const rendered = renderSection(section, index);
        if (rendered == null) return null;

        // Add divider before headings (except the first section)
        if (section.type === 'heading' && section.level === 1 && index > 0) {
          return (
            <React.Fragment key={`heading-group-${index}`}>
              <Divider style={styles.sectionDivider} />
              {rendered}
            </React.Fragment>
          );
        }

        return rendered;
      })}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    marginTop: 16,
    marginBottom: 8,
  },
  headingLevel1: {
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    marginBottom: 12,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '700',
  },
  inlineCode: {
    fontSize: 14,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  tableContainer: {
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    minWidth: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.3)',
  },
  tableHeaderText: {
    fontWeight: '600',
  },
  listContainer: {
    marginVertical: 8,
    paddingLeft: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  listBullet: {
    width: 24,
    textAlign: 'center',
    marginRight: 4,
  },
  listItemText: {
    flex: 1,
    lineHeight: 24,
  },
  keywordChip: {
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  sectionDivider: {
    marginVertical: 16,
  },
});
