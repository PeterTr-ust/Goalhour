interface PeriodNavigatorProps {
  label: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}

/** Heading with arrows to step back and forth, e.g. "‹ Oktober 2026 ›". */
export function PeriodNavigator({
  label,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
}: PeriodNavigatorProps) {
  const arrowClasses =
    'flex size-12 items-center justify-center rounded-full text-3xl leading-none text-fg transition-[transform,background-color] duration-150 active:scale-90 active:bg-surface';

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        aria-label={previousLabel}
        onClick={onPrevious}
        className={arrowClasses}
      >
        <span aria-hidden="true">‹</span>
      </button>
      <h1 className="text-xl font-semibold" aria-live="polite">
        {label}
      </h1>
      <button type="button" aria-label={nextLabel} onClick={onNext} className={arrowClasses}>
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}
