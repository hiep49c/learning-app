/**
 * ContentRenderer — renders a form's ContentSection[] into RN components.
 * Supports: heading, paragraph (inline bold/code), list, image (bundled SVG),
 * video (YouTube), callout (safety/tip). All text is selectable (copy support).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme, Card, Icon } from 'react-native-paper';
import type { ContentSection } from '@/data/types';
import { PoseIllustration } from './PoseIllustration';
import { VideoBlock } from './VideoBlock';

interface Props {
  sections: ContentSection[];
  fontScale: number;
}

interface Seg {
  type: 'text' | 'bold' | 'code';
  value: string;
}

function parseInline(text: string): Seg[] {
  const segs: Seg[] = [];
  const re = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segs.push({ type: 'text', value: text.slice(last, m.index) });
    if (m[2] != null) segs.push({ type: 'bold', value: m[2] });
    else if (m[3] != null) segs.push({ type: 'code', value: m[3] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segs.push({ type: 'text', value: text.slice(last) });
  return segs;
}

export function ContentRenderer({ sections, fontScale }: Props) {
  const theme = useTheme();

  const renderInline = (text: string) =>
    parseInline(text).map((seg, i) => {
      if (seg.type === 'bold') return <Text key={i} style={styles.bold}>{seg.value}</Text>;
      if (seg.type === 'code')
        return (
          <Text
            key={i}
            style={[styles.code, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}
          >
            {seg.value}
          </Text>
        );
      return <Text key={i}>{seg.value}</Text>;
    });

  const headingSize = (level: number) => (level === 1 ? 24 : level === 2 ? 19 : 16);

  return (
    <View>
      {sections.map((s, i) => {
        switch (s.type) {
          case 'heading':
            return (
              <Text
                key={i}
                selectable
                accessibilityRole="header"
                style={[
                  styles.heading,
                  { color: theme.colors.onSurface, fontSize: headingSize(s.level) * fontScale },
                  s.level === 1 && styles.h1,
                ]}
              >
                {s.text}
              </Text>
            );
          case 'paragraph':
            return (
              <Text
                key={i}
                selectable
                style={[styles.paragraph, { color: theme.colors.onSurface, fontSize: 16 * fontScale }]}
              >
                {renderInline(s.text)}
              </Text>
            );
          case 'list':
            return (
              <View key={i} style={styles.list}>
                {s.items.map((item, j) => (
                  <View key={j} style={styles.listItem}>
                    <Text style={[styles.bullet, { color: theme.colors.primary, fontSize: 16 * fontScale }]}>
                      {s.ordered ? `${j + 1}.` : '•'}
                    </Text>
                    <Text
                      selectable
                      style={[styles.listText, { color: theme.colors.onSurface, fontSize: 16 * fontScale }]}
                    >
                      {renderInline(item)}
                    </Text>
                  </View>
                ))}
              </View>
            );
          case 'image':
            return (
              <View key={i} style={[styles.imageWrap, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(14,122,95,0.06)' }]}>
                <PoseIllustration
                  name={s.illustration}
                  size={160}
                  color={theme.dark ? '#4CC7A4' : '#0E7A5F'}
                  accent={theme.colors.secondary}
                />
                {s.caption ? (
                  <Text selectable style={[styles.caption, { color: theme.colors.onSurfaceVariant, fontSize: 13 * fontScale }]}>
                    {s.caption}
                  </Text>
                ) : null}
              </View>
            );
          case 'video':
            return (
              <VideoBlock
                key={i}
                videoId={s.videoId}
                title={s.title}
                start={s.start}
                sourceName={s.source?.name}
                sourceUrl={s.source?.url}
              />
            );
          case 'callout': {
            const isSafety = s.variant === 'safety';
            return (
              <Card
                key={i}
                mode="contained"
                style={[
                  styles.callout,
                  {
                    backgroundColor: isSafety
                      ? theme.dark ? 'rgba(220,80,60,0.18)' : '#FDECEA'
                      : theme.dark ? 'rgba(76,199,164,0.15)' : '#E6F4EF',
                  },
                ]}
              >
                <Card.Content style={styles.calloutContent}>
                  <Icon source={isSafety ? 'alert' : 'lightbulb-on'} size={22} color={isSafety ? '#C0392B' : theme.colors.primary} />
                  <Text selectable style={[styles.calloutText, { color: theme.colors.onSurface, fontSize: 15 * fontScale }]}>
                    {renderInline(s.text)}
                  </Text>
                </Card.Content>
              </Card>
            );
          }
          default:
            return null;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 16, marginBottom: 8, fontWeight: '700' },
  h1: { marginTop: 8 },
  paragraph: { marginBottom: 12, lineHeight: 24 },
  bold: { fontWeight: '700' },
  code: { fontFamily: 'monospace', paddingHorizontal: 4, borderRadius: 4 },
  list: { marginVertical: 6, paddingLeft: 4 },
  listItem: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' },
  bullet: { width: 26, textAlign: 'center', marginRight: 4 },
  listText: { flex: 1, lineHeight: 24 },
  imageWrap: { alignItems: 'center', paddingVertical: 16, borderRadius: 12, marginVertical: 12 },
  caption: { marginTop: 8, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 16 },
  callout: { marginVertical: 10 },
  calloutContent: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  calloutText: { flex: 1, lineHeight: 22 },
});
