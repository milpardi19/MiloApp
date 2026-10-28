import type { ComponentType } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { CoursePage } from '@/components/LanguageCourseUI';
import { useLearnerLanguageAccess } from '@/components/LearnerLanguageAccess';
import { FEATURES } from '@/lib/features';

function resolveDefault<T>(mod: { default?: T } | T): T {
  return mod && typeof mod === 'object' && 'default' in mod && mod.default ? mod.default : (mod as T);
}

export default function LanguageLibraryRoute() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const { isLanguageAllowed } = useLearnerLanguageAccess();

  if (language === 'de') {
    if (!FEATURES.germanCourse || !isLanguageAllowed('de')) return <Redirect href={'/languages' as never} />;
    const GermanCourseLibrary = resolveDefault<ComponentType>(require('@/components/GermanCourseLibrary'));
    return <GermanCourseLibrary />;
  }
  if (language === 'ru') {
    if (!FEATURES.russianCourse || !isLanguageAllowed('ru')) return <Redirect href={'/languages' as never} />;
    const RussianLibrary = resolveDefault<ComponentType>(require('@/components/RussianLibrary'));
    return <RussianLibrary />;
  }
  if (language === 'tr') {
    if (!FEATURES.turkishCourse || !isLanguageAllowed('tr')) return <Redirect href={'/languages' as never} />;
    const TurkishLibrary = resolveDefault<ComponentType>(require('@/components/TurkishLibrary'));
    return <TurkishLibrary />;
  }
  return <CoursePage title="این مسیر آموزشی پیدا نشد">{null}</CoursePage>;
}
