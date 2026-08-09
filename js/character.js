/* character.js — 졸라맨 본체.
   1) 기본 포즈(대기/걷기/달리기)를 절차적으로 만들고
   2) 그 위에 모션 클립을 블렌드하고
   3) 모든 관절을 스프링으로 부드럽게 수렴시킨 뒤
   4) FK → 지면 고정 → 렌더 한다. */

import { Skeleton, HIT_PARTS } from './skeleton.js';
import { CLIPS, sampleClip } from './clips.js';
import { Ragdoll, PARTICLE_FOR_PART } from './ragdoll.js';
import { AngleSpring, clamp, lerp, rand, randInt, pick, chance, shade, D2R, TAU } from './util.js';
import { settings, bumpStat } from './store.js';

export const DIMS = { headR: 26, neck: 8, hand: 9, foot: 14 };

const JOINTS = ['spine', 'neck', 'head', 'armR_u', 'armR_f', 'handR', 'armL_u', 'armL_f', 'handL',
  'legR_u', 'legR_l', 'footR', 'legL_u', 'legL_l', 'footL'];

/* 관절별 스프링 세기 — 무거운 부위는 느리게, 손끝은 빠르게 */
const STIFF = {
  spine: 130, neck: 190, head: 170,
  armR_u: 175, armR_f: 200, handR: 240,
  armL_u: 175, armL_f: 200, handL: 240,
  legR_u: 165, legR_l: 190, footR: 230,
  legL_u: 165, legL_l: 190, footL: 230,
};

export class Character {
  constructor(world) {
    this.world = world;
    this.sk = new Skeleton();
    this.rag = new Ragdoll();

    this.x = 300; this.y = 400;   // 골반 위치
    this.vx = 0; this.vy = 0;
    this.dir = 1;                 // 1=오른쪽, -1=왼쪽
    this.facing = new AngleSpring(0, 90, 1);  // 방향 전환을 부드럽게(0~180도 회전)

    this.state = 'ground';        // ground | air | ragdoll
    this.locomotion = 'idle';     // idle | walk | run
    this.moveTarget = null;
    this.runFlag = false;
    this.phase = 0;               // 보행 위상
    this.breath = rand(TAU);
    this.blink = 0;

    this.action = null;           // {clip, t, speed, loopsLeft, weight, out, onEnd}
    this.queue = [];

    this.springs = {};
    for (const j of JOINTS) this.springs[j] = new AngleSpring(0, STIFF[j] || 170, 1);

    this.bodyRot = 0;             // 전신 회전(공중제비, 제자리돌기)
    this.bodyRotSpring = new AngleSpring(0, 120, 1);

    this.lookAtPt = null;
    this.lookAmt = 0;

    this.speech = null;
    this.fx = [];
    this.trail = [];

    this.mood = 'calm';           // calm | happy | angry | sad | sleepy | scared
    this.energy = 1;
    this.dizzyT = 0;
    this.stepAccum = 0;
    this.follow = false;
    this.sitOn = null;
    this.lastGroundY = 0;

    this.onEvent = null;          // (id) => void  — 상호작용 발견 알림용
  }

  /* ────────── 조작 API ────────── */

  get scale() { return settings.size; }

  play(name, opt = {}) {
    const clip = CLIPS[name];
    if (!clip) return false;
    if (this.state === 'ragdoll' && !opt.force) return false;
    this.action = {
      clip, t: 0, speed: opt.speed || 1,
      loops: opt.loops ?? (clip.loop ? 3 : 1),
      done: 0, weight: 0, out: false,
      onEnd: opt.onEnd || null,
      hold: opt.hold || false,
    };
    return true;
  }

  stopAction() { if (this.action) this.action.out = true; }

  isPlaying(name) { return this.action && this.action.clip.name === name && !this.action.out; }

  say(text, dur) {
    if (!settings.talk || !text) return;
    this.speech = { text, t: 0, dur: dur ?? clamp(1.4 + text.length * 0.07, 1.6, 4.5) };
  }

  /** 말 + 동작을 항상 함께 */
  react(clipName, text, opt = {}) {
    if (clipName) this.play(clipName, opt);
    if (text) this.say(text);
  }

  faceTo(x) { const d = x < this.x ? -1 : 1; if (d !== this.dir) { this.dir = d; this.facing.target = d === 1 ? 0 : 180; } }
  lookAt(x, y, amt = 1) { this.lookAtPt = { x, y }; this.lookTarget = amt; }

  walkTo(x, run = false) {
    this.moveTarget = clamp(x, 30, this.world.width - 30);
    this.runFlag = run;
    this.sitOn = null;
  }
  stopWalk() { this.moveTarget = null; this.vx = 0; }

  jump(force = 900) {
    if (this.state !== 'ground') return false;
    this.vy = -force;
    this.state = 'air';
    this.spawnFx('dust', this.x, this.y + 62 * this.scale, 6);
    return true;
  }

  /** 잡히기 → 래그돌 전환 */
  grab(part, mx, my) {
    if (!settings.physics) return false;
    this.rag.fromPoints(this.sk.pts, this.scale);
    this.rag.grab(PARTICLE_FOR_PART[part] || 'chest', mx, my);
    this.state = 'ragdoll';
    this.action = null;
    this.moveTarget = null;
    return true;
  }
  dragTo(x, y) { if (this.state === 'ragdoll') this.rag.moveGrab(x, y); }
  release(vx, vy) {
    if (this.state !== 'ragdoll') return;
    this.rag.release(vx, vy);
    if (Math.hypot(vx, vy) > 900) bumpStat('throws', 1);
  }

  /** 부위 히트 테스트 — 마우스 아래 있는 몸 부위 id 반환 */
  hitTest(mx, my) {
    const P = this.sk.pts;
    const R = 15 * this.scale;
    let best = null, bestD = Infinity;
    for (const [id, key, mul] of HIT_PARTS) {
      const p = P[key]; if (!p) continue;
      const r = (id === 'head' ? P.headRadius * 1.15 : R * (mul * 2.2));
      const d = Math.hypot(mx - p.x, my - p.y);
      if (d < r && d < bestD) { bestD = d; best = id; }
    }
    if (best) return best;
    // 팔·다리 선분 위도 잡히게
    const segs = [
      ['chest', 'pelvis', 'chest'], ['chest', 'elbowL', 'shoulderL'], ['elbowL', 'handL', 'elbowL'],
      ['chest', 'elbowR', 'shoulderR'], ['elbowR', 'handR', 'elbowR'],
      ['pelvis', 'kneeL', 'kneeL'], ['kneeL', 'footL', 'footL'],
      ['pelvis', 'kneeR', 'kneeR'], ['kneeR', 'footR', 'footR'],
    ];
    for (const [a, b, id] of segs) {
      const A = P[a], B = P[b];
      if (!A || !B) continue;
      if (this._distToSeg(mx, my, A, B) < 13 * this.scale) return id;
    }
    return null;
  }
  _distToSeg(px, py, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const l2 = dx * dx + dy * dy || 1;
    let t = ((px - a.x) * dx + (py - a.y) * dy) / l2;
    t = clamp(t, 0, 1);
    return Math.hypot(px - (a.x + dx * t), py - (a.y + dy * t));
  }

  bounds() {
    const P = this.sk.pts;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const k of Object.keys(P)) {
      const p = P[k]; if (!p || typeof p.x !== 'number') continue;
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x);
      y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
    }
    const r = (P.headRadius || 26);
    return { x0: x0 - r, y0: y0 - r, x1: x1 + r, y1: y1 + r };
  }

  /* ────────── 이펙트 ────────── */
  spawnFx(type, x, y, n = 1, text) {
    for (let i = 0; i < n; i++) {
      this.fx.push({
        type, x: x + rand(-8, 8), y: y + rand(-8, 8),
        vx: rand(-70, 70), vy: type === 'dust' ? rand(-40, -10) : rand(-90, -30),
        life: 0, max: rand(0.5, 1.1), text, rot: rand(TAU),
      });
    }
    if (this.fx.length > 120) this.fx.splice(0, this.fx.length - 120);
  }

  /* ────────── 기본 포즈 ────────── */
  _basePose(dt) {
    const T = {};
    for (const j of JOINTS) T[j] = 0;

    const sp = settings.speed;
    const br = Math.sin(this.breath) * 1.0;

    if (this.state === 'air') {
      const up = this.vy < 0;
      T.legL_u = up ? -34 : -14; T.legL_l = up ? 48 : 20;
      T.legR_u = up ? 12 : -6; T.legR_l = up ? 26 : 30;
      T.armL_u = up ? -150 : -110; T.armR_u = up ? 140 : 100;
      T.armL_f = -22; T.armR_f = -22;
      T.spine = up ? -8 : 6; T.head = up ? -8 : 6;
      T.footL = -18; T.footR = -18;
      return T;
    }

    if (this.locomotion === 'idle') {
      T.spine = br * 1.4;
      T.neck = -br * 0.6;
      T.head = Math.sin(this.breath * 0.7 + 1) * 2.2;
      // 팔은 몸통에서 살짝 벌어지고, 다리는 자연스러운 스탠스로
      T.armL_u = -22 + Math.sin(this.breath * 0.9) * 3.5;
      T.armR_u = 20 + Math.sin(this.breath * 0.9 + 0.6) * 3.5;
      T.armL_f = -14 + Math.sin(this.breath * 0.8) * 4;
      T.armR_f = -11 + Math.sin(this.breath * 0.8 + 1.2) * 4;
      T.legL_u = -10 + Math.sin(this.breath * 0.5) * 1.2;
      T.legR_u = 9;
      T.legL_l = 5; T.legR_l = 7;
      T.footL = 2; T.footR = -2;
      // 가끔 무게 중심 이동
      T.spine += Math.sin(this.breath * 0.31) * 2.5;
    } else {
      const run = this.locomotion === 'run';
      const th = this.phase * TAU;
      const A = run ? 42 : 27;       // 허벅지 진폭
      const K = run ? 78 : 52;       // 무릎 굽힘
      const AR = run ? 40 : 22;      // 팔 스윙
      T.legR_u = -A * Math.cos(th);
      T.legL_u = -A * Math.cos(th + Math.PI);
      T.legR_l = K * Math.max(0, Math.sin(th + 2.1)) ** 1.1;
      T.legL_l = K * Math.max(0, Math.sin(th + Math.PI + 2.1)) ** 1.1;
      T.footR = -(T.legR_u + T.legR_l) * 0.55 + (run ? 12 : 6);
      T.footL = -(T.legL_u + T.legL_l) * 0.55 + (run ? 12 : 6);
      T.armR_u = 16 + AR * Math.cos(th);
      T.armL_u = -18 + AR * Math.cos(th + Math.PI);
      T.armR_f = -(run ? 70 : 26) - Math.max(0, Math.cos(th)) * 12;
      T.armL_f = -(run ? 70 : 26) - Math.max(0, Math.cos(th + Math.PI)) * 12;
      T.spine = (run ? 14 : 5) + Math.sin(th * 2) * 1.6;
      T.head = -(run ? 10 : 3) + Math.sin(th * 2 + 1) * 2;
      T.neck = -2;
    }

    // 시선 처리 — 머리를 커서 쪽으로 살짝
    if (this.lookAtPt) {
      const P = this.sk.pts.headCenter || { x: this.x, y: this.y - 90 };
      const dx = (this.lookAtPt.x - P.x) * this.dir;
      const dy = this.lookAtPt.y - P.y;
      const a = clamp(Math.atan2(dy, Math.abs(dx) + 40) / D2R, -34, 34);
      T.head += a * 0.55 * this.lookAmt;
      T.neck += a * 0.2 * this.lookAmt;
      T.spine += clamp(a, -12, 12) * 0.12 * this.lookAmt;
    }

    // 어지러움
    if (this.dizzyT > 0) {
      const w = Math.min(1, this.dizzyT);
      T.spine += Math.sin(this.breath * 6) * 7 * w;
      T.head += Math.sin(this.breath * 6 + 1.4) * 9 * w;
    }
    void sp; void dt;
    return T;
  }

  /* ────────── 갱신 ────────── */
  update(dt) {
    const sp = settings.speed;
    this.breath += dt * 1.7;
    this.blink -= dt;

    if (settings.rainbow) this.world.hueShift = (this.world.hueShift + dt * 40) % 360;

    /* 래그돌 */
    if (this.state === 'ragdoll') {
      this.rag.scale = this.scale;
      this.rag.step(dt, this.world);
      this.sk.pts = this.rag.toPoints(DIMS);
      const c = this.rag.center();
      this.x = this.rag.p.pelvis.x; this.y = this.rag.p.pelvis.y;
      void c;
      if (!this.rag.grabbed && this.rag.stillTime > 1.1) {
        // 스스로 일어난다
        this.state = 'ground';
        this.y = this.world.surfaceAt(this.x, this.rag.p.pelvis.y);
        this.vx = 0; this.vy = 0;
        for (const j of JOINTS) this.springs[j].set(this.springs[j].v);
        this.play('getup', { force: true });
        this.dizzyT = 1.6;
        if (this.onEvent) this.onEvent('recover');
      }
      this._updateSpeech(dt);
      this._updateFx(dt);
      return;
    }

    /* 이동 */
    if (this.moveTarget !== null && this.state === 'ground') {
      const d = this.moveTarget - this.x;
      const ad = Math.abs(d);
      if (ad < 6) { this.moveTarget = null; this.vx = 0; this.locomotion = 'idle'; }
      else {
        this.faceTo(this.moveTarget);
        const speed = (this.runFlag ? 265 : 112) * sp;
        this.vx = Math.sign(d) * Math.min(speed, ad * 5);
        this.locomotion = this.runFlag ? 'run' : 'walk';
      }
    } else if (this.state === 'ground' && !this.moveTarget) {
      this.vx *= 0.82;
      if (Math.abs(this.vx) < 8) { this.vx = 0; this.locomotion = 'idle'; }
    }

    // 클립이 자체 이동을 지정하는 경우(문워크, 기어가기 등)
    const clipRoot = this.action && this.action.clip.root ? this.action.clip.root(this.action.t) : null;
    if (clipRoot && clipRoot.x) this.x += clipRoot.x * this.dir * 60 * dt * sp;

    this.x += this.vx * dt;
    this.x = clamp(this.x, 24, this.world.width - 24);

    // 보행 위상
    const speedMag = Math.abs(this.vx);
    if (this.locomotion !== 'idle') {
      const cyc = this.locomotion === 'run' ? 0.44 : 0.62;
      const before = this.phase;
      this.phase = (this.phase + (dt * (speedMag / (this.locomotion === 'run' ? 265 : 112)) / cyc)) % 1;
      if (before > this.phase) { bumpStat('steps', 2); }
      this.stepAccum += dt;
      if (Math.floor(before * 2) !== Math.floor(this.phase * 2)) {
        this.spawnFx('dust', this.x - this.dir * 10, this.y + 62 * this.scale, 1);
      }
    }

    /* 공중 */
    if (this.state === 'air') {
      this.vy += 2400 * dt;
      this.y += this.vy * dt;
      const surf = this.world.surfaceAt(this.x, this.y);
      // 발끝 기준 착지 판정
      const footOffset = 66 * this.scale;
      if (this.vy > 0 && this.y + footOffset >= surf) {
        this.y = surf - footOffset;
        const hard = this.vy > 1300;
        this.vy = 0;
        this.state = 'ground';
        this.spawnFx('dust', this.x, surf - 4, hard ? 10 : 5);
        if (this.onEvent) this.onEvent(hard ? 'land_hard' : 'land_soft');
        if (hard) this.play('stumble');
      }
    }

    /* 클립 진행 */
    let clipVals = null, clipW = 0;
    if (this.action) {
      const a = this.action;
      const dur = a.clip.dur / (a.speed * sp);
      a.t += dt / dur;
      if (a.t >= 1) {
        a.done++;
        if (a.hold) a.t = 1;
        else if (a.clip.loop && a.done < a.loops) a.t %= 1;
        else if (a.done >= a.loops) { a.out = true; a.t = a.clip.loop ? a.t % 1 : 1; }
        else a.t %= 1;
      }
      const bl = a.clip.blend;
      const target = a.out ? 0 : 1;
      a.weight += (target - a.weight) * Math.min(1, dt / Math.max(0.04, bl));
      if (a.out && a.weight < 0.02) {
        const cb = a.onEnd; this.action = null;
        if (cb) cb();
        if (this.queue.length) { const n = this.queue.shift(); this.play(n.name, n.opt); }
      } else {
        clipVals = sampleClip(a.clip, a.t);
        clipW = a.weight;
      }
    }

    /* 목표 각도 = 기본 포즈 + 클립 */
    this.lookAmt += ((this.lookTarget ?? (this.action ? 0.25 : 0.8)) - this.lookAmt) * Math.min(1, dt * 4);
    const base = this._basePose(dt);
    for (const j of JOINTS) {
      let v = base[j] || 0;
      if (clipVals && clipVals[j] !== undefined) v = lerp(v, clipVals[j], clipW);
      const s = this.springs[j];
      s.target = v;
      s.step(dt * clamp(sp, 0.4, 2.2));
      this.sk.get(j).angle = s.v;
    }

    /* 전신 회전(제자리돌기/공중제비) */
    let rotTarget = 0;
    if (this.action && clipW > 0.02) {
      const o = this.action.clip;
      if (o.spinTurns) rotTarget = o.spinTurns * 360 * this.action.t * clipW;
      if (o.flipTurns) rotTarget = o.flipTurns * 360 * this.action.t * clipW;
    }
    this.bodyRotSpring.target = rotTarget;
    this.bodyRot = this.bodyRotSpring.step(dt * 3);

    /* 루트 */
    this.sk.root.x = this.x;
    this.sk.root.y = this.y;
    this.sk.root.lean = 0;
    if (clipRoot && clipRoot.y) this.sk.root.y += clipRoot.y * this.scale * clipW;

    /* FK */
    const flip = this.dir === -1;
    this.sk.solve(this.scale);
    if (flip) this._mirror();

    /* 지면 고정 */
    const clip = this.action && clipW > 0.5 ? this.action.clip : null;
    const doLock = this.state === 'ground' && (!clip || clip.lock !== false);
    if (doLock) {
      const contacts = clip ? clip.contacts : ['footL', 'footR'];
      let shift = Infinity;
      for (const c of contacts) {
        const p = this.sk.pts[c]; if (!p) continue;
        const surf = this.world.surfaceAt(p.x, p.y);
        shift = Math.min(shift, surf - p.y);
      }
      if (isFinite(shift)) {
        // 급격한 튐 방지
        shift = clamp(shift, -40 * this.scale, 40 * this.scale);
        this.y += shift;
        this.sk.root.y += shift;
        for (const k of Object.keys(this.sk.pts)) {
          const p = this.sk.pts[k];
          if (p && typeof p.y === 'number') p.y += shift;
        }
      }
      this.lastGroundY = this.y;
    }

    this.dizzyT = Math.max(0, this.dizzyT - dt);
    this._updateSpeech(dt);
    this._updateFx(dt);

    if (settings.trail) {
      this.trail.push({ pts: JSON.parse(JSON.stringify(this.sk.pts)), life: 0 });
      if (this.trail.length > 7) this.trail.shift();
      for (const t of this.trail) t.life += dt;
    } else if (this.trail.length) this.trail.length = 0;
  }

  _mirror() {
    const cx = this.x;
    for (const k of Object.keys(this.sk.pts)) {
      const p = this.sk.pts[k];
      if (p && typeof p.x === 'number') p.x = cx - (p.x - cx);
    }
  }

  _updateSpeech(dt) {
    if (!this.speech) return;
    this.speech.t += dt;
    if (this.speech.t > this.speech.dur) this.speech = null;
  }

  _updateFx(dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life += dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
      f.vy += (f.type === 'dust' ? 60 : 200) * dt;
      f.vx *= 0.97;
      f.rot += dt * 2;
      if (f.life > f.max) this.fx.splice(i, 1);
    }
  }

  /* ────────── 렌더 ────────── */
  get color() {
    if (!settings.rainbow) return settings.color;
    return `hsl(${(this.world.hueShift | 0) % 360} 85% 55%)`;
  }

  draw(ctx) {
    const P = this.sk.pts;
    if (!P.pelvis) return;
    const col = this.color;
    const lw = 13 * this.scale;

    ctx.save();
    if (Math.abs(this.bodyRot) > 0.5) {
      ctx.translate(P.pelvis.x, P.pelvis.y);
      ctx.rotate(this.bodyRot * D2R * this.dir);
      ctx.translate(-P.pelvis.x, -P.pelvis.y);
    }

    // 잔상
    if (settings.trail) {
      for (let i = 0; i < this.trail.length; i++) {
        const a = (i + 1) / (this.trail.length + 3) * 0.28;
        ctx.globalAlpha = a;
        this._strokeBody(ctx, this.trail[i].pts, col, lw);
      }
      ctx.globalAlpha = 1;
    }

    // 외곽선(참고 이미지의 옅은 테두리)
    ctx.globalAlpha = 0.22;
    this._strokeBody(ctx, P, shade(col, -0.55), lw + 3.5);
    ctx.globalAlpha = 1;

    // 본체
    this._strokeBody(ctx, P, col, lw);

    ctx.restore();

    this._drawFx(ctx, col);
    this._drawSpeech(ctx, col);
  }

  _strokeBody(ctx, P, color, lw) {
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;

    const line = (...pts) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    };

    // 몸통 + 목
    line(P.pelvis, P.chest, P.neckTop);
    // 뒤쪽 팔·다리 먼저
    line(P.chest, P.elbowR, P.wristR, P.handR);
    line(P.pelvis, P.kneeR, P.ankleR, P.footR);
    // 앞쪽 팔·다리
    line(P.chest, P.elbowL, P.wristL, P.handL);
    line(P.pelvis, P.kneeL, P.ankleL, P.footL);
    // 머리(속이 빈 원)
    ctx.beginPath();
    ctx.arc(P.headCenter.x, P.headCenter.y, Math.max(2, P.headRadius), 0, TAU);
    ctx.stroke();
  }

  _drawFx(ctx, col) {
    for (const f of this.fx) {
      const a = 1 - f.life / f.max;
      ctx.globalAlpha = clamp(a, 0, 1);
      if (f.type === 'dust') {
        ctx.fillStyle = 'rgba(150,150,150,0.75)';
        ctx.beginPath(); ctx.arc(f.x, f.y, 4 * a * this.scale + 1, 0, TAU); ctx.fill();
      } else if (f.type === 'star') {
        ctx.fillStyle = '#FFD23F';
        this._star(ctx, f.x, f.y, 7 * this.scale, f.rot);
      } else if (f.type === 'heart') {
        ctx.fillStyle = '#FF4D6D';
        ctx.font = `${16 * this.scale}px system-ui`;
        ctx.fillText('♥', f.x, f.y);
      } else if (f.type === 'note') {
        ctx.fillStyle = col;
        ctx.font = `${18 * this.scale}px system-ui`;
        ctx.fillText(f.text || '♪', f.x, f.y);
      } else if (f.type === 'sweat') {
        ctx.fillStyle = '#7FD1FF';
        ctx.beginPath(); ctx.ellipse(f.x, f.y, 3.5, 5, 0, 0, TAU); ctx.fill();
      } else if (f.type === 'impact') {
        ctx.strokeStyle = col; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = f.rot + i * TAU / 6;
          const r0 = 6 + (1 - a) * 12, r1 = r0 + 9;
          ctx.moveTo(f.x + Math.cos(ang) * r0, f.y + Math.sin(ang) * r0);
          ctx.lineTo(f.x + Math.cos(ang) * r1, f.y + Math.sin(ang) * r1);
        }
        ctx.stroke();
      } else if (f.type === 'zzz') {
        ctx.fillStyle = col;
        ctx.font = `bold ${15 * this.scale}px system-ui`;
        ctx.fillText('z', f.x, f.y);
      }
    }
    ctx.globalAlpha = 1;
  }

  _star(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = rot + i * Math.PI / 5;
      const rr = i % 2 ? r * 0.45 : r;
      const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }

  /** 말풍선 없이, 캐릭터 색으로 머리 위에 작은 텍스트 */
  _drawSpeech(ctx, col) {
    const s = this.speech;
    if (!s) return;
    const P = this.sk.pts;
    const head = P.headCenter || { x: this.x, y: this.y - 100 };
    const fs = settings.textSize * (0.85 + this.scale * 0.25);

    // 나타났다 사라지는 알파 + 살짝 떠오르는 움직임
    const inT = clamp(s.t / 0.16, 0, 1);
    const outT = clamp((s.dur - s.t) / 0.35, 0, 1);
    const alpha = Math.min(inT, outT);
    const rise = (1 - inT) * 8;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `800 ${fs}px "Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const lines = wrapText(s.text, 12);
    const lh = fs * 1.18;
    let y = head.y - (P.headRadius || 26) - 12 + rise;
    y -= (lines.length - 1) * lh;
    const x = clamp(head.x, 70, this.world.width - 70);

    // 배경 대비용 얇은 외곽선 (말풍선 아님)
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, fs * 0.28);
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.fillStyle = col;
    for (let i = 0; i < lines.length; i++) {
      const ly = y + i * lh;
      ctx.strokeText(lines[i], x, ly);
      ctx.fillText(lines[i], x, ly);
    }
    ctx.restore();
  }
}

function wrapText(text, maxLen) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxLen) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines.slice(0, 3) : [text];
}

export { wrapText, pick, chance, randInt };
