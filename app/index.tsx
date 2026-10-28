import { useEffect } from 'react';
import Constants from 'expo-constants';
import { Redirect, useRouter } from 'expo-router';
import { RUSSIAN_ONLY_BUILD } from '@/lib/features';

/** Each APK has a single clear role: learner catalog or private management. */
export default function Index() {
  const router = useRouter();
  const admin = Constants.expoConfig?.extra?.appRole === 'admin'
    || process.env.EXPO_PUBLIC_MILO_ADMIN_APP === 'true';
  const target = admin
    ? '/admin'
    : RUSSIAN_ONLY_BUILD
      ? '/learn/ru'
      : '/languages';

  useEffect(() => {
    router.replace(target as never);
  }, [router, target]);

  return <Redirect href={target as never} />;
}
