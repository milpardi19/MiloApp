import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { FEATURES } from '@/lib/features';
import { useLearnerLanguageAccess } from '@/components/LearnerLanguageAccess';

export default function RussianCourseLayout() {
  const { isLanguageAllowed } = useLearnerLanguageAccess();

  if (!FEATURES.russianCourse || !isLanguageAllowed('ru')) {
    return <Redirect href="/languages" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
