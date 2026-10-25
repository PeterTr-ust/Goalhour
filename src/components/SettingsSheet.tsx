import { useRef, useState, type ChangeEvent } from 'react';
import { replaceAllData } from '../db/repository';
import { parseBackup, type BackupFile } from '../lib/backup';
import { isEncryptedBackup } from '../lib/backupCrypto';
import { formatDateTime, strings } from '../lib/strings';
import { THEME_PREFERENCES, type ThemePreference } from '../lib/theme';
import { Button } from './Button';
import { DecryptBackupDialog } from './DecryptBackupDialog';
import { Modal } from './Modal';
import { SegmentedControl } from './SegmentedControl';

type RunAction = (action: () => Promise<unknown>) => Promise<boolean>;

const THEME_OPTIONS = THEME_PREFERENCES.map((value) => ({
  value,
  label: strings.settings.themes[value],
}));

interface SettingsSheetProps {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  lastBackupAt: number | undefined;
  onExport: () => void;
  onRestored: (message: string) => void;
  run: RunAction;
  onClose: () => void;
}

export function SettingsSheet({
  theme,
  onThemeChange,
  lastBackupAt,
  onExport,
  onRestored,
  run,
  onClose,
}: SettingsSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string>();
  const [pendingRestore, setPendingRestore] = useState<BackupFile>();
  const [encryptedText, setEncryptedText] = useState<string>();

  const readPlainBackup = (text: string) => {
    const result = parseBackup(text);
    if (result.ok) {
      setPendingRestore(result.backup);
    } else {
      setFileError(strings.errors.backup[result.error]);
    }
  };

  const handleFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so choosing the same file again triggers another change event.
    event.target.value = '';
    if (!file) {
      return;
    }
    setFileError(undefined);
    let text: string;
    try {
      text = await file.text();
    } catch (error) {
      console.error(error);
      setFileError(strings.errors.backupRead);
      return;
    }
    if (isEncryptedBackup(text)) {
      setEncryptedText(text);
    } else {
      readPlainBackup(text);
    }
  };

  const confirmRestore = async () => {
    if (!pendingRestore) {
      return;
    }
    if (await run(() => replaceAllData(pendingRestore))) {
      onRestored(strings.settings.restoreDone);
      onClose();
    }
  };

  if (encryptedText !== undefined && !pendingRestore) {
    return (
      <DecryptBackupDialog
        encryptedText={encryptedText}
        onDecrypted={(plain) => {
          setEncryptedText(undefined);
          readPlainBackup(plain);
        }}
        onClose={() => setEncryptedText(undefined)}
      />
    );
  }

  if (pendingRestore) {
    return (
      <Modal title={strings.restore.title} onClose={() => setPendingRestore(undefined)}>
        <div className="flex flex-col gap-4">
          <p>
            {strings.restore.summary(
              formatDateTime(pendingRestore.exportedAt),
              pendingRestore.items.length,
              pendingRestore.closes.length,
            )}
          </p>
          <p className="font-semibold text-danger">{strings.restore.warning}</p>
          <Button variant="danger" onClick={() => void confirmRestore()}>
            {strings.restore.confirm}
          </Button>
          <Button variant="secondary" onClick={() => setPendingRestore(undefined)}>
            {strings.sheet.cancel}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal variant="sheet" title={strings.settings.title} onClose={onClose}>
      <div className="flex flex-col gap-6">
        <SegmentedControl
          legend={strings.settings.appearance}
          options={THEME_OPTIONS}
          value={theme}
          onChange={onThemeChange}
        />

        <section aria-labelledby="backup-title" className="flex flex-col gap-3">
          <h3 id="backup-title" className="text-sm font-medium text-muted">
            {strings.settings.backupTitle}
          </h3>
          <p className="text-sm text-muted">{strings.settings.backupInfo}</p>
          <p className="text-sm font-semibold">
            {lastBackupAt === undefined
              ? strings.settings.noBackup
              : strings.settings.lastBackup(formatDateTime(lastBackupAt))}
          </p>
          <Button onClick={onExport}>{strings.settings.createBackup}</Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            {strings.settings.restoreBackup}
          </Button>
          {/*
            No accept filter: iOS does not know the ".goalhour" extension and would grey such
            files out. Any file can be chosen; its content is validated before anything happens.
          */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={(event) => void handleFileChosen(event)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          {fileError && (
            <p role="alert" className="animate-fade-in text-sm text-danger">
              {fileError}
            </p>
          )}
        </section>

        <Button variant="secondary" onClick={onClose}>
          {strings.settings.close}
        </Button>
      </div>
    </Modal>
  );
}
