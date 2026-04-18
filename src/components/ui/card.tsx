import { StyleSheet, View, type ViewProps } from 'react-native';

import { appTheme, colors, radii, shadows, spacing } from '../../theme/tokens';

type CardProps = ViewProps & {
  highlight?: boolean;
};

export function Card({ children, highlight = false, style, ...props }: CardProps) {
  return (
    <View style={[styles.base, highlight && styles.highlight, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 2,
    gap: appTheme.layout.screenGap,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  highlight: {
    borderColor: colors.highlight,
    backgroundColor: 'rgba(18, 34, 22, 0.94)',
  },
});
