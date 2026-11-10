'use client';

import { useActionState } from 'react';
import { submitDeclaration, type DeclarationState } from './actions';

export default function DeclarationPage() {
  const [state, formAction, pending] = useActionState<DeclarationState, FormData>(submitDeclaration, {});

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="card flex w-full max-w-[520px] flex-col gap-5 p-8">
        <a href="/logowanie" className="self-start font-semibold text-navy">
          ← Wróć do logowania
        </a>
        {state.sent ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-ok-light p-4 font-semibold text-ok">Deklaracja została wysłana</div>
            <p className="leading-relaxed">
              Zarząd zobaczy ją po zalogowaniu do panelu. Po zatwierdzeniu otrzymasz numer członkowski i hasło startowe od
              przedstawiciela zarządu.
            </p>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[26px] font-bold">Deklaracja członkowska</h1>
              <p className="text-[15px] text-ink-muted">Zarząd rozpatrzy deklarację i nada numer członkowski.</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="first_name" className="label">
                  Imię
                </label>
                <input id="first_name" name="first_name" required autoComplete="given-name" className="field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="last_name" className="label">
                  Nazwisko
                </label>
                <input id="last_name" name="last_name" required autoComplete="family-name" className="field" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="label">
                E-mail
              </label>
              <input id="email" name="email" type="email" required autoComplete="email" className="field" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="unit" className="label">
                Jednostka w CMKP
              </label>
              <input id="unit" name="unit" placeholder="np. Klinika, dział, biuro" className="field" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="position" className="label">
                Stanowisko
              </label>
              <input id="position" name="position" className="field" />
            </div>
            <div aria-hidden="true" className="absolute left-[-9999px]">
              <label htmlFor="website">Strona www</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <label className="flex items-start gap-2.5 text-sm leading-snug">
              <input type="checkbox" name="consent_statute" className="mt-0.5 h-5 w-5 shrink-0" />
              Oświadczam, że przystępuję do Związku Nauczycielstwa Polskiego i akceptuję postanowienia Statutu.
            </label>
            <label className="flex items-start gap-2.5 text-sm leading-snug">
              <input type="checkbox" name="consent_rodo" className="mt-0.5 h-5 w-5 shrink-0" />
              Wyrażam zgodę na przetwarzanie moich danych osobowych w celach związkowych (RODO, art. 9).
            </label>
            {state.error && (
              <p role="alert" className="rounded-lg bg-accent-light px-4 py-3 font-semibold text-[#9B1C1C]">
                {state.error}
              </p>
            )}
            <button type="submit" className="btn-primary h-12" disabled={pending}>
              {pending ? 'Wysyłanie…' : 'Wyślij deklarację'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
