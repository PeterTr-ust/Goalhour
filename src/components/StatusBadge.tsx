import { strings } from '../lib/strings';

interface StatusBadgeProps {
  closed: boolean;
  size?: 'small' | 'large';
}

/** Green "Abgeschlossen" or grey "offen". The text carries the meaning, color only adds to it. */
export function StatusBadge({ closed, size = 'small' }: StatusBadgeProps) {
  const sizeClasses = size === 'large' ? 'gap-1 px-3 py-1 text-sm' : 'gap-0.5 px-2 py-0.5 text-xs';

  if (closed) {
    return (
      <span
        className={`inline-flex animate-pop-in items-center rounded-full bg-success font-semibold text-on-status ${sizeClasses}`}
      >
        <span aria-hidden="true">✓</span>
        {size === 'large' ? strings.month.closed : strings.serviceYear.closed}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border border-line font-semibold text-muted ${sizeClasses}`}
    >
      {strings.serviceYear.open}
    </span>
  );
}
