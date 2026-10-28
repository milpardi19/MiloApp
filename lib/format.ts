export function formatBytes(bytes: number): string {
  if (bytes === 0) return '۰ بایت';
  const units = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${toPersianDigits(value.toFixed(i === 0 ? 0 : 1))} ${units[i]}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${toPersianDigits(secs)} ثانیه`;
  return `${toPersianDigits(mins)}:${toPersianDigits(secs.toString().padStart(2, '0'))}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${toPersianDigits(hours)} ساعت`;
  return `${toPersianDigits(hours)} ساعت و ${toPersianDigits(mins)} دقیقه`;
}

export function toPersianDigits(input: string | number): string {
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/[0-9]/g, (d) => persian[parseInt(d)]);
}

/**
 * Persian paragraphs that quote a Turkish/Latin phrase get scrambled by the
 * browser's bidi algorithm: the Latin run (and a trailing "!") jumps to the
 * wrong side of the sentence. Wrapping every Latin run in First-Strong
 * Isolate/PDI keeps the quote in place while the paragraph stays right-to-left.
 * Used by the Turkish lesson pattern lines and notes.
 */
export function bidiIsolate(text: string): string {
  // A leading hyphen belongs to the Turkish suffix itself (-ler/-lar), so it
  // is kept inside the isolate instead of floating to the other side.
  const LTR_RUN = /-?[A-Za-zÇĞİÖŞÜçğıöşü][A-Za-zÇĞİÖŞÜçğıöşü0-9\s'’\-.,!?;:()/]*/g;
  return text.replace(LTR_RUN, match => `\u2068${match.trimEnd()}\u2069${match.endsWith(' ') ? ' ' : ''}`);
}

export function formatPersianDate(isoDate: string): string {
  const date = new Date(isoDate);
  const months = [
    'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
    'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر',
  ];
  const day = toPersianDigits(date.getDate());
  const month = months[date.getMonth()];
  const time = `${toPersianDigits(date.getHours().toString().padStart(2, '0'))}:${toPersianDigits(
    date.getMinutes().toString().padStart(2, '0'),
  )}`;
  return `${day} ${month} - ${time}`;
}

export function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return `${toPersianDigits(date.getHours().toString().padStart(2, '0'))}:${toPersianDigits(
    date.getMinutes().toString().padStart(2, '0'),
  )}`;
}

export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${toPersianDigits(days)} روز پیش`;
  if (hours > 0) return `${toPersianDigits(hours)} ساعت پیش`;
  if (minutes > 0) return `${toPersianDigits(minutes)} دقیقه پیش`;
  return 'همین حالا';
}
