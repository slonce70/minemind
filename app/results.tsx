import { Redirect, Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ResultsView } from '../src/features/results/results-view';
import { useAppStore } from '../src/state/app-store';

export default function ResultsRoute() {
  const { t } = useTranslation();
  const result = useAppStore((state) => state.lastResult);

  if (!result) {
    return <Redirect href="/home" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ResultsView
        onBackHome={() => router.replace('/home')}
        onPlayAgain={() => router.replace(result.mode === 'room' ? '/rooms' : '/solo')}
        result={result}
        strings={{
          accuracyLabel: t('results.correct'),
          backHome: t('results.backHome'),
          bestStreak: t('results.bestStreak'),
          correctShort: t('results.correctShort'),
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
