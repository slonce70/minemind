import { Redirect, Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LoadingScreen } from '../src/components/ui/loading-screen';
import { Screen } from '../src/components/ui/screen';
import { difficultyConfig } from '../src/features/content/difficulty-config';
import { HomeView } from '../src/features/home/home-view';
import { minecraftCategory } from '../src/features/quiz/mock-data';
import { getMatchSourceTranslationKey } from '../src/features/results/match-record-source';
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
  const resetProfile = useAppStore((state) => state.resetProfile);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
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
      <HomeView
        difficultyLabel={t(difficultyConfig[selectedDifficulty].translationKey)}
        difficultyStrings={{
          easy: t(difficultyConfig.easy.translationKey),
          medium: t(difficultyConfig.medium.translationKey),
          hard: t(difficultyConfig.hard.translationKey),
        }}
        hasActiveRoom={Boolean(activeRoom)}
        latestMatch={latestMatch}
        latestMatchSourceLabel={latestMatch ? t(getMatchSourceTranslationKey(latestMatch)) : undefined}
        localeLabel={t(`languageNames.${profile.locale}`)}
        modeLabel={isSupabaseConfigured ? t('home.onlineReady') : t('home.offlineMode')}
        nickname={profile.nickname}
        onOpenResults={() => router.push('/results')}
        onPlaySolo={() => router.push('/solo')}
        onResetProfile={() => {
          resetProfile();
          router.replace('/onboarding');
        }}
        onRoomAction={() =>
          canResumeRoom
            ? router.push('/solo?mode=room')
            : router.push('/rooms')
        }
        onSelectDifficulty={setSelectedDifficulty}
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
            ? t('home.activeRoomCopy', { code: activeRoom.roomCode, count: activeRoom.participants.length })
            : t('home.roomCardCopy'),
          activeRoomTitle: t('home.activeRoom'),
          difficultyHelper: t('home.difficultyHint'),
          difficultySelectorLabel: t('home.difficultyLabel'),
          localeLabel: t('home.locale'),
          modeLabel: t('home.mode'),
          modeSelectorCopy: t('home.ready'),
          primaryCardCopy: t('home.categoryCopy', {
            questionCount: minecraftCategory.roundQuestionCount,
            roundLength: t('home.roundLengthValue'),
          }),
          primaryCardTitle: t('home.playSolo'),
          resultCorrectLabel: t('results.correct'),
          resultScoreLabel: t('results.score'),
          resultSourceLabel: t('results.source'),
          resultStreakLabel: t('results.bestStreak'),
          resultTitle: t('home.lastResult'),
          resultsAction: t('home.viewResults'),
          roomCardCopy: t('home.roomCardCopy'),
          roomCardTitle: t('home.roomCardTitle'),
          switchProfile: t('home.switchProfile'),
          title: t('home.greeting', { name: profile.nickname }),
        }}
      />
    </Screen>
  );
}
