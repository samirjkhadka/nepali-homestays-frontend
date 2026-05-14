/** Nepal local time (UTC+5:45), formatted as YYYY-MM-DD HH:MM:SS */
export function formatDateTime(date: Date | string | number | undefined | null): string {
  if (date == null) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
    .format(d)
    .replace(' ', ' ');
}
