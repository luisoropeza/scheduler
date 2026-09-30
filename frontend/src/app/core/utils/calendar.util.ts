export interface CalendarDay {
  date: Date;
  iso: string;
  inCurrentMonth: boolean;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Always returns 6 full weeks (Mon-Sun) so the grid height stays stable across months. */
export function buildMonthMatrix(year: number, month: number): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1);
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const cursor = new Date(year, month, 1 - leadingDays);

  const weeks: CalendarDay[][] = [];
  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = [];
    for (let day = 0; day < 7; day++) {
      days.push({ date: new Date(cursor), iso: toIso(cursor), inCurrentMonth: cursor.getMonth() === month });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }

  return weeks;
}

export function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatDayLabel(iso: string): string {
  return parseIso(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Compact "Sep 24" label, used by the date-range-picker trigger. */
export function formatShortDate(iso: string): string {
  return parseIso(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Converts a native <input type="time"> value ("14:05") into a display string ("2:05 PM"). */
export function formatTime(value: string): string {
  const [hoursRaw, minutes] = value.split(':');
  const hours = Number(hoursRaw);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = ((hours + 11) % 12) + 1;
  return `${displayHours}:${minutes} ${period}`;
}
