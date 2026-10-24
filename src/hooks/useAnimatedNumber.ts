import { useEffect, useRef, useState } from 'react';
import { interpolate } from '../lib/animation';

const DEFAULT_DURATION_MS = 700;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Smoothly animates from the previously shown value to `target` (starting at 0 on mount). */
export function useAnimatedNumber(target: number, durationMs = DEFAULT_DURATION_MS): number {
  const [value, setValue] = useState(0);
  const shownRef = useRef(0);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      shownRef.current = target;
      return;
    }

    const from = shownRef.current;
    let frame = 0;
    let start: number | undefined;

    const step = (now: number) => {
      start ??= now;
      const progress = (now - start) / durationMs;
      const next = progress >= 1 ? target : interpolate(from, target, progress);
      shownRef.current = next;
      setValue(next);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reducedMotion]);

  return reducedMotion ? target : value;
}
