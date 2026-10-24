import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastMessage } from '../components/Toast';

export const TOAST_DURATION_MS = 5000;

/** One toast at a time; a new toast replaces the current one and restarts the timer. */
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const nextIdRef = useRef(0);

  const dismiss = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const show = useCallback(
    (text: string, action?: ToastMessage['action']) => {
      window.clearTimeout(timerRef.current);
      nextIdRef.current += 1;
      setToast(action ? { id: nextIdRef.current, text, action } : { id: nextIdRef.current, text });
      timerRef.current = window.setTimeout(dismiss, TOAST_DURATION_MS);
    },
    [dismiss],
  );

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return { toast, show, dismiss };
}
