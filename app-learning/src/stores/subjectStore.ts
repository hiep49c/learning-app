/**
 * subjectStore — manages which subject (Java/English) the user is currently studying.
 * Persists selection in AsyncStorage.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubjectId = 'java' | 'english';

interface SubjectState {
  currentSubject: SubjectId;
  isLoaded: boolean;
}

interface SubjectActions {
  setSubject: (subject: SubjectId) => Promise<void>;
  loadSubject: () => Promise<void>;
}

const SUBJECT_KEY = '@current_subject';

export const useSubjectStore = create<SubjectState & SubjectActions>()(
  immer((set) => ({
    currentSubject: 'english',
    isLoaded: false,

    setSubject: async (subject: SubjectId): Promise<void> => {
      await AsyncStorage.setItem(SUBJECT_KEY, subject);
      set((s) => { s.currentSubject = subject; });
    },

    loadSubject: async (): Promise<void> => {
      const stored = await AsyncStorage.getItem(SUBJECT_KEY);
      set((s) => {
        s.currentSubject = stored === 'java' ? 'java' : 'english';
        s.isLoaded = true;
      });
    },
  })),
);
