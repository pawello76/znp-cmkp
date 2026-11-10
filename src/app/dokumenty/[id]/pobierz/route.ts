import { NextResponse, type NextRequest } from 'next/server';
import { requireMember } from '@/lib/session';

/** Pobranie PDF: krótkotrwały podpisany link (RLS decyduje, czy dokument jest widoczny dla tej osoby). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireMember();

  const { data: doc } = await supabase.from('documents').select('title, file_path').eq('id', id).maybeSingle();
  if (!doc) return new NextResponse('Nie znaleziono dokumentu.', { status: 404 });

  const fileName = `${doc.title.replace(/[^\p{L}\p{N} ._-]/gu, '').trim() || 'dokument'}.pdf`;
  const { data } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 60, { download: fileName });
  if (!data?.signedUrl) return new NextResponse('Nie udało się przygotować pliku.', { status: 500 });

  return NextResponse.redirect(data.signedUrl, { status: 303 });
}
