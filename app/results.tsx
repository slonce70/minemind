import { Redirect, Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { difficultyConfig } from '../src/features/content/difficulty-config';
import { ResultsView } from '../src/features/results/results-view';
import { useAppStore } from '../src/state/app-store';

export default function ResultsRoute() {
  const { t } = useTranslation();
  const result = useAppStore((state) => state.lastResult);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);

  if (!result) {
    return <Redirect href="/home" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ResultsView
        difficultyLabel={t(difficultyConfig[result.difficulty ?? selectedDifficulty].translationKey)}
        onBackHome={() => router.replace('/home')}
        onPlayAgain={() => router.replace(result.mode === 'room' ? '/rooms' : '/solo')}
        result={result}
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
          subtitle: t('results.subtitle'),
          title: t('results.title'),
          you: t('results.you'),
        }}
      />
    </>
  );
}
