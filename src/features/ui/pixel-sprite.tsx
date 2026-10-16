import { memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { spriteRuns, type PixelSpriteData } from './pixel-art';

export type { PixelSpriteData } from './pixel-art';

type PixelSpriteProps = {
  accessibilityLabel?: string;
  opacities?: Record<string, number>;
  size: number;
  sprite: PixelSpriteData;
};

export const PixelSprite = memo(function PixelSprite({ accessibilityLabel, opacities, size, sprite }: PixelSpriteProps) {
  const runs = useMemo(() => spriteRuns(sprite, opacities), [opacities, sprite]);
  const columns = sprite.rows[0]?.length ?? 1;
  const rows = sprite.rows.length;

  return (
    <View
      accessibilityElementsHidden={!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessible={Boolean(accessibilityLabel)}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    >
      <Svg height={(size * rows) / columns} viewBox={`0 0 ${columns} ${rows}`} width={size}>
        {runs.map((run) => (
          <Rect
            fill={run.color}
            fillOpacity={run.opacity}
            // A hair of overlap hides anti-aliasing seams between rows.
            height={run.opacity === undefined ? 1.04 : 1}
            key={`${run.x}-${run.y}`}
            width={run.width}
            x={run.x}
            y={run.y}
          />
        ))}
      </Svg>
    </View>
  );
});
