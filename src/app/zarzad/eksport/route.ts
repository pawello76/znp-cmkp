import { NextResponse, type NextRequest } from 'next/server';
import { cardValidUntil, requireBoard } from '@/lib/session';

const STATUS: Record<string, string> = { aktywny: 'aktywne', zablokowany: 'zablokowane', byly: 'były członek' };

function cell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  // Ochrona przed wstrzyknięciem formuł w Excelu + cudzysłowy dla separatora
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Eksport listy członków do CSV (separator „;”, kodowanie UTF-8 z BOM – otwiera się poprawnie w Excelu). */
export async function GET(request: NextRequest) {
  const { supabase } = await requireBoard();
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim().toLowerCase();

  const [{ data: members }, { data: dues }] = await Promise.all([
    supabase.from('members').select('*').order('member_no'),
    supabase.from('member_dues_status').select('member_id, paid_until, months_due'),
  ]);
  const dueById = new Map((dues ?? []).map((d) => [d.member_id, d]));

  const rows = (members ?? []).filter(
    (m) => !q || m.member_no.toLowerCase().includes(q) || `${m.first_name} ${m.last_name}`.toLowerCase().includes(q),
  );

  const header = [
    'Numer członkowski', 'Imię', 'Nazwisko', 'Rola', 'Jednostka', 'Stanowisko', 'E-mail',
    'Data przyjęcia', 'Legitymacja ważna do', 'Składki opłacone do', 'Zaległość (mies.)', 'Konto',
  ];
  const lines = rows.map((m) => {
    const d = dueById.get(m.id);
    return [
      m.member_no, m.first_name, m.last_name, m.is_board ? 'Zarząd' : 'Członek', m.unit, m.position, m.email,
      m.joined_at, cardValidUntil(m), d?.paid_until?.slice(0, 7) ?? '', d?.months_due ?? 0, STATUS[m.status] ?? m.status,
    ].map(cell).join(';');
  });

  await supabase.rpc('log_event', { p_action: 'export_members', p_details: { rows: rows.length, filter: q || null } });

  const csv = '﻿' + [header.map(cell).join(';'), ...lines].join('\r\n');
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="czlonkowie-znp-cmkp-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
