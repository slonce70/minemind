import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { motion } from '../../theme/tokens';

/** Counts from 0 up to `target` with an ease-out; shows the final value at once under reduced motion. */
export function useCountUp(target: number, duration: number = motion.countUp) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion || target <= 0) {
      setValue(target);
      return undefined;
    }

    let frame = 0;
    const startedAt = Date.now();
    const step = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);

      setValue(Math.round(target * (1 - (1 - progress) ** 3)));

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [duration, reduceMotion, target]);

  return value;
}
