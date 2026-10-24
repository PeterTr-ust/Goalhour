/** Fast start, gentle stop. Maps 0..1 to 0..1. */
export function easeOutCubic(progress: number): number {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return 1 - (1 - clamped) ** 3;
}

/** Value between `from` and `to` at the given eased progress (0..1). */
export function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * easeOutCubic(progress);
}
