import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Searchbar, Card, Text, useTheme } from 'react-native-paper';
import { FORMS } from '@/data';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export default function SearchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return FORMS;
    return FORMS.filter((f) =>
      [f.nameHanViet, f.nameVi, f.namePinyin, f.nameEn, f.summary]
        .map(normalize)
        .some((field) => field.includes(q)),
    );
  }, [query]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Searchbar
        placeholder="Tìm theo tên thức..."
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
      <FlatList
        data={results}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 32, color: theme.colors.onSurfaceVariant }}>
            Không tìm thấy thức phù hợp.
          </Text>
        }
        renderItem={({ item }) => (
          <Card mode="outlined" onPress={() => router.push(`/form/${item.id}`)}>
            <Card.Content>
              <Text variant="labelSmall" style={{ color: theme.colors.primary }}>Thức {item.order}</Text>
              <Text variant="titleMedium">{item.nameHanViet}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{item.nameVi}</Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { margin: 12 },
  list: { paddingHorizontal: 12, paddingBottom: 12 },
});
