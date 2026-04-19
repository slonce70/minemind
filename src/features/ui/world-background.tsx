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
      <View style={[styles.layers, styles.passThrough]}>
        <View style={[styles.mist, { backgroundColor: art.mist }]} />
        <View style={[styles.terrainTop, { backgroundColor: art.terrainTop }]} />
        <View style={[styles.terrainMid, { backgroundColor: art.terrainMid }]} />
        <View style={[styles.terrainBottom, { backgroundColor: art.terrainBottom }]} />
        <View style={[styles.detail, { backgroundColor: art.detail }]} />
      </View>
      <View style={styles.contentShell}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  layers: {
    ...StyleSheet.absoluteFillObject,
  },
  passThrough: {
    pointerEvents: 'none',
  },
  mist: {
    ...StyleSheet.absoluteFillObject,
  },
  terrainTop: {
    bottom: '52%',
    height: '30%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  terrainMid: {
    bottom: '20%',
    height: '34%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  terrainBottom: {
    bottom: 0,
    height: '24%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  detail: {
    bottom: 22,
    height: 10,
    left: '8%',
    position: 'absolute',
    right: '8%',
  },
  contentShell: {
    position: 'relative',
    zIndex: 1,
  },
});
