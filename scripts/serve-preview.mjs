#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distDirName = (process.env.DIST_DIR || 'dist').replace(/\/+$/, '');
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', distDirName);
const port = parseInt(process.env.PORT || '8081', 10);
const baseUrl = '/App2';

function contentType(p) {
  if (p.endsWith('.html')) return 'text/html; charset=UTF-8';
  if (p.endsWith('.js')) return 'application/javascript; charset=UTF-8';
  if (p.endsWith('.css')) return 'text/css; charset=UTF-8';
  if (p.endsWith('.json')) return 'application/json';
  if (p.endsWith('.ico')) return 'image/x-icon';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  if (p.endsWith('.ttf')) return 'font/ttf';
  if (p.endsWith('.woff2')) return 'font/woff2';
  if (p.endsWith('.woff')) return 'font/woff';
  return 'application/octet-stream';
}

const MOBILE_FRAME_INJECTION = `
<script id="arena-dimensions-patch">
try {
  (function(){
    var FRAME_W=360, FRAME_H=800, BP=520;
    var html=document.documentElement;
    try { if(localStorage.getItem('arena-mobile-frame-disabled')==='1') html.classList.add('arena-frame-disabled'); } catch(e){}
    try { var _k=null; try{_k=localStorage.getItem('arena-keep-desktop');}catch(e){} if(_k==='1') html.classList.add('arena-keep-desktop'); } catch(e){}
    var winProto=Object.getPrototypeOf(window);
    var origWDesc=Object.getOwnPropertyDescriptor(winProto,'innerWidth');
    var origHDesc=Object.getOwnPropertyDescriptor(winProto,'innerHeight');
    var origWGet=origWDesc&&origWDesc.get;
    var origHGet=origHDesc&&origHDesc.get;
    var getRealW=function(){ try{ return origWGet?origWGet.call(window):window.outerWidth; }catch{ return 1200;} };
    var getRealH=function(){ try{ return origHGet?origHGet.call(window):window.outerHeight; }catch{ return 800;} };
    try {
      Object.defineProperty(window,'innerWidth',{
        get:function(){ var real=getRealW(); var keepDesktop=html.classList.contains('arena-keep-desktop'); if(!html.classList.contains('arena-frame-disabled') && !keepDesktop && real>=BP) return FRAME_W; return real; },
        configurable:true
      });
      Object.defineProperty(window,'innerHeight',{
        get:function(){ var real=getRealH(); var keepDesktop=html.classList.contains('arena-keep-desktop'); if(!html.classList.contains('arena-frame-disabled') && !keepDesktop && real>=BP) return FRAME_H; return real; },
        configurable:true
      });
    } catch(e){}
    try {
      var elProto=Element.prototype;
      var origCWDesc=Object.getOwnPropertyDescriptor(elProto,'clientWidth');
      var origCHDesc=Object.getOwnPropertyDescriptor(elProto,'clientHeight');
      var origCWGet=origCWDesc&&origCWDesc.get;
      var origCHGet=origCHDesc&&origCHDesc.get;
      if(origCWGet){
        Object.defineProperty(elProto,'clientWidth',{
          get:function(){
            if(this===document.documentElement){
              var real=origCWGet.call(this);
              var realWinW=getRealW();
              var keepDesktop=html.classList.contains('arena-keep-desktop');
              if(!html.classList.contains('arena-frame-disabled') && !keepDesktop && realWinW>=BP) return FRAME_W;
              return real;
            }
            return origCWGet.call(this);
          },
          configurable:true
        });
      }
      if(origCHGet){
        Object.defineProperty(elProto,'clientHeight',{
          get:function(){
            if(this===document.documentElement){
              var real=origCHGet.call(this);
              var realWinW=getRealW();
              var keepDesktop=html.classList.contains('arena-keep-desktop');
              if(!html.classList.contains('arena-frame-disabled') && !keepDesktop && realWinW>=BP) return FRAME_H;
              return real;
            }
            return origCHGet.call(this);
          },
          configurable:true
        });
      }
    } catch(e){}
    try {
      var realVP=window.visualViewport;
      var vpDesc=Object.getOwnPropertyDescriptor(window,'visualViewport')||Object.getOwnPropertyDescriptor(winProto,'visualViewport');
      var vpGet=vpDesc&&vpDesc.get;
      if(vpGet){
        Object.defineProperty(window,'visualViewport',{
          get:function(){
            var keepDesktop=html.classList.contains('arena-keep-desktop');
            if(!html.classList.contains('arena-frame-disabled') && !keepDesktop && getRealW()>=BP) return null;
            return vpGet.call(window);
          },
          configurable:true
        });
      } else if(realVP!==undefined){
        Object.defineProperty(window,'visualViewport',{
          get:function(){
            var keepDesktop2=html.classList.contains('arena-keep-desktop');
            if(!html.classList.contains('arena-frame-disabled') && !keepDesktop2 && getRealW()>=BP) return null;
            return realVP;
          },
          set:function(v){ realVP=v; },
          configurable:true
        });
      }
    } catch(e){}
    try {
      var dispatchResize=function(){ try{ window.dispatchEvent(new Event('resize')); }catch(e){} };
      var p=DOMTokenList.prototype;
      var oToggle=p.toggle, oAdd=p.add, oRemove=p.remove;
      p.toggle=function(token,force){ var r=oToggle.call(this,token,force); if(token==='arena-frame-disabled' || token==='arena-keep-desktop') setTimeout(dispatchResize,0); return r; };
      p.add=function(){ var r=oAdd.apply(this,arguments); if([].slice.call(arguments).indexOf('arena-frame-disabled')!==-1 || [].slice.call(arguments).indexOf('arena-keep-desktop')!==-1) setTimeout(dispatchResize,0); return r; };
      p.remove=function(){ var r=oRemove.apply(this,arguments); if([].slice.call(arguments).indexOf('arena-frame-disabled')!==-1 || [].slice.call(arguments).indexOf('arena-keep-desktop')!==-1) setTimeout(dispatchResize,0); return r; };
      setTimeout(dispatchResize,50);
    } catch(e){}
  })();
} catch(e){}
</script>
<style id="arena-mobile-frame">
  /* Polished mobile frame like international language apps */
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
    html:not(.arena-frame-disabled) #root > div {
      background: #F8F6FB !important;
      min-height: 100% !important;
      box-sizing: border-box !important;
    }
    html:not(.arena-frame-disabled):not(.arena-keep-desktop) #root > div {
      padding-top: 38px !important;
      padding-bottom: 18px !important;
    }
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
  /* Keep-desktop mode: preserve original desktop layout scaled to fit 360 */
  @media (min-width: 520px) {
    html.arena-keep-desktop:not(.arena-frame-disabled) #root > div {
      zoom: 0.3214 !important;
      width: 1120px !important;
      max-width: 1120px !important;
      transform-origin: top center !important;
      background: #F8F6FB !important;
      min-height: calc(800px / 0.3214) !important;
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
</style>
<script id="arena-mobile-viewport-hint">
  try {
    var m = document.querySelector('meta[name="viewport"]');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'viewport';
      document.head.appendChild(m);
    }
    m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
  } catch(e) {}
  (function() {
    try {
      var KEY = 'arena-mobile-frame-disabled';
      var isDisabled = localStorage.getItem(KEY) === '1';
      if (isDisabled) document.documentElement.classList.add('arena-frame-disabled');
      var KEY2 = 'arena-keep-desktop';
      var _k2=null; try{ _k2=localStorage.getItem(KEY2); }catch(e){}
      var keepDesktop = _k2==='1';
      if (keepDesktop) document.documentElement.classList.add('arena-keep-desktop');
      document.addEventListener('DOMContentLoaded', function() {
        var btn = document.createElement('button');
        btn.id = 'arena-frame-toggle';
        function updateLabel() {
          var disabled = document.documentElement.classList.contains('arena-frame-disabled');
          btn.textContent = disabled ? '📱 حالت موبایل' : '🖥️ حالت دسکتاپ (تمام عرض)';
        }
        btn.addEventListener('click', function() {
          var html = document.documentElement;
          html.classList.toggle('arena-frame-disabled');
          var nowDisabled = html.classList.contains('arena-frame-disabled');
          localStorage.setItem(KEY, nowDisabled ? '1' : '0');
          updateLabel();
        });
        updateLabel();
        document.body.appendChild(btn);
        // Second toggle for keep-desktop
        if (!document.getElementById('arena-keep-desktop-toggle')) {
          var btn2 = document.createElement('button');
          btn2.id = 'arena-keep-desktop-toggle';
          function upd2(){
            var k=document.documentElement.classList.contains('arena-keep-desktop');
            btn2.textContent=k?'✨ حالت بهینه موبایل':'🖼️ حفظ چیدمان اصلی';
            btn2.title=k?'حالت اصلی (بدون تغییر) فعال - کلیک برای بهینه موبایل':'حالت بهینه موبایل فعال - کلیک برای حفظ چیدمان اصلی';
          }
          btn2.addEventListener('click', function(){
            var h=document.documentElement;
            var now=!h.classList.contains('arena-keep-desktop');
            if(now) h.classList.add('arena-keep-desktop'); else h.classList.remove('arena-keep-desktop');
            localStorage.setItem(KEY2, now?'1':'0');
            upd2();
            setTimeout(function(){ try{ location.reload(); }catch(e){} },120);
          });
          upd2();
          document.body.appendChild(btn2);
        }
      });
    } catch(e) {}
  })();
</script>
`;

function injectMobileFrame(html) {
  if (html.includes('id="arena-mobile-frame"')) return html;
  if (html.includes('</head>')) {
    return html.replace('</head>', MOBILE_FRAME_INJECTION + '</head>');
  }
  return html;
}

function resolveRouteFile(rootDir, pathname) {
  let filePath = path.join(rootDir, pathname);
  let stat = null;
  try { stat = fs.statSync(filePath); } catch {}
  if (stat && stat.isDirectory()) {
    const index = path.join(filePath, 'index.html');
    if (fs.existsSync(index)) return index;
  } else if (stat && stat.isFile()) {
    return filePath;
  } else {
    const withHtml = filePath + '.html';
    if (fs.existsSync(withHtml)) return withHtml;
    const indexInFolder = path.join(filePath, 'index.html');
    if (fs.existsSync(indexInFolder)) return indexInFolder;
  }

  // Match Expo Router static dynamic segments (e.g. dist/learn/[language]/index.html)
  const segs = pathname.split('/').filter(Boolean);
  function matchDynamic(dir, idx) {
    if (idx >= segs.length) {
      const idxHtml = path.join(dir, 'index.html');
      return fs.existsSync(idxHtml) ? idxHtml : null;
    }
    const seg = segs[idx];
    const isLast = idx === segs.length - 1;
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return null; }

    // 1. Exact segment match first
    if (isLast) {
      const exactHtml = path.join(dir, seg + '.html');
      if (fs.existsSync(exactHtml)) return exactHtml;
      const exactIdx = path.join(dir, seg, 'index.html');
      if (fs.existsSync(exactIdx)) return exactIdx;
    } else {
      const exactSub = path.join(dir, seg);
      try {
        if (fs.statSync(exactSub).isDirectory()) {
          const found = matchDynamic(exactSub, idx + 1);
          if (found) return found;
        }
      } catch {}
    }

    // 2. Bracketed dynamic segment fallback: [param].html or [param]/...
    for (const entry of entries) {
      if (isLast && entry.isFile() && /^\[[^\]]+\]\.html$/.test(entry.name)) {
        return path.join(dir, entry.name);
      }
      if (entry.isDirectory() && /^\[[^\]]+\]$/.test(entry.name)) {
        const found = matchDynamic(path.join(dir, entry.name), idx + 1);
        if (found) return found;
      }
    }
    return null;
  }

  return matchDynamic(rootDir, 0);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, expo-platform');
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return; }
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === baseUrl) pathname = '/';
    else if (pathname.startsWith(baseUrl + '/')) pathname = pathname.slice(baseUrl.length);
    pathname = pathname.replace(/\0/g, '');
    const resolved = resolveRouteFile(dist, pathname);
    if (!resolved) {
      const notFound = path.join(dist, '+not-found.html');
      if (fs.existsSync(notFound)) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        let html = fs.readFileSync(notFound, 'utf8');
        html = injectMobileFrame(html);
        res.end(html);
        return;
      }
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    if (!resolved.startsWith(dist)) { res.statusCode = 403; res.end('Forbidden'); return; }
    const isHtml = resolved.endsWith('.html');
    if (isHtml) {
      let html = fs.readFileSync(resolved, 'utf8');
      html = injectMobileFrame(html);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.setHeader('Cache-Control', 'public, max-age=0');
      res.end(html);
      return;
    }
    const stream = fs.createReadStream(resolved);
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType(resolved));
    if (resolved.includes('/_expo/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    else res.setHeader('Cache-Control', 'public, max-age=0');
    stream.on('error', () => { res.statusCode = 500; res.end('Internal Server Error'); });
    stream.pipe(res);
  } catch (e) {
    res.statusCode = 500;
    res.end('Internal Server Error: ' + String(e));
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Preview server running at http://0.0.0.0:${port} serving ${dist} with baseUrl ${baseUrl} (also /) + mobile frame 360×800 dp (xhdpi 720×1600 px) polished`);
});
