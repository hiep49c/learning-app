import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar, Card, Text, useTheme, Divider } from 'react-native-paper';
import { FORMS } from '@/data';
import { PoseIllustration } from '@/components/PoseIllustration';
import { useSettingsStore } from '@/stores/settingsStore';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const fontScale = useSettingsStore((s) => s.fontScale);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content title="Thái Cực Quyền 24 Thức" color="#fff" />
        <Appbar.Action icon="magnify" color="#fff" onPress={() => router.push('/search')} />
        <Appbar.Action icon="bookmark" color="#fff" onPress={() => router.push('/bookmarks')} />
        <Appbar.Action icon="cog" color="#fff" onPress={() => router.push('/settings')} />
      </Appbar.Header>

      <FlatList
        data={FORMS}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Card mode="contained" style={styles.intro}>
            <Card.Content>
              <Text variant="titleMedium" style={{ fontSize: 18 * fontScale }}>
                Bài quyền 24 thức giản hóa
              </Text>
              <Text variant="bodyMedium" style={{ marginTop: 6, fontSize: 14 * fontScale, color: theme.colors.onSurfaceVariant }}>
                Chuỗi 24 động tác liên tục để tăng cường sức khỏe. Tập chậm, thở đều, lấy eo làm trục.
                Chạm vào từng thức để xem hướng dẫn chi tiết, hình minh họa và video.
              </Text>
            </Card.Content>
          </Card>
        }
        renderItem={({ item }) => (
          <Card
            mode="outlined"
            style={styles.row}
            onPress={() => router.push(`/form/${item.id}`)}
            accessibilityLabel={`Thức ${item.order}: ${item.nameHanViet}`}
          >
            <Card.Content style={styles.rowContent}>
              <View style={[styles.thumb, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(14,122,95,0.08)' }]}>
                <PoseIllustration name={item.thumbnail} size={54} color={theme.dark ? '#4CC7A4' : '#0E7A5F'} accent={theme.colors.secondary} />
              </View>
              <View style={styles.rowText}>
                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                  Thức {item.order}
                </Text>
                <Text variant="titleMedium" style={{ fontSize: 16 * fontScale }}>
                  {item.nameHanViet}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 * fontScale }}>
                  {item.nameVi}
                </Text>
              </View>
              {item.hasSafetyNote ? <Text style={styles.safety}>⚠️</Text> : null}
            </Card.Content>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 12 },
  intro: { marginBottom: 12 },
  row: {},
  rowContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 60, height: 60, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  safety: { fontSize: 18 },
});
