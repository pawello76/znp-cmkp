'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const MAX_BYTES = 5 * 1024 * 1024;

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary self-start border-navy text-navy">
      Zapisz jako PDF / drukuj
    </button>
  );
}

/** Zdjęcie trafia do prywatnego miejsca „photos” jako <id członka>.jpg|png (reguły RLS w Storage). */
export function PhotoUpload({ memberId, photoPath }: { memberId: string; photoPath: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    if (!['image/jpeg', 'image/png'].includes(file.type)) return setError('Wybierz plik JPG lub PNG.');
    if (file.size > MAX_BYTES) return setError('Plik jest za duży (maksymalnie 5 MB).');

    setBusy(true);
    const supabase = createClient();
    const path = `${memberId}.${file.type === 'image/png' ? 'png' : 'jpg'}`;
    if (photoPath && photoPath !== path) await supabase.storage.from('photos').remove([photoPath]);

    const { error: upErr } = await supabase.storage.from('photos').upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setBusy(false);
      return setError('Nie udało się wgrać zdjęcia. Spróbuj ponownie.');
    }
    await supabase.from('members').update({ photo_path: path }).eq('id', memberId);
    setBusy(false);
    router.refresh();
  }

  async function onRemove() {
    if (!photoPath) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.storage.from('photos').remove([photoPath]);
    await supabase.from('members').update({ photo_path: null }).eq('id', memberId);
    setBusy(false);
    router.refresh();
  }

  return (
    <section className="card flex max-w-[560px] flex-col gap-3">
      <h2 className="text-lg font-bold">Zdjęcie do legitymacji</h2>
      <p className="text-[15px] text-ink-soft">Zdjęcie twarzy na jasnym tle, jak do dokumentu. Plik JPG lub PNG, do 5 MB.</p>
      <div className="flex flex-wrap items-center gap-2.5">
        <label className={`btn-primary cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
          {busy ? 'Zapisywanie…' : photoPath ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}
          <input type="file" accept="image/jpeg,image/png" onChange={onFile} className="sr-only" disabled={busy} />
        </label>
        {photoPath && (
          <button type="button" onClick={onRemove} className="btn-secondary" disabled={busy}>
            Usuń zdjęcie
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="font-semibold text-[#9B1C1C]">
          {error}
        </p>
      )}
    </section>
  );
}
