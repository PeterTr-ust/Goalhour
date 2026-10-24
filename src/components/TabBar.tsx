import { strings } from '../lib/strings';

export type Tab = 'month' | 'serviceYear';

const TABS: readonly { id: Tab; icon: string }[] = [
  { id: 'month', icon: '◷' },
  { id: 'serviceYear', icon: '▦' },
];

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  /** Shows the add button in the middle of the bar when set. */
  onAdd: (() => void) | undefined;
}

/**
 * Bottom navigation. The add button sits inside the bar (not floating above the content),
 * so it can never cover list text.
 */
export function TabBar({ active, onChange, onAdd }: TabBarProps) {
  const [first, second] = TABS;

  return (
    <nav
      aria-label={strings.tabs.label}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-xl items-center px-2">
        {first && <TabButton tab={first} active={active} onChange={onChange} />}
        <div className="flex w-20 shrink-0 justify-center">
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              aria-label={strings.sheet.add}
              className="flex size-14 animate-pop-in items-center justify-center rounded-full bg-fg text-3xl leading-none text-bg shadow-lg transition-transform duration-150 active:scale-90"
            >
              <span aria-hidden="true">+</span>
            </button>
          )}
        </div>
        {second && <TabButton tab={second} active={active} onChange={onChange} />}
      </div>
    </nav>
  );
}

interface TabButtonProps {
  tab: (typeof TABS)[number];
  active: Tab;
  onChange: (tab: Tab) => void;
}

function TabButton({ tab, active, onChange }: TabButtonProps) {
  const isActive = tab.id === active;
  return (
    <button
      type="button"
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onChange(tab.id)}
      className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
        isActive ? 'text-fg' : 'text-muted'
      }`}
    >
      <span
        aria-hidden="true"
        className={`text-2xl leading-none transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
      >
        {tab.icon}
      </span>
      {strings.tabs[tab.id]}
    </button>
  );
}
