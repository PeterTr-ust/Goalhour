import { useCallback } from 'react';
import { markBackupDone } from '../db/repository';
import { createBackup } from '../lib/backup';
import { UserFacingError } from '../lib/errors';
import { strings } from '../lib/strings';
import { exportBackupFile, type ExportOutcome } from '../services/backupFile';
import type { StoredData } from './useStoredData';

type RunAction = (action: () => Promise<unknown>) => Promise<boolean>;

async function exportOrFail(...args: Parameters<typeof exportBackupFile>): Promise<ExportOutcome> {
  try {
    return await exportBackupFile(...args);
  } catch (error) {
    throw new UserFacingError(strings.errors.backupExport, { cause: error });
  }
}

/**
 * Exports a backup of the data currently shown. The backup is built synchronously from data
 * already in memory, so the share sheet opens within the user's tap (required by iOS).
 */
export function useBackupExport(
  data: StoredData | undefined,
  run: RunAction,
  onDone: (message: string) => void,
) {
  return useCallback(() => {
    if (!data) {
      return;
    }
    const now = new Date();
    const backup = createBackup(data, now.getTime());
    void run(async () => {
      if ((await exportOrFail(backup, now)) === 'cancelled') {
        return;
      }
      await markBackupDone(now.getTime());
      onDone(strings.settings.backupDone);
    });
  }, [data, run, onDone]);
}
