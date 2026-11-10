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
