'use client';

import { useState } from 'react';

type Props = {
  id: string;
  name: string;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
};

/** Pole hasła z przyciskiem „Pokaż / Ukryj”. */
export function PasswordInput({ id, name, autoComplete, minLength }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className="field pr-24"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-controls={id}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 min-h-[38px] -translate-y-1/2 rounded-md px-3 text-sm font-semibold text-navy hover:bg-page"
      >
        {visible ? 'Ukryj' : 'Pokaż'}
      </button>
    </div>
  );
}
