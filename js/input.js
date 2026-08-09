/* input.js — 마우스·터치·키보드 입력과 제스처 인식.
   인식한 것은 app.fire(id) 로 상호작용 레지스트리에 넘긴다. */

import { clamp, dist, TAU } from './util.js';
import { settings } from './store.js';

const COOL = {};
function cooled(id, sec) {
  const t = performance.now() / 1000;
  if ((COOL[id] || 0) > t) return false;
  COOL[id] = t + sec;
  return true;
}

export class Input {
  constructor(app, canvas) {
    this.app = app;
    this.canvas = canvas;
    this.mx = window.innerWidth / 2; this.my = window.innerHeight / 2;
    this.pmx = this.mx; this.pmy = this.my;
    this.speed = 0;
    this.hist = [];
    this.down = false;
    this.dragPart = null;
    this.dragging = false;
    this.downX = 0; this.downY = 0; this.downT = 0;
    this.box = null;            // {x0,y0,x1,y1}
    this.lastBox = null;
    this.lastBoxT = 0;
    this.boxWobble = 0;
    this.clickTimes = [];
    this.lastClickT = 0;
    this.keys = new Set();
    this.idleT = 0;
    this.hoverHeadT = 0;
    this.hoverFeetT = 0;
    this.nearT = 0;
    this.tickleT = 0;
    this.angleAcc = 0;
    this.insideWindow = true;
    this.bind();
  }

  bind() {
    const c = this.canvas;
    const pos = (e) => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    c.addEventListener('pointerdown', (e) => {
      if (e.button === 2) return;
      const p = pos(e);
      c.setPointerCapture?.(e.pointerId);
      this.down = true;
      this.downX = p.x; this.downY = p.y; this.downT = performance.now();
      this.dragging = false;
      this.boxWobble = 0;
      this.dragPart = this.app.char.hitTest(p.x, p.y);
      this.app.brain.poke(0.6);
      if (!this.dragPart) this.box = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    });

    c.addEventListener('pointermove', (e) => {
      const p = pos(e);
      this.mx = p.x; this.my = p.y;
      this.idleT = 0;
      this.hist.push({ x: p.x, y: p.y, t: performance.now() });
      if (this.hist.length > 90) this.hist.shift();

      if (this.down) {
        const moved = dist(this.downX, this.downY, p.x, p.y);
        if (this.dragPart) {
          if (!this.dragging && moved > 7) {
            this.dragging = true;
            if (settings.physics) {
              this.app.char.grab(this.dragPart, p.x, p.y);
              this.app.fire('drag.' + this.dragPart);
            } else {
              this.app.fire('touch.' + this.dragPart);
            }
          }
          if (this.dragging) {
            this.app.char.dragTo(p.x, p.y);
            this.checkDragGestures(p);
          }
        } else if (this.box) {
          // 박스 그리는 동안의 흔들림 정도 측정
          const dx = p.x - this.box.x1, dy = p.y - this.box.y1;
          if (Math.hypot(dx, dy) > 2) {
            const s = Math.sign(dx);
            if (this._lastBoxDir !== undefined && s !== 0 && s !== this._lastBoxDir) this.boxWobble++;
            if (s !== 0) this._lastBoxDir = s;
          }
          this.box.x1 = p.x; this.box.y1 = p.y;
        }
      }
    });

    const up = (e) => {
      if (!this.down) return;
      const p = pos(e);
      this.down = false;
      const dt = (performance.now() - this.downT) / 1000;

      if (this.dragPart && this.dragging) {
        const v = this.recentVelocity();
        this.app.char.release(v.x, v.y);
        if (Math.hypot(v.x, v.y) > 1100) this.app.fire('throw');
        if (this.app.char.sk.pts.pelvis && this.app.char.sk.pts.pelvis.y < 140) this.app.fire('drag.high');
      } else if (this.dragPart && !this.dragging) {
        this.handleClick(this.dragPart, dt);
      } else if (this.box) {
        this.resolveBox();
      }
      this.dragPart = null; this.dragging = false; this.box = null; this._lastBoxDir = undefined;
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);

    c.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const p = pos(e);
      const part = this.app.char.hitTest(p.x, p.y);
      this.app.ui.showContextMenu(e.clientX, e.clientY, part);
    });

    c.addEventListener('wheel', () => {
      if (cooled('scroll', 4)) this.app.fire('s.scroll');
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      this.insideWindow = false;
      if (cooled('leave', 8)) this.app.fire('g.leave');
    });
    document.addEventListener('mouseenter', () => {
      if (!this.insideWindow && cooled('return', 8)) this.app.fire('g.return');
      this.insideWindow = true;
    });

    window.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      const k = e.key.toLowerCase();
      this.keys.add(k);
      this.app.brain.poke(0.5);
      const map = {
        ' ': 'k.space', arrowleft: 'k.left', arrowright: 'k.right',
        d: 'k.d', s: 'k.s', z: 'k.z', w: 'k.w', f: 'k.f', x: 'k.x', c: 'k.c', h: 'k.h', q: 'k.q',
      };
      if (k === 'shift') { this.app.fire('k.run'); return; }
      if (k === 'escape') { this.app.ui.closeAll(); return; }
      if (map[k]) { e.preventDefault(); this.app.fire(map[k]); }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.app.fire('s.hidden');
      else if (cooled('visible', 5)) this.app.fire('s.visible');
    });
  }

  recentVelocity() {
    const now = performance.now();
    const recent = this.hist.filter((h) => now - h.t < 110);
    if (recent.length < 2) return { x: 0, y: 0 };
    const a = recent[0], b = recent[recent.length - 1];
    const dt = Math.max(0.016, (b.t - a.t) / 1000);
    return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
  }

  handleClick(part, holdTime) {
    const now = performance.now();
    this.clickTimes.push(now);
    this.clickTimes = this.clickTimes.filter((t) => now - t < 2600);
    if (this.clickTimes.length >= 7 && cooled('spam', 6)) { this.app.fire('touch.spam'); return; }

    const isDouble = now - this.lastClickT < 340;
    this.lastClickT = now;
    if (isDouble) {
      const dmap = { head: 'dbl.head', chest: 'dbl.chest', belly: 'dbl.chest', handL: 'dbl.hand', handR: 'dbl.hand', footL: 'dbl.foot', footR: 'dbl.foot' };
      if (dmap[part]) { this.app.fire(dmap[part]); return; }
    }
    if (part === 'head' && holdTime < 0.14 && this.my < this.app.char.sk.pts.headCenter.y) {
      this.app.fire('touch.face'); return;
    }
    if (this.app.EVENT_EXISTS('touch.' + part)) this.app.fire('touch.' + part);
    else this.app.fire('touch.chest');
  }

  checkDragGestures() {
    const v = this.recentVelocity();
    if (Math.hypot(v.x, v.y) > 2200 && cooled('dragshake', 3)) this.app.fire('drag.shake');
  }

  resolveBox() {
    const b = this.box;
    const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1);
    const y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
    const w = x1 - x0, h = y1 - y0;
    if (w < 14 && h < 14) return; // 그냥 빈 곳 클릭
    const rect = { x0, y0, x1, y1, w, h };
    this.lastBox = rect; this.lastBoxT = performance.now();

    const cb = this.app.char.bounds();
    const contains = x0 <= cb.x0 && y0 <= cb.y0 && x1 >= cb.x1 && y1 >= cb.y1;
    const overlaps = !(x1 < cb.x0 || x0 > cb.x1 || y1 < cb.y0 || y0 > cb.y1);

    if (this.boxWobble >= 5) { this.app.fire('box.shake'); return; }
    if (contains) {
      const areaRatio = (w * h) / Math.max(1, (cb.x1 - cb.x0) * (cb.y1 - cb.y0));
      if (areaRatio < 1.35) this.app.fire('box.small');
      else if (w > window.innerWidth * 0.7 && h > window.innerHeight * 0.7) this.app.fire('box.big');
      else this.app.fire('box.catch');
      this.app.ui.showBoxMenu(rect);
      return;
    }
    if (overlaps) { this.app.fire('box.catch'); this.app.ui.showBoxMenu(rect); return; }
    this.app.fire('box.empty');
  }

  /** 매 프레임 제스처 판정 */
  update(dt) {
    const c = this.app.char;
    const P = c.sk.pts;
    if (!P.headCenter) return;

    const vx = this.mx - this.pmx, vy = this.my - this.pmy;
    this.pmx = this.mx; this.pmy = this.my;
    this.speed = Math.hypot(vx, vy) / Math.max(dt, 0.001);

    // 커서 정지
    if (this.speed < 3) this.idleT += dt; else this.idleT = 0;
    if (this.idleT > 13 && cooled('idle', 25)) this.app.fire('g.idle');
    if (this.idleT > 30 && cooled('idlelong', 60)) this.app.fire('s.idle_long');

    const now = performance.now();
    const recent = this.hist.filter((h) => now - h.t < 700);

    /* 흔들기 — x 방향 반전 횟수 */
    if (recent.length > 8) {
      let rev = 0, prev = 0;
      for (let i = 1; i < recent.length; i++) {
        const d = Math.sign(recent[i].x - recent[i - 1].x);
        if (d !== 0 && prev !== 0 && d !== prev) rev++;
        if (d !== 0) prev = d;
      }
      if (rev >= 6 && this.speed > 500) {
        const near = dist(this.mx, this.my, P.chest.x, P.chest.y) < 130 * c.scale;
        if (near && cooled('tickle', 5)) { this.app.fire('g.tickle'); }
        else if (!near && cooled('shake', 6)) this.app.fire('g.shake');
      }
      /* 지그재그 — y 방향 반전 */
      let yrev = 0, yp = 0;
      for (let i = 1; i < recent.length; i++) {
        const d = Math.sign(recent[i].y - recent[i - 1].y);
        if (d !== 0 && yp !== 0 && d !== yp) yrev++;
        if (d !== 0) yp = d;
      }
      if (yrev >= 5 && this.speed > 400 && cooled('zigzag', 8)) this.app.fire('g.zigzag');
    }

    /* 원 그리기 — 캐릭터 중심 기준 누적 각도 */
    if (recent.length > 6) {
      const cx = P.chest.x, cy = P.chest.y;
      let acc = 0, ok = true;
      for (let i = 1; i < recent.length; i++) {
        const a0 = Math.atan2(recent[i - 1].y - cy, recent[i - 1].x - cx);
        const a1 = Math.atan2(recent[i].y - cy, recent[i].x - cx);
        let d = a1 - a0;
        if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
        acc += d;
        if (dist(recent[i].x, recent[i].y, cx, cy) > 380) ok = false;
      }
      if (ok && Math.abs(acc) > TAU * 0.92) {
        if (acc > 0 && cooled('circle', 7)) this.app.fire('g.circle_cw');
        else if (acc < 0 && cooled('circle', 7)) this.app.fire('g.circle_ccw');
      }
    }

    /* 아주 빠른 커서 */
    if (this.speed > 3000 && cooled('fast', 7)) this.app.fire('g.fast');

    /* 천천히 다가가기 */
    const d2c = dist(this.mx, this.my, P.chest.x, P.chest.y);
    if (d2c < 220 * c.scale && this.speed > 4 && this.speed < 55) this.nearT += dt; else this.nearT = 0;
    if (this.nearT > 1.6 && cooled('slow', 10)) this.app.fire('g.slow');

    /* 스치듯 지나가기 */
    if (this.speed > 1700 && d2c < 90 * c.scale && cooled('flick', 6)) this.app.fire('g.flick');

    /* 머리 위 / 발밑 호버 */
    const overHead = Math.abs(this.mx - P.headCenter.x) < 70 * c.scale &&
      this.my < P.headCenter.y - P.headRadius && this.my > P.headCenter.y - 190 * c.scale;
    this.hoverHeadT = overHead && this.speed < 90 ? this.hoverHeadT + dt : 0;
    if (this.hoverHeadT > 1.5 && cooled('hoverhead', 10)) this.app.fire('g.hover_head');

    const feetY = Math.max(P.footL.y, P.footR.y);
    const overFeet = Math.abs(this.mx - c.x) < 80 * c.scale && this.my > feetY - 24 && this.my < feetY + 60;
    this.hoverFeetT = overFeet && this.speed < 90 ? this.hoverFeetT + dt : 0;
    if (this.hoverFeetT > 1.5 && cooled('hoverfeet', 10)) this.app.fire('g.hover_feet');

    /* 박스 안으로 걸어 들어가기 */
    if (this.lastBox && now - this.lastBoxT < 8000) {
      const r = this.lastBox;
      if (c.x > r.x0 && c.x < r.x1 && c.y > r.y0 - 60 && c.y < r.y1 + 20 && cooled('boxwalk', 10)) {
        this.app.fire('box.walkin');
        this.lastBox = null;
      }
    }

    /* 시선 */
    if (this.insideWindow) c.lookAt(this.mx, this.my, clamp(1 - d2c / 900, 0.15, 1));
  }

  /** 선택 박스 그리기 */
  draw(ctx) {
    if (!this.box) return;
    const b = this.box;
    const x = Math.min(b.x0, b.x1), y = Math.min(b.y0, b.y1);
    const w = Math.abs(b.x1 - b.x0), h = Math.abs(b.y1 - b.y0);
    ctx.save();
    ctx.strokeStyle = this.app.char.color;
    ctx.fillStyle = this.app.char.color + '22';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }
}
