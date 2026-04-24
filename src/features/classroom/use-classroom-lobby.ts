import * as Network from 'expo-network';
import { Share } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import { useAppStore } from '../../state/app-store';
import { applyClassroomTransportEvent, buildClassroomRoundManifest } from './classroom-session-sync';
import { buildClassroomInviteToken, parseClassroomInviteInput } from './classroom-invite';
import { deriveClassroomLobbyState } from './classroom-lobby-state';
import { getSharedLocalHostTransport } from './local-host-transport';
import type { ClassroomSession, HostSessionConfig, JoinPayload } from './types';

function buildRoomCode() {
  return `C${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function useClassroomLobby(messages?: {
  connectionError?: string;
  hostAddressRequired?: string;
  initialInviteInput?: string | null;
  nativeBuildRequired?: string;
  shareInviteError?: string;
}) {
  const profile = useAppStore((state) => state.profile);
  const locale = useAppStore((state) => state.locale);
  const classroomSession = useAppStore((state) => state.classroomSession);
  const activeRoomRound = useAppStore((state) => state.activeRoomRound);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const setActiveRoomRound = useAppStore((state) => state.setActiveRoomRound);
  const setClassroomSession = useAppStore((state) => state.setClassroomSession);
  const clearClassroomSession = useAppStore((state) => state.clearClassroomSession);
  const [hostAddress, setHostAddress] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const localHostTransport = useMemo(() => getSharedLocalHostTransport(), []);

  const localParticipant = useMemo(() => {
    if (!profile) {
      return undefined;
    }

    return {
      avatarId: profile.avatarId,
      id: profile.nickname.toLowerCase().replace(/\s+/g, '-'),
      isHost: true,
      isLocalPlayer: true,
      name: profile.nickname,
      ready: true,
    };
  }, [profile]);

  const inviteToken = classroomSession?.role === 'host' && classroomSession.hostAddress
    ? buildClassroomInviteToken({
        hostAddress: classroomSession.hostAddress,
        port: classroomSession.hostPort,
        roomCode: classroomSession.roomCode,
      })
    : null;
  const lobbyState = classroomSession ? deriveClassroomLobbyState(classroomSession) : null;

  useEffect(() => {
    if (classroomSession || !messages?.initialInviteInput) {
      return;
    }

    const parsedInvite = parseClassroomInviteInput(messages.initialInviteInput);

    if (!parsedInvite) {
      return;
    }

    setHostAddress(messages.initialInviteInput);
    setJoinCode(parsedInvite.roomCode ?? '');
  }, [classroomSession, messages?.initialInviteInput]);

  useEffect(
    () =>
      localHostTransport.subscribe((event) => {
        const currentSession = useAppStore.getState().classroomSession;

        if (!currentSession) {
          return;
        }

        const synced = applyClassroomTransportEvent(currentSession, event);

        setClassroomSession(synced.session);

        if (synced.round) {
          setActiveRoomRound(synced.round);
        }
      }),
    [localHostTransport, setActiveRoomRound, setClassroomSession]
  );

  const resolveErrorMessage = (error: unknown) =>
    error instanceof Error && error.message === 'CLASSROOM_NATIVE_TRANSPORT_UNAVAILABLE'
      ? (messages?.nativeBuildRequired ?? null)
      : (messages?.connectionError ?? null);

  const clearSession = async () => {
    await localHostTransport.close();
    setActiveRoomRound(undefined);
    clearClassroomSession();
    setErrorMessage(null);
  };

  const resolveHostAddress = async () => {
    const manualAddress = hostAddress.trim();

    if (manualAddress) {
      return manualAddress;
    }

    try {
      const detectedAddress = await Network.getIpAddressAsync();

      return detectedAddress && detectedAddress !== '0.0.0.0' ? detectedAddress : undefined;
    } catch {
      return undefined;
    }
  };

  const handleHostSession = async () => {
    if (!localParticipant) {
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);

    try {
      const roomCode = buildRoomCode();
      const resolvedHostAddress = await resolveHostAddress();
      const config: HostSessionConfig = {
        difficulty: selectedDifficulty,
        hostAddress: resolvedHostAddress,
        hostProfile: localParticipant,
        roomCode,
      };
      const handle = await localHostTransport.startHostSession(config);
      const nextSession: ClassroomSession = {
        difficulty: selectedDifficulty,
        hostAddress: handle.hostAddress,
        hostPort: handle.port,
        id: handle.sessionId,
        participants: [localParticipant],
        role: 'host',
        roomCode: handle.roomCode,
        status: 'lobby',
      };

      setClassroomSession(nextSession);
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleJoinSession = async () => {
    if (!localParticipant) {
      return;
    }

    const parsedInvite = parseClassroomInviteInput(hostAddress);
    const resolvedHostAddress = parsedInvite?.hostAddress ?? hostAddress.trim();
    const resolvedRoomCode = (joinCode.trim() || parsedInvite?.roomCode || '').toUpperCase();

    if (!resolvedHostAddress) {
      setErrorMessage(messages?.hostAddressRequired ?? null);
      return;
    }

    if (!resolvedRoomCode) {
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);

    try {
      const participant = {
        ...localParticipant,
        isHost: false,
        ready: false,
      };
      const payload: JoinPayload = {
        guestProfile: participant,
        hostAddress: resolvedHostAddress,
        port: parsedInvite?.port,
        roomCode: resolvedRoomCode,
      };
      const handle = await localHostTransport.joinHostSession(payload);
      const nextSession: ClassroomSession = {
        difficulty: selectedDifficulty,
        hostAddress: handle.hostAddress,
        hostPort: handle.port,
        id: handle.sessionId,
        participants: [participant],
        role: 'participant',
        roomCode: handle.roomCode,
        status: 'lobby',
      };

      setClassroomSession(nextSession);
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleStartMatch = async () => {
    if (!classroomSession || !profile || !lobbyState?.canStart) {
      return false;
    }

    const round = buildClassroomRoundManifest({
      difficulty: classroomSession.difficulty,
      locale,
      roomCode: classroomSession.roomCode,
    });
    const nextSession = {
      ...classroomSession,
      status: 'active',
    } satisfies ClassroomSession;

    setClassroomSession(nextSession);
    setActiveRoomRound(round);

    try {
      await localHostTransport.publishEvent({
        round,
        roomCode: classroomSession.roomCode,
        type: 'round-started',
      });
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error));
      return false;
    }

    return true;
  };

  const handleToggleReady = async () => {
    if (!classroomSession) {
      return false;
    }

    const localSessionParticipant = classroomSession.participants.find((participant) => participant.isLocalPlayer);

    if (!localSessionParticipant) {
      return false;
    }

    const nextReady = !localSessionParticipant.ready;
    const nextSession: ClassroomSession = {
      ...classroomSession,
      participants: classroomSession.participants.map((participant) => participant.id === localSessionParticipant.id
        ? {
            ...participant,
            ready: nextReady,
          }
        : participant),
    };

    setClassroomSession(nextSession);

    try {
      await localHostTransport.publishEvent({
        participantId: localSessionParticipant.id,
        ready: nextReady,
        roomCode: classroomSession.roomCode,
        type: 'participant-ready',
      });
      return true;
    } catch (error) {
      setClassroomSession(classroomSession);
      setErrorMessage(resolveErrorMessage(error));
      return false;
    }
  };

  const handleShareInvite = async () => {
    if (!inviteToken) {
      return false;
    }

    try {
      await Share.share({
        message: inviteToken,
      });
      return true;
    } catch {
      setErrorMessage(messages?.shareInviteError ?? messages?.connectionError ?? null);
      return false;
    }
  };

  return {
    activeRoomRound,
    classroomSession,
    clearClassroomSession: clearSession,
    errorMessage,
    handleHostSession,
    handleJoinSession,
    handleShareInvite,
    handleStartMatch,
    handleToggleReady,
    hostAddress,
    inviteToken,
    isBusy,
    joinCode,
    lobbyState,
    profile,
    selectedDifficulty,
    setHostAddress,
    setJoinCode,
  };
}
