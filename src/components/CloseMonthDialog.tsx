import { nextMonth } from '../lib/calendar';
import { formatDuration } from '../lib/duration';
import { applyClose, buildClose, type CloseChoice } from '../lib/month';
import { formatMonthName, strings } from '../lib/strings';
import type { MonthKey } from '../lib/types';
import { Button } from './Button';
import { Modal } from './Modal';

interface CloseMonthDialogProps {
  month: MonthKey;
  /** Entries plus entry carry-in: settled by the user's choice. */
  entryRaw: number;
  /** Credits plus credit carry-in: their remainder is always carried over. */
  creditRaw: number;
  carryOverAllowed: boolean;
  onChoose: (choice: CloseChoice) => void;
  onClose: () => void;
}

/** Lets the user choose between rounding up and carrying over, with a preview of both. */
export function CloseMonthDialog({
  month,
  entryRaw,
  creditRaw,
  carryOverAllowed,
  onChoose,
  onClose,
}: CloseMonthDialogProps) {
  const raw = entryRaw + creditRaw;
  const roundUp = buildClose(month, entryRaw, creditRaw, 'roundUp');
  const carryOver = buildClose(month, entryRaw, creditRaw, 'carryOver');
  const creditCarry = roundUp.creditCarry ?? 0;
  const next = formatMonthName(nextMonth(month));
  const from = formatDuration(entryRaw);

  return (
    <Modal title={strings.closeDialog.title} onClose={onClose}>
      <p className="mb-5 text-sm text-muted">{strings.closeDialog.description(from)}</p>
      <div className="flex flex-col gap-3">
        <ChoiceButton
          label={strings.closeDialog.roundUp}
          preview={strings.closeDialog.roundUpPreview(
            from,
            formatDuration(entryRaw + roundUp.adjustment),
            formatDuration(roundUp.adjustment),
          )}
          total={strings.closeDialog.monthTotal(formatDuration(applyClose(raw, roundUp)))}
          onClick={() => onChoose('roundUp')}
        />
        <ChoiceButton
          label={strings.closeDialog.carryOver}
          preview={
            carryOverAllowed
              ? strings.closeDialog.carryOverPreview(
                  from,
                  formatDuration(entryRaw - carryOver.adjustment),
                  formatDuration(carryOver.adjustment),
                  next,
                )
              : strings.closeDialog.carryOverBlocked
          }
          total={
            carryOverAllowed
              ? strings.closeDialog.monthTotal(formatDuration(applyClose(raw, carryOver)))
              : undefined
          }
          disabled={!carryOverAllowed}
          onClick={() => onChoose('carryOver')}
        />
        {creditCarry > 0 && (
          <p className="rounded-2xl border border-dashed border-muted px-4 py-3 text-sm">
            {strings.closeDialog.creditInfo(
              formatDuration(creditRaw),
              formatDuration(creditRaw - creditCarry),
              formatDuration(creditCarry),
              next,
            )}
          </p>
        )}
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
  total?: string | undefined;
  disabled?: boolean;
  onClick: () => void;
}

function ChoiceButton({ label, preview, total, disabled = false, onClick }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-16 flex-col items-start rounded-2xl border-2 border-fg px-4 py-3 text-left transition-[transform,background-color] duration-150 active:scale-[0.98] active:bg-surface disabled:border-line disabled:text-muted disabled:active:scale-100"
    >
      <span className="text-base font-semibold">{label}</span>
      <span className="text-sm text-muted">{preview}</span>
      {total && <span className="mt-1 text-sm font-semibold">{total}</span>}
    </button>
  );
}
