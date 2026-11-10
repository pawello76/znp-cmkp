import { createClient } from '@/lib/supabase/server';
import { NavList } from './nav-list';

/** Menu zarządu z licznikami spraw do załatwienia (powiadomienia po zalogowaniu). */
export async function BoardNav({ current }: { current: string }) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [decl, msgs, bens, late] = await Promise.all([
    supabase.from('declarations').select('id', { count: 'exact', head: true }).eq('status', 'oczekuje'),
    supabase.from('message_threads').select('id', { count: 'exact', head: true }).eq('board_folder', 'aktualne'),
    supabase.from('benefit_requests').select('id', { count: 'exact', head: true }).eq('status', 'zgloszony'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'w_toku').lt('due_on', today),
  ]);

  return (
    <NavList
      label="Menu zarządu"
      current={current}
      items={[
        { href: '/zarzad', label: 'Członkowie i konta', badge: decl.count ?? 0 },
        { href: '/zarzad/wiadomosci', label: 'Wiadomości', badge: msgs.count ?? 0 },
        { href: '/zarzad/aktualnosci', label: 'Aktualności' },
        { href: '/zarzad/dokumenty', label: 'Dokumenty' },
        { href: '/zarzad/wydarzenia', label: 'Wydarzenia' },
        { href: '/zarzad/zadania', label: 'Zadania', badge: late.count ?? 0 },
        { href: '/zarzad/benefity', label: 'Benefity', badge: bens.count ?? 0 },
      ]}
    />
  );
}
