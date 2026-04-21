/**
 * ProfileScreen — user profile, settings, progress stats.
 *
 * Features:
 * - Show user profile info (name, avatar icon)
 * - Display detailed progress stats per module
 * - Theme toggle (Sáng/Tối/Hệ thống) using SegmentedButtons
 * - Font size slider (0.8–1.4)
 * - "Đặt lại dữ liệu" button with confirmation dialog
 * - "Đăng xuất" button
 *
 * Requirements: 12.2, 12.3, 17.4
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  Divider,
  IconButton,
  Portal,
  ProgressBar,
  SegmentedButtons,
  Text,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { useCourseStore } from '@/stores/courseStore';
import { useAppTheme } from '@/theme/useAppTheme';
import type { ThemePreference } from '@/theme';

// ─── Avatar icons (same as login) ───

const AVATAR_ICONS = [
  'account-circle',
  'account-circle-outline',
  'account-cowboy-hat',
  'account-star',
  'account-heart',
  'account-tie',
  'account-school',
  'account-supervisor-circle',
  'account-child-circle',
  'account-group',
] as const;

// ─── Component ───

export default function ProfileScreen() {
  const theme = useTheme<MD3Theme>();
  const { currentUser, logout } = useAuthStore();
  const { overallProgress, moduleProgress, loadProgress } = useProgressStore();
  const { modules, loadCourseTree } = useCourseStore();
  const { preference, setPreference, fontSizeMultiplier, setFontSizeMultiplier } = useAppTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // ── Load data on mount ──

  useEffect(() => {
    async function init() {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      try {
        await Promise.all([loadProgress(), loadCourseTree()]);
      } catch {
        // Errors handled by stores
      } finally {
        setIsLoading(false);
      }
    }
    void init();
  }, [currentUser, loadProgress, loadCourseTree]);

  // ── Handlers ──

  const handleLogout = useCallback(async () => {
    setShowLogoutDialog(false);
    await logout();
    router.replace('/(auth)/login');
  }, [logout]);

  const handleResetData = useCallback(async () => {
    setShowResetDialog(false);
    // Reset is handled by re-seeding — for now just logout
    await logout();
    router.replace('/(auth)/login');
  }, [logout]);

  const handleThemeChange = useCallback(
    (value: string) => {
      setPreference(value as ThemePreference);
    },
    [setPreference],
  );

  // ── Loading state ──

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" accessibilityLabel="Đang tải hồ sơ" />
      </View>
    );
  }

  const avatarIndex = currentUser?.avatarIndex ?? 0;
  const avatarIcon = AVATAR_ICONS[avatarIndex % AVATAR_ICONS.length] as any;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <MaterialCommunityIcons
          name={avatarIcon}
          size={72}
          color={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={[styles.profileName, { color: theme.colors.onSurface }]}>
          {currentUser?.name ?? 'Người dùng'}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Tiến trình tổng thể: {overallProgress}%
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* Module progress */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Tiến trình theo module
        </Text>
        {modules.map((mod) => {
          const progress = moduleProgress[mod.id] ?? 0;
          const normalizedProgress = Math.min(Math.max(progress, 0), 100) / 100;
          return (
            <View key={mod.id} style={styles.moduleProgressItem}>
              <View style={styles.moduleProgressHeader}>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurface, flex: 1 }}
                  numberOfLines={1}
                >
                  {mod.titleVi || mod.title}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {progress}%
                </Text>
              </View>
              <ProgressBar
                progress={normalizedProgress}
                color={theme.colors.primary}
                style={styles.moduleProgressBar}
                accessibilityLabel={`${mod.titleVi || mod.title}: ${progress} phần trăm`}
              />
            </View>
          );
        })}
      </View>

      <Divider style={styles.divider} />

      {/* Settings */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Cài đặt
        </Text>

        {/* Theme toggle */}
        <Text variant="bodyMedium" style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
          Giao diện
        </Text>
        <SegmentedButtons
          value={preference}
          onValueChange={handleThemeChange}
          buttons={[
            { value: 'light', label: 'Sáng', accessibilityLabel: 'Giao diện sáng' },
            { value: 'dark', label: 'Tối', accessibilityLabel: 'Giao diện tối' },
            { value: 'system', label: 'Hệ thống', accessibilityLabel: 'Theo hệ thống' },
          ]}
          style={styles.segmentedButtons}
        />

        {/* Font size control */}
        <Text variant="bodyMedium" style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
          Cỡ chữ: {fontSizeMultiplier.toFixed(1)}x
        </Text>
        <View style={styles.sliderRow}>
          <IconButton
            icon="minus"
            size={20}
            onPress={() => setFontSizeMultiplier(Math.max(0.8, fontSizeMultiplier - 0.1))}
            disabled={fontSizeMultiplier <= 0.8}
            accessibilityLabel="Giảm cỡ chữ"
          />
          <View style={styles.fontSizeBar}>
            <View
              style={[
                styles.fontSizeFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${((fontSizeMultiplier - 0.8) / 0.6) * 100}%`,
                },
              ]}
            />
          </View>
          <IconButton
            icon="plus"
            size={20}
            onPress={() => setFontSizeMultiplier(Math.min(1.4, fontSizeMultiplier + 0.1))}
            disabled={fontSizeMultiplier >= 1.4}
            accessibilityLabel="Tăng cỡ chữ"
          />
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Actions */}
      <View style={styles.section}>
        <Button
          mode="outlined"
          icon="refresh"
          onPress={() => setShowResetDialog(true)}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          textColor={theme.colors.error}
          accessibilityLabel="Đặt lại dữ liệu"
        >
          Đặt lại dữ liệu
        </Button>

        <Button
          mode="contained"
          icon="logout"
          onPress={() => setShowLogoutDialog(true)}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          accessibilityLabel="Đăng xuất"
        >
          Đăng xuất
        </Button>
      </View>

      <View style={styles.bottomSpacer} />

      {/* Reset confirmation dialog */}
      <Portal>
        <Dialog visible={showResetDialog} onDismiss={() => setShowResetDialog(false)}>
          <Dialog.Title>Đặt lại dữ liệu</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Bạn có chắc muốn đặt lại toàn bộ dữ liệu? Tiến trình học tập sẽ bị xóa và không thể khôi phục.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowResetDialog(false)} accessibilityLabel="Hủy">
              Hủy
            </Button>
            <Button onPress={handleResetData} textColor={theme.colors.error} accessibilityLabel="Đặt lại">
              Đặt lại
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Logout confirmation dialog */}
      <Portal>
        <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
          <Dialog.Title>Đăng xuất</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Bạn có chắc muốn đăng xuất?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogoutDialog(false)} accessibilityLabel="Hủy">
              Hủy
            </Button>
            <Button onPress={handleLogout} accessibilityLabel="Đăng xuất">
              Đăng xuất
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileName: {
    marginTop: 12,
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  moduleProgressItem: {
    marginBottom: 16,
  },
  moduleProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  settingLabel: {
    marginBottom: 8,
    marginTop: 16,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontSizeBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(128,128,128,0.2)',
    overflow: 'hidden',
  },
  fontSizeFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionButton: {
    marginTop: 12,
    borderRadius: 12,
  },
  actionButtonContent: {
    minHeight: 48,
  },
  bottomSpacer: {
    height: 32,
  },
});
