import type { ComponentType } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { CoursePage } from '@/components/LanguageCourseUI';
import { useLearnerLanguageAccess } from '@/components/LearnerLanguageAccess';
import { FEATURES } from '@/lib/features';

function resolveDefault<T>(mod: { default?: T } | T): T {
  return mod && typeof mod === 'object' && 'default' in mod && mod.default ? mod.default : (mod as T);
}

export default function LearningHomeRoute() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const { isLanguageAllowed } = useLearnerLanguageAccess();

  if (language === 'en') {
    return FEATURES.englishCourse && isLanguageAllowed('en')
      ? <Redirect href={'/lang' as never} />
      : <Redirect href={'/languages' as never} />;
  }
  if (language === 'de') {
    if (!FEATURES.germanCourse || !isLanguageAllowed('de')) {
      return <Redirect href={'/languages' as never} />;
    }
    const GermanSentenceHome = resolveDefault<ComponentType>(require('@/components/GermanSentenceHome'));
    return <GermanSentenceHome />;
  }
  if (language === 'ru') {
    if (!FEATURES.russianCourse || !isLanguageAllowed('ru')) {
      return <Redirect href={'/languages' as never} />;
    }
    const RussianHome = resolveDefault<ComponentType>(require('@/components/RussianHome'));
    return <RussianHome />;
  }
  if (language === 'tr') {
    if (!FEATURES.turkishCourse || !isLanguageAllowed('tr')) {
      return <Redirect href={'/languages' as never} />;
    }
    const TurkishHome = resolveDefault<ComponentType>(require('@/components/TurkishHome'));
    return <TurkishHome />;
  }
  return <CoursePage title="این مسیر آموزشی پیدا نشد">{null}</CoursePage>;
}
