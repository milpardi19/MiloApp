import { Redirect } from 'expo-router';
import { FEATURES } from '@/lib/features';
import TurkishPronunciationLab from '@/components/TurkishPronunciationLab';

export default function TurkishPronunciationRoute() {
  if (!FEATURES.turkishCourse) return <Redirect href={'/languages' as never} />;
  return <TurkishPronunciationLab />;
}
