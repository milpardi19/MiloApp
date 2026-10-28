import { Redirect, Slot } from 'expo-router';
import { useLearnerLanguageAccess } from '@/components/LearnerLanguageAccess';
import { FEATURES } from '@/lib/features';

export default function TurkishCourseLayout() {
  const { isLanguageAllowed } = useLearnerLanguageAccess();
  if (!FEATURES.turkishCourse || !isLanguageAllowed('tr')) {
    return <Redirect href={'/languages' as never} />;
  }
  return <Slot />;
}
