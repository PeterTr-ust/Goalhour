import { useCallback, useState } from 'react';
import { RepositoryError } from '../db/repository';
import { UserFacingError } from '../lib/errors';
import { strings } from '../lib/strings';

function messageFor(error: unknown): string {
  if (error instanceof RepositoryError) {
    return strings.errors[error.code];
  }
  if (error instanceof UserFacingError) {
    return error.message;
  }
  return strings.errors.storage;
}

/**
 * Runs async storage actions and turns failures into a user-visible message.
 * Returns true when the action succeeded.
 */
export function useAction() {
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<unknown>): Promise<boolean> => {
    try {
      await action();
      return true;
    } catch (caught) {
      console.error(caught);
      setError(messageFor(caught));
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { error, run, clearError };
}
