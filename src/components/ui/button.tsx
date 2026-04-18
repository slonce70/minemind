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
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, style, ...props }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.base, styles.primary, pressed && styles.pressed, style]}
      {...props}
    >
      <Text style={[styles.label, styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, style, ...props }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.base, styles.secondary, pressed && styles.pressed, style]}
      {...props}
    >
      <Text style={[styles.label, styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.full,
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
    boxShadow: '0 10px 24px rgba(255, 216, 77, 0.22)',
  },
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
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
});
