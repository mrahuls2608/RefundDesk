/** The only money formatter in the app (Rules §6.3): ₹1,234.00 */
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

export function formatINR(amount: number): string {
  return inr.format(amount);
}

const IST = 'Asia/Kolkata';

const dateTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST,
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const dateOnly = new Intl.DateTimeFormat('en-IN', { timeZone: IST, day: 'numeric', month: 'short', year: 'numeric' });
const timeOnly = new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true });
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: IST, year: 'numeric', month: '2-digit', day: '2-digit' });

/** All dates are shown in IST, e.g. "20 Nov, 6:35 pm". */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeOnly.format(new Date(iso));
}

/** "Today", "Yesterday" or "20 Nov 2026" — used to group transactions. */
export function formatDayLabel(iso: string, now = new Date()): string {
  const key = dayKey.format(new Date(iso));
  if (key === dayKey.format(now)) return 'Today';
  if (key === dayKey.format(new Date(now.getTime() - 86_400_000))) return 'Yesterday';
  return dateOnly.format(new Date(iso));
}

export function istDayKey(iso: string): string {
  return dayKey.format(new Date(iso));
}

export function formatAge(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / (60 * 24))}d`;
}
