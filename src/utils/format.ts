const CLINIC_TZ = 'Asia/Kolkata';

function toDate(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Calendar date, for example 10 Oct 2026. Leaves text that is not a date unchanged. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  if (!/^\d{4}-\d{2}-\d{2}/.test(value.trim())) return value;
  const date = toDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: /^\d{4}-\d{2}-\d{2}$/.test(value) ? 'UTC' : CLINIC_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Date and time in India, for example 10 Oct 2026, 1:49 pm. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return formatDate(value);
  if (!/^\d{4}-\d{2}-\d{2}[T ]/.test(value.trim())) return value;
  const date = toDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: CLINIC_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
