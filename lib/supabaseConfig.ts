// Public Supabase connection settings (URL + anon key only, never secrets).
// Resolution order: EXPO_PUBLIC_* env vars at bundle time, then the committed
// config/supabase.public.json. The fallback matters because some build paths
// (for example EAS or a plain `expo export`) do not run the npm scripts that
// load that file, which previously baked a placeholder URL into the app and
// made every login fail with "ارتباط با سرور برقرار نشد".
import publicConfig from '../config/supabase.public.json';

const saved = publicConfig as { EXPO_PUBLIC_SUPABASE_URL?: string; EXPO_PUBLIC_SUPABASE_ANON_KEY?: string };

export const SUPABASE_PUBLIC_URL = (
  (process.env.EXPO_PUBLIC_SUPABASE_URL ?? saved.EXPO_PUBLIC_SUPABASE_URL ?? '')
).trim();

export const SUPABASE_PUBLIC_ANON_KEY = (
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? saved.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '')
).trim();
