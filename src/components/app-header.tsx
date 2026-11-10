import Link from 'next/link';
import type { Member } from '@/lib/session';

export function AppHeader({ member, area }: { member: Member; area: 'czlonek' | 'zarzad' }) {
  const board = area === 'zarzad';
  const initials = `${member.first_name[0] ?? ''}${member.last_name[0] ?? ''}`;

  return (
    <header className={board ? 'bg-navy text-white' : 'border-b border-line bg-white'}>
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link href={board ? '/zarzad' : '/'} className="flex flex-col no-underline">
          <span className="text-xl font-bold">ZNP w CMKP</span>
          <span className={board ? 'text-sm text-[#DCE5F0]' : 'text-sm text-ink-muted'}>
            {board ? 'Panel zarządu' : 'Panel członka'}
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          {member.is_board && (
            <Link href={board ? '/' : '/zarzad'} className={board ? 'font-semibold text-white underline' : 'font-semibold text-navy underline'}>
              {board ? 'Widok członka' : 'Panel zarządu'}
            </Link>
          )}
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-light font-bold text-navy"
            >
              {initials}
            </span>
            <span className="flex flex-col">
              <span className="font-semibold">
                {member.first_name} {member.last_name}
              </span>
              {member.member_no && (
                <span className={board ? 'text-sm text-[#DCE5F0]' : 'text-sm text-ink-muted'}>nr członkowski {member.member_no}</span>
              )}
            </span>
          </div>
          <form action="/wyloguj" method="post">
            <button
              type="submit"
              className={
                board
                  ? 'min-h-[44px] rounded-lg border border-[#9FB3CC] px-3.5 font-semibold text-white'
                  : 'btn-secondary'
              }
            >
              Wyloguj
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
