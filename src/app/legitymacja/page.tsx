import { AppHeader } from '@/components/app-header';
import { MemberNav } from '@/components/member-nav';
import { formatDate, formatMonth } from '@/lib/format';
import { cardValidUntil, requireMember } from '@/lib/session';
import { PhotoUpload, PrintButton } from './photo-upload';

export default async function CardPage() {
  const { supabase, member } = await requireMember();

  const [{ data: dues }, signed] = await Promise.all([
    supabase.from('member_dues_status').select('paid_until, months_due').eq('member_id', member.id).maybeSingle(),
    member.photo_path ? supabase.storage.from('photos').createSignedUrl(member.photo_path, 600) : Promise.resolve(null),
  ]);
  const photoUrl = signed?.data?.signedUrl ?? null;
  const validUntil = cardValidUntil(member);
  const expired = validUntil < new Date().toISOString().slice(0, 10);
  const monthsDue = dues?.months_due ?? 0;
  const initials = `${member.first_name[0] ?? ''}${member.last_name[0] ?? ''}`;

  return (
    <div className="min-h-screen">
      <div className="no-print">
        <AppHeader member={member} area="czlonek" />
      </div>
      <MemberNav current="/legitymacja" />
      <main className="mx-auto flex max-w-[1360px] flex-col gap-5 px-6 py-6">
        <h1 className="no-print text-[28px] font-bold">Cyfrowa legitymacja</h1>

        <section aria-label="Legitymacja członkowska" className="print-card w-full max-w-[560px] overflow-hidden rounded-[14px] border border-line bg-white">
          <div className="flex flex-col bg-navy px-5 py-4 text-white">
            <span className="text-lg font-bold">Legitymacja członkowska</span>
            <span className="text-sm text-[#DCE5F0]">Związek Nauczycielstwa Polskiego · CMKP</span>
          </div>
          <div className="flex flex-wrap gap-5 p-5">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Zdjęcie członka" className="h-[140px] w-[112px] rounded-lg object-cover" />
            ) : (
              <div
                role="img"
                aria-label="Brak zdjęcia"
                className="flex h-[140px] w-[112px] items-center justify-center rounded-lg bg-navy-light text-3xl font-bold text-navy"
              >
                {initials}
              </div>
            )}
            <dl className="grid flex-[1_1_220px] grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2">
                <dt className="text-[13px] text-ink-muted">Imię i nazwisko</dt>
                <dd className="text-xl font-bold">
                  {member.first_name} {member.last_name}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-ink-muted">Numer członkowski</dt>
                <dd className="font-semibold">{member.member_no}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-ink-muted">Data przyjęcia</dt>
                <dd className="font-semibold">{formatDate(member.joined_at)}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-ink-muted">Ważna do</dt>
                <dd className={`font-semibold ${expired ? 'text-[#9B1C1C]' : ''}`}>
                  {formatDate(validUntil)}
                  {expired ? ' (nieważna)' : ''}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-ink-muted">Składki</dt>
                <dd className={`font-semibold ${monthsDue === 0 ? 'text-ok' : 'text-warn'}`}>
                  {monthsDue === 0
                    ? dues?.paid_until
                      ? `Opłacone do ${formatMonth(dues.paid_until)}`
                      : 'Opłacone'
                    : `Zaległość ${monthsDue} mies.`}
                </dd>
              </div>
            </dl>
          </div>
          <p className="border-t border-line px-5 py-2 text-xs text-ink-muted">
            Stan na {formatDate(new Date().toISOString())}
          </p>
        </section>

        <div className="no-print flex flex-col gap-5">
          <PrintButton />
          <PhotoUpload memberId={member.id} photoPath={member.photo_path} />
        </div>
      </main>
    </div>
  );
}
