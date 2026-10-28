import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Redirect, Slot, useLocalSearchParams } from 'expo-router';
import { useLearnerLanguageAccess } from '@/components/LearnerLanguageAccess';
import { Colors, Typography } from '@/lib/theme';
import { FEATURES } from '@/lib/features';

/**
 * Static exports have no query/route-specific local progress on the server.
 * Keep the first client tree identical, then open the correct language/lesson.
 */
export default function LanguageLayout() {
  const { language } = useLocalSearchParams<{ language?: string }>();
  const { isLanguageAllowed } = useLearnerLanguageAccess();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (language === 'en' && (!FEATURES.englishCourse || !isLanguageAllowed('en'))) {
    return <Redirect href={'/languages' as never} />;
  }
  if (language === 'de' && (!FEATURES.germanCourse || !isLanguageAllowed('de'))) {
    return <Redirect href={'/languages' as never} />;
  }
  if (language === 'ru' && (!FEATURES.russianCourse || !isLanguageAllowed('ru'))) {
    return <Redirect href={'/languages' as never} />;
  }
  if (language === 'tr' && (!FEATURES.turkishCourse || !isLanguageAllowed('tr'))) {
    return <Redirect href={'/languages' as never} />;
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.neutral[950], alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator color={Colors.primary[400]} />
        <Text style={{ fontFamily: Typography.fontFamily, color: Colors.neutral[300] }}>در حال آماده‌کردن صفحه…</Text>
      </View>
    );
  }
  return <Slot />;
}
