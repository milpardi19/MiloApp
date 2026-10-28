import { Platform } from 'react-native';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { RegisteredUser } from './educationAdmin';

const HEADERS = ['نام کامل', 'ایمیل', 'پلتفرم', 'نسخه اپ', 'تاریخ ثبت‌نام', 'آخرین فعالیت'];

function csvCell(value: string | null | undefined): string {
  const text = value ?? '';
  // Prevent spreadsheet formula injection from user-supplied names.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Account metadata only: no private messages, voice files, or learning progress. */
export function registeredUsersCsv(users: RegisteredUser[]): string {
  const rows = users.map(user => [
    user.full_name, user.email, user.platform || '', user.app_version || '',
    user.registered_at, user.last_seen_at,
  ].map(csvCell).join(','));
  // Byte-order mark keeps Persian text readable when opened in spreadsheet apps.
  return '\uFEFF' + [HEADERS.map(csvCell).join(','), ...rows].join('\r\n');
}

/** Downloads the CSV in the browser, or opens the system share sheet on Android/iOS. */
export async function downloadRegisteredUsers(users: RegisteredUser[]): Promise<void> {
  const csv = registeredUsersCsv(users);
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `milo-users-${stamp}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const directory = FileSystemLegacy.cacheDirectory;
  if (!directory) throw new Error('فضای ذخیره‌سازی موقت در دسترس نیست.');
  const uri = `${directory}${fileName}`;
  await FileSystemLegacy.writeAsStringAsync(uri, csv, { encoding: FileSystemLegacy.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('اشتراک‌گذاری فایل روی این دستگاه ممکن نیست.');
  await Sharing.shareAsync(uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle: 'ذخیره فهرست کاربران' });
}
