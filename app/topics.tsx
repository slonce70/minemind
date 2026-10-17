import { Redirect, Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Card } from '../src/components/ui/card';
import { LoadingScreen } from '../src/components/ui/loading-screen';
import { Screen } from '../src/components/ui/screen';
import { ScreenHeader } from '../src/components/ui/screen-header';
import { difficultyConfig } from '../src/features/content/difficulty-config';
import { minecraftTopicConfig } from '../src/features/content/topic-config';
import { contentTopics } from '../src/features/content/types';
import { feedback } from '../src/features/feel/feedback';
import { DifficultySelector } from '../src/features/home/difficulty-selector';
import { PixelIcon } from '../src/features/ui/pixel-icon';
import { useAppStore } from '../src/state/app-store';
import { appTheme, colors, fonts, radii, spacing, typography } from '../src/theme/tokens';

export default function TopicsRoute() {
  const { t } = useTranslation();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const profile = useAppStore((state) => state.profile);
  const topicCorrect = useAppStore((state) => state.progress.topicCorrect);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const setSelectedDifficulty = useAppStore((state) => state.setSelectedDifficulty);
  const { width } = useWindowDimensions();
  const isWide = width >= appTheme.layout.wideBreakpoint;

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader backLabel={t('common.back')} title={t('modes.topicsTitle')} />

      <Card tone="panel">
        <DifficultySelector
          label={t('home.difficultyLabel')}
          onSelect={setSelectedDifficulty}
          selectedDifficulty={selectedDifficulty}
          strings={{
            easy: t(difficultyConfig.easy.translationKey),
            hard: t(difficultyConfig.hard.translationKey),
            medium: t(difficultyConfig.medium.translationKey),
          }}
          timerLabel={(seconds) => t('home.timerA11y', { seconds })}
        />
      </Card>

      <View style={[styles.grid, isWide && styles.gridWide]}>
        {contentTopics.map((topicId) => {
          const topic = minecraftTopicConfig[topicId];
          const name = t(topic.translationKey);
          const correct = topicCorrect[topicId] ?? 0;

          return (
            <Pressable
              accessibilityHint={t('modes.topicCorrect', { count: correct })}
              accessibilityLabel={`${t('modes.play')}: ${name}`}
              accessibilityRole="button"
              key={topicId}
              onPress={() => {
                feedback.tap();
                router.push(`/solo?variant=topic&topic=${topicId}`);
              }}
              style={[styles.topic, isWide && styles.topicWide]}
              testID={`topic-${topicId}`}
            >
              <View style={styles.topicIcon}>
                <PixelIcon color={colors.highlight} name={topic.icon} size={28} />
              </View>
              <View style={styles.topicText}>
                <Text style={styles.topicName}>{name}</Text>
                <Text style={styles.topicMeta}>{t('modes.topicCorrect', { count: correct })}</Text>
              </View>
              <PixelIcon color={colors.textMuted} name="play" size={16} />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.sm,
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  topic: {
    alignItems: 'center',
    backgroundColor: colors.panelSurface,
    borderColor: colors.panelEdge,
    borderRadius: radii.lg,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md,
  },
  topicIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInset,
    borderRadius: radii.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  topicMeta: {
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
    fontSize: typography.caption,
  },
  topicName: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.body,
  },
  topicText: {
    flex: 1,
    gap: 2,
  },
  topicWide: {
    flexBasis: '48%',
    flexGrow: 1,
  },
});
