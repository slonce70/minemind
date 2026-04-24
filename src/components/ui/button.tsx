import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { appTheme, colors, radii, shadows, spacing, typography } from '../../theme/tokens';

type ButtonProps = PressableProps & {
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, selected = false, style, ...props }: ButtonProps) {
  const { disabled } = props;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles.buttonRidge,
        styles.buttonFace,
        styles.buttonLip,
        styles.primary,
        selected && styles.primarySelected,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text
        numberOfLines={2}
        style={[styles.label, styles.primaryLabel, disabled && styles.disabledLabel]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, selected = false, style, ...props }: ButtonProps) {
  const { disabled } = props;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles.buttonRidge,
        styles.buttonFace,
        styles.buttonLip,
        styles.secondary,
        selected && styles.secondarySelected,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text
        numberOfLines={2}
        style={[
          styles.label,
          styles.secondaryLabel,
          selected && styles.secondarySelectedLabel,
          disabled && styles.disabledLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: appTheme.layout.controlHeight,
    minWidth: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonFace: {
    ...shadows.block,
  },
  buttonRidge: {
    boxShadow: '0 4px 0 rgba(13, 20, 16, 0.18)',
  },
  buttonLip: {
    borderBottomWidth: 0,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },
  primary: {
    backgroundColor: colors.torch,
    borderColor: colors.borderFocus,
  },
  primarySelected: {
    backgroundColor: colors.surfaceAccent,
  },
  secondary: {
    backgroundColor: colors.panelSurface,
    borderColor: colors.panelEdge,
  },
  secondarySelected: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderFocus,
  },
  disabled: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    opacity: 0.52,
  },
  disabledLabel: {
    color: colors.textMuted,
  },
  label: {
    flexShrink: 1,
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 0.2,
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryLabel: {
    color: colors.canvas,
  },
  secondaryLabel: {
    color: colors.textPrimary,
  },
  secondarySelectedLabel: {
    color: colors.highlight,
  },
});
