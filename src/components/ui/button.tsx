import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { appTheme, colors, radii, spacing, typography } from '../../theme/tokens';

type ButtonProps = PressableProps & {
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, selected = false, style, ...props }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles.primary,
        selected && styles.primarySelected,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.label, styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, selected = false, style, ...props }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles.secondary,
        selected && styles.secondarySelected,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.label, styles.secondaryLabel, selected && styles.secondarySelectedLabel]}>
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
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },
  primary: {
    backgroundColor: colors.highlight,
    borderColor: 'rgba(51, 35, 10, 0.24)',
    boxShadow: '0 10px 24px rgba(255, 216, 77, 0.22)',
  },
  primarySelected: {
    boxShadow: '0 12px 28px rgba(255, 216, 77, 0.28)',
  },
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
  },
  secondarySelected: {
    backgroundColor: 'rgba(255, 216, 77, 0.14)',
    borderColor: colors.highlight,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 0.2,
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
