import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  addDemoParticipants,
  createOfflineRoom,
  joinOfflineRoom,
  startOfflineRoom,
  toggleLocalReady,
} from '../features/rooms/demo-room-service';
import type { ActiveRoom, ActiveRoomRound } from '../features/rooms/types';
import { getDeviceLocale, type AppLocale } from '../lib/locale';
import type { QuizResultSummary } from '../features/quiz/types';

export type GuestProfile = {
  avatarId: string;
  locale: AppLocale;
  nickname: string;
};

type AppState = {
  activeRoom?: ActiveRoom;
  activeRoomRound?: ActiveRoomRound;
  addDemoPlayersToRoom: () => void;
  clearActiveRound: () => void;
  completeOnboarding: (profile: GuestProfile) => void;
  createRoom: () => void;
  hasHydrated: boolean;
  joinRoom: (roomCode: string) => void;
  lastResult?: QuizResultSummary;
  leaveRoom: () => void;
  locale: AppLocale;
  profile?: GuestProfile;
  resetProfile: () => void;
  saveLastResult: (result: QuizResultSummary) => void;
  setActiveRoom: (room?: ActiveRoom) => void;
  setActiveRoomRound: (round?: ActiveRoomRound) => void;
  setHasHydrated: (value: boolean) => void;
  startRoomBattle: () => void;
  toggleRoomReady: () => void;
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
      clearActiveRound: () => set({ activeRoomRound: undefined }),
      completeOnboarding: (profile) =>
        set({
          locale: profile.locale,
          profile,
        }),
      createRoom: () =>
        set((state) => ({
          activeRoom: state.profile ? createOfflineRoom(state.profile) : state.activeRoom,
        })),
      hasHydrated: false,
      joinRoom: (roomCode) =>
        set((state) => ({
          activeRoom:
            state.profile && roomCode.trim()
              ? joinOfflineRoom(state.profile, roomCode)
              : state.activeRoom,
        })),
      lastResult: undefined,
      leaveRoom: () => set({ activeRoom: undefined, activeRoomRound: undefined }),
      locale: getDeviceLocale(),
      profile: undefined,
      resetProfile: () =>
        set({
          activeRoom: undefined,
          activeRoomRound: undefined,
          lastResult: undefined,
          profile: undefined,
        }),
      saveLastResult: (lastResult) => set({ lastResult }),
      setActiveRoom: (activeRoom) => set({ activeRoom }),
      setActiveRoomRound: (activeRoomRound) => set({ activeRoomRound }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      startRoomBattle: () =>
        set((state) => ({
          activeRoom: state.activeRoom ? startOfflineRoom(state.activeRoom) : state.activeRoom,
        })),
      toggleRoomReady: () =>
        set((state) => ({
          activeRoom: state.activeRoom ? toggleLocalReady(state.activeRoom) : state.activeRoom,
        })),
    }),
    {
      name: 'minemind-store',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        activeRoom: state.activeRoom,
        activeRoomRound: state.activeRoomRound,
        lastResult: state.lastResult,
        locale: state.locale,
        profile: state.profile,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
