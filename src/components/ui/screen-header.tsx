import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { feedback } from '../../features/feel/feedback';
import { PixelIcon } from '../../features/ui/pixel-icon';
import { colors, fonts, radii, spacing, typography } from '../../theme/tokens';

type ScreenHeaderProps = {
  backLabel: string;
  title: string;
};

/** Back button and title for secondary screens; falls back to home when there is no history. */
export function ScreenHeader({ backLabel, title }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={backLabel}
        accessibilityRole="button"
        hitSlop={6}
        onPress={() => {
          feedback.tap();

          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/home');
          }
        }}
        style={styles.back}
      >
        <PixelIcon color={colors.textPrimary} name="arrow-left" size={18} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.display,
    fontSize: typography.h1,
  },
});
