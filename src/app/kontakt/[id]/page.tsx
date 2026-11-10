import { notFound } from 'next/navigation';
import { MemberShell } from '@/components/shell';
import { ReplyForm } from '@/components/message-forms';
import { ThreadView } from '@/components/thread-view';
import { requireMember } from '@/lib/session';

export default async function MemberThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, member } = await requireMember();

  const { data: thread } = await supabase.from('message_threads').select('*').eq('id', id).maybeSingle();
  if (!thread || thread.member_id !== member.id) notFound();

  // Otwarcie wątku = odpowiedzi przeczytane
  if (thread.last_message_at > thread.member_last_read_at) {
    await supabase.from('message_threads').update({ member_last_read_at: new Date().toISOString() }).eq('id', id);
  }

  const [{ data: messages }, { data: board }] = await Promise.all([
    supabase.from('messages').select('id, body, created_at, author_id').eq('thread_id', id).order('created_at'),
    supabase.rpc('board_contacts'),
  ]);
  const names = new Map((board ?? []).map((b) => [b.member_id, `${b.first_name} ${b.last_name}${b.roles.length ? `, ${b.roles[0]}` : ''}`]));

  return (
    <MemberShell member={member} current="/kontakt">
        <a href="/kontakt" className="self-start font-semibold text-navy">
          ← Wróć do wiadomości
        </a>
        <h1 className="text-2xl font-bold">{thread.subject}</h1>
        <ThreadView
          messages={messages ?? []}
          mineId={(a) => a === member.id}
          nameOf={(a) => (a === member.id ? 'Ty' : names.get(a) ?? 'Zarząd')}
        />
        <div className="card">
          <ReplyForm threadId={id} />
        </div>
    </MemberShell>
  );
}
