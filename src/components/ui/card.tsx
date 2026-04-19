import { StyleSheet, View, type ViewProps } from 'react-native';

import { appTheme, colors, radii, shadows, spacing } from '../../theme/tokens';

type CardProps = ViewProps & {
  highlight?: boolean;
  tone?: 'panel' | 'scene' | 'utility';
};

export function Card({ children, highlight = false, style, tone = 'panel', ...props }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        tone === 'scene' ? styles.scene : tone === 'utility' ? styles.utility : styles.panel,
        styles.innerStroke,
        highlight && styles.highlight,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    borderWidth: 2,
    gap: appTheme.layout.screenGap,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.panel,
  },
  innerStroke: {
    boxShadow: `inset 0 1px 0 ${colors.surfaceInset}`,
  },
  panel: {
    backgroundColor: colors.panelSurface,
    borderColor: colors.panelEdge,
  },
  scene: {
    backgroundColor: colors.sceneSurface,
    borderColor: colors.sceneEdge,
  },
  utility: {
    backgroundColor: colors.utilitySurface,
    borderColor: colors.utilityEdge,
  },
  highlight: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderFocus,
  },
});
