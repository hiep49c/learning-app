/**
 * LoginScreen — local profile selection with optional PIN and profile creation.
 *
 * Features:
 * - Profile selection list with avatar icons
 * - Optional PIN entry with shake animation on wrong PIN
 * - Max 5 attempts then 30s cooldown
 * - "Tạo hồ sơ mới" button for creating new profiles
 * - Auto-login if single profile with no PIN
 *
 * Requirements: 1.3
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  IconButton,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';
import type { UserProfileData } from '@/stores/authStore';

// ─── Constants ───

const MAX_PIN_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

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

export default function LoginScreen() {
  const theme = useTheme<MD3Theme>();
  const { profiles, loadProfiles, login, createProfile } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UserProfileData | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load profiles on mount ──

  useEffect(() => {
    async function init() {
      await loadProfiles();
      setIsLoading(false);
    }
    void init();
  }, [loadProfiles]);

  // ── Auto-login: single profile with no PIN ──

  useEffect(() => {
    if (isLoading) return;
    if (profiles.length === 1 && profiles[0]!.pinHash === null) {
      void handleLogin(profiles[0]!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, profiles]);

  // ── Cleanup cooldown timer ──

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
      }
    };
  }, []);

  // ── Cooldown logic ──

  const startCooldown = useCallback(() => {
    setCooldownRemaining(COOLDOWN_SECONDS);
    cooldownTimer.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          if (cooldownTimer.current) {
            clearInterval(cooldownTimer.current);
            cooldownTimer.current = null;
          }
          setAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── Shake animation ──

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // ── Login handler ──

  const handleLogin = useCallback(
    async (profile: UserProfileData, enteredPin?: string) => {
      const success = await login(profile.id, enteredPin);
      if (success) {
        router.replace('/(tabs)');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPinError(`Mã PIN không đúng (${newAttempts}/${MAX_PIN_ATTEMPTS})`);
        setPin('');
        triggerShake();

        if (newAttempts >= MAX_PIN_ATTEMPTS) {
          startCooldown();
        }
      }
    },
    [login, attempts, triggerShake, startCooldown],
  );

  // ── Profile selection ──

  const handleSelectProfile = useCallback(
    (profile: UserProfileData) => {
      if (profile.pinHash === null) {
        void handleLogin(profile);
      } else {
        setSelectedProfile(profile);
        setPin('');
        setPinError('');
        setAttempts(0);
      }
    },
    [handleLogin],
  );

  // ── PIN submit ──

  const handlePinSubmit = useCallback(() => {
    if (!selectedProfile || pin.length === 0 || cooldownRemaining > 0) return;
    void handleLogin(selectedProfile, pin);
  }, [selectedProfile, pin, cooldownRemaining, handleLogin]);

  // ── Create profile ──

  const handleCreateProfile = useCallback(async () => {
    const trimmedName = newName.trim();
    if (trimmedName.length === 0) return;

    setIsCreating(true);
    try {
      const profile = await createProfile(
        trimmedName,
        newPin.length > 0 ? newPin : undefined,
      );
      setShowCreateDialog(false);
      setNewName('');
      setNewPin('');
      void handleLogin(profile, newPin.length > 0 ? newPin : undefined);
    } catch {
      // Error handled by store
    } finally {
      setIsCreating(false);
    }
  }, [newName, newPin, createProfile, handleLogin]);

  // ── Render avatar ──

  const renderAvatar = useCallback(
    (avatarIndex: number, size: number) => {
      const iconName = AVATAR_ICONS[avatarIndex % AVATAR_ICONS.length] as any;
      return (
        <MaterialCommunityIcons
          name={iconName}
          size={size}
          color={theme.colors.primary}
        />
      );
    },
    [theme.colors.primary],
  );

  // ── Render profile item ──

  const renderProfileItem = useCallback(
    ({ item }: { item: UserProfileData }) => (
      <Card
        style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleSelectProfile(item)}
        accessibilityLabel={`Hồ sơ ${item.name}`}
        accessibilityRole="button"
      >
        <View style={styles.profileRow}>
          {renderAvatar(item.avatarIndex, 48)}
          <View style={styles.profileInfo}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {item.name}
            </Text>
            {item.pinHash !== null && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Có mã PIN
              </Text>
            )}
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      </Card>
    ),
    [theme, handleSelectProfile, renderAvatar],
  );

  // ── Loading state ──

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" accessibilityLabel="Đang tải" />
      </View>
    );
  }

  // ── PIN entry view ──

  if (selectedProfile !== null) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.pinContainer}>
          {renderAvatar(selectedProfile.avatarIndex, 72)}
          <Text variant="headlineSmall" style={[styles.pinTitle, { color: theme.colors.onSurface }]}>
            {selectedProfile.name}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 24 }}>
            Nhập mã PIN để đăng nhập
          </Text>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
            <TextInput
              label="Mã PIN"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="numeric"
              onSubmitEditing={handlePinSubmit}
              disabled={cooldownRemaining > 0}
              error={pinError.length > 0}
              style={styles.pinInput}
              accessibilityLabel="Nhập mã PIN"
              autoFocus
            />
          </Animated.View>

          {pinError.length > 0 && (
            <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
              {pinError}
            </Text>
          )}

          {cooldownRemaining > 0 && (
            <Text variant="bodyMedium" style={[styles.cooldownText, { color: theme.colors.error }]}>
              Vui lòng chờ {cooldownRemaining}s trước khi thử lại
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handlePinSubmit}
            disabled={pin.length === 0 || cooldownRemaining > 0}
            style={styles.pinButton}
            accessibilityLabel="Đăng nhập"
          >
            Đăng nhập
          </Button>

          <Button
            mode="text"
            onPress={() => {
              setSelectedProfile(null);
              setPin('');
              setPinError('');
              setAttempts(0);
            }}
            style={styles.backButton}
            accessibilityLabel="Quay lại chọn hồ sơ"
          >
            Quay lại
          </Button>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Profile list view ──

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
          Chọn hồ sơ
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          Chọn hồ sơ để bắt đầu học
        </Text>
      </View>

      {profiles.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="account-plus"
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}
          >
            Chưa có hồ sơ nào. Tạo hồ sơ mới để bắt đầu!
          </Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          renderItem={renderProfileItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Button
        mode="contained"
        icon="plus"
        onPress={() => setShowCreateDialog(true)}
        style={styles.createButton}
        contentStyle={styles.createButtonContent}
        accessibilityLabel="Tạo hồ sơ mới"
      >
        Tạo hồ sơ mới
      </Button>

      {/* Create Profile Dialog */}
      <Portal>
        <Dialog
          visible={showCreateDialog}
          onDismiss={() => {
            setShowCreateDialog(false);
            setNewName('');
            setNewPin('');
          }}
        >
          <Dialog.Title>Tạo hồ sơ mới</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Tên"
              value={newName}
              onChangeText={setNewName}
              style={styles.dialogInput}
              accessibilityLabel="Nhập tên hồ sơ"
              autoFocus
            />
            <TextInput
              label="Mã PIN (tùy chọn)"
              value={newPin}
              onChangeText={setNewPin}
              secureTextEntry
              keyboardType="numeric"
              style={styles.dialogInput}
              accessibilityLabel="Nhập mã PIN tùy chọn"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowCreateDialog(false);
                setNewName('');
                setNewPin('');
              }}
              accessibilityLabel="Hủy"
            >
              Hủy
            </Button>
            <Button
              onPress={handleCreateProfile}
              disabled={newName.trim().length === 0 || isCreating}
              loading={isCreating}
              accessibilityLabel="Tạo hồ sơ"
            >
              Tạo
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 48,
  },
  listContent: {
    paddingBottom: 16,
    width: '100%',
  },
  profileCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 72,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  createButton: {
    marginVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  createButtonContent: {
    minHeight: 48,
  },
  pinContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: 16,
  },
  pinTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  pinInput: {
    width: '100%',
    marginBottom: 8,
  },
  errorText: {
    marginTop: 4,
    marginBottom: 8,
  },
  cooldownText: {
    marginTop: 8,
    marginBottom: 8,
  },
  pinButton: {
    marginTop: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  backButton: {
    marginTop: 12,
  },
  dialogInput: {
    marginBottom: 12,
  },
});
