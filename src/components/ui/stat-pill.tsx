import { StyleSheet, Text, View } from 'react-native';

import { appTheme, colors, radii, spacing, typography } from '../../theme/tokens';

type StatPillProps = {
  label: string;
  value: string;
};

export function StatPill({ label, value }: StatPillProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    minWidth: 92,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.micro,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
});
