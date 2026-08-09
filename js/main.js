/* main.js — 전체를 묶는 곳 */

import { Character } from './character.js';
import { Brain } from './brain.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { BY_ID, TOTAL } from './interactions.js';
import { setLang } from './i18n.js';
import { settings, markFound, bumpStat, registerVisit, onSettingsChange, flushStats, foundCount } from './store.js';
import { clamp, el, rand } from './util.js';

class World {
  constructor() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.platforms = [];
    this.hueShift = 0;
    this.resize();
  }
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.ground = Math.round(this.height * settings.groundPct);
  }
  /** (x,y) 아래에서 가장 먼저 만나는 바닥면의 y */
  surfaceAt(x, y) {
    let best = this.ground;
    for (const p of this.platforms) {
      if (x < p.x - 4 || x > p.x + p.w + 4) continue;
      if (p.y >= y - 10 && p.y < best) best = p.y;
    }
    return best;
  }
  randomPlatform() {
    const ok = this.platforms.filter((p) => p.y > 90 && p.y < this.ground - 60 && p.w > 120);
    return ok.length ? ok[(Math.random() * ok.length) | 0] : null;
  }
}

class App {
  constructor() {
    setLang(settings.lang);
    document.documentElement.style.setProperty('--accent', settings.color);

    this.canvas = document.getElementById('stage');
    this.c2d = this.canvas.getContext('2d');
    this.world = new World();
    this.char = new Character(this.world);
    this.ui = new UI(this);
    this.brain = new Brain(this);
    this.input = new Input(this, this.canvas);

    this.char.onEvent = (id) => this.fire(id);
    this.fireCool = new Map();
    this.platTick = 0;
    this.secAccum = 0;
    this.last = performance.now();

    this.char.x = this.world.width * 0.45;
    this.char.y = this.world.ground - 66 * settings.size;

    this.resizeCanvas();
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.ui.layoutPanels();
      this.fire('s.resize');
    });

    onSettingsChange((k) => {
      if (k === 'groundPct') this.world.resize();
      if (k === 'color' || k === 'rainbow') {
        document.documentElement.style.setProperty('--accent', settings.color);
      }
    });

    document.getElementById('total').textContent = String(TOTAL);

    // 첫 방문 / 재방문 / 밤 인사
    const visits = registerVisit();
    setTimeout(() => this.fire(visits <= 1 ? 's.first' : 's.return'), 900);
    const h = new Date().getHours();
    if (h >= 21 || h < 6) setTimeout(() => this.fire('s.night'), 6000);

    requestAnimationFrame((t) => this.loop(t));
  }

  EVENT_EXISTS(id) { return BY_ID.has(id); }

  /** 상호작용 실행 — 모든 반응이 여기를 지나간다 */
  fire(id) {
    const ev = BY_ID.get(id);
    if (!ev) return false;
    const now = performance.now();
    if ((this.fireCool.get(id) || 0) > now) return false;
    this.fireCool.set(id, now + 320);

    try { ev.run(this); } catch (e) { console.error('상호작용 오류', id, e); }

    if (ev.cat !== 'auto') this.brain.poke(0.8);
    if (markFound(id)) this.discovered(ev);
    return true;
  }

  discovered(ev) {
    const n = document.getElementById('found');
    if (n) n.textContent = String(foundCount());
    const toast = el('div', { class: 'toast' },
      el('b', {}, '\u2605 ' + (settings.lang === 'ko' ? ev.name.ko : ev.name.en)),
      el('span', {}, `${foundCount()} / ${TOTAL}`));
    document.body.append(toast);
    requestAnimationFrame(() => toast.classList.add('in'));
    setTimeout(() => { toast.classList.remove('in'); setTimeout(() => toast.remove(), 400); }, 2200);
  }
  resizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.world.resize();
    this.canvas.width = Math.floor(this.world.width * dpr);
    this.canvas.height = Math.floor(this.world.height * dpr);
    this.canvas.style.width = this.world.width + 'px';
    this.canvas.style.height = this.world.height + 'px';
    this.c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.char.x = clamp(this.char.x, 30, this.world.width - 30);
  }

  loop(now) {
    const dt = Math.min((now - this.last) / 1000, 1 / 24);
    this.last = now;

    // 열린 창의 윗면 = 발판
    this.platTick += dt;
    if (this.platTick > 0.25) {
      this.platTick = 0;
      this.world.platforms = this.ui.measurePlatforms();
    }

    // 방향키 지속 이동
    const k = this.input.keys;
    if (this.char.state === 'ground') {
      const run = k.has('shift');
      if (k.has('arrowleft')) this.char.walkTo(this.char.x - 150, run);
      else if (k.has('arrowright')) this.char.walkTo(this.char.x + 150, run);
    }

    this.input.update(dt);
    this.brain.update(dt);
    this.char.update(dt);

    this.secAccum += dt;
    if (this.secAccum >= 1) { bumpStat('seconds', Math.floor(this.secAccum)); this.secAccum %= 1; }

    const ctx = this.c2d;
    ctx.clearRect(0, 0, this.world.width, this.world.height);
    this.drawGround(ctx);
    this.char.draw(ctx);
    this.input.draw(ctx);

    requestAnimationFrame((t) => this.loop(t));
  }

  drawGround(ctx) {
    const g = this.world.ground;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, g, this.world.width, this.world.height - g);
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, g + 1); ctx.lineTo(this.world.width, g + 1); ctx.stroke();
    ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__app = new App();
});
window.addEventListener('beforeunload', flushStats);
void rand;
