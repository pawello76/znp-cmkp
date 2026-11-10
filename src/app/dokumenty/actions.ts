'use server';

import { revalidatePath } from 'next/cache';
import { requireMember } from '@/lib/session';

export async function acknowledgeDocument(formData: FormData) {
  const { supabase, member } = await requireMember();
  const documentId = String(formData.get('document_id') ?? '');
  await supabase.from('document_acks').upsert({ document_id: documentId, member_id: member.id }, { ignoreDuplicates: true });
  revalidatePath('/dokumenty');
  revalidatePath('/');
}
