import { Redirect } from 'expo-router';
import { FEATURES } from '@/lib/features';
import TurkishLibrary from '@/components/TurkishLibrary';

export default function TurkishLibraryRoute() {
  if (!FEATURES.turkishCourse) return <Redirect href={'/languages' as never} />;
  return <TurkishLibrary />;
}
