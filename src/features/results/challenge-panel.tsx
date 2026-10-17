import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { SecondaryButton } from '../../components/ui/button';
import { colors, fonts, motion, radii, spacing, typography } from '../../theme/tokens';
import { shareChallenge } from '../quiz/challenge-link';
import { PixelIcon } from '../ui/pixel-icon';
import type { MatchRecord } from './match-record';

/** How a friend's challenge ended: shown right under the score. */
export function ChallengeVerdict({ record }: { record: MatchRecord }) {
  const { t } = useTranslation();
  const challenge = record.round?.challenge;

  if (!challenge) {
    return null;
  }

  const won = record.score > challenge.score;
  const verdict = won
    ? t('challenge.win')
    : record.score === challenge.score
      ? t('challenge.draw')
      : t('challenge.lose', { name: challenge.from });

  return (
    <Animated.View entering={ZoomIn.delay(motion.countUp).duration(motion.slow)} style={styles.verdict}>
      <PixelIcon color={won ? colors.highlight : colors.textMuted} name="sword" size={22} />
      <View style={styles.verdictText}>
        <Text accessibilityLiveRegion="polite" style={styles.verdictTitle}>
          {verdict}
        </Text>
        <Text style={styles.versus}>{t('challenge.versus', { name: challenge.from, them: challenge.score, you: record.score })}</Text>
      </View>
    </Animated.View>
  );
}

/** Sends the same round to a friend: classic and topic solo rounds only (they replay from a seed). */
export function ChallengeShare({ nickname, record }: { nickname: string; record: MatchRecord }) {
  const { t } = useTranslation();
  const [shared, setShared] = useState<{ copied: boolean; url: string } | null>(null);
  const round = record.round;
  const seed = round?.seed;

  if (record.mode !== 'solo' || !seed || !['classic', 'topic', 'challenge'].includes(round.soloMode)) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <SecondaryButton
        label={t('challenge.share')}
        onPress={() =>
          void shareChallenge(
            {
              correct: record.correctAnswers,
              difficulty: record.difficulty ?? 'medium',
              from: nickname,
              score: record.score,
              seed,
              topicId: round.topicId,
            },
            (url) => t('challenge.shareMessage', { score: record.score, url })
          ).then((outcome) => {
            if (outcome.result !== 'cancelled') {
              setShared({ copied: outcome.result === 'copied', url: outcome.url });
            }
          })
        }
        testID="challenge-share"
      />
      {shared ? (
        <View style={styles.link}>
          <Text style={styles.linkLabel}>{shared.copied ? t('challenge.copied') : t('challenge.linkLabel')}</Text>
          <Text selectable style={styles.linkText} testID="challenge-link">
            {shared.url}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    backgroundColor: colors.surfaceInset,
    borderRadius: radii.md,
    gap: spacing.xxs,
    padding: spacing.sm,
  },
  linkLabel: {
    color: colors.success,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  linkText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
  },
  panel: {
    gap: spacing.sm,
  },
  verdict: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.highlight,
    borderRadius: radii.lg,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  verdictText: {
    flex: 1,
    gap: 2,
  },
  verdictTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h3,
  },
  versus: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: typography.body,
  },
});
