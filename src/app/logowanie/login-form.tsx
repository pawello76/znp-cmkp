'use client';

import { useActionState } from 'react';
import { PasswordInput } from '@/components/password-input';
import { signIn, type LoginState } from './actions';

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login" className="label">
          Login
        </label>
        <input id="login" name="login" type="text" inputMode="numeric" autoComplete="username" required className="field" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="label">
          Hasło
        </label>
        <PasswordInput id="password" name="password" autoComplete="current-password" />
      </div>
      {state.error && (
        <p role="alert" className="rounded-lg bg-accent-light px-4 py-3 font-semibold text-[#9B1C1C]">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn-primary h-12" disabled={pending}>
        {pending ? 'Logowanie…' : 'Zaloguj się'}
      </button>
    </form>
  );
}
