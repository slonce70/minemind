import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { colors, fonts, motion, radii, spacing, typography } from '../../theme/tokens';
import { useCountUp } from '../feel/use-count-up';
import { PixelIcon } from '../ui/pixel-icon';
import { PixelSprite } from '../ui/pixel-sprite';
import { achievementCatalog, type AchievementId } from './achievements';
import { cardsById, type CardRarity } from './cards';
import { dailyQuestGoals, dailyQuestXp, levelProgress, rankForLevel, type DailyQuestState, type MatchRewards } from './progression';

export const rarityColors: Record<CardRarity, string> = {
  common: '#A9BDA6',
  epic: '#B98AF2',
  legendary: '#F5CD30',
  rare: '#6CC4F5',
};

/** Thin XP bar that fills from `fromRatio` to `toRatio`. */
function Meter({ color = colors.highlight, delay = 0, fromRatio = 0, toRatio }: { color?: string; delay?: number; fromRatio?: number; toRatio: number }) {
  const reduceMotion = useReducedMotion();
  const fill = useSharedValue(reduceMotion ? toRatio : fromRatio);

  useEffect(() => {
    fill.value = reduceMotion
      ? toRatio
      : withDelay(delay, withTiming(toRatio, { duration: motion.countUp, easing: Easing.out(Easing.cubic) }));
  }, [delay, fill, reduceMotion, toRatio]);

  const style = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, fill.value)) * 100}%` }));

  return (
    <View style={styles.meterTrack}>
      <Animated.View style={[styles.meterFill, { backgroundColor: color }, style]} />
    </View>
  );
}

/** Level, rank and XP towards the next level. */
export function LevelBar({ fromXp, xp }: { fromXp?: number; xp: number }) {
  const { t } = useTranslation();
  const now = levelProgress(xp);
  const before = levelProgress(fromXp ?? xp);
  // On a level-up the bar starts from empty at the new level.
  const fromRatio = before.level === now.level ? before.current / before.needed : 0;

  return (
    <View
      accessibilityLabel={t('progress.levelA11y', { current: now.current, level: now.level, needed: now.needed })}
      accessible
      style={styles.levelBar}
    >
      <View style={styles.levelRow}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>{now.level}</Text>
        </View>
        <Text numberOfLines={1} style={styles.rankText}>
          {t(`progress.rank.${rankForLevel(now.level)}`)}
        </Text>
        <Text style={styles.xpText}>
          {now.current}/{now.needed}
        </Text>
      </View>
      <Meter fromRatio={fromRatio} toRatio={now.current / now.needed} />
    </View>
  );
}

export function CollectionCard({ count = 1, id, isNew, size = 96 }: { count?: number; id: string; isNew?: boolean; size?: number }) {
  const { t } = useTranslation();
  const card = cardsById.get(id);

  if (!card) {
    return null;
  }

  const name = t(`cards.${id}`);
  const rarity = t(`progress.rarity.${card.rarity}`);

  return (
    <View
      accessibilityLabel={`${name}, ${rarity}${count > 1 ? `, ×${count}` : ''}`}
      accessible
      style={[styles.card, { borderColor: rarityColors[card.rarity], width: size + spacing.sm * 2 }]}
    >
      <View style={styles.cardArt}>
        <PixelSprite size={size} sprite={card.sprite} />
      </View>
      <Text numberOfLines={2} style={styles.cardName}>
        {name}
      </Text>
      <Text style={[styles.cardRarity, { color: rarityColors[card.rarity] }]}>{rarity}</Text>
      {isNew ? (
        <View style={styles.cardNew}>
          <Text style={styles.cardNewText}>{t('progress.cardNew')}</Text>
        </View>
      ) : count > 1 ? (
        <Text style={styles.cardCount}>×{count}</Text>
      ) : null}
    </View>
  );
}

export function LockedCard({ size = 96 }: { size?: number }) {
  return (
    <View style={[styles.card, styles.cardLocked, { width: size + spacing.sm * 2 }]}>
      <View style={[styles.cardArt, { height: size, justifyContent: 'center' }]}>
        <Text style={styles.lockedMark}>?</Text>
      </View>
    </View>
  );
}

export function AchievementRow({ id, unlocked }: { id: AchievementId; unlocked: boolean }) {
  const { t } = useTranslation();
  const entry = achievementCatalog.find((candidate) => candidate.id === id);

  return (
    <View
      accessibilityLabel={`${t(`achievements.${id}.name`)}. ${t(`achievements.${id}.description`)}${unlocked ? '' : `. ${t('progress.lockedAchievement')}`}`}
      accessible
      style={[styles.achievement, !unlocked && styles.achievementLocked]}
    >
      <View style={[styles.achievementIcon, unlocked && styles.achievementIconOn]}>
        <PixelIcon color={unlocked ? colors.canvas : colors.textMuted} name={entry?.icon ?? 'star'} size={18} />
      </View>
      <View style={styles.achievementText}>
        <Text style={styles.achievementName}>{t(`achievements.${id}.name`)}</Text>
        <Text style={styles.achievementDescription}>{t(`achievements.${id}.description`)}</Text>
      </View>
    </View>
  );
}

export function DailyQuestRow({ quest }: { quest: DailyQuestState }) {
  const { t } = useTranslation();
  const goal = dailyQuestGoals[quest.questId];

  return (
    <View accessible accessibilityLabel={`${t('progress.dailyTitle')}: ${t(`progress.daily.${quest.questId}`)}, ${quest.progress}/${goal}`} style={styles.daily}>
      <View style={styles.levelRow}>
        <PixelIcon color={quest.done ? colors.success : colors.highlight} name={quest.done ? 'check' : 'map'} size={18} />
        <Text style={styles.dailyText}>{t(`progress.daily.${quest.questId}`)}</Text>
        <Text style={styles.xpText}>
          {quest.progress}/{goal}
        </Text>
      </View>
      <Meter color={quest.done ? colors.success : colors.highlight} toRatio={quest.progress / goal} />
      {quest.done ? <Text style={styles.dailyDone}>{t('progress.dailyDone', { xp: dailyQuestXp })}</Text> : null}
    </View>
  );
}

/** What the last round paid: XP, level, streak, daily quest, achievements and a card. */
export function RewardsPanel({ rewards }: { rewards: MatchRewards }) {
  const { t } = useTranslation();
  const shownXp = useCountUp(rewards.xp);
  const leveledUp = rewards.levelAfter > rewards.levelBefore;

  return (
    <View style={styles.rewards}>
      <View style={styles.rewardsHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('progress.rewardsTitle')}
        </Text>
        <Text accessibilityLabel={t('progress.xpGained', { xp: rewards.xp })} style={styles.xpGained}>
          {t('progress.xpGained', { xp: shownXp })}
        </Text>
      </View>

      {leveledUp ? (
        <Animated.View entering={ZoomIn.delay(motion.countUp).duration(motion.slow)} style={styles.levelUp}>
          <PixelIcon color={colors.canvas} name="star" size={18} />
          <Text accessibilityLiveRegion="polite" style={styles.levelUpText}>
            {t('progress.levelUp')} {t('progress.levelShort', { level: rewards.levelAfter })}
          </Text>
        </Animated.View>
      ) : null}

      <LevelBar fromXp={rewards.xpBefore} xp={rewards.xpBefore + rewards.xp} />

      <View style={styles.levelRow}>
        <PixelIcon color={colors.highlight} name="flame" size={18} />
        <Text style={styles.dailyText}>{t('progress.streakDays', { count: rewards.streak })}</Text>
      </View>

      <DailyQuestRow quest={rewards.daily} />

      {rewards.achievements.length > 0 ? (
        <View style={styles.rewardList}>
          <Text style={styles.subTitle}>{t('progress.achievementsTitle')}</Text>
          {rewards.achievements.map((id, index) => (
            <Animated.View entering={FadeInDown.delay(motion.countUp + index * 120).duration(motion.base)} key={id}>
              <AchievementRow id={id} unlocked />
            </Animated.View>
          ))}
        </View>
      ) : null}

      {rewards.card ? (
        <Animated.View entering={ZoomIn.delay(motion.countUp + 200).duration(motion.slow)} style={styles.cardReveal}>
          <Text style={styles.subTitle}>{t('progress.cardTitle')}</Text>
          <CollectionCard id={rewards.card.id} isNew={rewards.card.isNew} size={88} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  achievement: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  achievementDescription: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
  },
  achievementIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInset,
    borderRadius: radii.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  achievementIconOn: {
    backgroundColor: colors.highlight,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementName: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.body,
  },
  achievementText: {
    flex: 1,
    gap: 2,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 3,
    gap: spacing.xxs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
  },
  cardArt: {
    alignItems: 'center',
  },
  cardCount: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.micro,
  },
  cardLocked: {
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  cardName: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.caption,
    textAlign: 'center',
  },
  cardNew: {
    backgroundColor: colors.highlight,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
  },
  cardNewText: {
    color: colors.canvas,
    fontFamily: fonts.black,
    fontSize: typography.micro,
  },
  cardRarity: {
    fontFamily: fonts.bold,
    fontSize: typography.micro,
  },
  cardReveal: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  daily: {
    gap: spacing.xs,
  },
  dailyDone: {
    color: colors.success,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  dailyText: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: typography.body,
  },
  levelBadge: {
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: radii.sm,
    height: 32,
    justifyContent: 'center',
    minWidth: 32,
    paddingHorizontal: spacing.xs,
  },
  levelBadgeText: {
    color: colors.canvas,
    fontFamily: fonts.black,
    fontSize: typography.body,
  },
  levelBar: {
    gap: spacing.xs,
  },
  levelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  levelUp: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.highlight,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  levelUpText: {
    color: colors.canvas,
    fontFamily: fonts.black,
    fontSize: typography.body,
  },
  lockedMark: {
    color: colors.textMuted,
    fontFamily: fonts.display,
    fontSize: typography.h1,
  },
  meterFill: {
    borderRadius: radii.sm,
    height: '100%',
  },
  meterTrack: {
    backgroundColor: colors.surfaceInset,
    borderRadius: radii.sm,
    height: 10,
    overflow: 'hidden',
  },
  rankText: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: typography.body,
  },
  rewardList: {
    gap: spacing.xs,
  },
  rewards: {
    gap: spacing.md,
  },
  rewardsHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h3,
  },
  subTitle: {
    color: colors.textMuted,
    fontFamily: fonts.display,
    fontSize: typography.micro,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  xpGained: {
    color: colors.highlight,
    fontFamily: fonts.black,
    fontSize: typography.h3,
  },
  xpText: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
});
