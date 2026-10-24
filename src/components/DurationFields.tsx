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
  'min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-lg tabular-nums dark:border-slate-700 dark:bg-slate-800';

/** Two numeric inputs for hours and minutes. */
export function DurationFields({ legend, value, onChange, error }: DurationFieldsProps) {
  const hoursId = useId();
  const minutesId = useId();
  const errorId = useId();
  const describedBy = error ? errorId : undefined;

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
        {legend}
      </legend>
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
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </fieldset>
  );
}
