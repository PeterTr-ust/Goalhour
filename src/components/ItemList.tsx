import { formatDuration, formatSignedDuration } from '../lib/duration';
import type { ListRow } from '../lib/listRows';
import { formatDate, formatMonthName, strings } from '../lib/strings';
import type { Item } from '../lib/types';

interface ItemListProps {
  rows: readonly ListRow[];
  locked: boolean;
  onSelect: (item: Item) => void;
}

type Tone = 'entry' | 'credit' | 'adjust';

const TONE_CLASSES: Record<Tone, { bar: string; badge: string }> = {
  entry: {
    bar: 'bg-entry',
    badge: 'bg-teal-100 text-teal-900 dark:bg-teal-900 dark:text-teal-100',
  },
  credit: {
    bar: 'bg-credit',
    badge: 'bg-violet-100 text-violet-900 dark:bg-violet-900 dark:text-violet-100',
  },
  adjust: {
    bar: 'bg-adjust',
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
  },
};

export function ItemList({ rows, locked, onSelect }: ItemListProps) {
  return (
    <section aria-labelledby="item-list-title">
      <h2
        id="item-list-title"
        className="mb-2 px-1 text-sm font-semibold text-slate-600 dark:text-slate-400"
      >
        {strings.month.listTitle}
      </h2>
      {rows.length === 0 ? (
        <p className="rounded-3xl bg-white p-5 text-center text-slate-600 dark:bg-slate-900 dark:text-slate-400">
          {strings.month.emptyList}
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-3xl bg-white shadow-sm dark:divide-slate-800 dark:bg-slate-900">
          {rows.map((row) => (
            <li key={rowKey(row)}>
              <Row row={row} locked={locked} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function rowKey(row: ListRow): string {
  return row.kind === 'item' ? row.item.id : row.kind;
}

interface RowContentProps {
  tone: Tone;
  label: string;
  detail: string;
  value: string;
}

function RowContent({ tone, label, detail, value }: RowContentProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <span className="flex min-h-16 items-center gap-3 py-2 pr-4">
      <span className={`h-10 w-1.5 shrink-0 rounded-full ${classes.bar}`} aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${classes.badge}`}>
          {label}
        </span>
        <span className="truncate text-sm text-slate-600 dark:text-slate-400">{detail}</span>
      </span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </span>
  );
}

function Row({
  row,
  locked,
  onSelect,
}: {
  row: ListRow;
  locked: boolean;
  onSelect: ItemListProps['onSelect'];
}) {
  switch (row.kind) {
    case 'item': {
      const { item } = row;
      const label = strings.itemTypes[item.type];
      const date = formatDate(item.date);
      const detail = item.time ? `${date}, ${item.time}` : date;
      const value = formatDuration(item.minutes);
      const content = <RowContent tone={item.type} label={label} detail={detail} value={value} />;
      if (locked) {
        return <div className="pl-3">{content}</div>;
      }
      return (
        <button
          type="button"
          onClick={() => onSelect(item)}
          aria-label={strings.list.edit(label, date, value)}
          className="w-full pl-3 text-left active:bg-slate-100 dark:active:bg-slate-800"
        >
          {content}
        </button>
      );
    }
    case 'roundUp':
      return (
        <div className="pl-3">
          <RowContent
            tone="adjust"
            label={strings.itemTypes.roundUp}
            detail={strings.list.roundUpNote}
            value={formatSignedDuration(row.minutes)}
          />
        </div>
      );
    case 'carryOut':
      return (
        <div className="pl-3">
          <RowContent
            tone="adjust"
            label={strings.itemTypes.carryOut}
            detail={strings.list.carryOutTo(formatMonthName(row.toMonth))}
            value={formatSignedDuration(-row.minutes)}
          />
        </div>
      );
    case 'carryIn':
      return (
        <div className="pl-3">
          <RowContent
            tone="adjust"
            label={strings.itemTypes.carryIn}
            detail={strings.list.carryInFrom(formatMonthName(row.fromMonth))}
            value={formatSignedDuration(row.minutes)}
          />
        </div>
      );
  }
}
