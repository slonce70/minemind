import { Redirect, Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LoadingScreen } from '../src/components/ui/loading-screen';
import { RoomLobbyView } from '../src/features/rooms/room-lobby-view';
import { useRoomLobby } from '../src/features/rooms/use-room-lobby';
import { Screen } from '../src/components/ui/screen';
import { difficultyConfig } from '../src/features/content/difficulty-config';
import { formatPlayerCount } from '../src/lib/count-format';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { useAppStore } from '../src/state/app-store';

export default function RoomsRoute() {
  const { t } = useTranslation();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const lobby = useRoomLobby({
    genericError: t('rooms.genericError'),
  });
  const canResumeRound = Boolean(lobby.activeRoomRound && (!isSupabaseConfigured || lobby.activeRoom?.roundId));

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  if (!lobby.profile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ headerShown: false }} />
      <RoomLobbyView
        activeRoom={lobby.activeRoom}
        canResumeRound={canResumeRound}
        difficultyStrings={{
          easy: t(difficultyConfig.easy.translationKey),
          medium: t(difficultyConfig.medium.translationKey),
          hard: t(difficultyConfig.hard.translationKey),
        }}
        selectedDifficulty={selectedDifficulty}
        errorMessage={lobby.errorMessage}
        isBusy={lobby.isBusy}
        isOfflineMode={!isSupabaseConfigured}
        joinCode={lobby.joinCode}
        onAddDemoPlayers={lobby.addDemoPlayersToRoom}
        onChangeJoinCode={lobby.setJoinCode}
        onCreateRoom={() => void lobby.handleCreateRoom()}
        onJoinRoom={() => void lobby.handleJoinRoom()}
        onLeaveRoom={() => {
          lobby.handleLeaveRoom();
          router.replace('/home');
        }}
        onSelectDifficulty={lobby.handleSelectDifficulty}
        onStartBattle={() => {
          void lobby.handleStartBattle().then((didStart) => {
            if (didStart) {
              router.replace('/solo?mode=room');
            }
          });
        }}
        onToggleReady={() => void lobby.handleToggleReady()}
        roomActionLabel={
          canResumeRound
            ? t('rooms.resumeBattle')
            : t('rooms.startBattle')
        }
        strings={{
          activeRoom: t('rooms.activeRoom'),
          activeRoomCopy: t('rooms.activeRoomCopy', {
            countLabel: formatPlayerCount(lobby.profile.locale, lobby.activeRoom?.participants.length ?? 0),
          }),
          addDemoPlayers: t('rooms.addDemoPlayers'),
          createRoom: t('rooms.createRoom'),
          difficultyHint: t('rooms.difficultyHint'),
          difficultyLabel: t('rooms.difficultyLabel'),
          heroEyebrow: t('rooms.eyebrow'),
          joinRoomAction: t('rooms.joinRoomAction'),
          joinRoomPlaceholder: t('rooms.joinRoomPlaceholder'),
          joinRoomTitle: t('rooms.joinRoomTitle'),
          leaveRoom: t('rooms.leaveRoom'),
          lobbyTitle: t('rooms.lobbyTitle'),
          loading: t('common.loading'),
          notReady: t('rooms.notReady'),
          ready: t('rooms.ready'),
          readySummary: t('rooms.readySummary'),
          startBattle: t('rooms.startBattle'),
          subtitle: t('rooms.subtitle'),
          title: t('rooms.title'),
          toggleReady: t('rooms.toggleReady'),
        }}
      />
    </Screen>
  );
}
