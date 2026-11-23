import { redirect } from 'next/navigation';
import { REQUIRE_BOARD_2FA, requireMember } from '@/lib/session';
import { TwoFactor } from './two-factor';

export default async function VerificationPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { supabase, member } = await requireMember({ allowTempPassword: true });
  const { next: nextParam } = await searchParams;
  if (!REQUIRE_BOARD_2FA) redirect(member.must_change_password ? '/zmiana-hasla' : member.is_board ? '/zarzad' : '/');
  // po kodzie: najpierw ustawienie hasła (jeśli tymczasowe), potem panel zarządu
  const next = member.must_change_password || nextParam === '/zmiana-hasla' ? '/zmiana-hasla' : '/zarzad';

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === 'aal2') redirect(next);
  if (!member.is_board && aal?.nextLevel !== 'aal2') redirect('/');

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verified = factors?.totp?.[0] ?? null;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="card flex w-full max-w-[480px] flex-col gap-5 p-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-bold">{verified ? 'Potwierdź logowanie' : 'Włącz weryfikację dwuetapową'}</h1>
          <p className="text-ink-muted">
            {verified
              ? next === '/zmiana-hasla'
                ? 'Wpisz 6-cyfrowy kod z aplikacji uwierzytelniającej. Potem ustawisz własne hasło.'
                : 'Wpisz 6-cyfrowy kod z aplikacji uwierzytelniającej, aby wejść do panelu zarządu.'
              : 'Panel zarządu chroni dodatkowy kod z telefonu. Zainstaluj aplikację uwierzytelniającą (np. Google Authenticator lub Microsoft Authenticator) i zeskanuj kod QR.'}
          </p>
        </div>
        <TwoFactor factorId={verified?.id ?? null} next={next} />
        {!member.must_change_password && (
          <a href="/" className="self-start font-semibold text-navy underline">
            Przejdź do panelu członka
          </a>
        )}
      </div>
    </main>
  );
}
