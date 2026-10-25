import { useId, useState, type FormEvent } from 'react';
import { markBackupDone } from '../db/repository';
import type { StoredData } from '../hooks/useStoredData';
import { createBackup } from '../lib/backup';
import { encryptBackupText, validateNewPassword } from '../lib/backupCrypto';
import { UserFacingError } from '../lib/errors';
import { strings } from '../lib/strings';
import { createBackupFile, shareBackupFile } from '../services/backupFile';
import { Button } from './Button';
import { Modal } from './Modal';
import { PasswordField } from './PasswordField';

type RunAction = (action: () => Promise<unknown>) => Promise<boolean>;

interface ExportBackupDialogProps {
  data: StoredData;
  run: RunAction;
  onDone: (message: string) => void;
  onClose: () => void;
}

interface PreparedBackup {
  file: File;
  exportedAt: number;
  encrypted: boolean;
}

/**
 * Two steps: prepare (optionally encrypt) the backup, then hand it over with a separate tap.
 * Encryption takes a moment, and iOS only opens the share sheet directly from a tap.
 */
export function ExportBackupDialog({ data, run, onDone, onClose }: ExportBackupDialogProps) {
  const [protect, setProtect] = useState(true);
  const [password, setPassword] = useState('');
  const [repeated, setRepeated] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState<PreparedBackup>();
  const protectId = useId();
  const errorId = useId();

  const prepare = async (event: FormEvent) => {
    event.preventDefault();
    if (protect) {
      const passwordError = validateNewPassword(password, repeated);
      if (passwordError) {
        setError(strings.errors.password[passwordError]);
        return;
      }
    }
    setError(undefined);
    setBusy(true);
    const now = new Date();
    await run(async () => {
      try {
        const plain = JSON.stringify(createBackup(data, now.getTime()));
        const text = protect ? await encryptBackupText(plain, password) : plain;
        setPrepared({
          file: createBackupFile(text, now),
          exportedAt: now.getTime(),
          encrypted: protect,
        });
      } catch (caught) {
        throw new UserFacingError(strings.errors.backupExport, { cause: caught });
      }
    });
    setBusy(false);
  };

  const save = () => {
    if (!prepared) {
      return;
    }
    // Called synchronously from the tap so iOS allows the share sheet.
    void run(async () => {
      if ((await shareBackupFile(prepared.file)) === 'cancelled') {
        return;
      }
      await markBackupDone(prepared.exportedAt);
      onDone(strings.settings.backupDone);
      onClose();
    });
  };

  if (prepared) {
    return (
      <Modal title={strings.exportDialog.title} onClose={onClose}>
        <div className="flex flex-col gap-4">
          <p className="animate-fade-in">
            {prepared.encrypted ? strings.exportDialog.readyEncrypted : strings.exportDialog.ready}
          </p>
          <Button onClick={save}>{strings.exportDialog.save}</Button>
          <Button variant="secondary" onClick={onClose}>
            {strings.sheet.cancel}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={strings.exportDialog.title} onClose={onClose}>
      <form onSubmit={(event) => void prepare(event)} noValidate className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <input
            id={protectId}
            type="checkbox"
            checked={protect}
            onChange={(event) => {
              setProtect(event.target.checked);
              setError(undefined);
            }}
            className="mt-0.5 size-6 shrink-0 accent-[var(--app-fg)]"
          />
          <label htmlFor={protectId} className="flex flex-col">
            <span className="font-semibold">{strings.exportDialog.protect}</span>
            <span className="text-sm text-muted">{strings.exportDialog.protectInfo}</span>
          </label>
        </div>

        {protect ? (
          <div className="flex animate-fade-in flex-col gap-3">
            <PasswordField
              label={strings.exportDialog.password}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              invalid={error !== undefined}
              describedBy={error ? errorId : undefined}
            />
            <PasswordField
              label={strings.exportDialog.repeat}
              value={repeated}
              onChange={setRepeated}
              autoComplete="new-password"
              invalid={error !== undefined}
              describedBy={error ? errorId : undefined}
            />
            <p className="text-sm text-muted">{strings.exportDialog.strengthHint}</p>
            <p className="text-sm text-danger">{strings.exportDialog.warning}</p>
          </div>
        ) : (
          <p className="animate-fade-in text-sm text-muted">
            {strings.exportDialog.unprotectedWarning}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="animate-fade-in text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? strings.exportDialog.preparing : strings.exportDialog.prepare}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {strings.sheet.cancel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
