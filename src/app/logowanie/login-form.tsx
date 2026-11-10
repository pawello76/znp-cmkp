'use client';

import { useActionState } from 'react';
import { signIn, type LoginState } from './actions';

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="member_no" className="label">
          Numer członkowski
        </label>
        <input id="member_no" name="member_no" type="text" autoComplete="username" required className="field" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="label">
          Hasło
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
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
