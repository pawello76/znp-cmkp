import type { Member } from '@/lib/session';
import { AppHeader } from './app-header';
import { BoardNav } from './board-nav';
import { MemberNav } from './member-nav';

/** Układ jak w prototypie: nagłówek, menu z lewej, treść z prawej (na telefonie menu nad treścią). */
export function MemberShell({ member, current, children }: { member: Member; current: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="no-print">
        <AppHeader member={member} area="czlonek" />
      </div>
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-start gap-6 px-6 py-6">
        <MemberNav current={current} />
        <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">{children}</main>
      </div>
    </div>
  );
}

export function BoardShell({ member, current, children }: { member: Member; current: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader member={member} area="zarzad" />
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-start gap-6 px-6 py-6">
        <BoardNav current={current} />
        <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">{children}</main>
      </div>
    </div>
  );
}
