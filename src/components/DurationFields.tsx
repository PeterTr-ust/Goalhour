import { useId } from 'react';
import { MAX_MINUTE_FIELD, type DurationInput } from '../lib/duration';
import { strings } from '../lib/strings';

interface DurationFieldsProps {
  legend: string;
  value: DurationInput;
  onChange: (value: DurationInput) => void;
  error?: string | undefined;
}

export const FIELD_CLASSES =
  'block min-h-12 w-full min-w-0 appearance-none rounded-2xl border border-line bg-surface px-4 text-left text-lg tabular-nums text-fg outline-none transition-colors focus:border-fg';

/** Two numeric inputs for hours and minutes. */
export function DurationFields({ legend, value, onChange, error }: DurationFieldsProps) {
  const hoursId = useId();
  const minutesId = useId();
  const errorId = useId();
  const describedBy = error ? errorId : undefined;

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-muted">{legend}</legend>
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor={hoursId} className="mb-1 block text-sm">
            {strings.sheet.hours}
          </label>
          <input
            id={hoursId}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={value.hours}
            aria-invalid={error !== undefined}
            aria-describedby={describedBy}
            onChange={(event) => onChange({ ...value, hours: event.target.value })}
            className={FIELD_CLASSES}
          />
        </div>
        <div className="flex-1">
          <label htmlFor={minutesId} className="mb-1 block text-sm">
            {strings.sheet.minutes}
          </label>
          <input
            id={minutesId}
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_MINUTE_FIELD}
            step={1}
            value={value.minutes}
            aria-invalid={error !== undefined}
            aria-describedby={describedBy}
            onChange={(event) => onChange({ ...value, minutes: event.target.value })}
            className={FIELD_CLASSES}
          />
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 animate-fade-in text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
