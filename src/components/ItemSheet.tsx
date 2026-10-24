import { useId, useState, type FormEvent } from 'react';
import type { NewItem } from '../db/repository';
import {
  parseDurationInput,
  toDurationInput,
  toMinutes,
  validateDuration,
  type DurationInput,
} from '../lib/duration';
import { strings } from '../lib/strings';
import type { Item, ItemType } from '../lib/types';
import { Button } from './Button';
import { DurationFields, FIELD_CLASSES } from './DurationFields';
import { Modal } from './Modal';

interface ItemSheetProps {
  /** Item to edit, or undefined to add a new one. */
  item: Item | undefined;
  defaultDate: string;
  defaultTime: string;
  onSave: (input: NewItem) => Promise<boolean>;
  /** Only needed when editing. */
  onDelete?: (id: string) => Promise<boolean>;
  onClose: () => void;
}

const ITEM_TYPES: readonly ItemType[] = ['entry', 'credit'];
const EMPTY_DURATION: DurationInput = { hours: '', minutes: '' };

export function ItemSheet({
  item,
  defaultDate,
  defaultTime,
  onSave,
  onDelete,
  onClose,
}: ItemSheetProps) {
  const [type, setType] = useState<ItemType>(item?.type ?? 'entry');
  const [date, setDate] = useState(item?.date ?? defaultDate);
  const [time, setTime] = useState(item?.time ?? defaultTime);
  const [duration, setDuration] = useState<DurationInput>(
    item ? toDurationInput(item.minutes) : EMPTY_DURATION,
  );
  const [durationError, setDurationError] = useState<string>();
  const [dateError, setDateError] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const dateId = useId();
  const timeId = useId();
  const dateErrorId = useId();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseDurationInput(duration);
    const error = validateDuration(parsed);
    setDurationError(error ? strings.errors.duration[error] : undefined);
    setDateError(date === '' ? strings.sheet.dateRequired : undefined);
    if (error || date === '') {
      return;
    }

    const minutes = toMinutes(parsed);
    const input: NewItem =
      type === 'entry' && time !== '' ? { type, date, time, minutes } : { type, date, minutes };
    setBusy(true);
    const saved = await onSave(input);
    setBusy(false);
    if (saved) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!item || !onDelete) {
      return;
    }
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setBusy(true);
    const deleted = await onDelete(item.id);
    setBusy(false);
    if (deleted) {
      onClose();
    }
  };

  return (
    <Modal
      variant="sheet"
      title={item ? strings.sheet.editTitle : strings.sheet.addTitle}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <fieldset>
          <legend className="sr-only">{strings.sheet.type}</legend>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-200 p-1 dark:bg-slate-800">
            {ITEM_TYPES.map((option) => (
              <label
                key={option}
                className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl text-base font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600 ${
                  type === option ? 'bg-white shadow-sm dark:bg-slate-600' : ''
                }`}
              >
                <input
                  type="radio"
                  name="item-type"
                  value={option}
                  checked={type === option}
                  onChange={() => setType(option)}
                  className="sr-only"
                />
                {strings.itemTypes[option]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor={dateId} className="mb-1 block text-sm">
              {strings.sheet.date}
            </label>
            <input
              id={dateId}
              type="date"
              required
              value={date}
              aria-invalid={dateError !== undefined}
              aria-describedby={dateError ? dateErrorId : undefined}
              onChange={(event) => setDate(event.target.value)}
              className={FIELD_CLASSES}
            />
          </div>
          {type === 'entry' && (
            <div className="flex-1">
              <label htmlFor={timeId} className="mb-1 block text-sm">
                {strings.sheet.time}
              </label>
              <input
                id={timeId}
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className={FIELD_CLASSES}
              />
            </div>
          )}
        </div>
        {dateError && (
          <p id={dateErrorId} role="alert" className="-mt-3 text-sm text-red-700 dark:text-red-400">
            {dateError}
          </p>
        )}

        <DurationFields
          legend={strings.sheet.duration}
          value={duration}
          onChange={setDuration}
          error={durationError}
        />

        <div className="flex flex-col gap-3">
          <Button type="submit" disabled={busy}>
            {strings.sheet.save}
          </Button>
          {item && onDelete && (
            <Button variant="danger" disabled={busy} onClick={handleDelete}>
              {confirmingDelete ? strings.sheet.confirmDelete : strings.sheet.delete}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            {strings.sheet.cancel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
