import { useState, type FormEvent } from 'react';
import {
  parseDurationInput,
  toDurationInput,
  toMinutes,
  validateGoal,
  type DurationInput,
} from '../lib/duration';
import { formatMonth, strings } from '../lib/strings';
import type { MonthKey } from '../lib/types';
import { Button } from './Button';
import { DurationFields } from './DurationFields';
import { Modal } from './Modal';

interface GoalDialogProps {
  month: MonthKey;
  currentGoal: number | undefined;
  onSave: (minutes: number) => Promise<boolean>;
  onClose: () => void;
}

export function GoalDialog({ month, currentGoal, onSave, onClose }: GoalDialogProps) {
  const [value, setValue] = useState<DurationInput>(
    currentGoal === undefined ? { hours: '', minutes: '' } : toDurationInput(currentGoal),
  );
  const [error, setError] = useState<string>();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseDurationInput(value);
    const validationError = validateGoal(parsed);
    if (validationError) {
      setError(strings.errors.duration[validationError]);
      return;
    }
    if (await onSave(toMinutes(parsed))) {
      onClose();
    }
  };

  return (
    <Modal title={strings.goalDialog.title} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {strings.goalDialog.description(formatMonth(month))}
        </p>
        <DurationFields
          legend={strings.goalDialog.title}
          value={value}
          onChange={setValue}
          error={error}
        />
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
