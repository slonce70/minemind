import { useMemo } from 'react';

import { colors } from '../../theme/tokens';
import { pixelIcons, type PixelIconName } from './pixel-art';
import { PixelSprite } from './pixel-sprite';

export type { PixelIconName } from './pixel-art';

type PixelIconProps = {
  accent?: string;
  accessibilityLabel?: string;
  color?: string;
  name: PixelIconName;
  size?: number;
};

const accentOpacity = { '+': 0.45 };

export function PixelIcon({ accent, accessibilityLabel, color = colors.textPrimary, name, size = 20 }: PixelIconProps) {
  const sprite = useMemo(
    () => ({ palette: { '#': color, '+': accent ?? color }, rows: pixelIcons[name] }),
    [accent, color, name]
  );

  return (
    <PixelSprite
      accessibilityLabel={accessibilityLabel}
      opacities={accent ? undefined : accentOpacity}
      size={size}
      sprite={sprite}
    />
  );
}
