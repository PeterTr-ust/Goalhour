import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { formatDuration, formatSignedDuration } from '../lib/duration';
import type { GoalStatus } from '../lib/goal';
import { strings } from '../lib/strings';

function AnimatedDuration({ minutes, signed = false }: { minutes: number; signed?: boolean }) {
  const shown = Math.round(useAnimatedNumber(minutes));
  return <>{signed ? formatSignedDuration(shown) : formatDuration(shown)}</>;
}

/** "Noch fehlend 17:30" (red) or "Ziel erreicht" / "Ziel überschritten +2:30" (green). */
export function GoalStatusLine({ status }: { status: GoalStatus }) {
  switch (status.kind) {
    case 'noGoal':
      return <p className="text-sm text-muted">{strings.month.noGoal}</p>;
    case 'missing':
      return (
        <p className="text-base text-danger">
          {strings.month.missing}{' '}
          <strong className="font-semibold tabular-nums">
            <AnimatedDuration minutes={status.minutes} />
          </strong>
        </p>
      );
    case 'reached':
      return (
        <p className="animate-fade-up text-base font-semibold text-success">
          <span aria-hidden="true">✓ </span>
          {strings.month.reached}
        </p>
      );
    case 'exceeded':
      return (
        <p className="animate-fade-up text-base font-semibold text-success">
          <span aria-hidden="true">✓ </span>
          {strings.month.exceeded}{' '}
          <span className="tabular-nums">
            <AnimatedDuration minutes={status.minutes} signed />
          </span>
        </p>
      );
  }
}
