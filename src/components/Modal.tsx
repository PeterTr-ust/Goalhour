import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Bottom sheet on all screen sizes. */
  variant?: 'sheet' | 'dialog';
}

/** Accessible modal based on the native <dialog> element. Rendered only while open. */
export function Modal({ title, onClose, children, variant = 'dialog' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const position =
    variant === 'sheet'
      ? 'mt-auto mb-0 w-full max-w-none animate-sheet-up rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+1.5rem)]'
      : 'm-auto w-[calc(100%-2rem)] max-w-md animate-pop-in rounded-3xl pb-6';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      className={`${position} max-h-[90dvh] overflow-y-auto bg-elevated px-5 pt-5 text-fg shadow-2xl`}
    >
      {variant === 'sheet' && (
        <div aria-hidden="true" className="mx-auto -mt-2 mb-3 h-1.5 w-10 rounded-full bg-line" />
      )}
      <h2 id={titleId} className="mb-4 text-lg font-semibold">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
