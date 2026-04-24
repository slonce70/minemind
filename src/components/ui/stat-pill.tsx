import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows, spacing, typography } from '../../theme/tokens';

type StatPillProps = {
  label: string;
  value: string;
};

export function StatPill({ label, value }: StatPillProps) {
  return (
    <View style={styles.inset}>
      <Text numberOfLines={2} style={styles.label}>
        {label}
      </Text>
      <Text numberOfLines={2} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inset: {
    backgroundColor: colors.utilitySurface,
    borderColor: colors.utilityEdge,
    borderRadius: radii.lg,
    borderWidth: 2,
    flexShrink: 1,
    maxWidth: '100%',
    minWidth: 92,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.block,
  },
  label: {
    color: colors.textMuted,
    flexShrink: 1,
    fontSize: typography.micro,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontSize: typography.caption,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
});
