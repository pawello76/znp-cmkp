import { BoardShell } from '@/components/shell';
import { formatDateTime } from '@/lib/format';
import { requireBoard } from '@/lib/session';

function Stat({ value, label, alert = false }: { value: number | string; label: string; alert?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className={`text-[30px] font-bold leading-tight ${alert ? 'text-[#9B1C1C]' : ''}`}>{value}</span>
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  );
}

function Section({ title, children, actions }: { title: string; children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <section className="card flex flex-col gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
      <div className="mt-auto flex flex-wrap gap-2">{actions}</div>
    </section>
  );
}

const primary = 'btn-primary px-3.5';
const secondary = 'btn-secondary px-3.5';

/** Pulpit zarządu podzielony na sekcje (jak w prototypie); czerwone liczby = sprawy do załatwienia. */
export default async function BoardDashboard() {
  const { supabase, member: me } = await requireBoard();
  const prevSeen = (await supabase.rpc('touch_last_seen')).data;
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const [members, decl, dues, inbox, docs, acks, events, regs, tasks, benefits] = await Promise.all([
    supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'aktywny'),
    supabase.from('declarations').select('id', { count: 'exact', head: true }).eq('status', 'oczekuje'),
    supabase.from('member_dues_status').select('months_due'),
    supabase.from('message_threads').select('id, last_message_at').eq('board_folder', 'aktualne'),
    supabase
      .from('documents')
      .select('id, title')
      .eq('is_published', true)
      .eq('requires_ack', true)
      .order('published_at', { ascending: false })
      .limit(1),
    supabase.from('document_acks').select('document_id'),
    supabase.from('events').select('id, title, starts_at, capacity').eq('is_published', true).gte('starts_at', now).order('starts_at'),
    supabase.from('event_registrations').select('event_id'),
    supabase.from('tasks').select('status, due_on'),
    supabase.from('benefit_requests').select('status'),
  ]);

  const activeCount = members.count ?? 0;
  const arrears = (dues.data ?? []).filter((d) => (d.months_due ?? 0) > 0).length;
  const newMessages = inbox.data?.length ?? 0;
  const newSinceLogin = prevSeen ? (inbox.data ?? []).filter((t) => t.last_message_at > prevSeen).length : newMessages;
  const lastAckDoc = docs.data?.[0];
  const lastAckCount = lastAckDoc ? (acks.data ?? []).filter((a) => a.document_id === lastAckDoc.id).length : 0;
  const nextEvent = events.data?.[0];
  const nextEventRegs = nextEvent ? (regs.data ?? []).filter((r) => r.event_id === nextEvent.id).length : 0;
  const openTasks = (tasks.data ?? []).filter((t) => t.status === 'w_toku').length;
  const lateTasks = (tasks.data ?? []).filter((t) => t.status === 'w_toku' && t.due_on && t.due_on < today).length;
  const pendingBenefits = (benefits.data ?? []).filter((b) => b.status === 'zgloszony').length;
  const activeBenefits = (benefits.data ?? []).filter((b) => b.status === 'przyznany').length;

  return (
    <BoardShell member={me} current="/zarzad">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-bold">Pulpit zarządu</h1>
        <span className="text-ink-muted">
          {prevSeen ? `Ostatnie logowanie: ${formatDateTime(prevSeen)}` : 'Pierwsze logowanie'} · czerwona liczba oznacza sprawę do
          załatwienia
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <Section
          title="Członkowie"
          actions={
            <>
              <a href="/zarzad/czlonkowie#dek" className={decl.count ? primary : secondary}>
                Deklaracje
              </a>
              <a href="/zarzad/czlonkowie" className={secondary}>
                Lista członków
              </a>
            </>
          }
        >
          <div className="flex flex-wrap gap-6">
            <Stat value={activeCount} label="aktywnych członków" />
            <Stat value={decl.count ?? 0} label="deklaracji do rozpatrzenia" alert={(decl.count ?? 0) > 0} />
          </div>
        </Section>

        <Section
          title="Składki"
          actions={
            <a href="/zarzad/czlonkowie" className={secondary}>
              Przejdź do członków
            </a>
          }
        >
          <div className="flex flex-wrap gap-6">
            <Stat value={arrears} label="osób z zaległością" alert={arrears > 0} />
          </div>
          <p className="text-[15px] text-ink-soft">Wpłaty wpisuje się na karcie członka (kliknij nazwisko na liście).</p>
        </Section>

        <Section
          title="Komunikacja"
          actions={
            <>
              <a href="/zarzad/wiadomosci" className={newMessages ? primary : secondary}>
                Wiadomości
              </a>
              <a href="/zarzad/dokumenty" className={secondary}>
                Dokumenty
              </a>
            </>
          }
        >
          <div className="flex flex-wrap gap-6">
            <Stat value={newMessages} label="nowych wiadomości" alert={newMessages > 0} />
          </div>
          {prevSeen && newSinceLogin > 0 && (
            <p className="text-[15px] text-ink-soft">Od ostatniego logowania: {newSinceLogin}</p>
          )}
          {lastAckDoc && (
            <p className="text-[15px] text-ink-soft">
              Potwierdzenia odczytu „{lastAckDoc.title}”: {lastAckCount} z {activeCount}
            </p>
          )}
        </Section>

        <Section
          title="Wydarzenia"
          actions={
            <a href="/zarzad/wydarzenia" className={secondary}>
              Wydarzenia
            </a>
          }
        >
          {nextEvent ? (
            <div className="flex flex-col gap-1">
              <span className="font-semibold">{nextEvent.title}</span>
              <span className="text-[15px] text-ink-soft">
                {formatDateTime(nextEvent.starts_at)} · zapisanych {nextEventRegs}
                {nextEvent.capacity ? ` z ${nextEvent.capacity}` : ''}
              </span>
              {(events.data?.length ?? 0) > 1 && (
                <span className="text-sm text-ink-muted">+ {(events.data?.length ?? 0) - 1} kolejnych zaplanowanych</span>
              )}
            </div>
          ) : (
            <p className="text-ink-muted">Brak zaplanowanych wydarzeń.</p>
          )}
        </Section>

        <Section
          title="Zadania"
          actions={
            <a href="/zarzad/zadania" className={lateTasks ? primary : secondary}>
              Przejdź do zadań
            </a>
          }
        >
          <div className="flex flex-wrap gap-6">
            <Stat value={openTasks} label="otwartych" />
            <Stat value={lateTasks} label="po terminie" alert={lateTasks > 0} />
          </div>
        </Section>

        <Section
          title="Benefity"
          actions={
            <a href="/zarzad/benefity" className={pendingBenefits ? primary : secondary}>
              Przejdź do benefitów
            </a>
          }
        >
          <div className="flex flex-wrap gap-6">
            <Stat value={pendingBenefits} label="zgłoszeń do potwierdzenia" alert={pendingBenefits > 0} />
            <Stat value={activeBenefits} label="aktywnych benefitów" />
          </div>
        </Section>
      </div>
    </BoardShell>
  );
}
