import { Redirect, Slot } from 'expo-router';
import { useLearnerLanguageAccess } from '@/components/LearnerLanguageAccess';
import { FEATURES } from '@/lib/features';

export default function EnglishCourseLayout() {
  const { isLanguageAllowed } = useLearnerLanguageAccess();
  if (!FEATURES.englishCourse || !isLanguageAllowed('en')) {
    return <Redirect href={'/languages' as never} />;
  }
  return <Slot />;
}
