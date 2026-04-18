import { Redirect, Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { RoomLobbyView } from '../src/features/rooms/room-lobby-view';
import { useRoomLobby } from '../src/features/rooms/use-room-lobby';
import { Screen } from '../src/components/ui/screen';
import { isSupabaseConfigured } from '../src/lib/supabase';

export default function RoomsRoute() {
  const { t } = useTranslation();
  const lobby = useRoomLobby({
    genericError: t('rooms.genericError'),
  });

  if (!lobby.profile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ headerShown: false }} />
      <RoomLobbyView
        activeRoom={lobby.activeRoom}
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
        onStartBattle={() => {
          void lobby.handleStartBattle().then((didStart) => {
            if (didStart) {
              router.replace('/solo?mode=room');
            }
          });
        }}
        onToggleReady={() => void lobby.handleToggleReady()}
        roomActionLabel={
          lobby.activeRoom?.status === 'active' && lobby.activeRoomRound
            ? t('rooms.resumeBattle')
            : t('rooms.startBattle')
        }
        strings={{
          activeRoom: t('rooms.activeRoom'),
          activeRoomCopy: t('rooms.activeRoomCopy', {
            count: lobby.activeRoom?.participants.length ?? 0,
          }),
          addDemoPlayers: t('rooms.addDemoPlayers'),
          createRoom: t('rooms.createRoom'),
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
