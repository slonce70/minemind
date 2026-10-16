import { StyleSheet, View } from 'react-native';

import { colors, radii } from '../../theme/tokens';
import { PixelSprite } from '../ui/pixel-sprite';
import { avatarLookup, avatarPresets } from './avatar-presets';

type PlayerAvatarProps = {
  accessibilityLabel?: string;
  avatarId?: string;
  size?: number;
};

/** A player's pixel critter on a tinted tile. Unknown ids (older clients) get the first avatar. */
export function PlayerAvatar({ accessibilityLabel, avatarId, size = 48 }: PlayerAvatarProps) {
  const preset = (avatarId && avatarLookup[avatarId]) || avatarPresets[0];

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessible={Boolean(accessibilityLabel)}
      style={[
        styles.tile,
        { backgroundColor: `${preset.color}33`, borderColor: preset.color, height: size, width: size },
      ]}
    >
      <PixelSprite size={size * 0.74} sprite={preset.sprite} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 2,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.canvas,
  },
});
