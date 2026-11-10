import { createClient } from '@/lib/supabase/server';
import { NavList } from './nav-list';

/** Menu członka z licznikami: nowe odpowiedzi zarządu i otwarte zadania. */
export async function MemberNav({ current }: { current: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let replies = 0;
  let tasks = 0;
  if (user) {
    const [{ data: threads }, { count }] = await Promise.all([
      supabase.from('message_threads').select('last_message_at, member_last_read_at').eq('member_id', user.id),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('assignee_id', user.id).eq('status', 'w_toku'),
    ]);
    replies = (threads ?? []).filter((t) => t.last_message_at > t.member_last_read_at).length;
    tasks = count ?? 0;
  }

  return (
    <NavList
      label="Menu członka"
      current={current}
      items={[
        { href: '/', label: 'Pulpit' },
        { href: '/aktualnosci', label: 'Aktualności' },
        { href: '/wydarzenia', label: 'Wydarzenia' },
        { href: '/dokumenty', label: 'Dokumenty' },
        { href: '/benefity', label: 'Benefity' },
        { href: '/kontakt', label: 'Kontakt', badge: replies },
        ...(tasks > 0 || current === '/zadania' ? [{ href: '/zadania', label: 'Moje zadania', badge: tasks }] : []),
        { href: '/legitymacja', label: 'Legitymacja' },
        { href: '/skladki', label: 'Składki' },
        { href: '/zmiana-hasla', label: 'Zmiana hasła' },
      ]}
    />
  );
}
