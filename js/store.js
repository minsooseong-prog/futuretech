/* store.js — 설정·게시판·통계는 localStorage, 배경 이미지는 IndexedDB(용량이 크므로) */

const LS = 'zolaman.v2';

export const DEFAULTS = {
  lang: 'ko',
  color: '#F26A21',
  rainbow: false,
  bgFit: 'cover',
  bgDim: 0,
  size: 1,
  speed: 1,
  autonomy: true,
  physics: true,
  talk: true,
  textSize: 15,
  groundPct: 0.88,
  trail: false,
  sounds: false,
};

export const COLOR_PRESETS = [
  '#F26A21', '#E63946', '#F4A261', '#2A9D8F', '#4361EE',
  '#7209B7', '#111111', '#EC4899', '#22C55E', '#06B6D4',
];

function readAll() {
  try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; }
}
function writeAll(o) {
  try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) { console.warn('저장 실패', e); }
}

/* ── 설정 ── */
export const settings = { ...DEFAULTS, ...(readAll().settings || {}) };

const listeners = new Set();
export function onSettingsChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function setSetting(key, value) {
  if (settings[key] === value) return;
  settings[key] = value;
  const all = readAll();
  all.settings = settings;
  writeAll(all);
  listeners.forEach((f) => f(key, value));
}

/* ── 게시판 ── */
export function getPosts() {
  return readAll().posts || [];
}
export function addPost(name, text) {
  const all = readAll();
  all.posts = all.posts || [];
  all.posts.unshift({ id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), name, text, at: Date.now() });
  all.posts = all.posts.slice(0, 300);
  writeAll(all);
  return all.posts;
}
export function removePost(id) {
  const all = readAll();
  all.posts = (all.posts || []).filter((p) => p.id !== id);
  writeAll(all);
  return all.posts;
}

/* ── 통계 & 도감 ── */
export function getStats() {
  return Object.assign({ steps: 0, throws: 0, seconds: 0, visits: 0, found: [] }, readAll().stats || {});
}
let statCache = getStats();
let statDirty = false;
export function bumpStat(key, by = 1) {
  statCache[key] = (statCache[key] || 0) + by;
  statDirty = true;
}
export function markFound(id) {
  if (statCache.found.includes(id)) return false;
  statCache.found.push(id);
  statDirty = true;
  return true; // 처음 발견
}
export function isFound(id) { return statCache.found.includes(id); }
export function foundCount() { return statCache.found.length; }
export function statsSnapshot() { return { ...statCache }; }
export function flushStats() {
  if (!statDirty) return;
  statDirty = false;
  const all = readAll();
  all.stats = statCache;
  writeAll(all);
}
setInterval(flushStats, 4000);
window.addEventListener('beforeunload', flushStats);

/* ── 배경 이미지 (IndexedDB) ── */
const DB_NAME = 'zolaman-bg';
const STORE = 'files';

function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => { r.result.createObjectStore(STORE); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function saveBackground(blob) {
  try {
    const db = await openDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, 'bg');
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
    return true;
  } catch (e) { console.warn('배경 저장 실패', e); return false; }
}

export async function loadBackground() {
  try {
    const db = await openDB();
    return await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const q = tx.objectStore(STORE).get('bg');
      q.onsuccess = () => res(q.result || null);
      q.onerror = () => rej(q.error);
    });
  } catch { return null; }
}

export async function clearBackground() {
  try {
    const db = await openDB();
    await new Promise((res) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete('bg');
      tx.oncomplete = res; tx.onerror = res;
    });
  } catch { /* noop */ }
}

export async function resetEverything() {
  try { localStorage.removeItem(LS); } catch { /* noop */ }
  await clearBackground();
  statCache = { steps: 0, throws: 0, seconds: 0, visits: 0, found: [] };
}

/* 방문 횟수 */
export function registerVisit() {
  bumpStat('visits', 1);
  flushStats();
  return statCache.visits;
}
