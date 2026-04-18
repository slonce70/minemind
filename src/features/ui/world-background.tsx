import { StyleSheet, View, type ViewProps } from 'react-native';

import { radii } from '../../theme/tokens';
import { themeArt } from './theme-art';

type WorldBackgroundProps = ViewProps & {
  children: React.ReactNode;
  variant: keyof typeof themeArt;
};

export function WorldBackground({ children, style, variant, ...props }: WorldBackgroundProps) {
  const art = themeArt[variant];

  return (
    <View style={[styles.shell, { backgroundColor: art.backdrop }, style]} {...props}>
      <View style={[styles.glow, { backgroundColor: art.glow }]} />
      <View style={[styles.horizon, { backgroundColor: art.horizon }]} />
      <View style={[styles.stripe, { backgroundColor: art.stripe }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 0,
  },
  glow: {
    borderRadius: 140,
    height: 140,
    position: 'absolute',
    right: -20,
    top: -30,
    width: 140,
  },
  horizon: {
    bottom: 0,
    height: '48%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  shell: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  stripe: {
    bottom: 20,
    height: 18,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
