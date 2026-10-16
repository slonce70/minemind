import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const { createJSONStorage, persist } = require('zustand/middleware') as typeof import('zustand/middleware');

import {
  addDemoParticipants,
  createOfflineRoom,
  joinOfflineRoom,
  startOfflineRoom,
  toggleLocalReady,
} from '../features/rooms/demo-room-service';
import type { ClassroomSession } from '../features/classroom/types';
import { createDefaultRoomMatchSettings } from '../features/rooms/room-match-settings';
import type { ActiveRoom, ActiveRoomRound } from '../features/rooms/types';
import type { ContentDifficulty } from '../features/content/types';
import type { MatchRecord } from '../features/results/match-record';
import { defaultAppLocale, type AppLocale } from '../lib/locale';
import { migratePersistedAppState } from './app-store-migration';

export type AppSettings = {
  haptics: boolean;
  music: boolean;
  sound: boolean;
};

export const defaultAppSettings: AppSettings = { haptics: true, music: true, sound: true };

export type GuestProfile = {
  avatarId: string;
  locale: AppLocale;
  nickname: string;
};

function withRoomSettings(room: ActiveRoom, difficulty: ContentDifficulty): ActiveRoom {
  return {
    ...room,
    difficulty,
    settings: room.settings ?? createDefaultRoomMatchSettings(difficulty),
  };
}

type AppState = {
  activeRoom?: ActiveRoom;
  activeRoomRound?: ActiveRoomRound;
  addDemoPlayersToRoom: () => void;
  classroomSession?: ClassroomSession;
  clearActiveRound: () => void;
  clearClassroomSession: () => void;
  completeOnboarding: (profile: GuestProfile) => void;
  createRoom: () => void;
  hasHydrated: boolean;
  joinRoom: (roomCode: string) => void;
  lastMatchId?: string;
  leaveRoom: () => void;
  locale: AppLocale;
  profile?: GuestProfile;
  recentMatches: MatchRecord[];
  resetProfile: () => void;
  saveMatchRecord: (record: MatchRecord) => void;
  setClassroomSession: (session?: ClassroomSession) => void;
  setActiveRoom: (room?: ActiveRoom) => void;
  setActiveRoomRound: (round?: ActiveRoomRound) => void;
  setHasHydrated: (value: boolean) => void;
  setSelectedDifficulty: (difficulty: ContentDifficulty) => void;
  /** Device preferences: survive a profile reset. */
  settings: AppSettings;
  startRoomBattle: () => void;
  toggleRoomReady: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  selectedDifficulty: ContentDifficulty;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeRoom: undefined,
      activeRoomRound: undefined,
      addDemoPlayersToRoom: () =>
        set((state) => ({
          activeRoom: state.activeRoom ? addDemoParticipants(state.activeRoom) : state.activeRoom,
        })),
      classroomSession: undefined,
      clearActiveRound: () => set({ activeRoomRound: undefined }),
      clearClassroomSession: () => set({ activeRoomRound: undefined, classroomSession: undefined }),
      completeOnboarding: (profile) =>
        set({
          locale: profile.locale,
          profile,
        }),
      createRoom: () =>
        set((state) => ({
          activeRoom:
            state.profile
              ? withRoomSettings(
                  createOfflineRoom(state.profile),
                  state.selectedDifficulty
                )
              : state.activeRoom,
        })),
      hasHydrated: false,
      joinRoom: (roomCode) =>
        set((state) => ({
          activeRoom:
            state.profile && roomCode.trim()
              ? withRoomSettings(
                  joinOfflineRoom(state.profile, roomCode),
                  state.selectedDifficulty
                )
              : state.activeRoom,
        })),
      lastMatchId: undefined,
      leaveRoom: () => set({ activeRoom: undefined, activeRoomRound: undefined }),
      locale: defaultAppLocale,
      profile: undefined,
      recentMatches: [],
      selectedDifficulty: 'medium',
      settings: defaultAppSettings,
      resetProfile: () =>
        set({
          activeRoom: undefined,
          activeRoomRound: undefined,
          classroomSession: undefined,
          lastMatchId: undefined,
          locale: defaultAppLocale,
          profile: undefined,
          recentMatches: [],
          selectedDifficulty: 'medium',
        }),
      saveMatchRecord: (record) =>
        set((state) => ({
          lastMatchId: record.id,
          recentMatches: [record, ...state.recentMatches.filter((entry) => entry.id !== record.id)].slice(0, 20),
        })),
      setActiveRoom: (activeRoom) => set({ activeRoom }),
      setActiveRoomRound: (activeRoomRound) => set({ activeRoomRound }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setSelectedDifficulty: (selectedDifficulty) =>
        set((state) => ({
          activeRoom:
            state.activeRoom && state.activeRoom.status !== 'active'
              ? {
                  ...state.activeRoom,
                  difficulty: selectedDifficulty,
                  settings: {
                    ...state.activeRoom.settings,
                    difficulty: selectedDifficulty,
                  },
                }
              : state.activeRoom,
          selectedDifficulty,
        })),
      startRoomBattle: () =>
        set((state) => ({
          activeRoom:
            state.activeRoom
              ? withRoomSettings(
                  startOfflineRoom(state.activeRoom),
                  state.activeRoom.settings?.difficulty ?? state.selectedDifficulty
                )
              : state.activeRoom,
        })),
      toggleRoomReady: () =>
        set((state) => ({
          activeRoom: state.activeRoom ? toggleLocalReady(state.activeRoom) : state.activeRoom,
        })),
      setClassroomSession: (classroomSession) => set({ classroomSession }),
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
    }),
    {
      migrate: migratePersistedAppState,
      name: 'minemind-store',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        activeRoom: state.activeRoom,
        activeRoomRound: state.activeRoomRound,
        classroomSession: state.classroomSession,
        lastMatchId: state.lastMatchId,
        locale: state.locale,
        profile: state.profile,
        recentMatches: state.recentMatches,
        selectedDifficulty: state.selectedDifficulty,
        settings: state.settings,
      }),
      storage: createJSONStorage(() => AsyncStorage),
      version: 5,
    }
  )
);
