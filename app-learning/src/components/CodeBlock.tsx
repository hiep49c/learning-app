/**
 * CodeBlock — displays code with simple keyword-based syntax highlighting,
 * line numbers, optional file name header, and copy-to-clipboard.
 *
 * Uses a lightweight approach: Java keywords, strings, comments, and numbers
 * are colored via regex. No heavy syntax highlighting library required.
 *
 * Requirements: 16.1, 16.2, 16.3
 */
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Surface, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { MONOSPACE_FONT } from '@/theme';

// ─── Props ───────────────────────────────────────────────────────────────────

interface CodeBlockProps {
  /** The source code to display. */
  code: string;
  /** Programming language (used for syntax highlighting selection). */
  language: string;
  /** Optional file name shown in the header bar. */
  fileName?: string;
  /** Whether to show line numbers on the left. Defaults to true. */
  showLineNumbers?: boolean;
  /** Called after code is copied to clipboard. */
  onCopy?: () => void;
}

// ─── Java keyword sets ───────────────────────────────────────────────────────

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
  'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
  'package', 'private', 'protected', 'public', 'return', 'short', 'static',
  'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'try', 'void', 'volatile', 'while', 'var', 'record', 'sealed',
  'permits', 'yield', 'true', 'false', 'null',
]);

const SPRING_ANNOTATIONS = new Set([
  '@Component', '@Service', '@Repository', '@Controller', '@RestController',
  '@Autowired', '@Bean', '@Configuration', '@Qualifier', '@Primary', '@Scope',
  '@RequestMapping', '@GetMapping', '@PostMapping', '@PutMapping', '@DeleteMapping',
  '@PathVariable', '@RequestBody', '@RequestParam', '@ResponseBody', '@ResponseStatus',
  '@Entity', '@Table', '@Id', '@GeneratedValue', '@Column', '@OneToMany',
  '@ManyToOne', '@ManyToMany', '@JoinColumn', '@Transactional', '@Override',
  '@SpringBootApplication', '@EnableAutoConfiguration', '@Value',
]);

// ─── Token types ─────────────────────────────────────────────────────────────

interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'annotation' | 'plain';
  value: string;
}

// ─── Tokenizer ───────────────────────────────────────────────────────────────

function tokenizeLine(line: string, language: string): Token[] {
  if (language !== 'java') {
    return [{ type: 'plain', value: line }];
  }

  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Single-line comment
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }

    // Block comment start on same line
    if (line[i] === '/' && line[i + 1] === '*') {
      const end = line.indexOf('*/', i + 2);
      if (end !== -1) {
        tokens.push({ type: 'comment', value: line.slice(i, end + 2) });
        i = end + 2;
        continue;
      }
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }

    // String literal (double quotes)
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') {
        if (line[j] === '\\') j++; // skip escaped char
        j++;
      }
      tokens.push({ type: 'string', value: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Char literal (single quotes)
    if (line[i] === "'") {
      let j = i + 1;
      while (j < line.length && line[j] !== "'") {
        if (line[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'string', value: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Annotation (@Word)
    if (line[i] === '@') {
      const match = line.slice(i).match(/^@\w+/);
      if (match) {
        const annotation = match[0];
        tokens.push({
          type: SPRING_ANNOTATIONS.has(annotation) ? 'annotation' : 'annotation',
          value: annotation,
        });
        i += annotation.length;
        continue;
      }
    }

    // Number literal
    if (/\d/.test(line[i] ?? '')) {
      const match = line.slice(i).match(/^\d+(\.\d+)?[fFdDlL]?/);
      if (match) {
        tokens.push({ type: 'number', value: match[0] });
        i += match[0].length;
        continue;
      }
    }

    // Word (potential keyword)
    if (/[a-zA-Z_$]/.test(line[i] ?? '')) {
      const match = line.slice(i).match(/^[a-zA-Z_$]\w*/);
      if (match) {
        const word = match[0];
        tokens.push({
          type: JAVA_KEYWORDS.has(word) ? 'keyword' : 'plain',
          value: word,
        });
        i += word.length;
        continue;
      }
    }

    // Plain character (whitespace, operators, etc.)
    tokens.push({ type: 'plain', value: line[i] ?? '' });
    i++;
  }

  return tokens;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CodeBlock({
  code,
  language,
  fileName,
  showLineNumbers = true,
  onCopy,
}: CodeBlockProps) {
  const theme = useTheme<MD3Theme>();

  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(code);
      onCopy?.();
    } catch {
      // Clipboard write failed — silently ignore
    }
  }, [code, onCopy]);

  const lines = useMemo(() => code.split('\n'), [code]);

  const tokenColors = useMemo(
    () => ({
      keyword: theme.dark ? '#569CD6' : '#0000FF',
      string: theme.dark ? '#CE9178' : '#A31515',
      comment: theme.dark ? '#6A9955' : '#008000',
      number: theme.dark ? '#B5CEA8' : '#098658',
      annotation: theme.dark ? '#DCDCAA' : '#808000',
      plain: theme.colors.onSurface,
    }),
    [theme.dark, theme.colors.onSurface],
  );

  const bgColor = theme.dark ? '#1E1E1E' : '#F5F5F5';
  const headerBg = theme.dark ? '#2D2D2D' : '#E8E8E8';
  const lineNumberColor = theme.dark
    ? 'rgba(255,255,255,0.3)'
    : 'rgba(0,0,0,0.3)';

  const lineNumberWidth = lines.length >= 100 ? 48 : lines.length >= 10 ? 36 : 28;

  return (
    <Surface style={[styles.container, { backgroundColor: bgColor }]} elevation={1}>
      {/* Header bar */}
      {fileName != null && fileName.length > 0 && (
        <View style={[styles.header, { backgroundColor: headerBg }]}>
          <Text
            variant="labelSmall"
            style={[styles.fileName, { color: theme.colors.onSurfaceVariant, fontFamily: MONOSPACE_FONT }]}
            numberOfLines={1}
          >
            {fileName}
          </Text>
        </View>
      )}

      {/* Copy button */}
      <View style={styles.copyButtonContainer}>
        <IconButton
          icon="content-copy"
          size={18}
          onPress={handleCopy}
          accessibilityLabel="Sao chép code"
          accessibilityRole="button"
          style={styles.copyButton}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </View>

      {/* Code content */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.codeContainer}>
          {lines.map((line, index) => (
            <View key={index} style={styles.lineRow}>
              {showLineNumbers && (
                <Text
                  style={[
                    styles.lineNumber,
                    {
                      color: lineNumberColor,
                      fontFamily: MONOSPACE_FONT,
                      width: lineNumberWidth,
                    },
                  ]}
                >
                  {index + 1}
                </Text>
              )}
              <Text style={[styles.codeLine, { fontFamily: MONOSPACE_FONT }]}>
                {tokenizeLine(line, language).map((token, tokenIdx) => (
                  <Text
                    key={tokenIdx}
                    style={{ color: tokenColors[token.type] }}
                  >
                    {token.value}
                  </Text>
                ))}
                {line.length === 0 ? '\n' : ''}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Surface>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fileName: {
    flex: 1,
  },
  copyButtonContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  copyButton: {
    margin: 4,
  },
  scrollContent: {
    flexGrow: 1,
  },
  codeContainer: {
    padding: 12,
    paddingTop: 8,
    paddingRight: 48, // space for copy button
  },
  lineRow: {
    flexDirection: 'row',
    minHeight: 20,
  },
  lineNumber: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    paddingRight: 12,
    userSelect: 'none',
  },
  codeLine: {
    fontSize: 13,
    lineHeight: 20,
    flexShrink: 0,
  },
});
