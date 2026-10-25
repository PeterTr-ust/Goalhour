import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { formatDuration } from '../lib/duration';
import { monthlyPlan } from '../lib/plan';
import { strings } from '../lib/strings';

interface PlanCardProps {
  yearGoal: number | undefined;
  weeksOff: number;
  onEditWeeksOff: () => void;
}

/** Suggests the monthly hours needed to reach the year goal despite planned weeks off. */
export function PlanCard({ yearGoal, weeksOff, onEditWeeksOff }: PlanCardProps) {
  const plan = yearGoal === undefined ? undefined : monthlyPlan(yearGoal, weeksOff);
  const shownPerMonth = Math.round(useAnimatedNumber(plan?.perMonth ?? 0));

  return (
    <section aria-labelledby="plan-title" className="rounded-3xl bg-surface p-5">
      <h2 id="plan-title" className="mb-3 text-sm font-semibold text-muted">
        {strings.plan.title}
      </h2>

      {plan && yearGoal !== undefined ? (
        <div className="mb-4">
          <p className="text-sm text-muted">{strings.plan.suggestion}</p>
          <p
            className="text-4xl font-bold tracking-tight tabular-nums"
            aria-label={formatDuration(plan.perMonth)}
          >
            {formatDuration(shownPerMonth)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {strings.plan.explanation(formatDuration(yearGoal), plan.activeWeeks)}
          </p>
        </div>
      ) : (
        <p className="mb-4 text-sm text-muted">{strings.plan.needsGoal}</p>
      )}

      <button
        type="button"
        onClick={onEditWeeksOff}
        aria-label={strings.plan.editWeeksOff(strings.plan.weeksValue(weeksOff))}
        className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-bg px-4 text-left transition-transform duration-150 active:scale-[0.98]"
      >
        <span className="font-medium">{strings.plan.weeksOff}</span>
        <span className="text-lg font-semibold tabular-nums">
          {strings.plan.weeksValue(weeksOff)}
          <span aria-hidden="true" className="ml-2 text-muted">
            ›
          </span>
        </span>
      </button>
    </section>
  );
}
