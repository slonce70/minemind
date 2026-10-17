import { useCallback, useEffect, useRef, useState } from 'react';

import { ensureGuestSession } from '../profile/profile-service';
import { useAppStore } from '../../state/app-store';
import { isDemoPlayersEnabled } from '../../lib/dev-flags';
import { isSupabaseConfigured } from '../../lib/supabase';
import { createDemoRoomRound } from './live-room-service';
import { getSoloQuestionSet } from '../quiz/quiz-service';
import { canStartOfflineRoom } from './demo-room-service';
import { createDefaultRoomMatchSettings, type RoomMatchSettings } from './room-match-settings';
import { useRoomChannel } from './use-room-channel';
import {
  createLiveRoom,
  joinLiveRoom,
  leaveLiveRoom,
  refreshLiveRoom,
  resumeLiveRoomRound,
  startLiveRoomRound,
  updateLiveRoomSettings,
  updateLiveReadyState,
} from './live-room-service';

export { deriveRoomLobbyState } from './room-lobby-state';

const OFFLINE_POLL_INTERVAL_MS = 4000;
const LIVE_POLL_INTERVAL_MS = 30_000;

export function useRoomLobby(messages: { genericError: string; onlineUnavailable: string }) {
  const profile = useAppStore((state) => state.profile);
  const activeRoom = useAppStore((state) => state.activeRoom);
  const activeRoomRound = useAppStore((state) => state.activeRoomRound);
  const createRoom = useAppStore((state) => state.createRoom);
  const joinRoom = useAppStore((state) => state.joinRoom);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const setSelectedDifficulty = useAppStore((state) => state.setSelectedDifficulty);
  const addDemoPlayersToRoom = useAppStore((state) => state.addDemoPlayersToRoom);
  const startRoomBattle = useAppStore((state) => state.startRoomBattle);
  const toggleRoomReady = useAppStore((state) => state.toggleRoomReady);
  const leaveRoom = useAppStore((state) => state.leaveRoom);
  const setActiveRoom = useAppStore((state) => state.setActiveRoom);
  const setActiveRoomRound = useAppStore((state) => state.setActiveRoomRound);
  const clearActiveRound = useAppStore((state) => state.clearActiveRound);
  const [joinCode, setJoinCode] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canResumeRound = Boolean(activeRoomRound && (!isSupabaseConfigured || activeRoom?.roundId));

  const activeRoomCode = activeRoom?.roomCode;
  const lastSyncAtRef = useRef(0);

  const syncRoomState = useCallback(async () => {
    if (!isSupabaseConfigured || !activeRoomCode) {
      return;
    }

    lastSyncAtRef.current = Date.now();

    try {
      const room = await refreshLiveRoom(activeRoomCode);

      // The room may have been left while the request was in flight.
      if (useAppStore.getState().activeRoom?.roomCode !== activeRoomCode) {
        return;
      }

      setActiveRoom(room);

      // Read the round fresh from the store rather than closing over it, so
      // this callback depends only on the stable room code.
      const activeRoomRound = useAppStore.getState().activeRoomRound;

      if ((room.status === 'active' || room.status === 'finalizing') && room.roundId && !activeRoomRound) {
        const resumed = await resumeLiveRoomRound(room.roomCode, useAppStore.getState().locale);

        if (useAppStore.getState().activeRoom?.roomCode !== activeRoomCode) {
          return;
        }

        setActiveRoom(resumed.room);
        setActiveRoomRound(resumed.round);
      }

      if ((room.status === 'lobby' || room.status === 'finished') && activeRoomRound) {
        clearActiveRound();
      }
    } catch {
      return undefined;
    }
  }, [activeRoomCode, clearActiveRound, setActiveRoom, setActiveRoomRound]);

  // Realtime pushes every room change; the database stays the source of truth, so a push
  // just triggers a re-read.
  const roomChannel = useRoomChannel(isSupabaseConfigured ? activeRoom : undefined, () => void syncRoomState());
  const isChannelLive = roomChannel.isLive;

  useEffect(() => {
    if (!isSupabaseConfigured || !activeRoomCode) {
      return undefined;
    }

    void syncRoomState();

    // Fallback polling: fast while realtime is down, a slow safety net while it is up.
    const interval = setInterval(() => {
      const maxAgeMs = isChannelLive ? LIVE_POLL_INTERVAL_MS : OFFLINE_POLL_INTERVAL_MS;

      if (Date.now() - lastSyncAtRef.current >= maxAgeMs) {
        void syncRoomState();
      }
    }, OFFLINE_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [activeRoomCode, isChannelLive, syncRoomState]);

  const handleCreateRoom = async () => {
    if (!profile) {
      return;
    }

    setErrorMessage(null);
    setIsBusy(true);

    try {
      if (isSupabaseConfigured) {
        await ensureGuestSession(profile);
        const settings = createDefaultRoomMatchSettings(selectedDifficulty);
        const room = await createLiveRoom(profile, settings);
        setActiveRoom(room);
        clearActiveRound();
      } else if (isDemoPlayersEnabled) {
        createRoom();
      } else {
        // Release builds without a backend never invent other players.
        setErrorMessage(messages.onlineUnavailable);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : messages.genericError);
    } finally {
      setIsBusy(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!profile || !joinCode.trim()) {
      return;
    }

    setErrorMessage(null);
    setIsBusy(true);

    try {
      if (isSupabaseConfigured) {
        await ensureGuestSession(profile);
        const room = await joinLiveRoom(joinCode);
        setActiveRoom(room);
        clearActiveRound();
      } else if (isDemoPlayersEnabled) {
        joinRoom(joinCode);
      } else {
        setErrorMessage(messages.onlineUnavailable);
        return;
      }

      setJoinCode('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : messages.genericError);
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleReady = async () => {
    if (!activeRoom) {
      return;
    }

    setErrorMessage(null);
    setIsBusy(true);

    try {
      if (isSupabaseConfigured) {
        const localPlayer = activeRoom.participants.find((participant) => participant.isLocalPlayer);
        const room = await updateLiveReadyState(activeRoom, !(localPlayer?.ready ?? true));
        setActiveRoom(room);
      } else {
        toggleRoomReady();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : messages.genericError);
    } finally {
      setIsBusy(false);
    }
  };

  const handleStartBattle = async () => {
    if (canResumeRound) {
      return true;
    }

    if (!activeRoom || !profile) {
      return false;
    }

    if (!canStartOfflineRoom(activeRoom)) {
      return false;
    }

    setErrorMessage(null);
    setIsBusy(true);

    try {
      if (isSupabaseConfigured) {
        await ensureGuestSession(profile);
        const { room, round } =
          activeRoom.status === 'active' && activeRoom.roundId
            ? await resumeLiveRoomRound(activeRoom.roomCode, useAppStore.getState().locale)
            : await startLiveRoomRound(activeRoom, profile);
        setActiveRoom(room);
        setActiveRoomRound(round);
      } else {
        startRoomBattle();
        const matchSettings = activeRoom.settings;
        setActiveRoomRound(
          createDemoRoomRound(
            activeRoom,
            getSoloQuestionSet(
              profile.locale,
              matchSettings.questionCount,
              matchSettings.difficulty ?? selectedDifficulty
            )
          )
        );
      }
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : messages.genericError);
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  /** The host changes match settings before the round (difficulty, big-screen mode). */
  const updateHostSettings = async (patch: Partial<RoomMatchSettings>) => {
    if (!activeRoom || !profile || !isSupabaseConfigured || activeRoom.status === 'active') {
      return;
    }

    const localPlayer = activeRoom.participants.find((participant) => participant.isLocalPlayer);
    if (!localPlayer?.isHost) {
      return;
    }

    setErrorMessage(null);
    setIsBusy(true);

    try {
      await ensureGuestSession(profile);
      const room = await updateLiveRoomSettings(activeRoom, { ...activeRoom.settings, ...patch });
      setActiveRoom(room);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : messages.genericError);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSelectDifficulty = async (difficulty: typeof selectedDifficulty) => {
    setSelectedDifficulty(difficulty);
    await updateHostSettings({ difficulty });
  };

  return {
    activeRoom,
    activeRoomRound,
    addDemoPlayersToRoom: isDemoPlayersEnabled ? addDemoPlayersToRoom : undefined,
    errorMessage,
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom: () => {
      if (isSupabaseConfigured && activeRoom) {
        void leaveLiveRoom(activeRoom.roomCode);
      }
      leaveRoom();
    },
    handleSelectDifficulty,
    handleStartBattle,
    handleToggleScreenMode: (screenMode: boolean) => void updateHostSettings({ screenMode }),
    handleToggleReady,
    canResumeRound,
    isBusy,
    joinCode,
    onlinePlayerIds: roomChannel.isLive ? roomChannel.onlinePlayerIds : undefined,
    profile,
    setJoinCode,
  };
}
