import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Text, useTheme } from 'react-native-paper';
import { FORMS } from '@/data';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { PoseIllustration } from '@/components/PoseIllustration';

export default function BookmarksScreen() {
  const router = useRouter();
  const theme = useTheme();
  const ids = useBookmarkStore((s) => s.ids);
  const items = FORMS.filter((f) => ids.includes(f.id));

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium">Chưa có thức nào được lưu</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' }}>
          Mở một thức và nhấn biểu tượng dấu trang để lưu lại đây.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(f) => f.id}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item }) => (
        <Card mode="outlined" onPress={() => router.push(`/form/${item.id}`)}>
          <Card.Content style={styles.row}>
            <View style={[styles.thumb, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(14,122,95,0.08)' }]}>
              <PoseIllustration name={item.thumbnail} size={48} color={theme.dark ? '#4CC7A4' : '#0E7A5F'} accent={theme.colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="labelSmall" style={{ color: theme.colors.primary }}>Thức {item.order}</Text>
              <Text variant="titleMedium">{item.nameHanViet}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{item.nameVi}</Text>
            </View>
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 54, height: 54, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
