import { strings } from '../lib/strings';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+0.5rem)] z-50 mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-red-700 p-4 text-white shadow-lg"
    >
      <p className="flex-1 text-sm">
        <span className="sr-only">{strings.errors.title}: </span>
        {message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="min-h-11 rounded-xl bg-white/20 px-3 text-sm font-semibold active:bg-white/30"
      >
        {strings.errors.dismiss}
      </button>
    </div>
  );
}
