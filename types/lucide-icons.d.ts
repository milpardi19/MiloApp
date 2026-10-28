// The lucide-react-native package ships per-icon ESM files under
// dist/esm/icons/* without individual .d.ts files; its bundled types only
// describe the barrel entry. App code imports icons through the deep path so
// Metro bundles just the icons we use (the barrel pulls all 1,600+ icons and
// added ~1.4 MB minified / ~3.5 MB dev to the startup bundle). This wildcard
// gives every deep icon module the same type as the barrel's named exports.
declare module 'lucide-react-native/dist/esm/icons/*' {
  import type { LucideIcon } from 'lucide-react-native';

  const icon: LucideIcon;
  export default icon;
}
