import { Redirect, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../src/components/ui/card';
import { LoadingScreen } from '../src/components/ui/loading-screen';
import { Screen } from '../src/components/ui/screen';
import { ScreenHeader } from '../src/components/ui/screen-header';
import { achievementCatalog } from '../src/features/progress/achievements';
import { cardCatalog } from '../src/features/progress/cards';
import { AchievementRow, CollectionCard, LevelBar, LockedCard } from '../src/features/progress/progress-parts';
import { useAppStore } from '../src/state/app-store';
import { colors, fonts, spacing, typography } from '../src/theme/tokens';

export default function CollectionRoute() {
  const { t } = useTranslation();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const profile = useAppStore((state) => state.profile);
  const progress = useAppStore((state) => state.progress);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  const owned = cardCatalog.filter((card) => progress.cards[card.id]).length;
  const unlocked = achievementCatalog.filter((entry) => progress.achievements[entry.id]).length;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader backLabel={t('common.back')} title={t('progress.collectionTitle')} />

      <Card highlight>
        <LevelBar xp={progress.xp} />
      </Card>

      <Card tone="panel">
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('progress.collectionTitle')}
          </Text>
          <Text style={styles.count}>{t('progress.collectionCount', { owned, total: cardCatalog.length })}</Text>
        </View>
        <View style={styles.cards}>
          {cardCatalog.map((card) =>
            progress.cards[card.id] ? (
              <CollectionCard count={progress.cards[card.id]} id={card.id} key={card.id} size={72} />
            ) : (
              <LockedCard key={card.id} size={72} />
            )
          )}
        </View>
      </Card>

      <Card tone="panel">
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('progress.achievementsTitle')}
          </Text>
          <Text style={styles.count}>{t('progress.collectionCount', { owned: unlocked, total: achievementCatalog.length })}</Text>
        </View>
        {achievementCatalog.map((entry) => (
          <AchievementRow id={entry.id} key={entry.id} unlocked={Boolean(progress.achievements[entry.id])} />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  count: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  header: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h3,
  },
});
