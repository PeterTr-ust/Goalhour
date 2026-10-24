import { useId } from 'react';

const GAP_REM = 0.25;
const PADDING_REM = 0.25;

interface SegmentedControlProps<T extends string> {
  legend: string;
  /** Hides the legend visually but keeps it for screen readers. */
  hideLegend?: boolean;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** iOS-style segmented control built from radio buttons, with a sliding selection pill. */
export function SegmentedControl<T extends string>({
  legend,
  hideLegend = false,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId();
  const count = options.length;
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );
  const pillWidth = `calc((100% - ${2 * PADDING_REM + (count - 1) * GAP_REM}rem) / ${count})`;

  return (
    <fieldset>
      <legend className={hideLegend ? 'sr-only' : 'mb-2 text-sm font-medium text-muted'}>
        {legend}
      </legend>
      <div
        className="relative grid gap-1 rounded-2xl bg-surface p-1"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 rounded-xl bg-fg shadow-sm transition-transform duration-300 ease-out"
          style={{
            width: pillWidth,
            transform: `translateX(calc(${selectedIndex} * (100% + ${GAP_REM}rem)))`,
          }}
        />
        {options.map((option) => (
          <label
            key={option.value}
            className={`relative flex min-h-11 cursor-pointer items-center justify-center rounded-xl text-base font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-fg ${
              option.value === value ? 'text-bg' : 'text-muted'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
