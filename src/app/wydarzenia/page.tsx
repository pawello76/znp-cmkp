import { MemberShell } from '@/components/shell';
import { dayAndMonth, formatDateTime, formatTime } from '@/lib/format';
import { requireMember } from '@/lib/session';
import { RegistrationButton } from './registration-button';

export default async function EventsPage() {
  const { supabase, member } = await requireMember();
  const now = new Date().toISOString();

  const [{ data: events }, { data: mine }, { data: counts }] = await Promise.all([
    supabase.from('events').select('*').eq('is_published', true).gte('starts_at', now).order('starts_at'),
    supabase.from('event_registrations').select('event_id').eq('member_id', member.id),
    supabase.rpc('event_counts'),
  ]);

  const registered = new Set((mine ?? []).map((r) => r.event_id));
  const countOf = new Map((counts ?? []).map((c) => [c.event_id, Number(c.registered)]));

  return (
    <MemberShell member={member} current="/wydarzenia">
        <h1 className="text-[28px] font-bold">Wydarzenia i spotkania</h1>
        {(events ?? []).map((e) => {
          const { day, month } = dayAndMonth(e.starts_at);
          const count = countOf.get(e.id) ?? 0;
          const full = e.capacity != null && count >= e.capacity;
          const isReg = registered.has(e.id);
          return (
            <div key={e.id} className="card flex flex-wrap items-center gap-5">
              <div className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-[10px] bg-navy-light text-navy">
                <span className="text-[26px] font-bold leading-none">{day}</span>
                <span className="text-[13px] font-semibold uppercase">{month}</span>
              </div>
              <div className="flex flex-[1_1_280px] flex-col gap-1">
                <span className="text-lg font-bold">{e.title}</span>
                <span className="text-[15px] text-ink-soft">
                  {formatDateTime(e.starts_at)}
                  {e.ends_at ? `–${formatTime(e.ends_at)}` : ''}
                  {e.place ? ` · ${e.place}` : ''}
                </span>
                {e.description && <span className="whitespace-pre-line text-[15px] text-ink-soft">{e.description}</span>}
                <span className="text-sm text-ink-muted">
                  Zapisanych: {count}
                  {e.capacity ? ` z ${e.capacity}` : ''}
                </span>
              </div>
              <RegistrationButton eventId={e.id} registered={isReg} canRegister={e.registration_open && !full} />
            </div>
          );
        })}
        {(events ?? []).length === 0 && <p className="text-ink-muted">Brak zaplanowanych wydarzeń.</p>}
    </MemberShell>
  );
}
