/**
 * Custom entry point.
 *
 * This file runs BEFORE any app code (including lib/supabase.ts, lib/DeviceContext.tsx,
 * and every screen) is imported. Its only job is to install a global JS error handler
 * so that if anything throws during startup — even a synchronous error thrown while a
 * module is being imported — the app shows a readable on-screen message instead of
 * silently crashing with a native "keeps stopping" dialog.
 *
 * React Native's module loader wraps every `require()` call in the currently-registered
 * global error handler, so installing it here, first, lets us catch errors that happen
 * even before the React tree exists (where a React ErrorBoundary cannot help).
 */
import { Alert, I18nManager, Platform } from 'react-native';

// Keep the native tree deterministic and independent of the phone locale.
// Persian copy receives explicit RTL styles, while English and German receive
// explicit LTR styles. Forcing the whole native tree RTL here used to conflict
// with app/_layout.tsx and could alternate direction after an app restart.
try {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
} catch (directionError) {
  // Explicit per-language styles and the Android manifest remain the fallback.
}

// On web, `direction: 'rtl'` in StyleSheet is not supported by react-native-web,
// so set the DOM direction globally instead — the whole tree inherits it.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  try {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'fa';
    if (typeof HTMLMediaElement !== 'undefined' && HTMLMediaElement.prototype.play) {
      const origMediaPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args) {
        const res = origMediaPlay.apply(this, args);
        if (res && typeof res.catch === 'function') {
          return res.catch((err) => {
            if (err && err.name === 'NotAllowedError') return undefined;
            throw err;
          });
        }
        return res;
      };
    }
  } catch (webRtlError) {
    // ignore — web preview degrades gracefully
  }
}

// Mobile resolution emulation for web preview (360×800 dp → xhdpi 720×1600 px / Android)
// Density buckets (same dp, different px):
//   mdpi  1× → 360×800 | hdpi 1.5× → 540×1200 | xhdpi 2× → 720×1600 ← this phone | xxhdpi 3× → 1080×2400 | xxxhdpi 4× → 1440×3200
// - Desktop (>=520px): centered phone frame 360×800 dp with notch & shadow, light background like international apps
// - Real mobile (<520px): full-screen without frame to keep native UX
// - Adds toggle button to switch frame on/off (persisted in localStorage)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  try {
    const mobileStyle = document.createElement('style');
    mobileStyle.id = 'app-mobile-frame';
    mobileStyle.textContent = `
      /* --- Polished mobile frame like Duolingo / Babbel / Memrise --- */
      @media (min-width: 520px) {
        html:not(.arena-frame-disabled), body:not(.arena-frame-disabled) {
          background: #eef2f7 !important;
          background-color: #eef2f7 !important;
          background-image: radial-gradient(circle at 20% 20%, rgba(99,102,241,0.06) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(14,165,233,0.05) 0%, transparent 50%) !important;
          display: flex !important;
          justify-content: center !important;
          align-items: flex-start !important;
          min-height: 100vh !important;
          margin: 0 !important;
          padding: 28px 0 56px 0 !important;
          overflow-y: auto !important;
        }
        html:not(.arena-frame-disabled) #root,
        body:not(.arena-frame-disabled) #root {
          width: 360px !important;
          height: 800px !important;
          max-width: 360px !important;
          max-height: 800px !important;
          min-height: 800px !important;
          flex: none !important;
          border-radius: 48px !important;
          overflow: hidden !important;
          background: #F8F6FB !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          box-shadow: 0 32px 80px -16px rgba(15,23,42,0.18), 0 12px 32px rgba(15,23,42,0.10), 0 0 0 1px rgba(15,23,42,0.06), 0 0 0 12px #ffffff !important;
          border: 1px solid rgba(15,23,42,0.04) !important;
        }
        /* iPhone notch */
        html:not(.arena-frame-disabled) #root::before {
          content: '';
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 82px;
          height: 24px;
          background: #0f172a;
          border-radius: 9999px;
          z-index: 9999;
          pointer-events: none;
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.15);
        }
        /* Home indicator */
        html:not(.arena-frame-disabled) #root::after {
          content: '';
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 132px;
          height: 5px;
          background: #0f172a;
          border-radius: 9999px;
          opacity: 0.85;
          z-index: 9999;
          pointer-events: none;
        }
        /* Safe area for notch & home indicator inside mobile frame */
        html:not(.arena-frame-disabled) #root > div {
          background: #F8F6FB !important;
          min-height: 100% !important;
          box-sizing: border-box !important;
        }
        html:not(.arena-frame-disabled):not(.arena-keep-desktop) #root > div {
          padding-top: 38px !important;
          padding-bottom: 18px !important;
        }
        /* Subtle label below frame */
        html:not(.arena-frame-disabled) body::after {
          content: 'پیش‌نمایش موبایل • 360 × 800 · xhdpi 720×1600';
          position: fixed;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: #ffffff;
          color: #64748b;
          font-family: Vazirmatn, system-ui, sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2px;
          padding: 7px 16px;
          border-radius: 9999px;
          z-index: 10000;
          pointer-events: none;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(15,23,42,0.08);
          direction: rtl;
        }
      }
      @media (max-width: 519px) {
        html, body {
          background: #ffffff !important;
          background-image: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        #root {
          width: 100% !important;
          height: 100% !important;
          min-height: 100vh !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }
        #root::before, #root::after { display: none !important; }
      }
      @media (min-width: 520px) {
        #arena-frame-toggle {
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 10001;
          background: #ffffff;
          color: #334155;
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          padding: 8px 16px;
          font-family: Vazirmatn, system-ui, sans-serif;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(15,23,42,0.08);
          direction: rtl;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        #arena-frame-toggle:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(15,23,42,0.12);
        }
      }
      @media (max-width: 519px) {
        #arena-frame-toggle { display: none !important; }
      }
      html.arena-frame-disabled, html.arena-frame-disabled body {
        background: #ffffff !important;
        background-image: none !important;
        display: block !important;
        padding: 0 !important;
      }
      html.arena-frame-disabled #root {
        width: 100% !important;
        max-width: 100% !important;
        height: 100% !important;
        min-height: 100vh !important;
        max-height: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
      html.arena-frame-disabled #root::before,
      html.arena-frame-disabled #root::after,
      html.arena-frame-disabled body::after { display: none !important; }
      /* Polish inner content for mobile frame - keep original structure but ensure proper spacing like international apps */
      @media (min-width: 520px) {
        html:not(.arena-frame-disabled) #root {
          /* Ensure ScrollView fills and scrolls correctly */
          overflow: hidden !important;
        }
      }
      /* Keep-desktop mode: preserve original desktop layout scaled to fit 360, like "without change" */
      @media (min-width: 520px) {
        html.arena-keep-desktop:not(.arena-frame-disabled) #root {
          /* In keep-desktop, we keep desktop layout (no Dimensions patch) and scale via zoom */
        }
        html.arena-keep-desktop:not(.arena-frame-disabled) #root > div {
          /* Scale exactly to fit 360 like xhdpi - preserve original structure without reflow */
          zoom: 0.3214 !important;
          width: 1120px !important;
          max-width: 1120px !important;
          transform-origin: top center !important;
          background: #F8F6FB !important;
          min-height: calc(800px / 0.3214) !important;
        }
        /* Ensure the page content inside still respects scaled width */
        html.arena-keep-desktop:not(.arena-frame-disabled) #root div[style*="max-width: 1120"],
        html.arena-keep-desktop:not(.arena-frame-disabled) #root div[style*="max-width:1120"] {
          max-width: 1120px !important;
        }
        #arena-keep-desktop-toggle {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10001;
          background: #ffffff;
          color: #334155;
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          padding: 6px 14px;
          font-family: Vazirmatn, system-ui, sans-serif;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(15,23,42,0.08);
          direction: rtl;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        #arena-keep-desktop-toggle:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
      }
      @media (max-width: 519px) {
        #arena-keep-desktop-toggle { display: none !important; }
      }
      html.arena-frame-disabled #arena-keep-desktop-toggle { display: none !important; }
    `;
    document.head.appendChild(mobileStyle);

    // Toggle buttons logic (persisted) - frame on/off and keep-desktop vs mobile-optimized
    try {
      const KEY_KEEP = 'arena-keep-desktop';
      const keepDesktop = (() => { try { const v=localStorage.getItem(KEY_KEEP); return v==='1'; } catch { return false; } })();
      if (keepDesktop) document.documentElement.classList.add('arena-keep-desktop');
      // Second toggle for keep-desktop
      const onReadyKeep = () => {
        if (document.getElementById('arena-keep-desktop-toggle')) return;
        const btn2 = document.createElement('button');
        btn2.id = 'arena-keep-desktop-toggle';
        const updateLabel2 = () => {
          const keep = document.documentElement.classList.contains('arena-keep-desktop');
          btn2.textContent = keep ? '✨ حالت بهینه موبایل' : '🖼️ حفظ چیدمان اصلی';
          btn2.title = keep ? 'چیدمان اصلی دسکتاپ (کوچک شده) فعال است - کلیک برای حالت بهینه موبایل' : 'حالت بهینه موبایل فعال است - کلیک برای حفظ چیدمان اصلی بدون تغییر';
        };
        btn2.addEventListener('click', () => {
          const html = document.documentElement;
          const nowKeep = !html.classList.contains('arena-keep-desktop');
          if (nowKeep) html.classList.add('arena-keep-desktop');
          else html.classList.remove('arena-keep-desktop');
          try { localStorage.setItem(KEY_KEEP, nowKeep ? '1' : '0'); } catch {}
          updateLabel2();
          // Need reload to re-evaluate Dimensions patch (desktop vs mobile)
          try { window.dispatchEvent(new Event('resize')); } catch {}
          setTimeout(() => { try { location.reload(); } catch {} }, 100);
        });
        updateLabel2();
        if (document.body) document.body.appendChild(btn2);
        else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn2));
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReadyKeep);
      else onReadyKeep();
    } catch {}
    try {
      const KEY = 'arena-mobile-frame-disabled';
      const isDisabled = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();
      if (isDisabled) document.documentElement.classList.add('arena-frame-disabled');
      const onReady = () => {
        if (document.getElementById('arena-frame-toggle')) return;
        const btn = document.createElement('button');
        btn.id = 'arena-frame-toggle';
        const updateLabel = () => {
          const disabled = document.documentElement.classList.contains('arena-frame-disabled');
          btn.textContent = disabled ? '📱 حالت موبایل' : '🖥️ حالت دسکتاپ (تمام عرض)';
        };
        btn.addEventListener('click', () => {
          const html = document.documentElement;
          html.classList.toggle('arena-frame-disabled');
          const nowDisabled = html.classList.contains('arena-frame-disabled');
          try { localStorage.setItem(KEY, nowDisabled ? '1' : '0'); } catch {}
          updateLabel();
        });
        updateLabel();
        // Wait for body to exist
        if (document.body) document.body.appendChild(btn);
        else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
      else onReady();
    } catch {}

    // --- Patch window.innerWidth/innerHeight + visualViewport + clientWidth so React Native's useWindowDimensions sees mobile size ---
    // On desktop (>=520px) with frame enabled, report 360×800 instead of real window size.
    // This makes all `width < 760` / `width < 640` checks render the mobile (compact) layout inside the 360 frame.
    // react-native-web Dimensions uses visualViewport if available else documentElement.clientWidth, so we patch all.
    try {
      const FRAME_W = 360;
      const FRAME_H = 800;
      const BP = 520;
      const winProto = Object.getPrototypeOf(window);
      const origWDesc = Object.getOwnPropertyDescriptor(winProto, 'innerWidth');
      const origHDesc = Object.getOwnPropertyDescriptor(winProto, 'innerHeight');
      const origWGet = origWDesc && origWDesc.get;
      const origHGet = origHDesc && origHDesc.get;
      const getRealW = () => {
        try { return origWGet ? origWGet.call(window) : window.outerWidth; } catch { return 1200; }
      };
      const getRealH = () => {
        try { return origHGet ? origHGet.call(window) : window.outerHeight; } catch { return 800; }
      };
      Object.defineProperty(window, 'innerWidth', {
        get() {
          const real = getRealW();
          const disabled = document.documentElement.classList.contains('arena-frame-disabled');
          const keepDesktop = document.documentElement.classList.contains('arena-keep-desktop');
          if (!disabled && !keepDesktop && real >= BP) return FRAME_W;
          return real;
        },
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        get() {
          const real = getRealH();
          const disabled = document.documentElement.classList.contains('arena-frame-disabled');
          const keepDesktop = document.documentElement.classList.contains('arena-keep-desktop');
          if (!disabled && !keepDesktop && real >= BP) return FRAME_H;
          return real;
        },
        configurable: true,
      });
      // Patch documentElement.clientWidth/Height (fallback when visualViewport is disabled)
      try {
        const elProto = Element.prototype;
        const origCWDesc = Object.getOwnPropertyDescriptor(elProto, 'clientWidth');
        const origCHDesc = Object.getOwnPropertyDescriptor(elProto, 'clientHeight');
        const origCWGet = origCWDesc && origCWDesc.get;
        const origCHGet = origCHDesc && origCHDesc.get;
        if (origCWGet) {
          Object.defineProperty(elProto, 'clientWidth', {
            get() {
              if (this === document.documentElement) {
                const real = origCWGet.call(this);
                const disabled = document.documentElement.classList.contains('arena-frame-disabled');
                const keepDesktop = document.documentElement.classList.contains('arena-keep-desktop');
                const realWinW = getRealW();
                if (!disabled && !keepDesktop && realWinW >= BP) return FRAME_W;
                return real;
              }
              return origCWGet.call(this);
            },
            configurable: true,
          });
        }
        if (origCHGet) {
          Object.defineProperty(elProto, 'clientHeight', {
            get() {
              if (this === document.documentElement) {
                const real = origCHGet.call(this);
                const disabled = document.documentElement.classList.contains('arena-frame-disabled');
                const keepDesktop = document.documentElement.classList.contains('arena-keep-desktop');
                const realWinW = getRealW();
                if (!disabled && !keepDesktop && realWinW >= BP) return FRAME_H;
                return real;
              }
              return origCHGet.call(this);
            },
            configurable: true,
          });
        }
      } catch {}
      // Patch visualViewport to return null when frame enabled (forces Dimensions to use clientWidth fallback which we patched)
      try {
        let realVP = window.visualViewport;
        const vpDesc = Object.getOwnPropertyDescriptor(window, 'visualViewport') || Object.getOwnPropertyDescriptor(winProto, 'visualViewport');
        const vpGet = vpDesc && vpDesc.get;
        if (vpGet) {
          Object.defineProperty(window, 'visualViewport', {
            get() {
              const disabled = document.documentElement.classList.contains('arena-frame-disabled');
              const keepDesktop = document.documentElement.classList.contains('arena-keep-desktop');
              const realWinW = getRealW();
              if (!disabled && !keepDesktop && realWinW >= BP) return null;
              return vpGet.call(window);
            },
            configurable: true,
          });
        } else if (realVP !== undefined) {
          Object.defineProperty(window, 'visualViewport', {
            get() {
              const disabled = document.documentElement.classList.contains('arena-frame-disabled');
              const keepDesktop = document.documentElement.classList.contains('arena-keep-desktop');
              const realWinW = getRealW();
              if (!disabled && !keepDesktop && realWinW >= BP) return null;
              return realVP;
            },
            set(v) { realVP = v; },
            configurable: true,
          });
        }
      } catch {}
      // Ensure Dimensions listeners are notified when frame toggles
      const dispatchResize = () => { try { window.dispatchEvent(new Event('resize')); } catch {} };
      const origToggle = DOMTokenList.prototype.toggle;
      DOMTokenList.prototype.toggle = function (token, force) {
        const res = origToggle.call(this, token, force);
        if (token === 'arena-frame-disabled' || token === 'arena-keep-desktop') setTimeout(dispatchResize, 0);
        return res;
      };
      const origAdd = DOMTokenList.prototype.add;
      DOMTokenList.prototype.add = function (...args) {
        const res = origAdd.apply(this, args);
        if (args.includes('arena-frame-disabled') || args.includes('arena-keep-desktop')) setTimeout(dispatchResize, 0);
        return res;
      };
      const origRemove = DOMTokenList.prototype.remove;
      DOMTokenList.prototype.remove = function (...args) {
        const res = origRemove.apply(this, args);
        if (args.includes('arena-frame-disabled') || args.includes('arena-keep-desktop')) setTimeout(dispatchResize, 0);
        return res;
      };
      setTimeout(dispatchResize, 50);
      // Also dispatch on window resize to re-evaluate
      window.addEventListener('resize', () => setTimeout(dispatchResize, 0));
    } catch {}
  } catch (e) {
    // ignore
  }
}

try {
  const ErrorUtilsGlobal = global.ErrorUtils;

  if (ErrorUtilsGlobal && typeof ErrorUtilsGlobal.setGlobalHandler === 'function') {
    ErrorUtilsGlobal.setGlobalHandler((error, isFatal) => {
      const message = (error && error.message) || String(error);
      const stack = (error && error.stack) || '';

      // Always log it, in case a logcat/log viewer is available.
      // eslint-disable-next-line no-console
      console.error('[AppStartupError]', isFatal ? 'FATAL' : 'non-fatal', message, stack);

      try {
        Alert.alert(
          isFatal ? 'برنامه با خطا مواجه شد' : 'خطا',
          `${message}\n\n${stack}`.slice(0, 1800),
          [{ text: 'باشه' }],
          { cancelable: true }
        );
      } catch (alertError) {
        // If even Alert fails, there's nothing more we can safely do here.
      }

      // Intentionally NOT re-throwing / forwarding to the default handler:
      // the default handler for fatal errors terminates the app process,
      // which is exactly the "keeps stopping" crash we're trying to avoid.
      // Showing the message and staying alive (even if the UI is broken)
      // is far more useful for diagnosing the problem.
    });
  }
} catch (setupError) {
  // If installing the handler itself fails, fall through silently —
  // worst case we're back to default behavior.
}

require('expo-router/entry');
