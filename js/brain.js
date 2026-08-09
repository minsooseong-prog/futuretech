/* brain.js — 아무도 건드리지 않아도 스스로 살아가게 만드는 부분.
   에너지·기분·호기심 값을 가지고 다음 행동을 고른다. */

import { AUTO_IDS } from './interactions.js';
import { rand, chance, pick, clamp } from './util.js';
import { settings } from './store.js';

/* 행동별 가중치 규칙 */
const RULES = [
  { id: 'a.wander', w: (b) => 3 + b.curiosity * 2 },
  { id: 'a.explore', w: (b) => b.curiosity * 2.2 },
  { id: 'a.look', w: () => 2.2 },
  { id: 'a.sit', w: (b) => (1 - b.energy) * 4 },
  { id: 'a.sleep', w: (b) => (b.energy < 0.22 ? 6 : 0) },
  { id: 'a.stretch', w: (b) => 1.4 + (1 - b.energy) },
  { id: 'a.yawn', w: (b) => (1 - b.energy) * 2.4 },
  { id: 'a.dance', w: (b) => b.energy * 2.2 },
  { id: 'a.sing', w: (b) => b.energy * 1.4 },
  { id: 'a.ponder', w: () => 1.3 },
  { id: 'a.count', w: () => 0.8 },
  { id: 'a.bored', w: (b) => b.boredom * 3 },
  { id: 'a.happy', w: (b) => b.energy * 1.2 },
  { id: 'a.exercise', w: (b) => b.energy * 1.8 },
  { id: 'a.jumpfun', w: (b) => b.energy * 1.6 },
  { id: 'a.pebble', w: () => 1.1 },
  { id: 'a.climb', w: (b, a) => (a.world.platforms.length ? b.curiosity * 2.4 : 0) },
  { id: 'a.sit_dangle', w: (b, a) => (a.char.onPlatform ? 3 : 0) },
  { id: 'a.greet_cursor', w: (b) => b.social * 2.4 },
  { id: 'a.selfcheck', w: () => 0.7 },
  { id: 'a.balance', w: (b) => b.energy * 1.0 },
  { id: 'a.meditate', w: (b) => (1 - b.energy) * 1.4 },
  { id: 'a.shiver', w: (b) => (b.night ? 1.2 : 0.2) },
];

export class Brain {
  constructor(app) {
    this.app = app;
    this.timer = rand(1.5, 3.5);
    this.energy = 0.85;
    this.boredom = 0;
    this.curiosity = 0.6;
    this.social = 0.5;
    this.night = false;
    this.zzz = 0;
    this.lastId = null;
    this.sleeping = false;
    this.followTick = 0;
  }

  /** 사용자가 뭔가 하면 지루함이 사라지고 기운이 난다 */
  poke(intensity = 1) {
    this.boredom = 0;
    this.energy = clamp(this.energy + 0.05 * intensity, 0, 1);
    this.social = clamp(this.social + 0.08 * intensity, 0, 1);
    this.timer = Math.max(this.timer, 1.2);
    if (this.sleeping) {
      this.sleeping = false;
      this.app.fire('a.wake');
      this.timer = 3;
    }
  }

  update(dt) {
    const c = this.app.char;
    const h = new Date().getHours();
    this.night = h >= 21 || h < 6;

    // 상태 값 변화
    this.energy = clamp(this.energy - dt * 0.006 + (this.sleeping ? dt * 0.06 : 0), 0, 1);
    this.boredom = clamp(this.boredom + dt * 0.02, 0, 1);
    this.curiosity = clamp(this.curiosity + dt * 0.01 * (this.boredom), 0, 1);
    this.social = clamp(this.social - dt * 0.004, 0, 1);

    // 자는 중에는 z 이펙트
    if (c.isPlaying('sleep')) {
      this.sleeping = true;
      this.zzz -= dt;
      if (this.zzz <= 0) {
        this.zzz = 0.9;
        const p = c.sk.pts.headCenter;
        c.spawnFx('zzz', p.x + 20, p.y - 16, 1);
      }
    } else if (this.sleeping && !c.action) {
      this.sleeping = false;
      this.app.fire('a.wake');
    }

    // 따라다니기
    if (c.follow && c.state === 'ground') {
      this.followTick -= dt;
      if (this.followTick <= 0) {
        this.followTick = 0.35;
        const d = this.app.input.mx - c.x;
        if (Math.abs(d) > 90) c.walkTo(this.app.input.mx - Math.sign(d) * 60, Math.abs(d) > 320);
        if (this.app.input.my < c.y - 160 && chance(0.25)) c.jump(1050);
      }
    }

    // 발판 오르기
    if (c.climbTarget && c.state === 'ground') {
      const p = c.climbTarget;
      const cx = p.x + p.w / 2;
      if (Math.abs(c.x - cx) < 60) {
        if (c.y > p.y + 30) c.jump(clamp(700 + (c.y - p.y) * 4.2, 800, 1900));
        else { c.climbTarget = null; c.onPlatform = true; }
      } else if (!c.moveTarget) c.walkTo(cx);
      if (Math.random() < dt * 0.15) c.climbTarget = null; // 포기
    }
    c.onPlatform = c.y < this.app.world.ground - 40;

    if (!settings.autonomy) return;
    if (c.state === 'ragdoll') { this.timer = 2; return; }
    if (c.action || c.moveTarget !== null) { this.timer = Math.max(this.timer, 0.4); return; }

    this.timer -= dt;
    if (this.timer > 0) return;

    // 다음 행동 고르기
    const cands = [];
    let total = 0;
    for (const r of RULES) {
      if (!AUTO_IDS.includes(r.id)) continue;
      let w = Math.max(0, r.w(this, this.app));
      if (r.id === this.lastId) w *= 0.15;
      if (w > 0) { total += w; cands.push([r.id, total]); }
    }
    if (!total) { this.timer = 2; return; }
    const roll = Math.random() * total;
    const hit = cands.find(([, acc]) => roll <= acc);
    const id = hit ? hit[0] : pick(AUTO_IDS);
    this.lastId = id;
    this.app.fire(id);

    this.boredom = clamp(this.boredom - 0.35, 0, 1);
    this.energy = clamp(this.energy - 0.02, 0, 1);
    this.timer = rand(2.2, 6.5) / clamp(settings.speed, 0.5, 2);
  }
}
