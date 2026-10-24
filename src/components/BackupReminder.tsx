import { strings } from '../lib/strings';
import { ShieldIcon } from './icons';

interface BackupReminderProps {
  /** Days since the last backup, undefined if there was none. */
  daysSinceBackup: number | undefined;
  onBackup: () => void;
}

export function BackupReminder({ daysSinceBackup, onBackup }: BackupReminderProps) {
  return (
    <aside className="flex animate-fade-up items-center gap-3 rounded-3xl border border-line p-4">
      <span className="shrink-0 text-danger">
        <ShieldIcon />
      </span>
      <p className="min-w-0 flex-1 text-sm">
        {daysSinceBackup === undefined
          ? strings.reminder.never
          : strings.reminder.overdue(daysSinceBackup)}
      </p>
      <button
        type="button"
        onClick={onBackup}
        className="min-h-11 shrink-0 rounded-xl bg-fg px-3 text-sm font-semibold text-bg transition-transform duration-150 active:scale-95"
      >
        {strings.reminder.action}
      </button>
    </aside>
  );
}
