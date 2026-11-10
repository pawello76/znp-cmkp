import { NextResponse, type NextRequest } from 'next/server';
import { cardValidUntil, requireBoard } from '@/lib/session';
import { formatDateTime } from '@/lib/format';

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
  const rokParam = request.nextUrl.searchParams.get('rok') ?? '';
  const allYears = rokParam === 'wszystkie';
  const year = /^\d{4}$/.test(rokParam) ? rokParam : String(new Date().getFullYear());

  const [{ data: members }, { data: dues }, { data: payments }, { data: bens }, { data: threads }, { data: regs }] = await Promise.all([
    supabase.from('members').select('*').order('last_name'),
    supabase.from('member_dues_status').select('member_id, paid_until, months_due'),
    supabase.from('dues_payments').select('member_id, amount_grosz, paid_on'),
    supabase.from('benefit_requests').select('member_id, value_grosz').eq('status', 'przyznany'),
    supabase.from('message_threads').select('member_id').eq('board_folder', 'aktualne'),
    supabase.from('event_registrations').select('member_id'),
  ]);
  const dueById = new Map((dues ?? []).map((d) => [d.member_id, d]));
  const add = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) ?? 0) + v);
  const paid = new Map<string, number>();
  for (const p of payments ?? []) if (allYears || p.paid_on.startsWith(year)) add(paid, p.member_id, p.amount_grosz);
  const benN = new Map<string, number>();
  const benSum = new Map<string, number>();
  for (const b of bens ?? []) {
    add(benN, b.member_id, 1);
    add(benSum, b.member_id, b.value_grosz ?? 0);
  }
  const unread = new Map<string, number>();
  for (const t of threads ?? []) add(unread, t.member_id, 1);
  const events = new Map<string, number>();
  for (const r of regs ?? []) add(events, r.member_id, 1);
  const zl = (grosz: number) => (grosz / 100).toFixed(2).replace('.', ',');

  const rows = (members ?? []).filter(
    (m) =>
      !q || m.login.includes(q) || (m.member_no ?? '').toLowerCase().includes(q) || `${m.first_name} ${m.last_name}`.toLowerCase().includes(q),
  );

  const header = [
    'Login', 'Numer członkowski', 'Imię', 'Nazwisko', 'Rola', 'Jednostka', 'Stanowisko', 'E-mail',
    'Data przyjęcia', 'Legitymacja ważna do', 'Składki opłacone do', 'Zaległość (mies.)',
    allYears ? 'Suma składek – wszystkie lata (zł)' : `Suma składek ${year} (zł)`,
    'Liczba benefitów', 'Wartość benefitów (zł)', 'Nieprzeczytane wiadomości', 'Zapisy na wydarzenia', 'Konto', 'Ostatnie logowanie',
  ];
  const lines = rows.map((m) => {
    const d = dueById.get(m.id);
    return [
      m.login, m.member_no, m.first_name, m.last_name, m.is_board ? 'Zarząd' : 'Członek', m.unit, m.position, m.email,
      m.joined_at, cardValidUntil(m), d?.paid_until?.slice(0, 7) ?? '', d?.months_due ?? 0,
      zl(paid.get(m.id) ?? 0), benN.get(m.id) ?? 0, zl(benSum.get(m.id) ?? 0), unread.get(m.id) ?? 0, events.get(m.id) ?? 0,
      STATUS[m.status] ?? m.status, m.last_seen_at ? formatDateTime(m.last_seen_at) : '-',
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
