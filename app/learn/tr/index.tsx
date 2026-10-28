import { Redirect } from 'expo-router';
import { FEATURES } from '@/lib/features';
import TurkishHome from '@/components/TurkishHome';

/**
 * ورودی نسخهٔ ترکی. این مسیر فقط در نسخهٔ دوم اپ (Turkish edition) فعال است؛
 * در نسخهٔ اصلی، صفحهٔ زبان‌ها نمایش داده می‌شود تا دو نسخه از هم جدا بمانند.
 */
export default function TurkishHomeRoute() {
  return FEATURES.turkishCourse ? <TurkishHome /> : <Redirect href={'/languages' as never} />;
}
