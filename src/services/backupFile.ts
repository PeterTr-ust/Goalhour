import { backupFileName, type BackupFile } from '../lib/backup';

const JSON_MIME_TYPE = 'application/json';
const JSON_INDENT = 2;

export type ExportOutcome = 'shared' | 'downloaded' | 'cancelled';

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function download(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Hands the backup to the user: via the share sheet where files can be shared (iOS: "Save to
 * Files"), otherwise as a download. Must be called directly from a user gesture.
 */
export async function exportBackupFile(backup: BackupFile, now: Date): Promise<ExportOutcome> {
  const file = new File([JSON.stringify(backup, null, JSON_INDENT)], backupFileName(now), {
    type: JSON_MIME_TYPE,
  });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return 'shared';
    } catch (error) {
      if (isAbortError(error)) {
        return 'cancelled';
      }
      // Sharing can be refused (e.g. lost user activation); fall back to a download.
      console.error(error);
    }
  }

  download(file);
  return 'downloaded';
}
