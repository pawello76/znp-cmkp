import Link from 'next/link';
import { MemberShell } from '@/components/shell';
import { NewThreadForm } from '@/components/message-forms';
import { formatDate } from '@/lib/format';
import { requireMember } from '@/lib/session';

export default async function ContactPage() {
  const { supabase, member } = await requireMember();

  const [{ data: board }, { data: roles }, { data: threads }] = await Promise.all([
    supabase.rpc('board_contacts'),
    supabase.from('board_roles').select('id, name').order('sort_order'),
    supabase.from('message_threads').select('*').eq('member_id', member.id).order('last_message_at', { ascending: false }),
  ]);
  const roleName = new Map((roles ?? []).map((r) => [r.id, r.name]));

  return (
    <MemberShell member={member} current="/kontakt">
        <h1 className="text-[28px] font-bold">Kontakt z zarządem</h1>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {(board ?? []).map((b) => (
            <div key={b.member_id} className="card flex items-center gap-3 py-4">
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-light font-bold text-navy">
                {b.first_name[0]}
                {b.last_name[0]}
              </span>
              <span className="flex flex-col">
                <span className="font-bold">
                  {b.first_name} {b.last_name}
                </span>
                <span className="text-sm text-ink-muted">{b.roles.length ? b.roles.join(', ') : 'Zarząd'}</span>
              </span>
            </div>
          ))}
        </div>

        <section className="card flex flex-col gap-1" aria-labelledby="moje">
          <h2 id="moje" className="mb-2 text-xl font-bold">
            Moje wiadomości
          </h2>
          {(threads ?? []).map((t) => {
            const fresh = t.last_message_at > t.member_last_read_at;
            return (
              <Link
                key={t.id}
                href={`/kontakt/${t.id}`}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDF0F3] py-3 hover:bg-page"
              >
                <span className="flex flex-col">
                  <span className="flex items-center gap-2 font-bold text-navy underline">
                    {t.subject}
                    {fresh && <span className="rounded-full bg-accent px-2 text-xs font-bold text-white no-underline">NOWA ODPOWIEDŹ</span>}
                  </span>
                  <span className="text-sm text-ink-muted">
                    do: {t.to_board_role_id ? roleName.get(t.to_board_role_id) : 'cały zarząd'} · ostatnia wiadomość{' '}
                    {formatDate(t.last_message_at)}
                  </span>
                </span>
              </Link>
            );
          })}
          {(threads ?? []).length === 0 && <p className="border-t border-[#EDF0F3] py-3 text-ink-muted">Nie masz jeszcze wiadomości.</p>}
        </section>

        <section className="card flex max-w-[720px] flex-col gap-3.5" aria-labelledby="nowa">
          <h2 id="nowa" className="text-xl font-bold">
            Nowa wiadomość
          </h2>
          <NewThreadForm roles={roles ?? []} />
        </section>
    </MemberShell>
  );
}
