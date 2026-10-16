import { Redirect, Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LoadingScreen } from '../src/components/ui/loading-screen';
import { Screen } from '../src/components/ui/screen';
import { difficultyConfig } from '../src/features/content/difficulty-config';
import { ChallengeBanner } from '../src/features/home/home-progress';
import { HomeView } from '../src/features/home/home-view';
import { challengeQuery } from '../src/features/quiz/solo-round-builder';
import { minecraftCategory } from '../src/features/quiz/mock-data';
import { formatPlayerCount } from '../src/lib/count-format';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { useAppStore } from '../src/state/app-store';

export default function HomeRoute() {
  const { t } = useTranslation();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const profile = useAppStore((state) => state.profile);
  const recentMatches = useAppStore((state) => state.recentMatches);
  const lastMatchId = useAppStore((state) => state.lastMatchId);
  const activeRoom = useAppStore((state) => state.activeRoom);
  const activeRoomRound = useAppStore((state) => state.activeRoomRound);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const progress = useAppStore((state) => state.progress);
  const pendingChallenge = useAppStore((state) => state.pendingChallenge);
  const setPendingChallenge = useAppStore((state) => state.setPendingChallenge);
  const setSelectedDifficulty = useAppStore((state) => state.setSelectedDifficulty);
  const canResumeRoom = Boolean(activeRoomRound && (!isSupabaseConfigured || activeRoom?.roundId));
  const latestMatch = recentMatches.find((entry) => entry.id === lastMatchId) ?? recentMatches[0];

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ headerShown: false }} />
      {pendingChallenge ? (
        <ChallengeBanner
          challenge={pendingChallenge}
          onAccept={() => {
            setPendingChallenge(undefined);
            router.push({ params: { ...challengeQuery(pendingChallenge), variant: 'challenge' }, pathname: '/solo' });
          }}
          onLater={() => setPendingChallenge(undefined)}
        />
      ) : null}
      <HomeView
        avatarId={profile.avatarId}
        difficultyStrings={{
          easy: t(difficultyConfig.easy.translationKey),
          medium: t(difficultyConfig.medium.translationKey),
          hard: t(difficultyConfig.hard.translationKey),
        }}
        hasActiveRoom={Boolean(activeRoom)}
        latestMatch={latestMatch}
        modeLabel={isSupabaseConfigured ? t('home.onlineReady') : t('home.offlineMode')}
        nickname={profile.nickname}
        onOpenClassroom={() => router.push('/classroom')}
        onOpenCollection={() => router.push('/collection')}
        onPlayVariant={(variant) =>
          variant === 'topics' ? router.push('/topics') : router.push(`/solo?variant=${variant}`)
        }
        onOpenProfile={() => router.push('/profile')}
        onOpenResults={() => router.push('/results')}
        onOpenSettings={() => router.push('/settings')}
        onPlaySolo={() => router.push('/solo')}
        onRoomAction={() =>
          canResumeRoom
            ? router.push('/solo?mode=room')
            : router.push('/rooms')
        }
        onSelectDifficulty={setSelectedDifficulty}
        progress={progress}
        roomActionLabel={
          activeRoom
            ? canResumeRoom
              ? t('home.resumeRoom')
              : t('home.openLobby')
            : t('home.privateRooms')
        }
        selectedDifficulty={selectedDifficulty}
        strings={{
          activeRoomCopy: activeRoom
            ? t('home.activeRoomCopy', {
                code: activeRoom.roomCode,
                countLabel: formatPlayerCount(profile.locale, activeRoom.participants.length),
              })
            : t('home.roomCardCopy'),
          activeRoomTitle: t('home.activeRoom'),
          classroomAction: t('home.classroomAction'),
          classroomCardCopy: t('home.classroomCardCopy'),
          classroomCardTitle: t('home.classroomCardTitle'),
          difficultyHelper: t('home.difficultyHint'),
          difficultySelectorLabel: t('home.difficultyLabel'),
          primaryCardCopy: t('home.categoryCopy', {
            questionCount: minecraftCategory.roundQuestionCount,
            roundLength: t('home.roundLengthValue'),
          }),
          primaryCardTitle: t('home.playSolo'),
          profileA11y: t('profile.open'),
          resultCorrectLabel: t('results.correct'),
          resultScoreLabel: t('results.score'),
          resultStreakLabel: t('results.bestStreak'),
          resultTitle: t('home.lastResult'),
          resultsAction: t('home.viewResults'),
          roomCardCopy: t('home.roomCardCopy'),
          roomCardTitle: t('home.roomCardTitle'),
          settingsA11y: t('settings.open'),
          timerA11y: t('home.timerA11y'),
          title: t('home.greeting', { name: profile.nickname }),
        }}
      />
    </Screen>
  );
}
