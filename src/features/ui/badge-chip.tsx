import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows, spacing, typography } from '../../theme/tokens';
import { iconMap } from './icon-map';

type BadgeChipProps = {
  icon?: keyof typeof iconMap;
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
      {icon ? <Text style={[styles.icon, { color: style.color }]}>{iconMap[icon]}</Text> : null}
      <Text numberOfLines={2} style={[styles.label, { color: style.color }]}>
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
  icon: {
    fontSize: typography.micro,
    fontWeight: '900',
  },
  label: {
    flexShrink: 1,
    fontSize: typography.micro,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
