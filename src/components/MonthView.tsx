import { useState } from 'react';
import { closeMonth, deleteItem, reopenMonth, setGoal, updateItem } from '../db/repository';
import { nextMonth, previousMonth } from '../lib/calendar';
import { buildListRows } from '../lib/listRows';
import {
  canCarryOver,
  canReopen,
  needsCloseChoice,
  summarizeMonth,
  type CloseChoice,
  type MonthData,
} from '../lib/month';
import { formatMonth, strings } from '../lib/strings';
import type { Item, MonthKey } from '../lib/types';
import { Button } from './Button';
import { CloseMonthDialog } from './CloseMonthDialog';
import { GoalDialog } from './GoalDialog';
import { ItemList } from './ItemList';
import { ItemSheet } from './ItemSheet';
import { MonthSummaryCard } from './MonthSummaryCard';
import { PeriodNavigator } from './PeriodNavigator';

type RunAction = (action: () => Promise<unknown>) => Promise<boolean>;

type OpenPanel =
  { kind: 'none' } | { kind: 'editItem'; item: Item } | { kind: 'goal' } | { kind: 'close' };

interface MonthViewProps {
  month: MonthKey;
  data: MonthData;
  onMonthChange: (month: MonthKey) => void;
  /** Called after an item was deleted, e.g. to offer undo. */
  onItemDeleted: (item: Item) => void;
  run: RunAction;
}

export function MonthView({ month, data, onMonthChange, onItemDeleted, run }: MonthViewProps) {
  const [panel, setPanel] = useState<OpenPanel>({ kind: 'none' });
  const closePanel = () => setPanel({ kind: 'none' });

  const summary = summarizeMonth(month, data);
  const isClosed = summary.close !== undefined;
  const rows = buildListRows(summary, data.items);

  const handleCloseMonth = () => {
    if (needsCloseChoice(summary.raw)) {
      setPanel({ kind: 'close' });
      return;
    }
    // A full hour total needs no choice; the stored mode becomes 'none'.
    void run(() => closeMonth(month, 'roundUp'));
  };

  const handleCloseChoice = (choice: CloseChoice) => {
    closePanel();
    void run(() => closeMonth(month, choice));
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <PeriodNavigator
          label={formatMonth(month)}
          previousLabel={strings.month.previous}
          nextLabel={strings.month.next}
          onPrevious={() => onMonthChange(previousMonth(month))}
          onNext={() => onMonthChange(nextMonth(month))}
        />

        <MonthSummaryCard summary={summary} onEditGoal={() => setPanel({ kind: 'goal' })} />

        {isClosed ? (
          <ReopenSection
            allowed={canReopen(data.closes, month)}
            onReopen={() => void run(() => reopenMonth(month))}
          />
        ) : (
          <Button onClick={handleCloseMonth}>{strings.month.closeMonth}</Button>
        )}

        {/* Keyed by month so the list animates in when switching months. */}
        <div key={month}>
          <ItemList
            rows={rows}
            locked={isClosed}
            onSelect={(item) => setPanel({ kind: 'editItem', item })}
          />
        </div>
      </div>

      {panel.kind === 'editItem' && (
        <ItemSheet
          item={panel.item}
          defaultDate={panel.item.date}
          defaultTime={panel.item.time ?? ''}
          onSave={(input) => run(() => updateItem(panel.item.id, input))}
          onDelete={(id) =>
            run(async () => {
              const deleted = await deleteItem(id);
              if (deleted) {
                onItemDeleted(deleted);
              }
            })
          }
          onClose={closePanel}
        />
      )}
      {panel.kind === 'goal' && (
        <GoalDialog
          title={strings.goalDialog.title}
          description={strings.goalDialog.description(formatMonth(month))}
          currentGoal={summary.goal}
          onSave={(minutes) => run(() => setGoal(month, minutes))}
          onClose={closePanel}
        />
      )}
      {panel.kind === 'close' && (
        <CloseMonthDialog
          month={month}
          raw={summary.raw}
          carryOverAllowed={canCarryOver(data.closes, month)}
          onChoose={handleCloseChoice}
          onClose={closePanel}
        />
      )}
    </>
  );
}

function ReopenSection({ allowed, onReopen }: { allowed: boolean; onReopen: () => void }) {
  return (
    <div className="flex animate-fade-in flex-col gap-2">
      <p className="px-1 text-sm text-muted">{strings.month.lockedHint}</p>
      <Button variant="secondary" disabled={!allowed} onClick={onReopen}>
        {strings.month.reopen}
      </Button>
      {!allowed && <p className="px-1 text-sm text-muted">{strings.month.reopenBlocked}</p>}
    </div>
  );
}
