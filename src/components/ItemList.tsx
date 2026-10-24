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

/** Types differ by fill style (solid, outline, dashed) and label, not by hue. */
const TONE_CLASSES: Record<Tone, { bar: string; badge: string }> = {
  entry: {
    bar: 'bg-fg',
    badge: 'border-fg bg-fg text-bg',
  },
  credit: {
    bar: 'border-2 border-fg',
    badge: 'border-fg text-fg',
  },
  adjust: {
    bar: 'border-2 border-dashed border-muted',
    badge: 'border-dashed border-muted text-muted',
  },
};

const STAGGER_MS = 35;
const MAX_STAGGER_MS = 350;

export function ItemList({ rows, locked, onSelect }: ItemListProps) {
  return (
    <section aria-labelledby="item-list-title">
      <h2 id="item-list-title" className="mb-2 px-1 text-sm font-semibold text-muted">
        {strings.month.listTitle}
      </h2>
      {rows.length === 0 ? (
        <p className="animate-fade-in rounded-3xl bg-surface p-5 text-center text-muted">
          {strings.month.emptyList}
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-surface">
          {rows.map((row, index) => (
            <li
              key={rowKey(row)}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(index * STAGGER_MS, MAX_STAGGER_MS)}ms` }}
            >
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
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${classes.badge}`}>
          {label}
        </span>
        <span className="truncate text-sm text-muted">{detail}</span>
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
          className="w-full pl-3 text-left transition-colors active:bg-surface-strong"
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
