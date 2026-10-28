import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import ArrowRight from 'lucide-react-native/dist/esm/icons/arrow-right';
import Home from 'lucide-react-native/dist/esm/icons/house';

export type PageNavigationTone = 'light' | 'dark';

/** Compact RTL page controls: previous screen plus the language-selection home. */
export function PageNavigation({
  backFallback = '/languages',
  tone = 'light',
  style,
  onBack,
  accentColor,
  borderColor,
}: {
  backFallback?: string;
  tone?: PageNavigationTone;
  style?: ViewStyle;
  onBack?: () => void;
  accentColor?: string;
  borderColor?: string;
}) {
  const router = useRouter();
  const dark = tone === 'dark';
  const iconColor = dark ? '#F8FAFF' : accentColor ?? '#143599';

  return (
    <View style={[styles.row, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="بازگشت به صفحهٔ قبل"
        hitSlop={6}
        onPress={() => onBack ? onBack() : router.canGoBack() ? router.back() : router.replace(backFallback as never)}
        style={({ pressed }) => [styles.button, dark ? styles.buttonDark : styles.buttonLight, !dark && borderColor ? { borderColor } : null, pressed && styles.pressed]}
      >
        <ArrowRight size={19} color={iconColor} strokeWidth={2.4} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="بازگشت به صفحهٔ اصلی اپ"
        hitSlop={6}
        onPress={() => router.replace('/languages' as never)}
        style={({ pressed }) => [styles.button, dark ? styles.buttonDark : styles.buttonLight, !dark && borderColor ? { borderColor } : null, pressed && styles.pressed]}
      >
        <Home size={18} color={iconColor} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  button: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  buttonLight: { backgroundColor: '#FFFFFF', borderColor: '#E2EAF6', shadowColor: '#0B1838', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  buttonDark: { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.22)' },
  pressed: { opacity: .76, transform: [{ scale: .96 }] },
});
