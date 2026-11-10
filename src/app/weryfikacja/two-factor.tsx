'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Enrollment = { factorId: string; qr: string; secret: string };

/** Rejestracja aplikacji uwierzytelniającej (pierwszy raz) albo podanie kodu przy logowaniu. */
export function TwoFactor({ factorId }: { factorId: string | null }) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (factorId || started.current) return;
    started.current = true;
    (async () => {
      const supabase = createClient();
      // Usuń niedokończone wcześniejsze próby rejestracji.
      const { data: list } = await supabase.auth.mfa.listFactors();
      for (const f of list?.all ?? []) {
        if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error: err } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `ZNP w CMKP ${new Date().toISOString().slice(0, 10)}`,
        issuer: 'ZNP w CMKP',
      });
      if (err || !data) {
        setError('Nie udało się przygotować kodu QR. Odśwież stronę.');
        return;
      }
      setEnrollment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    })();
  }, [factorId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = factorId ?? enrollment?.factorId;
    if (!id) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: id, code: code.trim() });
    if (err) {
      setBusy(false);
      setError('Nieprawidłowy kod. Wpisz aktualny kod z aplikacji.');
      return;
    }
    window.location.assign('/zarzad');
  }

  return (
    <div className="flex flex-col gap-4">
      {!factorId && !enrollment && !error && <p className="text-ink-muted">Przygotowuję kod QR…</p>}
      {enrollment && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-page p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrollment.qr} alt="Kod QR do aplikacji uwierzytelniającej" width={200} height={200} />
          <p className="text-center text-sm text-ink-soft">
            Nie możesz zeskanować? Wpisz w aplikacji klucz:
            <br />
            <code className="break-all font-mono font-bold">{enrollment.secret}</code>
          </p>
        </div>
      )}
      {(factorId || enrollment) && (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="label">
              Kod z aplikacji
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="field tracking-[0.3em]"
            />
          </div>
          <button type="submit" className="btn-primary h-12" disabled={busy || code.length !== 6}>
            {busy ? 'Sprawdzanie…' : 'Potwierdź'}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-accent-light px-4 py-3 font-semibold text-[#9B1C1C]">
          {error}
        </p>
      )}
      <p className="text-sm text-ink-muted">
        Zgubiony telefon? Inny członek zarządu może zresetować Twoją weryfikację w panelu.
      </p>
    </div>
  );
}
