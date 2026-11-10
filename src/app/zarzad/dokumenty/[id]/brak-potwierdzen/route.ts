import { NextResponse, type NextRequest } from 'next/server';
import { requireBoard } from '@/lib/session';

const cell = (v: string | null) => `"${(v ?? '').replace(/^[=+\-@]/, "'$&").replace(/"/g, '""')}"`;

/** CSV: aktywni członkowie, którzy nie potwierdzili zapoznania się z dokumentem. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireBoard();

  const [{ data: doc }, { data: members }, { data: acks }] = await Promise.all([
    supabase.from('documents').select('title').eq('id', id).maybeSingle(),
    supabase.from('members').select('id, member_no, first_name, last_name, unit').eq('status', 'aktywny').order('last_name'),
    supabase.from('document_acks').select('member_id').eq('document_id', id),
  ]);
  if (!doc) return new NextResponse('Nie znaleziono dokumentu.', { status: 404 });

  const acked = new Set((acks ?? []).map((a) => a.member_id));
  const rows = (members ?? []).filter((m) => !acked.has(m.id));
  await supabase.rpc('log_event', { p_action: 'export_missing_acks', p_details: { document_id: id, rows: rows.length } });

  const csv =
    '﻿' +
    [
      ['Numer członkowski', 'Imię', 'Nazwisko', 'Jednostka'].map(cell).join(';'),
      ...rows.map((m) => [m.member_no, m.first_name, m.last_name, m.unit].map(cell).join(';')),
    ].join('\r\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="brak-potwierdzen-${id.slice(0, 8)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
