import { strings } from '../lib/strings';
import { GearIcon } from './icons';

interface AppHeaderProps {
  onOpenSettings: () => void;
}

export function AppHeader({ onOpenSettings }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <span className="pl-1 text-sm font-semibold tracking-wide text-muted">Goalhour</span>
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label={strings.settings.open}
        className="flex size-11 items-center justify-center rounded-full text-fg transition-[transform,background-color] duration-150 active:scale-90 active:bg-surface"
      >
        <GearIcon />
      </button>
    </header>
  );
}
