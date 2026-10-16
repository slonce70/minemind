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
  const lastRewards = useAppStore((state) => state.lastRewards);
  const nickname = useAppStore((state) => state.profile?.nickname ?? '');
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
        difficultyLabel={
          latestMatch.round?.soloMode === 'adaptive' || latestMatch.round?.soloMode === 'mistakes'
            ? t(`modes.${latestMatch.round.soloMode}`)
            : t(difficultyConfig[latestMatch.difficulty ?? selectedDifficulty].translationKey)
        }
        matchRecord={latestMatch}
        nickname={nickname}
        onBackHome={() => router.replace('/home')}
        onPlayAgain={() => {
          if (latestMatch.mode === 'room') {
            router.replace('/rooms');
            return;
          }

          if (latestMatch.mode === 'classroom') {
            router.replace('/classroom');
            return;
          }

          const round = latestMatch.round;

          // The same kind of round again; a friend's challenge continues as a normal round.
          if (round?.soloMode === 'topic' && round.topicId) {
            router.replace({ params: { topic: round.topicId, variant: 'topic' }, pathname: '/solo' });
          } else if (round?.soloMode === 'adaptive' || round?.soloMode === 'mistakes') {
            router.replace({ params: { variant: round.soloMode }, pathname: '/solo' });
          } else {
            router.replace('/solo');
          }
        }}
        rewards={lastRewards}
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
          correctAnswer: t('results.correctAnswer'),
          difficulty: t('results.difficulty'),
          noAnswer: t('results.noAnswer'),
          playAgain: t('results.playAgain'),
          questionNumber: (number) => t('results.questionNumber', { number }),
          review: t('results.review'),
          roomCodePrefix: t('results.roomCodeLabel'),
          score: t('results.score'),
          scoreA11y: (score) => t('results.scoreA11y', { score }),
          source: t('results.source'),
          standings: t('results.standings'),
          subtitle: t('results.subtitle'),
          title: t('results.title'),
          you: t('results.you'),
          yourAnswer: t('results.yourAnswer'),
        }}
      />
    </>
  );
}
