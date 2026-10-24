import { useState, type FormEvent } from 'react';
import {
  parseDurationInput,
  toDurationInput,
  toMinutes,
  validateGoal,
  type DurationInput,
} from '../lib/duration';
import { strings } from '../lib/strings';
import { Button } from './Button';
import { DurationFields } from './DurationFields';
import { Modal } from './Modal';

interface GoalDialogProps {
  title: string;
  description: string;
  currentGoal: number | undefined;
  onSave: (minutes: number) => Promise<boolean>;
  onClose: () => void;
}

/** Edits a monthly or yearly goal in hours and minutes. */
export function GoalDialog({ title, description, currentGoal, onSave, onClose }: GoalDialogProps) {
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
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <p className="text-sm text-muted">{description}</p>
        <DurationFields legend={title} value={value} onChange={setValue} error={error} />
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
