import React from 'react';
import { ScrollView, StyleSheet, View, Linking } from 'react-native';
import { List, SegmentedButtons, Text, useTheme, Divider, Button } from 'react-native-paper';
import { useSettingsStore } from '@/stores/settingsStore';
import { CANONICAL_SOURCE, youtubeSearchUrl, FULL_FORM_QUERY } from '@/data';

export default function SettingsScreen() {
  const theme = useTheme();
  const { themeMode, setThemeMode, fontScale, setFontScale } = useSettingsStore();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
      <List.Section>
        <List.Subheader>Giao diện</List.Subheader>
        <View style={styles.block}>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(v) => setThemeMode(v as 'light' | 'dark' | 'system')}
            buttons={[
              { value: 'light', label: 'Sáng', icon: 'white-balance-sunny' },
              { value: 'dark', label: 'Tối', icon: 'moon-waning-crescent' },
              { value: 'system', label: 'Hệ thống', icon: 'theme-light-dark' },
            ]}
          />
        </View>
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Cỡ chữ</List.Subheader>
        <View style={styles.block}>
          <SegmentedButtons
            value={String(fontScale)}
            onValueChange={(v) => setFontScale(Number(v))}
            buttons={[
              { value: '0.9', label: 'Nhỏ' },
              { value: '1', label: 'Vừa' },
              { value: '1.2', label: 'Lớn' },
              { value: '1.4', label: 'Rất lớn' },
            ]}
          />
          <Text style={{ marginTop: 12, fontSize: 16 * fontScale, color: theme.colors.onSurface }}>
            Xem trước cỡ chữ nội dung bài học.
          </Text>
        </View>
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Video & nguồn</List.Subheader>
        <View style={styles.block}>
          <Button mode="outlined" icon="youtube" onPress={() => Linking.openURL(youtubeSearchUrl(FULL_FORM_QUERY))}>
            Xem toàn bài 24 thức (YouTube)
          </Button>
          <Button
            mode="text"
            icon="information"
            style={{ marginTop: 8 }}
            onPress={() => Linking.openURL(CANONICAL_SOURCE.url)}
          >
            Nguồn tên thức: {CANONICAL_SOURCE.name}
          </Button>
        </View>
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Lưu ý an toàn</List.Subheader>
        <View style={styles.block}>
          <Text style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
            Nội dung trong app mang tính tham khảo, không thay thế việc học trực tiếp với võ sư.
            Hãy khởi động kỹ, tập chậm, và dừng lại nếu thấy đau khớp. Người lớn tuổi hoặc có bệnh
            lý nên tham khảo ý kiến chuyên môn trước khi tập.
          </Text>
        </View>
      </List.Section>

      <Text style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>
        Thái Cực Quyền 24 Thức — v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  block: { paddingHorizontal: 16, paddingBottom: 8 },
  version: { textAlign: 'center', marginTop: 24, fontSize: 12 },
});
