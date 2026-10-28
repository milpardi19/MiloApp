import { Redirect } from 'expo-router';
import { FEATURES } from '@/lib/features';
import TurkishReview from '@/components/TurkishReview';

export default function TurkishReviewRoute() {
  if (!FEATURES.turkishCourse) return <Redirect href={'/languages' as never} />;
  return <TurkishReview />;
}
