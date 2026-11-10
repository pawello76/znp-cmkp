'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createDocument } from './actions';

const MAX_BYTES = 20 * 1024 * 1024;

export function UploadDocumentForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get('file');
    if (!(file instanceof File) || file.size === 0) return setError('Wybierz plik PDF.');
    if (file.type !== 'application/pdf') return setError('Dozwolone są tylko pliki PDF.');
    if (file.size > MAX_BYTES) return setError('Plik jest za duży (maksymalnie 20 MB).');

    setBusy(true);
    const path = `${crypto.randomUUID()}.pdf`;
    const supabase = createClient();
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file, { contentType: 'application/pdf' });
    if (upErr) {
      setBusy(false);
      return setError('Nie udało się wgrać pliku.');
    }
    fd.delete('file');
    fd.set('file_path', path);
    const result = await createDocument(fd);
    setBusy(false);
    if (result.error) return setError(result.error);
    formRef.current?.reset();
    setOk('Dokument zapisany.');
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-[2_1_260px] flex-col gap-1.5">
          <label htmlFor="d-title" className="label">
            Nazwa dokumentu
          </label>
          <input id="d-title" name="title" required maxLength={200} className="field" />
        </div>
        <div className="flex flex-[1_1_200px] flex-col gap-1.5">
          <label htmlFor="d-cat" className="label">
            Kategoria
          </label>
          <select id="d-cat" name="category_id" className="field">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-[1_1_240px] flex-col gap-1.5">
          <label htmlFor="d-file" className="label">
            Plik PDF (do 20 MB)
          </label>
          <input id="d-file" name="file" type="file" accept="application/pdf" required className="min-h-[46px] py-2" />
        </div>
      </div>
      <label className="flex min-h-[44px] items-center gap-2.5">
        <input type="checkbox" name="requires_ack" defaultChecked className="h-5 w-5" />
        <span>
          <strong>Wymagaj potwierdzenia odczytania</strong> – członkowie zobaczą przycisk „Potwierdzam zapoznanie się”
        </span>
      </label>
      <label className="flex min-h-[44px] items-center gap-2.5">
        <input type="checkbox" name="publish" defaultChecked className="h-5 w-5" />
        <span>Opublikuj od razu</span>
      </label>
      {error && (
        <p role="alert" className="font-semibold text-[#9B1C1C]">
          {error}
        </p>
      )}
      {ok && (
        <p role="status" className="font-semibold text-ok">
          {ok}
        </p>
      )}
      <button type="submit" className="btn-primary self-start" disabled={busy}>
        {busy ? 'Wgrywanie…' : 'Zapisz dokument'}
      </button>
    </form>
  );
}
