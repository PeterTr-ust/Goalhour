import { useId } from 'react';
import { FIELD_CLASSES } from './DurationFields';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** "new-password" lets iOS suggest a strong password and save it in the Passwords app. */
  autoComplete: 'new-password' | 'current-password';
  invalid?: boolean;
  describedBy?: string | undefined;
}

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  invalid = false,
  describedBy,
}: PasswordFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm">
        {label}
      </label>
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASSES}
      />
    </div>
  );
}
