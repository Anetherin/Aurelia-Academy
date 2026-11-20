'use strict';
/* =====================================================================
   SAFETY FILTER — strips youth-coded terms from prompts and character text.
   All characters are adults (18+).
   ===================================================================== */
const YOUTH_RE = /\b(child(ren|like|ish)?|kids?|loli(ta|con)?|shota(con)?|toddlers?|infants?|bab(y|ies)|pre-?teens?|teens?|teenag(er|e)|underage|minors?|school ?girls?|middle ?school|high ?school|elementary|little girls?|young girls?|girlish|tiny body|(1[0-7]|[1-9]) ?(yo|y\/o|years? old))\b/gi;

function cleanText(s){
  return String(s ?? '')
    .replace(YOUTH_RE, '')
    .replace(/\s+,/g, ',')
    .replace(/,(\s*,)+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .trim();
}

/* =====================================================================
   DOM, MATH, RANDOM & STORAGE HELPERS
   ===================================================================== */
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => {
  const b = a.slice();
  for(let i = b.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
function weighted(arr, f){
  const ws = arr.map(f);
  let t = ws.reduce((a, b) => a + b, 0) * Math.random();
  for(let i = 0; i < arr.length; i++){
    t -= ws[i];
    if(t <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const fmtMoney = n => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();
const uid = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o));
const cap = s => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);

function hashStr(s){
  let h = 0;
  for(const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}
function seededRng(seed){
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HAIR_HEX = {
  'ink black': '#272733',
  'platinum blonde': '#ede4c7',
  'chestnut brown': '#6d4029',
  'fiery red': '#b8352a',
  'ash grey': '#8e929c',
  'deep violet': '#6d448f',
  'golden silk': '#dfb858',
  'emerald green': '#2e7d5b'
};
const hairHex = s => HAIR_HEX[String((s && s.design && s.design.hairColor) || (s && s.physicalStats && s.physicalStats.hairColor) || '').toLowerCase()] || '#6366f1';
const initials = n => String(n || '?').split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();

const store = {
  get(k){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }catch(e){ return null; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};

const KEY_SAVE = 'aurelia_save_v1';
const KEY_SET = 'aurelia_settings_v1';
const KEY_LIB = 'aurelia_library_v1';

const _savedSet = store.get(KEY_SET) || {};
let SET = Object.assign({}, DEFAULT_SETTINGS, _savedSet);
SET.ai = Object.assign({}, DEFAULT_SETTINGS.ai, _savedSet.ai || {});

let LIB = store.get(KEY_LIB) || [];
let S = null;
let TAB = 'students';
let SHEET = null;
let SETUP = null;
let MODAL_LOCK = false;
let STU_FILTER = { role: 'all', focus: 'all', sort: 'rank' };
let HIST_FILTER = 'all';

/* =====================================================================
   INDEXEDDB IMAGE CACHE (local browser only — no R2/cloud sync)
   ===================================================================== */
let DB = null;
let THUMBS = {};
let IMGKEYS = new Set();

function idbOpen(){
  return new Promise(res => {
    try{
      const r = indexedDB.open('aurelia_academy_imgs', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        if(!d.objectStoreNames.contains('imgs')) d.createObjectStore('imgs');
        if(!d.objectStoreNames.contains('thumbs')) d.createObjectStore('thumbs');
      };
      r.onsuccess = () => { DB = r.result; res(DB); };
      r.onerror = () => res(null);
    }catch(e){ res(null); }
  });
}

function idbReq(st, mode, fn){
  return new Promise(res => {
    if(!DB) return res(null);
    try{
      const tx = DB.transaction(st, mode);
      const q = fn(tx.objectStore(st));
      tx.oncomplete = () => res(q ? q.result : null);
      tx.onerror = () => res(null);
      tx.onabort = () => res(null);
    }catch(e){ res(null); }
  });
}

const imgGet = k => idbReq('imgs', 'readonly', s => s.get(k));
const imgPut = (k, v) => { IMGKEYS.add(k); return idbReq('imgs', 'readwrite', s => s.put(v, k)); };
const imgDel = k => { IMGKEYS.delete(k); return idbReq('imgs', 'readwrite', s => s.delete(k)); };
const imgKeysAll = () => idbReq('imgs', 'readonly', s => s.getAllKeys());

function idbAll(st){
  return new Promise(res => {
    const out = {};
    if(!DB) return res(out);
    try{
      const c = DB.transaction(st, 'readonly').objectStore(st).openCursor();
      c.onsuccess = () => {
        const cur = c.result;
        if(cur){ out[cur.key] = cur.value; cur.continue(); }
        else res(out);
      };
      c.onerror = () => res(out);
    }catch(e){ res(out); }
  });
}

function shrink(src, max, q){
  return new Promise(res => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.round(im.width * s);
      c.height = Math.round(im.height * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      try{ res(c.toDataURL('image/jpeg', q)); }
      catch(e){ res(String(src).startsWith('data:') ? src : null); }
    };
    im.onerror = () => res(null);
    im.src = src;
  });
}

async function setThumb(id, dataUrl){
  const t = await shrink(dataUrl, 180, 0.82);
  if(!t) return;
  THUMBS[id] = t;
  await idbReq('thumbs', 'readwrite', s => s.put(t, id));
  if(S || SETUP) render();
}
