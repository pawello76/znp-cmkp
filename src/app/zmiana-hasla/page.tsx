import { PASSWORD_MIN_LENGTH } from '@/lib/auth';
import { requireMember } from '@/lib/session';
import { ChangePasswordForm } from './form';

export default async function ChangePasswordPage() {
  const { member } = await requireMember({ allowTempPassword: true });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="card flex w-full max-w-[440px] flex-col gap-5 p-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-bold">{member.must_change_password ? 'Ustaw własne hasło' : 'Zmiana hasła'}</h1>
          <p className="text-ink-muted">
            {member.must_change_password
              ? 'Logujesz się hasłem tymczasowym od zarządu. Zanim przejdziesz dalej, ustaw własne hasło.'
              : 'Wpisz nowe hasło dwa razy.'}
          </p>
        </div>
        <ChangePasswordForm minLength={PASSWORD_MIN_LENGTH} canCancel={!member.must_change_password} />
      </div>
    </main>
  );
}
