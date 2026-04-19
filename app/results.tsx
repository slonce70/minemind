import { Redirect, Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LoadingScreen } from '../src/components/ui/loading-screen';
import { difficultyConfig } from '../src/features/content/difficulty-config';
import { getMatchSourceTranslationKey } from '../src/features/results/match-record-source';
import { ResultsView } from '../src/features/results/results-view';
import { useAppStore } from '../src/state/app-store';

export default function ResultsRoute() {
  const { t } = useTranslation();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const recentMatches = useAppStore((state) => state.recentMatches);
  const lastMatchId = useAppStore((state) => state.lastMatchId);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const latestMatch = recentMatches.find((entry) => entry.id === lastMatchId) ?? recentMatches[0];

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  if (!latestMatch) {
    return <Redirect href="/home" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ResultsView
        difficultyLabel={t(difficultyConfig[latestMatch.difficulty ?? selectedDifficulty].translationKey)}
        matchRecord={latestMatch}
        onBackHome={() => router.replace('/home')}
        onPlayAgain={() =>
          router.replace(latestMatch.mode === 'room' ? '/rooms' : '/solo')
        }
        sourceLabel={t(getMatchSourceTranslationKey(latestMatch))}
        strings={{
          accuracyLabel: t('results.correct'),
          backHome: t('results.backHome'),
          badges: {
            netherPerfect: t('results.badges.netherPerfect'),
            perfectClear: t('results.badges.perfectClear'),
            standardClear: t('results.badges.standardClear'),
          },
          bestStreak: t('results.bestStreak'),
          correctShort: t('results.correctShort'),
          difficulty: t('results.difficulty'),
          insights: t('results.insights'),
          learned: t('results.learned'),
          playAgain: t('results.playAgain'),
          roomCodePrefix: t('results.roomCodeLabel'),
          score: t('results.score'),
          source: t('results.source'),
          subtitle: t('results.subtitle'),
          title: t('results.title'),
          you: t('results.you'),
        }}
      />
    </>
  );
}
