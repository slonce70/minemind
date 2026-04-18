import { Redirect, Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '../src/components/ui/screen';
import { difficultyConfig } from '../src/features/content/difficulty-config';
import { HomeView } from '../src/features/home/home-view';
import { leaderboardPreview, minecraftCategory } from '../src/features/quiz/mock-data';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { useAppStore } from '../src/state/app-store';

export default function HomeRoute() {
  const { t } = useTranslation();
  const profile = useAppStore((state) => state.profile);
  const lastResult = useAppStore((state) => state.lastResult);
  const activeRoom = useAppStore((state) => state.activeRoom);
  const activeRoomRound = useAppStore((state) => state.activeRoomRound);
  const resetProfile = useAppStore((state) => state.resetProfile);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const setSelectedDifficulty = useAppStore((state) => state.setSelectedDifficulty);

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
        lastResult={lastResult}
        leaderboardEntries={leaderboardPreview}
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
          activeRoom && activeRoom.status === 'active' && activeRoomRound
            ? router.push('/solo?mode=room')
            : router.push('/rooms')
        }
        onSelectDifficulty={setSelectedDifficulty}
        roomActionLabel={activeRoom ? t('home.resumeRoom') : t('home.privateRooms')}
        selectedDifficulty={selectedDifficulty}
        strings={{
          activeRoomCopy: activeRoom
            ? t('home.activeRoomCopy', { code: activeRoom.roomCode, count: activeRoom.participants.length })
            : t('home.roomCardCopy'),
          activeRoomTitle: t('home.activeRoom'),
          difficultyHelper: t('home.difficultyHint'),
          difficultySelectorLabel: t('home.difficultyLabel'),
          leaderboardTitle: t('home.leaderboardPreview'),
          localeLabel: t('home.locale'),
          modeLabel: t('home.mode'),
          modeSelectorCopy: t('home.ready'),
          primaryCardCopy: `${t('home.categoryCopy')} ${minecraftCategory.roundQuestionCount} ${t('home.questions').toLowerCase()}, ${minecraftCategory.roundDurationLabel}.`,
          primaryCardTitle: t('home.playSolo'),
          resultCorrectLabel: t('results.correct'),
          resultScoreLabel: t('results.score'),
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
