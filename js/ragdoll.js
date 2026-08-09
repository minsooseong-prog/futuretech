/* ragdoll.js — Verlet 적분 기반 래그돌.
   잡아서 끌거나 던졌을 때 스켈레톤 애니메이션 대신 이 물리로 몸이 움직인다. */

import { clamp } from './util.js';

const P_NAMES = ['head', 'chest', 'pelvis', 'elbowL', 'wristL', 'elbowR', 'wristR', 'kneeL', 'ankleL', 'kneeR', 'ankleR'];

export class Ragdoll {
  constructor() {
    this.p = {};
    for (const n of P_NAMES) this.p[n] = { x: 0, y: 0, px: 0, py: 0, m: 1, pin: false };
    this.p.chest.m = 2.0;
    this.p.pelvis.m = 2.4;
    this.p.head.m = 1.4;
    this.links = [];
    this.gravity = 2100;
    this.air = 0.992;
    this.friction = 0.72;
    this.bounce = 0.32;
    this.grabbed = null;
    this.grabX = 0; this.grabY = 0;
    this.stillTime = 0;
    this.scale = 1;
  }

  /** 스켈레톤 좌표에서 래그돌 초기화 */
  fromPoints(pts, scale = 1) {
    this.scale = scale;
    const set = (n, q) => { const p = this.p[n]; p.x = p.px = q.x; p.y = p.py = q.y; p.pin = false; };
    set('head', pts.headCenter);
    set('chest', pts.chest);
    set('pelvis', pts.pelvis);
    set('elbowL', pts.elbowL); set('wristL', pts.wristL);
    set('elbowR', pts.elbowR); set('wristR', pts.wristR);
    set('kneeL', pts.kneeL); set('ankleL', pts.ankleL);
    set('kneeR', pts.kneeR); set('ankleR', pts.ankleR);
    this.buildLinks();
    this.stillTime = 0;
  }

  buildLinks() {
    const d = (a, b) => Math.hypot(this.p[a].x - this.p[b].x, this.p[a].y - this.p[b].y);
    const L = (a, b, k = 1) => ({ a, b, len: d(a, b), k });
    this.links = [
      L('chest', 'head', 1), L('chest', 'pelvis', 1),
      L('chest', 'elbowL', 1), L('elbowL', 'wristL', 1),
      L('chest', 'elbowR', 1), L('elbowR', 'wristR', 1),
      L('pelvis', 'kneeL', 1), L('kneeL', 'ankleL', 1),
      L('pelvis', 'kneeR', 1), L('kneeR', 'ankleR', 1),
      // 형태 유지용(약한 제약) — 완전히 흐물거리지 않게
      L('head', 'pelvis', 0.35), L('chest', 'kneeL', 0.2), L('chest', 'kneeR', 0.2),
      L('chest', 'wristL', 0.12), L('chest', 'wristR', 0.12),
      L('pelvis', 'ankleL', 0.12), L('pelvis', 'ankleR', 0.12),
      L('elbowL', 'elbowR', 0.1), L('kneeL', 'kneeR', 0.08),
    ];
  }

  grab(name, x, y) {
    if (!this.p[name]) name = 'chest';
    this.grabbed = name;
    this.grabX = x; this.grabY = y;
    this.p[name].pin = true;
  }
  moveGrab(x, y) { this.grabX = x; this.grabY = y; }
  release(vx = 0, vy = 0) {
    if (!this.grabbed) return;
    const p = this.p[this.grabbed];
    p.pin = false;
    // 던지기 속도 주입
    p.px = p.x - vx / 60;
    p.py = p.y - vy / 60;
    for (const n of P_NAMES) {
      if (n === this.grabbed) continue;
      this.p[n].px -= vx / 90;
      this.p[n].py -= vy / 90;
    }
    this.grabbed = null;
  }

  /** 총 운동에너지(정지 판정) */
  energy() {
    let e = 0;
    for (const n of P_NAMES) {
      const p = this.p[n];
      e += (p.x - p.px) ** 2 + (p.y - p.py) ** 2;
    }
    return e;
  }

  center() {
    return { x: (this.p.pelvis.x + this.p.chest.x) / 2, y: (this.p.pelvis.y + this.p.chest.y) / 2 };
  }

  /** 마지막 프레임 속도(px/s) */
  velocity() {
    const p = this.p.pelvis;
    return { x: (p.x - p.px) * 60, y: (p.y - p.py) * 60 };
  }

  step(dt, world) {
    dt = clamp(dt, 0.001, 1 / 30);
    const sub = 2;
    const h = dt / sub;
    for (let s = 0; s < sub; s++) {
      // 적분
      for (const n of P_NAMES) {
        const p = this.p[n];
        if (p.pin) { p.px = p.x; p.py = p.y; p.x = this.grabX; p.y = this.grabY; continue; }
        const vx = (p.x - p.px) * this.air;
        const vy = (p.y - p.py) * this.air;
        p.px = p.x; p.py = p.y;
        p.x += vx;
        p.y += vy + this.gravity * h * h;
      }
      // 제약 반복
      for (let it = 0; it < 6; it++) {
        for (const l of this.links) {
          const a = this.p[l.a], b = this.p[l.b];
          let dx = b.x - a.x, dy = b.y - a.y;
          let d = Math.hypot(dx, dy) || 1e-6;
          const diff = ((d - l.len) / d) * 0.5 * l.k;
          const ax = dx * diff, ay = dy * diff;
          const wa = a.pin ? 0 : 1 / a.m, wb = b.pin ? 0 : 1 / b.m;
          const tot = wa + wb || 1;
          a.x += ax * (wa / tot) * 2 * (a.pin ? 0 : 1);
          a.y += ay * (wa / tot) * 2 * (a.pin ? 0 : 1);
          b.x -= ax * (wb / tot) * 2 * (b.pin ? 0 : 1);
          b.y -= ay * (wb / tot) * 2 * (b.pin ? 0 : 1);
        }
        this.collide(world);
      }
    }
    this.stillTime = this.energy() < 0.6 ? this.stillTime + dt : 0;
  }

  collide(world) {
    const pad = 6 * this.scale;
    for (const n of P_NAMES) {
      const p = this.p[n];
      if (p.pin) continue;
      // 바닥 + 발판
      const surf = world.surfaceAt(p.x, p.y);
      if (p.y > surf - pad) {
        const vy = p.y - p.py;
        p.y = surf - pad;
        if (vy > 0) p.py = p.y + vy * this.bounce;
        const vx = p.x - p.px;
        p.px = p.x - vx * this.friction;
      }
      // 좌우 벽
      if (p.x < pad) { const vx = p.x - p.px; p.x = pad; p.px = p.x - vx * -this.bounce; }
      if (p.x > world.width - pad) { const vx = p.x - p.px; p.x = world.width - pad; p.px = p.x - vx * -this.bounce; }
      // 천장
      if (p.y < pad) { const vy = p.y - p.py; p.y = pad; p.py = p.y - vy * -this.bounce; }
    }
  }

  /** 렌더에 필요한 관절 좌표 산출 */
  toPoints(dims) {
    const P = this.p;
    const norm = (ax, ay, bx, by) => {
      const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1;
      return [dx / d, dy / d];
    };
    const [hx, hy] = norm(P.chest.x, P.chest.y, P.head.x, P.head.y);
    const [lx, ly] = norm(P.elbowL.x, P.elbowL.y, P.wristL.x, P.wristL.y);
    const [rx, ry] = norm(P.elbowR.x, P.elbowR.y, P.wristR.x, P.wristR.y);
    const footDir = (kx, ky, ax, ay) => {
      const [dx, dy] = norm(kx, ky, ax, ay);
      // 정강이 방향에서 80도 회전 → 발 방향
      const a = -80 * Math.PI / 180;
      return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
    };
    const [flx, fly] = footDir(P.kneeL.x, P.kneeL.y, P.ankleL.x, P.ankleL.y);
    const [frx, fry] = footDir(P.kneeR.x, P.kneeR.y, P.ankleR.x, P.ankleR.y);
    const s = this.scale;
    return {
      pelvis: { x: P.pelvis.x, y: P.pelvis.y },
      chest: { x: P.chest.x, y: P.chest.y },
      neckTop: { x: P.chest.x + hx * dims.neck * s, y: P.chest.y + hy * dims.neck * s },
      headCenter: { x: P.head.x, y: P.head.y },
      headRadius: dims.headR * s,
      shoulderL: { x: P.chest.x, y: P.chest.y },
      shoulderR: { x: P.chest.x, y: P.chest.y },
      elbowL: { x: P.elbowL.x, y: P.elbowL.y },
      wristL: { x: P.wristL.x, y: P.wristL.y },
      handL: { x: P.wristL.x + lx * dims.hand * s, y: P.wristL.y + ly * dims.hand * s },
      elbowR: { x: P.elbowR.x, y: P.elbowR.y },
      wristR: { x: P.wristR.x, y: P.wristR.y },
      handR: { x: P.wristR.x + rx * dims.hand * s, y: P.wristR.y + ry * dims.hand * s },
      kneeL: { x: P.kneeL.x, y: P.kneeL.y },
      ankleL: { x: P.ankleL.x, y: P.ankleL.y },
      footL: { x: P.ankleL.x + flx * dims.foot * s, y: P.ankleL.y + fly * dims.foot * s },
      kneeR: { x: P.kneeR.x, y: P.kneeR.y },
      ankleR: { x: P.ankleR.x, y: P.ankleR.y },
      footR: { x: P.ankleR.x + frx * dims.foot * s, y: P.ankleR.y + fry * dims.foot * s },
    };
  }
}

export const PARTICLE_FOR_PART = {
  head: 'head', chest: 'chest', belly: 'pelvis',
  shoulderL: 'chest', shoulderR: 'chest',
  elbowL: 'elbowL', elbowR: 'elbowR',
  handL: 'wristL', handR: 'wristR',
  kneeL: 'kneeL', kneeR: 'kneeR',
  footL: 'ankleL', footR: 'ankleR',
};
