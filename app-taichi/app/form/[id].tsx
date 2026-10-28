import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Appbar, Button, FAB, Text, useTheme } from 'react-native-paper';
import { getFormById, FORMS } from '@/data';
import { ContentRenderer } from '@/components/ContentRenderer';
import { TTSControls } from '@/components/TTSControls';
import { extractFormText } from '@/utils/extractFormText';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useSettingsStore } from '@/stores/settingsStore';

export default function FormDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const fontScale = useSettingsStore((s) => s.fontScale);
  const { has, toggle } = useBookmarkStore();
  const bookmarked = id ? has(id) : false;
  const [ttsOpen, setTtsOpen] = useState(false);

  const form = id ? getFormById(id) : undefined;

  useLayoutEffect(() => {
    navigation.setOptions({ title: form ? `Thức ${form.order}` : '' });
  }, [navigation, form]);

  if (!form) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy thức.</Text>
      </View>
    );
  }

  const prev = FORMS.find((f) => f.order === form.order - 1);
  const next = FORMS.find((f) => f.order === form.order + 1);
  const ttsText = extractFormText(form.sections);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction color="#fff" onPress={() => router.back()} />
        <Appbar.Content title={`Thức ${form.order}`} color="#fff" />
        <Appbar.Action
          icon={bookmarked ? 'bookmark' : 'bookmark-outline'}
          color="#fff"
          onPress={() => toggle(form.id)}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <ContentRenderer sections={form.sections} fontScale={fontScale} />

        <View style={styles.nav}>
          <Button
            mode="outlined"
            icon="chevron-left"
            disabled={!prev}
            onPress={() => prev && router.replace(`/form/${prev.id}`)}
            style={styles.navBtn}
          >
            {prev ? `Thức ${prev.order}` : 'Đầu bài'}
          </Button>
          <Button
            mode="contained"
            icon="chevron-right"
            contentStyle={{ flexDirection: 'row-reverse' }}
            disabled={!next}
            onPress={() => next && router.replace(`/form/${next.id}`)}
            style={styles.navBtn}
          >
            {next ? `Thức ${next.order}` : 'Cuối bài'}
          </Button>
        </View>
      </ScrollView>

      {ttsOpen ? (
        <TTSControls text={ttsText} onClose={() => setTtsOpen(false)} />
      ) : (
        <FAB icon="volume-high" label="Đọc bài" style={styles.fab} onPress={() => setTtsOpen(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 96 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 24 },
  navBtn: { flex: 1 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
