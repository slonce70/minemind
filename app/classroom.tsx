import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { LoadingScreen } from '../src/components/ui/loading-screen';
import { Screen } from '../src/components/ui/screen';
import { buildClassroomInviteToken } from '../src/features/classroom/classroom-invite';
import { ClassroomLobbyView } from '../src/features/classroom/classroom-lobby-view';
import { useClassroomLobby } from '../src/features/classroom/use-classroom-lobby';
import { formatPlayerCount } from '../src/lib/count-format';
import { useAppStore } from '../src/state/app-store';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ClassroomRoute() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    host?: string | string[];
    port?: string | string[];
    roomCode?: string | string[];
  }>();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const initialInviteInput = useMemo(() => {
    const host = firstParam(params.host);
    const roomCode = firstParam(params.roomCode);
    const portValue = firstParam(params.port);
    const port = portValue ? Number(portValue) : undefined;

    if (!host || !roomCode || Number.isNaN(port)) {
      return null;
    }

    return buildClassroomInviteToken({
      hostAddress: host,
      port,
      roomCode,
    });
  }, [params.host, params.port, params.roomCode]);
  const lobby = useClassroomLobby({
    connectionError: t('classroom.connectionError'),
    hostAddressRequired: t('classroom.hostAddressRequired'),
    initialInviteInput,
    nativeBuildRequired: t('classroom.nativeBuildRequired'),
    shareInviteError: t('classroom.shareInviteError'),
  });

  // host session / join session labels are translated in the classroom namespace.
  useEffect(() => {
    if (lobby.classroomSession?.status === 'active' && lobby.activeRoomRound?.source === 'classroom') {
      router.replace('/solo?mode=classroom');
    }
  }, [lobby.activeRoomRound?.source, lobby.classroomSession?.status]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  if (!lobby.profile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ headerShown: false }} />
      <ClassroomLobbyView
        classroomSession={lobby.classroomSession}
        errorMessage={lobby.errorMessage}
        hostAddress={lobby.hostAddress}
        inviteToken={lobby.inviteToken}
        isBusy={lobby.isBusy}
        joinCode={lobby.joinCode}
        lobbyState={lobby.lobbyState}
        onChangeHostAddress={lobby.setHostAddress}
        onChangeJoinCode={lobby.setJoinCode}
        onClearSession={lobby.clearClassroomSession}
        onHostSession={() => void lobby.handleHostSession()}
        onJoinSession={() => void lobby.handleJoinSession()}
        onShareInvite={() => void lobby.handleShareInvite()}
        onStartMatch={() => void lobby.handleStartMatch()}
        onToggleReady={() => void lobby.handleToggleReady()}
        strings={{
          clearSession: t('classroom.clearSession'),
          hostAddressLabel: t('classroom.hostAddressLabel'),
          hostAddressPlaceholder: t('classroom.hostAddressPlaceholder'),
          hostSession: t('classroom.hostSession'),
          hostSessionHint: t('classroom.hostSessionHint'),
          inviteQrAccessibilityLabel: t('classroom.inviteQrAccessibilityLabel'),
          inviteQrHint: t('classroom.inviteQrHint'),
          inviteQrTitle: t('classroom.inviteQrTitle'),
          inviteTokenLabel: t('classroom.inviteTokenLabel'),
          inviteTokenPlaceholder: t('classroom.inviteTokenPlaceholder'),
          joinSession: t('classroom.joinSession'),
          joinSessionHint: t('classroom.joinSessionHint'),
          joinSessionPlaceholder: t('classroom.joinSessionPlaceholder'),
          loading: t('common.loading'),
          notReady: t('classroom.notReady'),
          participantCount: t('classroom.participantCount', {
            countLabel: formatPlayerCount(
              lobby.profile.locale,
              lobby.classroomSession?.participants.length ?? 0
            ),
          }),
          participantCountLabel: t('classroom.participantCountLabel'),
          ready: t('classroom.ready'),
          readySummary: t('classroom.readySummary'),
          roleLabel: t('classroom.roleLabel'),
          roomCode: t('classroom.roomCode'),
          shareInvite: t('classroom.shareInvite'),
          sessionStatusFinished: t('classroom.sessionStatusFinished'),
          sessionStatusLobby: t('classroom.sessionStatusLobby'),
          sessionStatusPlaying: t('classroom.sessionStatusPlaying'),
          startMatch: t('classroom.startMatch'),
          subtitle: t('classroom.subtitle'),
          title: t('classroom.title'),
          toggleReady: t('classroom.toggleReady'),
        }}
      />
    </Screen>
  );
}
