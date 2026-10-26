import type { ReactNode } from 'react';
import { strings } from '../lib/strings';
import { CalendarIcon, ClockIcon, PlusIcon } from './icons';

export type Tab = 'month' | 'serviceYear';

const TAB_ICONS: Record<Tab, ReactNode> = {
  month: <ClockIcon />,
  serviceYear: <CalendarIcon />,
};

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  /** Shows the add button in the middle of the bar when set. */
  onAdd: (() => void) | undefined;
}

/**
 * Bottom navigation as a floating, rounded bar just above the home indicator. Its content is
 * centered in the visible bar (a full-width bar looks off-center on iPhones, because the
 * area below its content is reserved for the home indicator). The add button sits inside the
 * bar, so it can never cover list text.
 */
export function TabBar({ active, onChange, onAdd }: TabBarProps) {
  return (
    <nav
      aria-label={strings.tabs.label}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.5rem))]"
    >
      <div className="pointer-events-auto mx-auto grid h-16 max-w-md grid-cols-[1fr_4.5rem_1fr] items-center rounded-full border border-line bg-bg/85 px-2 shadow-lg backdrop-blur-xl">
        <TabButton tab="month" active={active} onChange={onChange} />
        <div className="flex justify-center">
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              aria-label={strings.sheet.add}
              className="flex size-12 animate-pop-in items-center justify-center rounded-full bg-fg text-bg shadow-lg transition-transform duration-150 active:scale-90"
            >
              <PlusIcon />
            </button>
          )}
        </div>
        <TabButton tab="serviceYear" active={active} onChange={onChange} />
      </div>
    </nav>
  );
}

interface TabButtonProps {
  tab: Tab;
  active: Tab;
  onChange: (tab: Tab) => void;
}

function TabButton({ tab, active, onChange }: TabButtonProps) {
  const isActive = tab === active;
  return (
    <button
      type="button"
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onChange(tab)}
      className={`flex h-full flex-col items-center justify-center gap-0.5 rounded-full text-xs font-medium transition-colors ${
        isActive ? 'text-fg' : 'text-muted'
      }`}
    >
      <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
        {TAB_ICONS[tab]}
      </span>
      {strings.tabs[tab]}
    </button>
  );
}
