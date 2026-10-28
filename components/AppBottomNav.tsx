import { usePathname } from 'expo-router';
import { LanguageBottomNav } from './LanguageBottomNav';
import { getLastActiveLanguage } from './luxuryTheme';

export function AppBottomNav() {
  const pathname = usePathname();
  const isSharedRoute = pathname === '/conversations' || pathname.startsWith('/conversations/');
  const language = isSharedRoute ? getLastActiveLanguage() : 'en';
  return <LanguageBottomNav language={language} />;
}
