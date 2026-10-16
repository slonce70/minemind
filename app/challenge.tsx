import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../src/components/ui/button';
import { Card } from '../src/components/ui/card';
import { LoadingScreen } from '../src/components/ui/loading-screen';
import { Screen } from '../src/components/ui/screen';
import { difficultyConfig } from '../src/features/content/difficulty-config';
import { minecraftTopicConfig } from '../src/features/content/topic-config';
import { challengeQuery, parseChallenge } from '../src/features/quiz/solo-round-builder';
import { Mascot } from '../src/features/ui/mascot';
import { useAppStore } from '../src/state/app-store';
import { colors, fonts, typography } from '../src/theme/tokens';

/** Landing screen of a friend's challenge link. */
export default function ChallengeRoute() {
  const { t } = useTranslation();
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const profile = useAppStore((state) => state.profile);
  const setPendingChallenge = useAppStore((state) => state.setPendingChallenge);
  const challenge = parseChallenge(params);

  // New players make a profile first; home then offers the challenge.
  useEffect(() => {
    if (hasHydrated && !profile && challenge) {
      setPendingChallenge(challenge);
    }
  }, [challenge, hasHydrated, profile, setPendingChallenge]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  if (!profile && challenge) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <Card highlight style={styles.card}>
        <View style={styles.mascot}>
          <Mascot mood="wow" size={96} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {t('challenge.title')}
        </Text>
        {challenge ? (
          <>
            <Text style={styles.lead}>{t('challenge.from', { name: challenge.from })}</Text>
            <Text style={styles.score}>{t('challenge.toBeat', { correct: challenge.correct, score: challenge.score })}</Text>
            <Text style={styles.copy}>
              {t(difficultyConfig[challenge.difficulty].translationKey)}
              {challenge.topicId ? ` · ${t(minecraftTopicConfig[challenge.topicId].translationKey)}` : ''}
            </Text>
            <Text style={styles.copy}>{t('challenge.sameQuestions')}</Text>
            <PrimaryButton
              label={t('challenge.accept')}
              onPress={() => {
                setPendingChallenge(undefined);
                router.replace({ params: { ...challengeQuery(challenge), variant: 'challenge' }, pathname: '/solo' });
              }}
              testID="challenge-accept"
            />
          </>
        ) : (
          <Text style={styles.copy}>{t('challenge.invalid')}</Text>
        )}
        <SecondaryButton label={t('common.back')} onPress={() => router.replace('/home')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'stretch',
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  mascot: {
    alignItems: 'center',
  },
  lead: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.h3,
    textAlign: 'center',
  },
  score: {
    color: colors.highlight,
    fontFamily: fonts.black,
    fontSize: typography.h3,
    textAlign: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h1,
    textAlign: 'center',
  },
});
