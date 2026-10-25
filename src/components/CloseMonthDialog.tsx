import { useId, useState } from 'react';
import { nextMonth } from '../lib/calendar';
import { formatDuration, MINUTES_PER_HOUR } from '../lib/duration';
import {
  applyClose,
  buildClose,
  closeChoicesNeeded,
  hourRemainder,
  type CloseChoice,
  type CloseChoices,
} from '../lib/month';
import { formatMonthName, strings } from '../lib/strings';
import type { MonthKey } from '../lib/types';
import { Button } from './Button';
import { Modal } from './Modal';

interface CloseMonthDialogProps {
  month: MonthKey;
  /** Hours plus their carry-in. */
  entryRaw: number;
  /** Credits plus their carry-in. */
  creditRaw: number;
  carryOverAllowed: boolean;
  onConfirm: (choices: CloseChoices) => void;
  onClose: () => void;
}

/**
 * Lets the user decide separately for hours and credits whether the remainder is rounded up
 * or carried into the next month. Only parts that do not end on a full hour are asked.
 */
export function CloseMonthDialog({
  month,
  entryRaw,
  creditRaw,
  carryOverAllowed,
  onConfirm,
  onClose,
}: CloseMonthDialogProps) {
  const needed = closeChoicesNeeded(entryRaw, creditRaw);
  const [entryChoice, setEntryChoice] = useState<CloseChoice>();
  const [creditChoice, setCreditChoice] = useState<CloseChoice>();
  const next = formatMonthName(nextMonth(month));

  // A part that ends on a full hour needs no decision; any choice gives the same result.
  const choices: CloseChoices | undefined =
    (!needed.entries || entryChoice) && (!needed.credits || creditChoice)
      ? { entries: entryChoice ?? 'roundUp', credits: creditChoice ?? 'roundUp' }
      : undefined;
  const total = choices
    ? applyClose(entryRaw + creditRaw, buildClose(month, entryRaw, creditRaw, choices))
    : undefined;

  return (
    <Modal title={strings.closeDialog.title} onClose={onClose}>
      <p className="mb-5 text-sm text-muted">{strings.closeDialog.description}</p>
      <div className="flex flex-col gap-5">
        {needed.entries && (
          <SettlementChoice
            legend={strings.closeDialog.hoursSection(formatDuration(entryRaw))}
            value={entryRaw}
            nextMonthName={next}
            carryOverAllowed={carryOverAllowed}
            choice={entryChoice}
            onChoose={setEntryChoice}
          />
        )}
        {needed.credits && (
          <SettlementChoice
            legend={strings.closeDialog.creditsSection(formatDuration(creditRaw))}
            value={creditRaw}
            nextMonthName={next}
            carryOverAllowed={carryOverAllowed}
            choice={creditChoice}
            onChoose={setCreditChoice}
          />
        )}

        <p className="text-base font-semibold" aria-live="polite">
          {total === undefined
            ? strings.closeDialog.chooseAll
            : strings.closeDialog.monthTotal(formatDuration(total))}
        </p>

        <div className="flex flex-col gap-3">
          <Button disabled={!choices} onClick={() => choices && onConfirm(choices)}>
            {strings.closeDialog.confirm}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {strings.sheet.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface SettlementChoiceProps {
  legend: string;
  value: number;
  nextMonthName: string;
  carryOverAllowed: boolean;
  choice: CloseChoice | undefined;
  onChoose: (choice: CloseChoice) => void;
}

/** Round up or carry over for one part (hours or credits), as two selectable cards. */
function SettlementChoice({
  legend,
  value,
  nextMonthName,
  carryOverAllowed,
  choice,
  onChoose,
}: SettlementChoiceProps) {
  const name = useId();
  const remainder = hourRemainder(value);
  const from = formatDuration(value);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <OptionCard
        name={name}
        label={strings.closeDialog.roundUp}
        preview={strings.closeDialog.roundUpPreview(
          from,
          formatDuration(value + MINUTES_PER_HOUR - remainder),
          formatDuration(MINUTES_PER_HOUR - remainder),
        )}
        checked={choice === 'roundUp'}
        onSelect={() => onChoose('roundUp')}
      />
      <OptionCard
        name={name}
        label={strings.closeDialog.carryOver}
        preview={
          carryOverAllowed
            ? strings.closeDialog.carryOverPreview(
                from,
                formatDuration(value - remainder),
                formatDuration(remainder),
                nextMonthName,
              )
            : strings.closeDialog.carryOverBlocked
        }
        checked={choice === 'carryOver'}
        disabled={!carryOverAllowed}
        onSelect={() => onChoose('carryOver')}
      />
    </fieldset>
  );
}

interface OptionCardProps {
  name: string;
  label: string;
  preview: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

function OptionCard({
  name,
  label,
  preview,
  checked,
  disabled = false,
  onSelect,
}: OptionCardProps) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-[transform,background-color,border-color] duration-150 active:scale-[0.98] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-fg ${
        checked ? 'border-fg bg-surface' : 'border-line'
      } ${disabled ? 'cursor-not-allowed text-muted active:scale-100' : ''}`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? 'border-fg' : 'border-subtle'
        }`}
      >
        {checked && <span className="size-2.5 animate-pop-in rounded-full bg-fg" />}
      </span>
      <span className="flex flex-col">
        <span className="text-base font-semibold">{label}</span>
        <span className="text-sm text-muted">{preview}</span>
      </span>
    </label>
  );
}
