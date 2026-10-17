import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii, shadows, spacing, typography } from '../../theme/tokens';
import type { PixelIconName } from './pixel-art';
import { PixelIcon } from './pixel-icon';

type BadgeChipProps = {
  icon?: PixelIconName;
  label: string;
  tone?: 'danger' | 'success' | 'warning';
};

const toneStyles = {
  danger: {
    backgroundColor: 'rgba(255, 108, 122, 0.16)',
    borderColor: colors.danger,
    color: colors.danger,
  },
  success: {
    backgroundColor: 'rgba(110, 240, 166, 0.16)',
    borderColor: colors.success,
    color: colors.success,
  },
  warning: {
    backgroundColor: 'rgba(255, 216, 77, 0.16)',
    borderColor: colors.highlight,
    color: colors.highlight,
  },
} as const;

export function BadgeChip({ icon, label, tone = 'warning' }: BadgeChipProps) {
  const style = toneStyles[tone];

  return (
    <View style={[styles.plate, { backgroundColor: style.backgroundColor, borderColor: style.borderColor }]}>
      {icon ? <PixelIcon color={style.color} name={icon} size={16} /> : null}
      <Text style={[styles.label, { color: style.color }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.lg,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.xs,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...shadows.soft,
  },
  label: {
    flexShrink: 1,
    fontFamily: fonts.display,
    fontSize: typography.micro,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
