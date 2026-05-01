import { StyleSheet, View, type ViewProps } from 'react-native';

import { radii } from '../../theme/tokens';
import { themeArt } from './theme-art';

type WorldBackgroundProps = ViewProps & {
  children: React.ReactNode;
  showTerrain?: boolean;
  variant: keyof typeof themeArt;
};

export function WorldBackground({
  children,
  showTerrain = true,
  style,
  variant,
  ...props
}: WorldBackgroundProps) {
  const art = themeArt[variant];

  return (
    <View style={[styles.shell, { backgroundColor: art.backdrop }, style]} {...props}>
      {showTerrain ? (
        <View style={[styles.layers, styles.passThrough]}>
          <View style={[styles.mist, { backgroundColor: art.mist }]} />
          <View style={[styles.terrainTop, { backgroundColor: art.terrainTop }]} />
          <View style={[styles.terrainMid, { backgroundColor: art.terrainMid }]} />
          <View style={[styles.terrainBottom, { backgroundColor: art.terrainBottom }]} />
          <View style={[styles.detail, { backgroundColor: art.detail }]} />
        </View>
      ) : null}
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
    bottom: '12%',
    height: '10%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  terrainMid: {
    bottom: '5%',
    height: '8%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  terrainBottom: {
    bottom: 0,
    height: '8%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  detail: {
    bottom: 2,
    height: 4,
    left: '8%',
    position: 'absolute',
    right: '8%',
  },
  contentShell: {
    position: 'relative',
    zIndex: 1,
  },
});
