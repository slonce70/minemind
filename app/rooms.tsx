import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LoadingScreen } from '../src/components/ui/loading-screen';
import { challengeLinkBase } from '../src/features/quiz/challenge-link';
import { buildRoomJoinUrl, parseRoomCode } from '../src/features/rooms/room-join-link';
import { RoomLobbyView } from '../src/features/rooms/room-lobby-view';
import { RoomQrScanner } from '../src/features/rooms/room-qr-scanner';
import { useRoomLobby } from '../src/features/rooms/use-room-lobby';
import { Screen } from '../src/components/ui/screen';
import { ScreenHeader } from '../src/components/ui/screen-header';
import { difficultyConfig } from '../src/features/content/difficulty-config';
import { formatPlayerCount } from '../src/lib/count-format';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { useAppStore } from '../src/state/app-store';

export default function RoomsRoute() {
  const { t } = useTranslation();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const setPendingRoomCode = useAppStore((state) => state.setPendingRoomCode);
  const lobby = useRoomLobby({
    genericError: t('rooms.genericError'),
    onlineUnavailable: t('rooms.onlineUnavailable'),
  });
  const params = useLocalSearchParams<{ join?: string }>();
  const linkedCode = parseRoomCode(params.join);
  const joinedFromLink = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const canResumeRound = Boolean(lobby.activeRoomRound && (!isSupabaseConfigured || lobby.activeRoom?.roundId));
  // Live rooms share one timeline: when the host starts, everyone goes to the round at once.
  const liveRoundId =
    lobby.activeRoomRound?.source === 'supabase' && lobby.activeRoom?.status === 'active'
      ? lobby.activeRoomRound.roundId
      : undefined;

  useEffect(() => {
    if (liveRoundId) {
      router.replace('/solo?mode=room');
    }
  }, [liveRoundId]);

  // New players make a profile first; onboarding then brings them back here with the same code.
  useEffect(() => {
    if (hasHydrated && !lobby.profile && linkedCode) {
      setPendingRoomCode(linkedCode);
    }
  }, [hasHydrated, linkedCode, lobby.profile, setPendingRoomCode]);

  // A room link or QR code (…/rooms?join=AB12CD) joins right away once the player has a profile.
  useEffect(() => {
    if (linkedCode && lobby.profile && !lobby.activeRoom && !joinedFromLink.current) {
      joinedFromLink.current = true;
      void lobby.handleJoinRoom(linkedCode);
    }
  }, [linkedCode, lobby]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  if (!lobby.profile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader backLabel={t('common.back')} title={t('rooms.title')} />
      <RoomLobbyView
        activeRoom={lobby.activeRoom}
        canResumeRound={canResumeRound}
        closedNotice={
          lobby.activeRoom?.status === 'finished' ? t(`roomClosed.${lobby.activeRoom.closedReason ?? 'other'}`) : undefined
        }
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
        joinUrl={
          isSupabaseConfigured && lobby.activeRoom ? buildRoomJoinUrl(challengeLinkBase(), lobby.activeRoom.roomCode) : undefined
        }
        onJoinRoom={() => void lobby.handleJoinRoom()}
        onScanCode={isSupabaseConfigured ? () => setIsScanning(true) : undefined}
        onlinePlayerIds={lobby.onlinePlayerIds}
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
        onToggleScreenMode={isSupabaseConfigured ? lobby.handleToggleScreenMode : undefined}
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
          createRoomCopy: t('rooms.createRoomCopy'),
          difficultyHint: t('rooms.difficultyHint'),
          difficultyLabel: t('rooms.difficultyLabel'),
          joinRoomAction: t('rooms.joinRoomAction'),
          joinRoomPlaceholder: t('rooms.joinRoomPlaceholder'),
          joinRoomTitle: t('rooms.joinRoomTitle'),
          leaveRoom: t('rooms.leaveRoom'),
          lobbyTitle: t('rooms.lobbyTitle'),
          loading: t('common.loading'),
          notReady: t('rooms.notReady'),
          offline: t('rooms.offline'),
          ready: t('rooms.ready'),
          joinQrA11y: t('qr.joinA11y', { code: lobby.activeRoom?.roomCode ?? '' }),
          joinQrHint: t('qr.joinHint'),
          scanQr: t('qr.scan'),
          screenMode: t('rooms.screenMode'),
          screenModeCopy: t('rooms.screenModeCopy'),
          readySummary: t('rooms.readySummary'),
          startBattle: t('rooms.startBattle'),
          subtitle: t('rooms.subtitle'),
          timerA11y: t('home.timerA11y'),
          toggleReady: t('rooms.toggleReady'),
        }}
      />
      {isScanning ? (
        <RoomQrScanner
          onClose={() => setIsScanning(false)}
          onCode={(code) => {
            setIsScanning(false);
            void lobby.handleJoinRoom(code);
          }}
        />
      ) : null}
    </Screen>
  );
}
