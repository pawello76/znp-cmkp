'use client';

import { useActionState } from 'react';
import {
  addMember,
  approveDeclaration,
  resetPassword,
  type AccountResult,
  type ResetResult,
} from '../actions';

function TempPasswordNotice({ created }: { created: NonNullable<AccountResult['created']> }) {
  return (
    <div role="status" className="flex flex-col gap-1 rounded-lg bg-ok-light px-4 py-3 text-ok">
      <strong>
        Konto utworzone: {created.name}, login {created.login}
      </strong>
      <span className="text-ink">
        Hasło tymczasowe: <code className="rounded bg-white px-2 py-0.5 font-mono text-base font-bold">{created.tempPassword}</code>
      </span>
      <span className="text-sm text-ink-soft">
        Przekaż je osobiście. Hasło nie będzie już wyświetlone; przy pierwszym logowaniu członek ustawi własne.
      </span>
    </div>
  );
}

export function AddMemberForm() {
  const [state, formAction, pending] = useActionState<AccountResult, FormData>(addMember, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-[1_1_160px] flex-col gap-1.5">
          <label htmlFor="add-login" className="label">
            Login
          </label>
          <input id="add-login" name="login" required inputMode="numeric" className="field" />
        </div>
        <div className="flex flex-[1_1_140px] flex-col gap-1.5">
          <label htmlFor="add-no" className="label">
            Numer członkowski (opcjonalnie)
          </label>
          <input id="add-no" name="member_no" placeholder="można nadać później" className="field" />
        </div>
        <div className="flex flex-[1_1_160px] flex-col gap-1.5">
          <label htmlFor="add-first" className="label">
            Imię
          </label>
          <input id="add-first" name="first_name" required className="field" />
        </div>
        <div className="flex flex-[1_1_180px] flex-col gap-1.5">
          <label htmlFor="add-last" className="label">
            Nazwisko
          </label>
          <input id="add-last" name="last_name" required className="field" />
        </div>
        <div className="flex flex-[1_1_160px] flex-col gap-1.5">
          <label htmlFor="add-date" className="label">
            Data przyjęcia
          </label>
          <input id="add-date" name="joined_at" type="date" className="field" />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-[1_1_220px] flex-col gap-1.5">
          <label htmlFor="add-email" className="label">
            E-mail (opcjonalnie)
          </label>
          <input id="add-email" name="email" type="email" className="field" />
        </div>
        <div className="flex flex-[1_1_200px] flex-col gap-1.5">
          <label htmlFor="add-unit" className="label">
            Jednostka w CMKP
          </label>
          <input id="add-unit" name="unit" className="field" />
        </div>
        <div className="flex flex-[1_1_180px] flex-col gap-1.5">
          <label htmlFor="add-position" className="label">
            Stanowisko
          </label>
          <input id="add-position" name="position" className="field" />
        </div>
      </div>
      <label className="flex min-h-[44px] items-center gap-2.5">
        <input type="checkbox" name="is_board" className="h-5 w-5" />
        <span>Członek zarządu (pełny dostęp do panelu zarządu)</span>
      </label>
      {state.error && (
        <p role="alert" className="font-semibold text-[#9B1C1C]">
          {state.error}
        </p>
      )}
      {state.created && <TempPasswordNotice created={state.created} />}
      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? 'Tworzenie konta…' : 'Utwórz konto'}
      </button>
    </form>
  );
}

export function ApproveDeclarationForm({ declarationId }: { declarationId: string }) {
  const [state, formAction, pending] = useActionState<AccountResult, FormData>(approveDeclaration, {});
  const loginId = `login-${declarationId}`;
  const inputId = `nr-${declarationId}`;

  if (state.created) return <TempPasswordNotice created={state.created} />;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="declaration_id" value={declarationId} />
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-[0_1_200px] flex-col gap-1.5">
          <label htmlFor={loginId} className="label">
            Login
          </label>
          <input id={loginId} name="login" required inputMode="numeric" className="field h-11" />
        </div>
        <div className="flex flex-[0_1_200px] flex-col gap-1.5">
          <label htmlFor={inputId} className="label">
            Numer członkowski (opcjonalnie)
          </label>
          <input id={inputId} name="member_no" className="field h-11" />
        </div>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Zatwierdzanie…' : 'Zatwierdź i utwórz konto'}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="font-semibold text-[#9B1C1C]">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function ResetPasswordButton({ memberId }: { memberId: string }) {
  const [state, formAction, pending] = useActionState<ResetResult, FormData>(resetPassword, {});

  if (state.tempPassword) {
    return (
      <span className="font-semibold text-ok">
        Hasło tymczasowe: <code className="font-mono">{state.tempPassword}</code>
      </span>
    );
  }

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="member_id" value={memberId} />
      <button type="submit" className="font-semibold text-navy underline disabled:opacity-60" disabled={pending}>
        {pending ? 'Resetowanie…' : 'Reset hasła'}
      </button>
      {state.error && <span className="ml-2 text-sm text-[#9B1C1C]">{state.error}</span>}
    </form>
  );
}
