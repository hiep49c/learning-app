/**
 * AuthStore — manages local authentication with profile selection and optional PIN.
 *
 * Uses Zustand with immer middleware. PIN hashing via expo-crypto SHA-256.
 * Persists @current_user_id in AsyncStorage for session restore.
 *
 * Requirements: 1.3
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';

import { database } from '@/database';
import type UserProfile from '@/database/models/UserProfile';

// ─── Constants ───

const CURRENT_USER_KEY = '@current_user_id';

// ─── Types ───

export interface UserProfileData {
  id: string;
  name: string;
  avatarIndex: number;
  pinHash: string | null;
  createdAt: Date;
}

interface AuthState {
  currentUser: UserProfileData | null;
  profiles: UserProfileData[];
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (profileId: string, pin?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  createProfile: (name: string, pin?: string) => Promise<UserProfileData>;
  deleteProfile: (profileId: string) => Promise<void>;
  loadProfiles: () => Promise<void>;
}

// ─── Helpers ───

function toProfileData(record: UserProfile): UserProfileData {
  return {
    id: record.id,
    name: record.name,
    avatarIndex: record.avatarIndex,
    pinHash: record.pinHash,
    createdAt: record.createdAt,
  };
}

async function hashPin(pin: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, pin);
}

// ─── Store ───

export const useAuthStore = create<AuthState & AuthActions>()(
  immer((set, get) => ({
    // State
    currentUser: null,
    profiles: [],
    isAuthenticated: false,

    // Actions
    login: async (profileId: string, pin?: string): Promise<boolean> => {
      try {
        const profile = get().profiles.find((p) => p.id === profileId);
        if (!profile) return false;

        // Verify PIN if profile has one
        if (profile.pinHash) {
          if (!pin) return false;
          const inputHash = await hashPin(pin);
          if (inputHash !== profile.pinHash) return false;
        }

        await AsyncStorage.setItem(CURRENT_USER_KEY, profileId);

        set((state) => {
          state.currentUser = profile;
          state.isAuthenticated = true;
        });

        return true;
      } catch (error) {
        console.error('[AuthStore] login failed:', error);
        return false;
      }
    },

    logout: async (): Promise<void> => {
      try {
        await AsyncStorage.removeItem(CURRENT_USER_KEY);
        await AsyncStorage.setItem('@explicit_logout', 'true');

        set((state) => {
          state.currentUser = null;
          state.isAuthenticated = false;
        });
      } catch (error) {
        console.error('[AuthStore] logout failed:', error);
      }
    },

    createProfile: async (
      name: string,
      pin?: string,
    ): Promise<UserProfileData> => {
      const pinHash = pin ? await hashPin(pin) : null;

      const collection = database.get<UserProfile>('user_profiles');
      let created: UserProfile | undefined;

      await database.write(async () => {
        created = await collection.create((record) => {
          record.name = name;
          record.avatarIndex = Math.floor(Math.random() * 10);
          const raw = record._raw as Record<string, unknown>;
          raw.pin_hash = pinHash;
        });
      });

      const profileData = toProfileData(created!);

      set((state) => {
        state.profiles.push(profileData);
      });

      return profileData;
    },

    deleteProfile: async (profileId: string): Promise<void> => {
      try {
        const record = await database
          .get<UserProfile>('user_profiles')
          .find(profileId);

        await database.write(async () => {
          await record.markAsDeleted();
        });

        set((state) => {
          state.profiles = state.profiles.filter((p) => p.id !== profileId);
          if (state.currentUser?.id === profileId) {
            state.currentUser = null;
            state.isAuthenticated = false;
          }
        });

        // Clear persisted user if it was the deleted profile
        const storedId = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (storedId === profileId) {
          await AsyncStorage.removeItem(CURRENT_USER_KEY);
        }
      } catch (error) {
        console.error('[AuthStore] deleteProfile failed:', error);
      }
    },

    loadProfiles: async (): Promise<void> => {
      try {
        const records = await database
          .get<UserProfile>('user_profiles')
          .query()
          .fetch();

        const profiles = records.map(toProfileData);

        // Restore session from persisted user ID
        const storedId = await AsyncStorage.getItem(CURRENT_USER_KEY);
        const restoredUser = storedId
          ? profiles.find((p) => p.id === storedId) ?? null
          : null;

        set((state) => {
          state.profiles = profiles;
          state.currentUser = restoredUser;
          state.isAuthenticated = restoredUser !== null;
        });
      } catch (error) {
        console.error('[AuthStore] loadProfiles failed:', error);
      }
    },
  })),
);
