const dateFmt = new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Warsaw' });
const monthFmt = new Intl.DateTimeFormat('pl-PL', { month: '2-digit', year: 'numeric', timeZone: 'Europe/Warsaw' });

export function formatDate(value: string | null | undefined): string {
  if (!value) return '–';
  return dateFmt.format(new Date(value));
}

/** "2026-10-01" → "10.2026" */
export function formatMonth(value: string | null | undefined): string {
  if (!value) return '–';
  return monthFmt.format(new Date(value));
}

export function formatAmount(grosz: number): string {
  return (grosz / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' });
}

const dateTimeFmt = new Intl.DateTimeFormat('pl-PL', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw',
});
const timeFmt = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
const dayFmt = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', timeZone: 'Europe/Warsaw' });
const shortMonthFmt = new Intl.DateTimeFormat('pl-PL', { month: 'short', timeZone: 'Europe/Warsaw' });

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '–';
  return dateTimeFmt.format(new Date(value));
}

export function formatTime(value: string): string {
  return timeFmt.format(new Date(value));
}

/** Dzień i skrót miesiąca do „kalendarzowego” kafelka wydarzenia. */
export function dayAndMonth(value: string): { day: string; month: string } {
  const d = new Date(value);
  return { day: dayFmt.format(d), month: shortMonthFmt.format(d).replace('.', '') };
}

/** Czas wpisany w formularzu (datetime-local, czas polski) → ISO w UTC. */
export function warsawLocalToISO(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const asUTC = Date.UTC(y, mo - 1, d, h, mi);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Warsaw', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
      .formatToParts(new Date(asUTC))
      .map((p) => [p.type, p.value]),
  );
  const zoned = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(asUTC - (zoned - asUTC)).toISOString();
}
