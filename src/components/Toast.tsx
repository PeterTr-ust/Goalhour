export interface ToastMessage {
  id: number;
  text: string;
  action?: { label: string; onClick: () => void };
}

interface ToastProps {
  toast: ToastMessage;
}

/** Short notice above the tab bar, optionally with one action (e.g. undo). */
export function Toast({ toast }: ToastProps) {
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(max(0.375rem,calc(env(safe-area-inset-bottom)-0.75rem))+4.25rem)] z-30 mx-auto flex max-w-md animate-fade-up items-center gap-3 rounded-2xl bg-fg py-2 pr-2 pl-4 text-bg shadow-xl"
    >
      <p className="min-w-0 flex-1 text-sm font-medium">{toast.text}</p>
      {toast.action && (
        <button
          type="button"
          onClick={toast.action.onClick}
          className="min-h-11 rounded-xl px-3 text-sm font-bold underline-offset-2 active:bg-bg/15"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
