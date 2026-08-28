import { useId, useState } from 'react';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  error?: string;
}

export function PasswordField({ label, value, onChange, autoComplete, minLength, required, error }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <label className="field" htmlFor={id}>
      {label}
      <div className="password-input">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 4.5 10 7-.32.86-1.02 2.06-2.11 3.23M6.61 6.61C4.5 8.06 3 10 2 12c1 2.5 5 7 10 7 1.35 0 2.62-.28 3.78-.77" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
