import { nextMonth } from '../lib/calendar';
import { formatDuration } from '../lib/duration';
import { applyClose, buildClose, type CloseChoice } from '../lib/month';
import { formatMonthName, strings } from '../lib/strings';
import type { MonthKey } from '../lib/types';
import { Button } from './Button';
import { Modal } from './Modal';

interface CloseMonthDialogProps {
  month: MonthKey;
  raw: number;
  carryOverAllowed: boolean;
  onChoose: (choice: CloseChoice) => void;
  onClose: () => void;
}

/** Lets the user choose between rounding up and carrying over, with a preview of both. */
export function CloseMonthDialog({
  month,
  raw,
  carryOverAllowed,
  onChoose,
  onClose,
}: CloseMonthDialogProps) {
  const roundUp = buildClose(month, raw, 'roundUp');
  const carryOver = buildClose(month, raw, 'carryOver');
  const from = formatDuration(raw);

  return (
    <Modal title={strings.closeDialog.title} onClose={onClose}>
      <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">
        {strings.closeDialog.description(from)}
      </p>
      <div className="flex flex-col gap-3">
        <ChoiceButton
          label={strings.closeDialog.roundUp}
          preview={strings.closeDialog.roundUpPreview(
            from,
            formatDuration(applyClose(raw, roundUp)),
            formatDuration(roundUp.adjustment),
          )}
          onClick={() => onChoose('roundUp')}
        />
        <ChoiceButton
          label={strings.closeDialog.carryOver}
          preview={
            carryOverAllowed
              ? strings.closeDialog.carryOverPreview(
                  from,
                  formatDuration(applyClose(raw, carryOver)),
                  formatDuration(carryOver.adjustment),
                  formatMonthName(nextMonth(month)),
                )
              : strings.closeDialog.carryOverBlocked
          }
          disabled={!carryOverAllowed}
          onClick={() => onChoose('carryOver')}
        />
        <Button variant="secondary" onClick={onClose}>
          {strings.sheet.cancel}
        </Button>
      </div>
    </Modal>
  );
}

interface ChoiceButtonProps {
  label: string;
  preview: string;
  disabled?: boolean;
  onClick: () => void;
}

function ChoiceButton({ label, preview, disabled = false, onClick }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-16 flex-col items-start rounded-2xl border-2 border-teal-700 px-4 py-3 text-left active:bg-teal-50 disabled:border-slate-300 disabled:text-slate-500 dark:active:bg-teal-950 dark:disabled:border-slate-700"
    >
      <span className="text-base font-semibold">{label}</span>
      <span className="text-sm text-slate-600 dark:text-slate-400">{preview}</span>
    </button>
  );
}
