import { useId, useState, type FormEvent } from 'react';
import { decryptBackupText } from '../lib/backupCrypto';
import { strings } from '../lib/strings';
import { Button } from './Button';
import { Modal } from './Modal';
import { PasswordField } from './PasswordField';

interface DecryptBackupDialogProps {
  encryptedText: string;
  /** Receives the decrypted plain backup text. */
  onDecrypted: (plainText: string) => void;
  onClose: () => void;
}

export function DecryptBackupDialog({
  encryptedText,
  onDecrypted,
  onClose,
}: DecryptBackupDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const errorId = useId();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = await decryptBackupText(encryptedText, password);
    setBusy(false);
    if (result.ok) {
      onDecrypted(result.text);
    } else {
      setError(strings.errors.decrypt[result.error]);
    }
  };

  return (
    <Modal title={strings.restore.passwordTitle} onClose={onClose}>
      <form
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        className="flex flex-col gap-4"
      >
        <p className="text-sm text-muted">{strings.restore.passwordInfo}</p>
        <PasswordField
          label={strings.restore.password}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          invalid={error !== undefined}
          describedBy={error ? errorId : undefined}
        />
        {error && (
          <p id={errorId} role="alert" className="animate-fade-in text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Button type="submit" disabled={busy || password === ''}>
            {busy ? strings.restore.decrypting : strings.restore.decrypt}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {strings.sheet.cancel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
