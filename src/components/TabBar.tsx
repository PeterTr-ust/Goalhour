import { strings } from '../lib/strings';

export type Tab = 'month' | 'serviceYear';

const TABS: readonly { id: Tab; icon: string }[] = [
  { id: 'month', icon: '◷' },
  { id: 'serviceYear', icon: '▦' },
];

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav
      aria-label={strings.tabs.label}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90"
    >
      <ul className="mx-auto flex max-w-xl">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onChange(tab.id)}
                className={`flex min-h-16 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  isActive
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <span aria-hidden="true" className="text-2xl leading-none">
                  {tab.icon}
                </span>
                {strings.tabs[tab.id]}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
