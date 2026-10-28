/**
 * VideoBlock — renders a YouTube video.
 *
 * If a verified `videoId` is provided, it embeds the player (react-native-
 * youtube-iframe). Otherwise it shows a tappable card that opens a precise
 * YouTube search / source URL in the browser or YouTube app. This avoids dead
 * embeds and keeps the app robust when offline (shows a message + link).
 */
import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import YoutubePlayer from 'react-native-youtube-iframe';

interface Props {
  videoId: string;
  title: string;
  start?: number;
  sourceName?: string;
  sourceUrl?: string;
}

export function VideoBlock({ videoId, title, start, sourceName, sourceUrl }: Props) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const hasEmbed = videoId.length > 0 && !failed;

  const openExternal = () => {
    const url = sourceUrl ?? (videoId ? `https://youtu.be/${videoId}` : undefined);
    if (url) Linking.openURL(url).catch(() => undefined);
  };

  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Content>
        <Text variant="titleSmall" style={styles.title} selectable>
          🎬 {title}
        </Text>
        {hasEmbed ? (
          <View style={styles.player}>
            <YoutubePlayer
              height={200}
              play={false}
              videoId={videoId}
              initialPlayerParams={{ start }}
              onError={() => setFailed(true)}
            />
          </View>
        ) : (
          <View style={styles.fallback}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Nhấn nút bên dưới để mở video hướng dẫn trên YouTube (cần kết nối mạng).
            </Text>
            <Button mode="contained" icon="youtube" style={styles.btn} onPress={openExternal}>
              Mở video hướng dẫn
            </Button>
          </View>
        )}
        {sourceName ? (
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Nguồn: {sourceName}
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: 12 },
  title: { marginBottom: 8, fontWeight: '600' },
  player: { borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  fallback: { gap: 8, marginBottom: 8 },
  btn: { alignSelf: 'flex-start' },
});
