import { useEffect, useState } from 'react';

import { ensureGuestSession } from '../profile/profile-service';
import { useAppStore } from '../../state/app-store';
import { isSupabaseConfigured } from '../../lib/supabase';
import { createDemoRoomRound } from './live-room-service';
import { getSoloQuestionSet } from '../quiz/quiz-service';
import { deriveRoomLobbyState } from './room-lobby-state';
import { canStartOfflineRoom } from './demo-room-service';
import { subscribeToRoomChannel } from './realtime-room-channel';
import {
  createLiveRoom,
  joinLiveRoom,
  refreshLiveRoom,
  resumeLiveRoomRound,
  startLiveRoomRound,
  updateLiveReadyState,
} from './live-room-service';

export { deriveRoomLobbyState } from './room-lobby-state';

export function useRoomLobby(messages: { genericError: string }) {
  const profile = useAppStore((state) => state.profile);
  const activeRoom = useAppStore((state) => state.activeRoom);
  const activeRoomRound = useAppStore((state) => state.activeRoomRound);
  const createRoom = useAppStore((state) => state.createRoom);
  const joinRoom = useAppStore((state) => state.joinRoom);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
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

  useEffect(() => {
    if (!isSupabaseConfigured || !activeRoom) {
      return undefined;
    }

    let isCancelled = false;

    const syncRoomState = async () => {
      try {
        const room = await refreshLiveRoom(activeRoom.roomCode);

        if (isCancelled) {
          return;
        }

        setActiveRoom(room);

        if ((room.status === 'active' || room.status === 'finalizing') && room.roundId && !activeRoomRound) {
          const resumed = await resumeLiveRoomRound(room.roomCode);

          if (isCancelled) {
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
    };

    void syncRoomState();
    const unsubscribe = subscribeToRoomChannel(activeRoom.roomCode, {
      onRoomFinished: () => void syncRoomState(),
      onRoomUpdated: () => void syncRoomState(),
      onRoundFinalizing: () => void syncRoomState(),
      onRoundStarted: () => void syncRoomState(),
    });

    const interval = setInterval(() => {
      void syncRoomState();
    }, 4000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      unsubscribe();
    };
  }, [activeRoom, activeRoomRound, clearActiveRound, setActiveRoom, setActiveRoomRound]);

  const handleCreateRoom = async () => {
    if (!profile) {
      return;
    }

    setErrorMessage(null);
    setIsBusy(true);

    try {
      if (isSupabaseConfigured) {
        await ensureGuestSession(profile);
        const room = await createLiveRoom(profile);
        setActiveRoom(room);
        clearActiveRound();
      } else {
        createRoom();
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
      } else {
        joinRoom(joinCode);
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
            ? await resumeLiveRoomRound(activeRoom.roomCode)
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

  return {
    activeRoom,
    activeRoomRound,
    addDemoPlayersToRoom,
    errorMessage,
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom: () => leaveRoom(),
    handleStartBattle,
    handleToggleReady,
    canResumeRound,
    isBusy,
    joinCode,
    profile,
    setJoinCode,
  };
}
