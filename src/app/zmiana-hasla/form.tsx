'use client';

import { useActionState } from 'react';
import { PasswordInput } from '@/components/password-input';
import { changePassword, type ChangePasswordState } from './actions';

export function ChangePasswordForm({ minLength, canCancel }: { minLength: number; canCancel: boolean }) {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(changePassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="label">
          Nowe hasło
        </label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={minLength} />
        <span className="text-sm text-ink-muted">Co najmniej {minLength} znaków.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="repeat" className="label">
          Powtórz hasło
        </label>
        <PasswordInput id="repeat" name="repeat" autoComplete="new-password" minLength={minLength} />
      </div>
      {state.error && (
        <p role="alert" className="rounded-lg bg-accent-light px-4 py-3 font-semibold text-[#9B1C1C]">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap gap-2.5">
        <button type="submit" className="btn-primary h-12 flex-1" disabled={pending}>
          {pending ? 'Zapisywanie…' : 'Ustaw hasło'}
        </button>
        {canCancel && (
          <a href="/" className="btn-secondary h-12 flex-1">
            Anuluj
          </a>
        )}
      </div>
    </form>
  );
}
