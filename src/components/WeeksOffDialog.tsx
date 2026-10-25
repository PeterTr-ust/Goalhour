import { useId, useState, type FormEvent } from 'react';
import { MAX_WEEKS_OFF, validateWeeksOff } from '../lib/plan';
import { strings } from '../lib/strings';
import { Button } from './Button';
import { FIELD_CLASSES } from './DurationFields';
import { Modal } from './Modal';

interface WeeksOffDialogProps {
  serviceYear: string;
  current: number;
  onSave: (weeks: number) => Promise<boolean>;
  onClose: () => void;
}

const STEPPER_CLASSES =
  'flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-2xl font-semibold transition-transform duration-150 active:scale-90 disabled:text-subtle disabled:active:scale-100';

/** Number of weeks without service, with +/- buttons for one-handed use. */
export function WeeksOffDialog({ serviceYear, current, onSave, onClose }: WeeksOffDialogProps) {
  const [value, setValue] = useState(String(current));
  const [error, setError] = useState<string>();
  const inputId = useId();
  const errorId = useId();
  const parsed = value.trim() === '' ? 0 : Number(value);

  const step = (delta: number) => {
    const base = Number.isInteger(parsed) ? parsed : current;
    setValue(String(Math.min(Math.max(base + delta, 0), MAX_WEEKS_OFF)));
    setError(undefined);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateWeeksOff(parsed);
    if (validationError) {
      setError(strings.errors.weeksOff[validationError]);
      return;
    }
    if (await onSave(parsed)) {
      onClose();
    }
  };

  return (
    <Modal title={strings.plan.dialogTitle} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <p className="text-sm text-muted">{strings.plan.dialogDescription(serviceYear)}</p>
        <div>
          <label htmlFor={inputId} className="mb-1 block text-sm">
            {strings.plan.weeksOff}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={strings.plan.decrease}
              onClick={() => step(-1)}
              disabled={parsed <= 0}
              className={STEPPER_CLASSES}
            >
              <span aria-hidden="true">−</span>
            </button>
            <input
              id={inputId}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_WEEKS_OFF}
              step={1}
              value={value}
              aria-invalid={error !== undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => setValue(event.target.value)}
              className={`${FIELD_CLASSES} text-center`}
            />
            <button
              type="button"
              aria-label={strings.plan.increase}
              onClick={() => step(1)}
              disabled={parsed >= MAX_WEEKS_OFF}
              className={STEPPER_CLASSES}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
          {error && (
            <p id={errorId} role="alert" className="mt-2 animate-fade-in text-sm text-danger">
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Button type="submit">{strings.sheet.save}</Button>
          <Button variant="secondary" onClick={onClose}>
            {strings.sheet.cancel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
