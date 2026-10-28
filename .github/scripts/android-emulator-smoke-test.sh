#!/usr/bin/env bash
set -Eeuo pipefail

apk_path="2-MiloNoLogin-EN-RU.apk"
admin_apk_path="1-MiloAdmin.apk"
diag_dir="${RUNNER_TEMP:-/tmp}"
log_file="$diag_dir/milomultilang-emulator-smoke.log"
full_logcat_file="$diag_dir/milomultilang-emulator-logcat.txt"
ui_file="$diag_dir/milomultilang-emulator-window.xml"
screenshot_file="$diag_dir/milomultilang-emulator-screen.png"
remote_ui_file="/sdcard/milomultilang-window.xml"
failed_step="smoke-test setup"

mkdir -p "$diag_dir"
: > "$log_file"
exec > >(tee -a "$log_file") 2>&1

on_exit() {
  local status=$?
  local activity_summary log_summary ui_summary annotation
  trap - EXIT
  if (( status != 0 )); then
    set +e
    printf '\nSmoke test failed during: %s (exit %s)\n' "$failed_step" "$status"
    printf '\n--- ADB devices ---\n'
    adb devices -l
    printf '\n--- Emulator boot status ---\n'
    adb shell getprop sys.boot_completed
    printf '\n--- Resumed activity ---\n'
    activity_summary="$(adb shell dumpsys activity activities 2>&1 | grep -E 'mResumedActivity|topResumedActivity|ResumedActivity' | tail -n 8 | tr '\n' ' ' || true)"
    printf '%s\n' "${activity_summary:-'(no resumed activity reported)'}"
    printf '\n--- Relevant recent logcat ---\n'
    adb logcat -d -v threadtime -t 5000 >"$full_logcat_file" 2>&1
    crash_buffer="$(adb logcat -d -b crash -v brief -t 40 2>/dev/null | tr '\n' ' ' | cut -c1-900 || true)"
    log_summary="$(grep -E 'FATAL EXCEPTION|Unable to load script|AppStartupError|ReactNativeJS|AndroidRuntime: E|SoLoader|Fatal signal' "$full_logcat_file" | grep -v 'com.android.commands.uiautomator' | tail -n 80 || true)"
    printf 'CRASH BUFFER: %s\n%s\n' "${crash_buffer:-'(empty)'}" "${log_summary:-'(no matching Android or React Native errors)'}"
    ui_summary='(UI hierarchy unavailable)'
    if [[ -f "$ui_file" ]]; then
      printf '\n--- UI hierarchy (first 4000 bytes) ---\n'
      head -c 4000 "$ui_file"
      printf '\n'
      ui_summary="$(python3 - "$ui_file" <<'PY' 2>/dev/null || true
import sys
import xml.etree.ElementTree as ET

root = ET.parse(sys.argv[1]).getroot()
values = []
for node in root.iter():
    for name in ('text', 'content-desc'):
        value = node.attrib.get(name, '').strip()
        if value and value not in values:
            values.append(value)
print(' | '.join(values)[:1800] or '(no accessible text nodes)')
PY
)"
    fi
    annotation="${failed_step} (exit ${status}); UI=${ui_summary}; ACTIVITY=${activity_summary:-none}; CRASH=${crash_buffer:-none}; LOGCAT=$(printf '%s' "$log_summary" | tail -n 12 | tr '\n' ' ' | cut -c1-900)"
    annotation="${annotation//'%'/'%25'}"
    annotation="${annotation//$'\r'/'%0D'}"
    annotation="${annotation//$'\n'/'%0A'}"
    echo "::error title=Android emulator smoke test failed::${annotation}"
  fi
  exit "$status"
}
trap on_exit EXIT

capture_ui() {
  local attempt
  for attempt in 1 2 3; do
    if timeout 60s adb shell uiautomator dump "$remote_ui_file" \
      && adb pull "$remote_ui_file" "$ui_file" \
      && [[ -s "$ui_file" ]]; then
      return 0
    fi
    echo "Android UI hierarchy was temporarily unavailable (attempt $attempt/3)."
    sleep 5
  done
  echo 'Android UI hierarchy could not be collected after three attempts.'
  return 1
}

printf 'Testing standalone APK: %s\n' "$apk_path"
printf 'Diagnostics will be saved under: %s\n' "$diag_dir"

failed_step="listing emulator devices"
adb devices -l

failed_step="installing standalone APK"
adb install -r "$apk_path"

failed_step="clearing Android logcat"
adb logcat -c

failed_step="launching the main activity"
timeout 90s adb shell am start -W -n com.devicecontrol.mml.v2/.MainActivity

failed_step="allowing the first screen to finish rendering"
sleep 30

failed_step="dumping the Android UI hierarchy"
capture_ui

for attempt in 1 2; do
  # Slow hosted emulators can report either the System UI package or the core
  # Android "system" process as temporarily unresponsive during first boot.
  # Both dialogs expose a Wait action and are infrastructure noise when our
  # activity remains resumed without a FATAL EXCEPTION.
  if ! grep -Eq "System UI isn't responding|Process system isn't responding|Settings isn't responding" "$ui_file"; then
    break
  fi

  failed_step="waiting for Android System UI (recovery attempt $attempt)"
  wait_coords="$(python3 - "$ui_file" <<'PY'
import re
import sys
import xml.etree.ElementTree as ET

for node in ET.parse(sys.argv[1]).getroot().iter():
    if node.attrib.get('text', '').strip().lower() == 'wait':
        match = re.search(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds', ''))
        if match:
            x1, y1, x2, y2 = map(int, match.groups())
            print((x1 + x2) // 2, (y1 + y2) // 2)
            break
PY
)"
  if [[ -z "$wait_coords" ]]; then
    echo 'Android system is not responding, but its Wait button could not be located.'
    break
  fi
  read -r wait_x wait_y <<< "$wait_coords"
  echo "Android system reported a transient ANR; selecting Wait at $wait_x,$wait_y and allowing the app another 30 seconds."
  adb shell input tap "$wait_x" "$wait_y"
  sleep 30
  failed_step="rechecking the screen after waiting for Android System UI"
  capture_ui
done

failed_step="capturing the launched screen"
for app2_attempt in 1 2 3; do
  if grep -Fq 'ساخت حساب زبان‌آموز' "$ui_file" || grep -Fq 'شروع مسیر یادگیری' "$ui_file" || grep -Fq 'آکادمی چندزبانهٔ میلو' "$ui_file" || grep -Fq 'هر روز، یک قدم' "$ui_file"; then
    break
  fi
  if [[ "$app2_attempt" == 3 ]]; then
    break
  fi
  echo "App 2 accessibility tree not ready yet (attempt $app2_attempt/3); waiting 15s."
  sleep 15
  capture_ui
done
if ! timeout 30s adb exec-out screencap -p > "$screenshot_file"; then
  echo 'Warning: screenshot capture failed; continuing with the UI hierarchy check.'
fi

failed_step="verifying the learner home or registration screen rendered"
registration_gate=false
direct_catalog_home=false
if grep -Fq 'ساخت حساب زبان‌آموز' "$ui_file" && grep -Fq 'ساخت حساب و دریافت کد' "$ui_file"; then
  registration_gate=true
  echo 'Android emulator opened MiloMultilang and rendered its mandatory registration gate.'
elif grep -Fq 'شروع مسیر یادگیری' "$ui_file" || grep -Fq 'آکادمی چندزبانهٔ میلو' "$ui_file"; then
  direct_catalog_home=true
  if ! grep -Fq 'انگلیسی' "$ui_file" || ! grep -Fq 'روسی' "$ui_file"; then
    echo 'App 2 (No-Login EN+RU) did not display both English and Russian on the catalog home.'
    exit 1
  fi
  if grep -Fq 'آلمانی' "$ui_file" || grep -Fq 'ترکی' "$ui_file"; then
    echo 'App 2 (No-Login EN+RU) leaked German or Turkish onto its catalog home.'
    exit 1
  fi
  echo 'Android emulator opened App 2 (2-MiloNoLogin-EN-RU.apk) and verified ONLY English + Russian.'
elif (grep -Fq 'MILO' "$ui_file" || grep -Fq 'Milo' "$ui_file") && grep -Fq 'هر روز، یک قدم' "$ui_file"; then
  echo 'Android emulator restored an authenticated learner and rendered the language home.'
else
  echo 'Neither the learner registration gate nor the language home was found.'
  exit 1
fi

if [[ "$registration_gate" == true ]]; then
  failed_step="opening the keyboard in the learner registration form"
  registration_coords="$(python3 - "$ui_file" <<'PY'
import re, sys, xml.etree.ElementTree as ET
for node in ET.parse(sys.argv[1]).getroot().iter():
    if node.attrib.get('content-desc', '') == 'ایمیل حساب':
        match = re.search(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds', ''))
        if match:
            x1,y1,x2,y2=map(int,match.groups()); print((x1+x2)//2,(y1+y2)//2); break
PY
)"
  [[ -n "$registration_coords" ]] || { echo 'Registration email input was not found.'; exit 1; }
  read -r registration_x registration_y <<< "$registration_coords"
  adb shell settings put secure show_ime_with_hard_keyboard 1
  adb shell input tap "$registration_x" "$registration_y"
  sleep 5
  capture_ui
  keyboard_state="$(adb shell dumpsys input_method 2>/dev/null || true)"
  grep -Eq 'mInputShown=true|isInputViewShown=true|inputShown=true' <<< "$keyboard_state" || { echo 'Registration keyboard did not open.'; exit 1; }
  python3 - "$ui_file" <<'PY'
import re, sys, xml.etree.ElementTree as ET
root=ET.parse(sys.argv[1]).getroot(); input_bottom=None; keyboard_tops=[]
for node in root.iter():
    bounds=re.search(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]',node.attrib.get('bounds',''))
    if not bounds: continue
    x1,y1,x2,y2=map(int,bounds.groups())
    if node.attrib.get('content-desc','') == 'ایمیل حساب': input_bottom=y2
    package=node.attrib.get('package','').lower()
    if 'inputmethod' in package or 'keyboard' in package: keyboard_tops.append(y1)
if input_bottom is None: raise SystemExit('Registration input disappeared with keyboard open.')
if keyboard_tops and input_bottom > min(keyboard_tops):
    raise SystemExit(f'Registration input overlaps keyboard by {input_bottom-min(keyboard_tops)}px.')
print('Registration input remains fully visible above the software keyboard.')
PY
  adb shell input keyevent KEYCODE_BACK
fi

# A clean CI install intentionally has no production learner credentials. Chat
# geometry remains covered when an authenticated test session is restored; on a
# first install we verify the account gate and continue with the separate admin APK.
if [[ "$registration_gate" == false && "$direct_catalog_home" == false ]]; then
failed_step="opening the Emma chat keyboard test route"
timeout 60s adb shell am start -W -a android.intent.action.VIEW -d 'companionenglish:///conversations/emma' com.devicecontrol.mml.v2
sleep 8
capture_ui

failed_step="locating the English chat composer"
composer_coords="$(python3 - "$ui_file" <<'PY'
import re
import sys
import xml.etree.ElementTree as ET

for node in ET.parse(sys.argv[1]).getroot().iter():
    label = node.attrib.get('content-desc', '')
    text = node.attrib.get('text', '')
    if label == 'پیام انگلیسی برای Emma' or (node.attrib.get('class') == 'android.widget.EditText' and 'پیام انگلیسی' in text):
        match = re.search(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds', ''))
        if match:
            x1, y1, x2, y2 = map(int, match.groups())
            print((x1 + x2) // 2, (y1 + y2) // 2, y2)
            break
PY
)"
if [[ -z "$composer_coords" ]]; then
  echo 'The Emma chat composer was not found through Android accessibility.'
  exit 1
fi
read -r composer_x composer_y composer_closed_bottom <<< "$composer_coords"

failed_step="opening the Android keyboard in the Emma composer"
adb shell settings put secure show_ime_with_hard_keyboard 1
adb shell input tap "$composer_x" "$composer_y"
sleep 5
capture_ui

failed_step="verifying the composer remains fully visible above the keyboard"
keyboard_state="$(adb shell dumpsys input_method 2>/dev/null || true)"
if ! grep -Eq 'mInputShown=true|isInputViewShown=true|inputShown=true' <<< "$keyboard_state"; then
  echo 'Android did not report a visible software keyboard after focusing the composer.'
  exit 1
fi

density_dpi="$(adb shell wm density | grep -Eo '[0-9]+' | tail -n 1)"
python3 - "$ui_file" "${density_dpi:-160}" "$composer_closed_bottom" <<'PY'
import re
import sys
import xml.etree.ElementTree as ET

path, density_value, closed_bottom = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
minimum_height = round(40 * density_value / 160)
minimum_lift = round(100 * density_value / 160)
root = ET.parse(path).getroot()
keyboard_tops = []
for candidate in root.iter():
    package = candidate.attrib.get('package', '').lower()
    bounds = re.search(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', candidate.attrib.get('bounds', ''))
    if bounds and ('inputmethod' in package or 'keyboard' in package):
        keyboard_tops.append(int(bounds.group(2)))
keyboard_top = min(keyboard_tops) if keyboard_tops else None
for node in root.iter():
    label = node.attrib.get('content-desc', '')
    text = node.attrib.get('text', '')
    if label == 'پیام انگلیسی برای Emma' or (node.attrib.get('class') == 'android.widget.EditText' and 'پیام انگلیسی' in text):
        match = re.search(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds', ''))
        if not match:
            raise SystemExit('Composer bounds are unavailable while the keyboard is open.')
        x1, y1, x2, y2 = map(int, match.groups())
        height = y2 - y1
        if height < minimum_height:
            raise SystemExit(f'Composer is clipped: {height}px visible; expected at least {minimum_height}px at {density_value}dpi.')
        if x2 <= x1 or y2 <= y1:
            raise SystemExit(f'Composer has invalid bounds: {node.attrib.get("bounds")}')
        lift = closed_bottom - y2
        if lift < minimum_lift:
            raise SystemExit(f'Composer did not follow the keyboard: moved up only {lift}px; expected at least {minimum_lift}px.')
        if keyboard_top is not None and y2 > keyboard_top:
            raise SystemExit(f'Composer overlaps the keyboard by {y2 - keyboard_top}px (composer bottom {y2}, keyboard top {keyboard_top}).')
        gap = 'unknown' if keyboard_top is None else str(keyboard_top - y2)
        print(f'Emma composer moved up {lift}px, remains {height}px high, and has a {gap}px keyboard gap.')
        break
else:
    raise SystemExit('Composer disappeared from accessibility while the keyboard was open.')
PY

failed_step="capturing the keyboard-open chat screen"
timeout 30s adb exec-out screencap -p > "$screenshot_file"
echo 'Android emulator verified the full-height Emma composer with the software keyboard open.'

failed_step="opening the human chat keyboard test route"
adb shell input keyevent KEYCODE_BACK
adb shell am start -W -a android.intent.action.VIEW -d 'companionenglish:///conversations/human/00000000-0000-0000-0000-000000000001?name=Test' com.devicecontrol.mml.v2
sleep 8
capture_ui

failed_step="locating the human chat composer"
human_composer_coords="$(python3 - "$ui_file" <<'PY'
import re
import sys
import xml.etree.ElementTree as ET

for node in ET.parse(sys.argv[1]).getroot().iter():
    if node.attrib.get('content-desc', '') == 'متن پیام فارسی یا انگلیسی':
        match = re.search(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds', ''))
        if match:
            x1, y1, x2, y2 = map(int, match.groups())
            print((x1 + x2) // 2, (y1 + y2) // 2, y2)
            break
PY
)"
if [[ -z "$human_composer_coords" ]]; then
  echo 'The human chat composer was not found through Android accessibility.'
  exit 1
fi
read -r human_composer_x human_composer_y human_composer_closed_bottom <<< "$human_composer_coords"
adb shell input tap "$human_composer_x" "$human_composer_y"
sleep 5
capture_ui

failed_step="verifying the human composer and side buttons stay above the keyboard"
keyboard_state="$(adb shell dumpsys input_method 2>/dev/null || true)"
if ! grep -Eq 'mInputShown=true|isInputViewShown=true|inputShown=true' <<< "$keyboard_state"; then
  echo 'Android did not report a visible software keyboard in the human conversation.'
  exit 1
fi
python3 - "$ui_file" "${density_dpi:-160}" "$human_composer_closed_bottom" <<'PY'
import re
import sys
import xml.etree.ElementTree as ET

path, density_value, closed_bottom = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
minimum_input_height = round(40 * density_value / 160)
minimum_button_size = round(38 * density_value / 160)
minimum_lift = round(100 * density_value / 160)
root = ET.parse(path).getroot()
keyboard_tops = []
for candidate in root.iter():
    package = candidate.attrib.get('package', '').lower()
    bounds = re.search(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', candidate.attrib.get('bounds', ''))
    if bounds and ('inputmethod' in package or 'keyboard' in package):
        keyboard_tops.append(int(bounds.group(2)))
keyboard_top = min(keyboard_tops) if keyboard_tops else None
input_ok = False
input_lift = 0
button_count = 0
for node in root.iter():
    match = re.search(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds', ''))
    if not match:
        continue
    x1, y1, x2, y2 = map(int, match.groups())
    width, height = x2 - x1, y2 - y1
    label = node.attrib.get('content-desc', '')
    if label == 'متن پیام فارسی یا انگلیسی':
        if height < minimum_input_height:
            raise SystemExit(f'Human composer is clipped: {height}px; expected at least {minimum_input_height}px.')
        input_lift = closed_bottom - y2
        if input_lift < minimum_lift:
            raise SystemExit(f'Human composer did not follow the keyboard: moved up only {input_lift}px; expected at least {minimum_lift}px.')
        if keyboard_top is not None and y2 > keyboard_top:
            raise SystemExit(f'Human composer overlaps the keyboard by {y2 - keyboard_top}px.')
        input_ok = True
    if label in ('باز و بسته‌کردن دستیار زبان', 'ضبط و ارسال پیام صوتی فعلاً غیرفعال است', 'شروع یا پایان ضبط پیام صوتی', 'ارسال پیام متنی'):
        if width >= minimum_button_size and height >= minimum_button_size:
            if keyboard_top is not None and y2 > keyboard_top:
                raise SystemExit(f'Human composer button {label!r} overlaps the keyboard by {y2 - keyboard_top}px.')
            button_count += 1
if not input_ok:
    raise SystemExit('Human composer disappeared while its keyboard was open.')
if button_count < 2:
    raise SystemExit(f'Human composer side buttons are clipped or missing; found {button_count}.')
gap = 'unknown' if keyboard_top is None else str(keyboard_top - (closed_bottom - input_lift))
print(f'Human composer moved up {input_lift}px; {button_count} side buttons are visible; keyboard gap is {gap}px.')
PY

timeout 30s adb exec-out screencap -p > "$screenshot_file"
echo 'Android emulator verified both complete chat composers and their side buttons with the keyboard open.'
fi

failed_step="installing the private management APK"
adb shell am force-stop com.devicecontrol.mml.v2 || true
adb install -r "$admin_apk_path"
adb shell am force-stop com.devicecontrol.miloadmin.v2

failed_step="launching the private management app"
timeout 90s adb shell am start -W -n com.devicecontrol.miloadmin.v2/.MainActivity
sleep 15
capture_ui

failed_step="verifying the management login is isolated and protected"
for admin_attempt in 1 2 3; do
  if grep -Fq 'ایمیل مدیر' "$ui_file" && grep -Fq 'ورود امن به پنل' "$ui_file"; then
    break
  fi
  if [[ "$admin_attempt" == 3 ]]; then
    break
  fi
  echo 'Management accessibility tree is not ready; waiting once more.'
  sleep 12
  capture_ui
done
if ! grep -Fq 'ایمیل مدیر' "$ui_file" || ! grep -Fq 'ورود امن به پنل' "$ui_file"; then
  echo 'The standalone management APK did not render its protected manager login.'
  exit 1
fi
if grep -Fq 'ساخت حساب زبان‌آموز' "$ui_file"; then
  echo 'The management APK incorrectly rendered the learner registration flow.'
  exit 1
fi


all4_apk_path="3-MiloNoLogin-All4.apk"
if [[ -s "$all4_apk_path" ]]; then
  failed_step="installing App 3 (No-Login All 4 Languages APK)"
  adb shell am force-stop com.devicecontrol.miloadmin.v2 || true
  adb install -r "$all4_apk_path"
  adb shell pm path com.devicecontrol.miloall.v2
  adb shell am force-stop com.devicecontrol.miloall.v2
  failed_step="launching App 3 (No-Login All 4 Languages APK)"
  timeout 90s adb shell am start -W -n com.devicecontrol.miloall.v2/.MainActivity
  sleep 20
  capture_ui
  failed_step="verifying App 3 rendered all 4 languages without login"
  all4_rendered=false
  for all4_attempt in 1 2 3; do
    if grep -Fq 'انگلیسی' "$ui_file" && grep -Fq 'آلمانی' "$ui_file" && grep -Fq 'روسی' "$ui_file" && grep -Fq 'ترکی' "$ui_file"; then
      all4_rendered=true
      echo 'Android emulator launched 3-MiloNoLogin-All4.apk and verified all 4 languages (EN, DE, RU, TR).'
      break
    fi
    if [[ "$all4_attempt" == 3 ]]; then break; fi
    sleep 15
    capture_ui
  done
  if [[ "$all4_rendered" != true ]]; then
    echo 'App 3 (3-MiloNoLogin-All4.apk) did not render all 4 languages.'
    exit 1
  fi
  if grep -Fq 'ساخت حساب زبان‌آموز' "$ui_file"; then
    echo 'App 3 (No-Login All 4) unexpectedly showed the login gate.'
    exit 1
  fi
fi

login_apk_path="4-MiloLogin-EN-DE-TR.apk"
if [[ -s "$login_apk_path" ]]; then
  failed_step="installing App 4 (Learner Login EN+DE+TR APK)"
  adb shell am force-stop com.devicecontrol.miloall.v2 || true
  adb install -r "$login_apk_path"
  failed_step="verifying App 4 package"
  adb shell pm path com.devicecontrol.milomultilang.v2
  adb shell am force-stop com.devicecontrol.milomultilang.v2
  failed_step="launching App 4 (Learner Login EN+DE+TR APK)"
  timeout 90s adb shell am start -W -n com.devicecontrol.milomultilang.v2/.MainActivity
  failed_step="allowing App 4 to render"
  sleep 25
  capture_ui
  failed_step="verifying App 4 registration gate rendered"
  login_rendered=false
  for login_attempt in 1 2 3; do
    if grep -Fq 'ساخت حساب زبان‌آموز' "$ui_file" || grep -Fq 'هر روز، یک قدم' "$ui_file"; then
      login_rendered=true
      echo 'Android emulator launched 4-MiloLogin-EN-DE-TR.apk and verified its registration gate.'
      break
    fi
    if [[ "$login_attempt" == 3 ]]; then
      break
    fi
    echo 'Learner login accessibility tree is not ready; waiting once more.'
    sleep 20
    capture_ui
  done
  if [[ "$login_rendered" != true ]]; then
    echo 'App 4 (4-MiloLogin-EN-DE-TR.apk) did not render the registration gate.'
    exit 1
  fi
fi

failed_step="verifying all 4 APKs coexist simultaneously without conflict"
adb shell pm path com.devicecontrol.miloadmin.v2
adb shell pm path com.devicecontrol.mml.v2
adb shell pm path com.devicecontrol.miloall.v2
adb shell pm path com.devicecontrol.milomultilang.v2

echo 'Android emulator verified all 4 standalone APKs in the Milo suite.'
