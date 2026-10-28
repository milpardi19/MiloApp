import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const Colors = {
  primary: {
    50: '#F1F7FF',
    100: '#E2EFFF',
    200: '#C9DFFF',
    300: '#4D8FE8',
    400: '#2878DE',
    500: '#1769D2',
    600: '#1259B5',
    700: '#104A94',
    800: '#123E76',
    900: '#102A56',
  },
  accent: {
    50: '#EDFCFF',
    100: '#D7F7FC',
    200: '#B3EEF7',
    300: '#46BCD0',
    400: '#21A7C0',
    500: '#128DA8',
    600: '#0E748E',
    700: '#115E73',
    800: '#154E5E',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    300: '#15803d',
    400: '#16a34a',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    300: '#b45309',
    400: '#d97706',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    300: '#b91c1c',
    400: '#dc2626',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
  },
  neutral: {
    0: '#0f172a',
    50: '#1e293b',
    100: '#334155',
    200: '#475569',
    300: '#475569',
    400: '#64748b',
    500: '#94a3b8',
    600: '#b4bfcd',
    700: '#dde3ea',
    800: '#e6eaf0',
    850: '#ffffff',
    900: '#f4f6fa',
    950: '#f6f8fb',
  },
  onColor: '#ffffff',
  onColorSoft: 'rgba(255,255,255,0.85)',
} as const;

export const Shadows = {
  card: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};

export const Spacing = {
  xs: 4,
  sm: 7,
  md: 13,
  lg: 18,
  xl: 24,
  xxl: 36,
};

export const Radius = {
  sm: 7,
  md: 10,
  lg: 14,
  xl: 19,
  full: 9999,
};

export const Typography = {
  // Persian UI and Persian numerals use bundled Vazir; explicit LTR teaching
  // copy uses bundled Inter, so neither path depends on an OEM font.
  fontFamily: 'Vazir',
  mediumFontFamily: 'Vazir-Medium',
  boldFontFamily: 'Vazir-Bold',
  numberFontFamily: 'Vazir-Black',
  latinFontFamily: 'Inter-ExtraBold',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
  weights: {
    regular: '400' as const,
    medium: '400' as const,
    bold: '400' as const,
  },
};

export const CategoryColors: Record<string, string> = {
  social: '#E1306C',
  communication: '#2AABEE',
  productivity: '#4285F4',
  entertainment: '#FF6B35',
  system: '#6B7280',
  finance: '#00A651',
  game: '#7C4DFF',
  other: '#6366f1',
};

export const CategoryLabels: Record<string, string> = {
  social: 'شبکه اجتماعی',
  communication: 'ارتباطات',
  productivity: 'بهره‌وری',
  entertainment: 'سرگرمی',
  system: 'سیستمی',
  finance: 'مالی',
  game: 'بازی',
  other: 'سایر',
};

/**
 * Text/layout direction helpers.
 *
 * On native (the shipping Android APK) `direction: 'rtl' | 'ltr'` is a real
 * Yoga style property that flips the layout of every child view.
 * `react-native-web` does not support `direction` — it logs
 * `Invalid style property of "direction"` and strips it on every render — so on
 * web we use `writingDirection`, which react-native-web compiles to the CSS
 * `direction` property. The RTL case is already covered globally by
 * `document.documentElement.dir = 'rtl'` (see index.js), so it stays empty there.
 */
type DirectionStyle = ViewStyle & TextStyle;

export const RtlDirection: DirectionStyle =
  Platform.OS === 'web' ? { writingDirection: 'rtl' } : { direction: 'rtl', writingDirection: 'rtl' };

export const LtrDirection: DirectionStyle =
  Platform.OS === 'web' ? { writingDirection: 'ltr' } : { direction: 'ltr' };
