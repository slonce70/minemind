import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { mascotSprites, type MascotMood } from './pixel-art';
import { PixelSprite } from './pixel-sprite';

export type { MascotMood } from './pixel-art';

// Kubik, the MineMind mascot (sprites in pixel-art.ts).
type MascotProps = {
  accessibilityLabel?: string;
  /** Gentle idle bounce; off when the system asks for reduced motion. */
  animated?: boolean;
  mood?: MascotMood;
  size?: number;
};

export function Mascot({ accessibilityLabel, animated = true, mood = 'happy', size = 96 }: MascotProps) {
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);
  const shouldAnimate = animated && !reduceMotion;

  useEffect(() => {
    if (!shouldAnimate) {
      lift.value = 0;
      return undefined;
    }

    lift.value = withRepeat(
      withSequence(
        withTiming(-size * 0.06, { duration: 700, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) })
      ),
      -1
    );

    return () => cancelAnimation(lift);
  }, [lift, shouldAnimate, size]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));

  return (
    <Animated.View style={style}>
      <PixelSprite accessibilityLabel={accessibilityLabel} size={size} sprite={mascotSprites[mood]} />
    </Animated.View>
  );
}
