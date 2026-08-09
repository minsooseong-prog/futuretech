/* util.js — 수학, 스프링, 난수, DOM 헬퍼 */

export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const sign = (v) => (v < 0 ? -1 : 1);

/** 각도 차이를 -180~180 으로 정규화(도 단위) */
export function angDelta(a, b) {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/* ── 난수 ── */
export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export const chance = (p) => Math.random() < p;
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 임계 감쇠 스프링(critically damped spring).
 * 관절이 목표각으로 "탄력 있게" 수렴하도록 만든다 — 살아 있는 움직임의 핵심.
 */
export class Spring {
  constructor(value = 0, stiffness = 170, damping = 1) {
    this.v = value;      // 현재값
    this.vel = 0;        // 속도
    this.target = value;
    this.k = stiffness;
    this.z = damping;    // 1 = 임계 감쇠, <1 = 출렁임
  }
  set(v) { this.v = v; this.target = v; this.vel = 0; }
  step(dt) {
    // 안정성을 위해 서브스텝
    const steps = Math.min(4, Math.max(1, Math.ceil(dt / 0.012)));
    const h = dt / steps;
    const d = 2 * this.z * Math.sqrt(this.k);
    for (let i = 0; i < steps; i++) {
      const a = this.k * (this.target - this.v) - d * this.vel;
      this.vel += a * h;
      this.v += this.vel * h;
    }
    if (!isFinite(this.v)) { this.v = this.target; this.vel = 0; }
    return this.v;
  }
}

/** 각도 전용 스프링 (래핑 처리) */
export class AngleSpring extends Spring {
  step(dt) {
    // 목표를 현재값 근처로 옮겨서 최단 경로 회전
    const d = angDelta(this.v, this.target);
    const t = this.v + d;
    const saved = this.target;
    this.target = t;
    const r = super.step(dt);
    this.target = saved;
    return r;
  }
}

/* ── DOM ── */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'style') Object.assign(n.style, v);
    else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c));
  return n;
}

/* ── 색상 ── */
export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const s = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
export function shade(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v) => clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** 짧은 시간 안에 반복 호출되는 것을 제한 */
export function throttle(fn, ms) {
  let last = 0;
  return (...a) => {
    const t = performance.now();
    if (t - last >= ms) { last = t; fn(...a); }
  };
}
