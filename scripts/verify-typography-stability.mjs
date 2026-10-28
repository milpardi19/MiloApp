#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const walk = directory => readdirSync(path.join(root, directory)).flatMap(name => {
  const relative = path.join(directory, name);
  const full = path.join(root, relative);
  return statSync(full).isDirectory() ? walk(relative) : relative.endsWith('.tsx') ? [relative] : [];
});
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks += 1; };

const entry = read('index.js');
const layout = read('app/_layout.tsx');
const theme = read('lib/theme.ts');
const pkg = JSON.parse(read('package.json'));
check(pkg.dependencies['@expo-google-fonts/inter'], 'bundled Inter dependency is declared');
check(pkg.dependencies['@expo-google-fonts/vazirmatn'], 'bundled open-source Vazir dependency is declared');
check(/Inter_400Regular[\s\S]*Inter_600SemiBold[\s\S]*Inter_800ExtraBold/.test(layout), 'regular, semibold and extrabold Inter faces are bundled');
check(/Vazir:\s*(?:swap\()?Vazirmatn_400Regular\)?[\s\S]*'Vazir-Black':\s*(?:swap\()?Vazirmatn_900Black\)?/.test(layout), 'Vazir regular through black faces are bundled locally');
check(/fontFamily:\s*'Vazir'/.test(theme) && /numberFontFamily:\s*'Vazir-Black'/.test(theme), 'Persian copy and decorative Persian digits use Vazir');
check(/I18nManager\.allowRTL\(false\)/.test(entry) && /I18nManager\.forceRTL\(false\)/.test(entry)
  && !/I18nManager\.(?:allowRTL|forceRTL)\(true\)/.test(entry + layout),
  'entry point and root layout cannot alternate native direction between launches');
check(/latinFontFamily:\s*'Inter-ExtraBold'/.test(theme), 'shared Latin typography points to the bundled deterministic face');
check(/allowFontScaling:\s*false/.test(layout) && /maxFontSizeMultiplier:\s*1/.test(layout), 'OEM/user font scaling cannot destabilize layouts');
check(/includeFontPadding:\s*false/.test(layout) && /textBreakStrategy:\s*'simple'/.test(layout), 'Android OEM font padding and line-breaking differences are neutralized');

const missing = [];
for (const file of [...walk('app'), ...walk('components')]) {
  const lines = read(file).split('\n');
  lines.forEach((line, index) => {
    if (!line.includes("writingDirection: 'ltr'") && !line.includes("writingDirection:'ltr'")) return;
    const nearby = lines.slice(Math.max(0, index - 14), index + 1).join('\n');
    if (!line.includes('fontFamily')
      && !nearby.includes('fontFamily: Typography.latinFontFamily')
      && !nearby.includes("fontFamily: 'Inter-ExtraBold'")) {
      missing.push(`${file}:${index + 1}`);
    }
  });
}
check(missing.length === 0, `every explicit LTR style has a bundled font (${missing.join(', ')})`);

const emma = read('app/conversations/emma.tsx');
const human = read('app/conversations/human/[conversationId].tsx');
const personalSync = read('app/personal-sync.tsx');
const appConfig = read('app.json');
const androidSmoke = read('.github/scripts/android-emulator-smoke-test.sh');
check(/"softwareKeyboardLayoutMode":\s*"resize"/.test(appConfig), 'Android manifest is generated with native keyboard resize');
check(/companionenglish:\/\/\/conversations\/emma/.test(androidSmoke)
  && /mInputShown=true/.test(androidSmoke)
  && /Composer is clipped/.test(androidSmoke),
  'Android release smoke test opens the real keyboard and rejects a clipped composer');
check(/messages:\s*\{\s*flex:\s*1,\s*minHeight:\s*0/.test(emma) && /messages:\s*\{\s*flex:\s*1,\s*minHeight:\s*0/.test(human), 'message lists yield all resized height to the composer');
check(/KeyboardAvoidingView style=\{styles\.root\} behavior="height" enabled/.test(emma)
  && /KeyboardAvoidingView style=\{styles\.root\} behavior="height" enabled/.test(human)
  && /<View style=\{styles\.composer\}>/.test(emma)
  && /<View style=\{styles\.composer\}>/.test(human), 'both complete composers and their side buttons are inside the UI-thread keyboard avoiding root');
check(/composer:\s*\{\s*flexShrink:\s*0,\s*minHeight:\s*64,\s*overflow:\s*'visible'/.test(emma)
  && /composer:\s*\{\s*flexShrink:\s*0,\s*minHeight:\s*64,\s*overflow:\s*'visible'/.test(human), 'chat composers retain their full visible height during resize');
check((human.match(/containsRtlScript/g) || []).length >= 4
  && /rtlText:\s*\{\s*fontFamily:\s*Typography\.fontFamily/.test(human)
  && /ltrText:\s*\{\s*fontFamily:\s*Typography\.latinFontFamily/.test(human),
  'mixed human chat selects a deterministic bundled font per script');
check((personalSync.match(/fontFamily:\s*Typography\.fontFamily/g) || []).length >= 18
  && (personalSync.match(/fontFamily:\s*Typography\.latinFontFamily/g) || []).length >= 3,
  'personal sync Persian UI and Latin account fields both use bundled fonts');
check(!/Platform\.OS === 'android' \? 'height'/.test(emma) && !/Platform\.OS === 'android' \? 'height'/.test(human), 'Android native adjustResize is not double-applied');
check(/automaticallyAdjustKeyboardInsets=\{Platform\.OS === 'ios'\}/.test(emma)
  && /automaticallyAdjustKeyboardInsets=\{Platform\.OS === 'ios'\}/.test(human), 'iOS scroll insets track the keyboard');

console.log(`${checks} typography and keyboard-stability checks passed.`);
