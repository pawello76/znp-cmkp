'use client';

import { useActionState } from 'react';
import { changePassword, type ChangePasswordState } from './actions';

export function ChangePasswordForm({ minLength }: { minLength: number }) {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(changePassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="label">
          Nowe hasło
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={minLength} required className="field" />
        <span className="text-sm text-ink-muted">Co najmniej {minLength} znaków.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="repeat" className="label">
          Powtórz hasło
        </label>
        <input id="repeat" name="repeat" type="password" autoComplete="new-password" minLength={minLength} required className="field" />
      </div>
      {state.error && (
        <p role="alert" className="rounded-lg bg-accent-light px-4 py-3 font-semibold text-[#9B1C1C]">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn-primary h-12" disabled={pending}>
        {pending ? 'Zapisywanie…' : 'Ustaw hasło'}
      </button>
    </form>
  );
}
