import { Redirect, useLocalSearchParams } from 'expo-router';
import { FEATURES } from '@/lib/features';
import TurkishLesson from '@/components/TurkishLesson';
import { CoursePage } from '@/components/LanguageCourseUI';
import { findTurkishLesson } from '@/lib/languages/turkish';

export default function TurkishLessonRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!FEATURES.turkishCourse) return <Redirect href={'/languages' as never} />;
  const lesson = findTurkishLesson(id);
  if (!lesson) {
    return (
      <CoursePage title="درس ترکی پیدا نشد" subtitle="از صفحهٔ ترکی یک درس معتبر باز کنید.">
        {null}
      </CoursePage>
    );
  }
  return <TurkishLesson key={lesson.id} lesson={lesson} />;
}
