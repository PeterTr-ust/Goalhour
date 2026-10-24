import type { ReactNode } from 'react';
import { strings } from '../lib/strings';

export type Tab = 'month' | 'serviceYear';

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const TAB_ICONS: Record<Tab, ReactNode> = {
  month: (
    <svg {...ICON_PROPS} className="size-6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  serviceYear: (
    <svg {...ICON_PROPS} className="size-6">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  ),
};

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  /** Shows the add button in the middle of the bar when set. */
  onAdd: (() => void) | undefined;
}

/**
 * Bottom navigation. The add button sits inside the bar (not floating above the content),
 * so it can never cover list text. The bar reaches slightly into the home indicator area,
 * like native iOS tab bars, instead of adding the full safe-area inset below it.
 */
export function TabBar({ active, onChange, onAdd }: TabBarProps) {
  return (
    <nav
      aria-label={strings.tabs.label}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/85 pb-[max(0.375rem,calc(env(safe-area-inset-bottom)-0.75rem))] backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-xl grid-cols-[1fr_5rem_1fr] items-center px-2">
        <TabButton tab="month" active={active} onChange={onChange} />
        <div className="flex justify-center">
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              aria-label={strings.sheet.add}
              className="flex size-12 animate-pop-in items-center justify-center rounded-full bg-fg text-bg shadow-lg transition-transform duration-150 active:scale-90"
            >
              <svg {...ICON_PROPS} strokeWidth={2.5} className="size-6">
                <path d="M12 5v14M5 12h14" />
              </svg>
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
      className={`flex min-h-13 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
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
