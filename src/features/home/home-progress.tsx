import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { colors, fonts, radii, spacing, typography } from '../../theme/tokens';
import { feedback } from '../feel/feedback';
import { DailyQuestRow, LevelBar } from '../progress/progress-parts';
import { currentDailyQuest, localDay, visibleStreak, type PlayerProgress } from '../progress/progression';
import type { ChallengeSpec } from '../quiz/solo-round-builder';
import { PixelIcon, type PixelIconName } from '../ui/pixel-icon';

/** Level, day streak and today's quest; opens the collection. */
export function ProgressStrip({ onOpenCollection, progress }: { onOpenCollection: () => void; progress: PlayerProgress }) {
  const { t } = useTranslation();
  const now = new Date();
  const offset = -now.getTimezoneOffset();
  const streak = visibleStreak(progress.streak, now, offset);

  return (
    <Card style={styles.card} tone="panel">
      <LevelBar xp={progress.xp} />
      <View style={styles.row}>
        <View style={styles.streak}>
          <PixelIcon color={streak > 0 ? colors.highlight : colors.textMuted} name="flame" size={18} />
          <Text style={styles.streakText}>{t('progress.streakDays', { count: streak })}</Text>
        </View>
        <Pressable
          accessibilityLabel={t('progress.collectionTitle')}
          accessibilityRole="button"
          onPress={() => {
            feedback.tap();
            onOpenCollection();
          }}
          style={styles.collectionButton}
        >
          <PixelIcon color={colors.highlight} name="card" size={18} />
          <Text style={styles.collectionText}>{t('progress.collectionTitle')}</Text>
          <PixelIcon color={colors.textMuted} name="chevron-right" size={14} />
        </Pressable>
      </View>
      <DailyQuestRow quest={currentDailyQuest(progress, localDay(now, offset))} />
    </Card>
  );
}

function ModeRow(props: { copy: string; disabled?: boolean; icon: PixelIconName; onPress: () => void; testID?: string; title: string }) {
  return (
    <Pressable
      accessibilityHint={props.copy}
      accessibilityLabel={props.title}
      accessibilityRole="button"
      accessibilityState={{ disabled: props.disabled }}
      disabled={props.disabled}
      onPress={() => {
        feedback.tap();
        props.onPress();
      }}
      style={[styles.mode, props.disabled && styles.modeOff]}
      testID={props.testID}
    >
      <View style={styles.modeIcon}>
        <PixelIcon color={props.disabled ? colors.textMuted : colors.highlight} name={props.icon} size={22} />
      </View>
      <View style={styles.modeText}>
        <Text style={styles.modeTitle}>{props.title}</Text>
        <Text style={styles.modeCopy}>{props.copy}</Text>
      </View>
      <PixelIcon color={colors.textMuted} name="chevron-right" size={14} />
    </Pressable>
  );
}

export function ModesCard(props: {
  mistakesCount: number;
  onAdaptive: () => void;
  onMistakes: () => void;
  onTopics: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card style={styles.card} tone="panel">
      <Text accessibilityRole="header" style={styles.title}>
        {t('modes.title')}
      </Text>
      <ModeRow copy={t('modes.topicCopy')} icon="map" onPress={props.onTopics} testID="mode-topics" title={t('modes.topic')} />
      <ModeRow copy={t('modes.adaptiveCopy')} icon="lightbulb" onPress={props.onAdaptive} testID="mode-adaptive" title={t('modes.adaptive')} />
      <ModeRow
        copy={props.mistakesCount > 0 ? t('modes.mistakesCopy', { count: props.mistakesCount }) : t('modes.mistakesEmpty')}
        disabled={props.mistakesCount === 0}
        icon="book"
        onPress={props.onMistakes}
        testID="mode-mistakes"
        title={t('modes.mistakes')}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    marginBottom: 0,
  },
  collectionButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  collectionText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  mode: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    padding: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  modeCopy: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  modeIcon: {
    alignItems: 'center',
    width: 32,
  },
  modeOff: {
    opacity: 0.6,
  },
  modeText: {
    flex: 1,
    gap: 2,
  },
  modeTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.body,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  streak: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  streakText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.body,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.h3,
  },
});

/** A friend's challenge that arrived before the player made a profile. */
export function ChallengeBanner(props: { challenge: ChallengeSpec; onAccept: () => void; onLater: () => void }) {
  const { t } = useTranslation();

  return (
    <Card highlight style={styles.card} tone="panel">
      <View style={styles.row}>
        <PixelIcon color={colors.highlight} name="sword" size={22} />
        <Text accessibilityRole="header" style={[styles.title, styles.flex]}>
          {t('challenge.waiting', { name: props.challenge.from })}
        </Text>
      </View>
      <Text style={styles.modeCopy}>{t('challenge.toBeat', { correct: props.challenge.correct, score: props.challenge.score })}</Text>
      <PrimaryButton label={t('challenge.accept')} onPress={props.onAccept} testID="challenge-banner-accept" />
      <SecondaryButton label={t('challenge.later')} onPress={props.onLater} />
    </Card>
  );
}
