/* skeleton.js — 사람 관절 계층을 그대로 옮긴 2D 뼈대.
   각도 규칙: 0° = 오른쪽(+x), 양수 = 화면상 시계 방향(캔버스 y가 아래로 향하므로).
   각 뼈는 world = parentWorld + base + angle 로 계산된다.
   base 는 "차렷 자세" 오프셋이고, 애니메이션은 angle(=0에서 시작)만 건드린다.
   무릎 굽힘 = +각도, 팔꿈치 굽힘 = -각도.                                     */

import { D2R } from './util.js';

/** 기준 신장 약 176px (size=1). 실제 렌더는 size 배율로 확대/축소 */
export const BONES = [
  // name        parent      len   base(도)
  ['spine',     null,        52,   -90],
  ['neck',      'spine',      8,     0],
  ['head',      'neck',      26,     0],   // len = 머리 반지름

  ['armR_u',    'spine',     27,   190],   // 뒤쪽 팔 (몸통 반대편)
  ['armR_f',    'armR_u',    25,     0],
  ['handR',     'armR_f',     9,     0],

  ['armL_u',    'spine',     27,   170],   // 앞쪽 팔
  ['armL_f',    'armL_u',    25,     0],
  ['handL',     'armL_f',     9,     0],

  ['legR_u',    null,        35,    83],   // 뒤쪽 다리
  ['legR_l',    'legR_u',    33,     0],
  ['footR',     'legR_l',    14,   -83],

  ['legL_u',    null,        35,    97],   // 앞쪽 다리
  ['legL_l',    'legL_u',    33,     0],
  ['footL',     'legL_l',    14,   -97],
];

export const BONE_NAMES = BONES.map((b) => b[0]);

/** 관절 이름 → 사람이 읽는 부위 이름(도감/디버그용) */
export const PART_OF = {
  head: 'head', neck: 'head', spine: 'chest',
  armR_u: 'shoulderR', armR_f: 'elbowR', handR: 'handR',
  armL_u: 'shoulderL', armL_f: 'elbowL', handL: 'handL',
  legR_u: 'hipR', legR_l: 'kneeR', footR: 'footR',
  legL_u: 'hipL', legL_l: 'kneeL', footL: 'footL',
};

export class Skeleton {
  constructor() {
    this.bones = new Map();
    for (const [name, parent, len, base] of BONES) {
      this.bones.set(name, { name, parent, len, base, angle: 0, world: 0, x0: 0, y0: 0, x1: 0, y1: 0 });
    }
    this.order = BONES.map((b) => b[0]); // 부모가 항상 먼저 나오도록 정의됨
    this.root = { x: 0, y: 0, lean: 0 };
    /** 계산된 관절 좌표 */
    this.pts = {};
  }

  get(name) { return this.bones.get(name); }

  /** 모든 관절 각도를 0으로 (차렷) */
  restAll() { for (const b of this.bones.values()) b.angle = 0; }

  /**
   * FK 계산. scale = 크기 배율.
   * pts 에 다음 좌표가 채워진다:
   * pelvis, chest, neckTop, headCenter, shoulderL/R, elbowL/R, wristL/R, handL/R,
   * kneeL/R, ankleL/R, footL/R
   */
  solve(scale = 1) {
    const rootWorld = this.root.lean; // 0 = 똑바로
    for (const name of this.order) {
      const b = this.bones.get(name);
      const p = b.parent ? this.bones.get(b.parent) : null;
      const pw = p ? p.world : rootWorld;
      b.world = pw + b.base + b.angle;
      const ox = p ? p.x1 : this.root.x;
      const oy = p ? p.y1 : this.root.y;
      const r = b.world * D2R;
      const L = b.len * scale;
      b.x0 = ox; b.y0 = oy;
      b.x1 = ox + Math.cos(r) * L;
      b.y1 = oy + Math.sin(r) * L;
    }

    const B = (n) => this.bones.get(n);
    const P = this.pts;
    P.pelvis = { x: this.root.x, y: this.root.y };
    P.chest = { x: B('spine').x1, y: B('spine').y1 };
    P.neckTop = { x: B('neck').x1, y: B('neck').y1 };
    P.headCenter = { x: B('head').x1, y: B('head').y1 };

    P.shoulderR = { x: B('armR_u').x0, y: B('armR_u').y0 };
    P.elbowR = { x: B('armR_u').x1, y: B('armR_u').y1 };
    P.wristR = { x: B('armR_f').x1, y: B('armR_f').y1 };
    P.handR = { x: B('handR').x1, y: B('handR').y1 };

    P.shoulderL = { x: B('armL_u').x0, y: B('armL_u').y0 };
    P.elbowL = { x: B('armL_u').x1, y: B('armL_u').y1 };
    P.wristL = { x: B('armL_f').x1, y: B('armL_f').y1 };
    P.handL = { x: B('handL').x1, y: B('handL').y1 };

    P.kneeR = { x: B('legR_u').x1, y: B('legR_u').y1 };
    P.ankleR = { x: B('legR_l').x1, y: B('legR_l').y1 };
    P.footR = { x: B('footR').x1, y: B('footR').y1 };

    P.kneeL = { x: B('legL_u').x1, y: B('legL_u').y1 };
    P.ankleL = { x: B('legL_l').x1, y: B('legL_l').y1 };
    P.footL = { x: B('footL').x1, y: B('footL').y1 };

    P.headRadius = B('head').len * scale;
    return P;
  }
}

/** 클릭/드래그 판정에 쓰는 부위 목록 — [id, 점 이름, 반지름 배율] */
export const HIT_PARTS = [
  ['head',      'headCenter', 1.15],
  ['chest',     'chest',      0.55],
  ['belly',     'pelvis',     0.5],
  ['shoulderL', 'shoulderL',  0.42],
  ['shoulderR', 'shoulderR',  0.42],
  ['elbowL',    'elbowL',     0.4],
  ['elbowR',    'elbowR',     0.4],
  ['handL',     'handL',      0.46],
  ['handR',     'handR',      0.46],
  ['kneeL',     'kneeL',      0.42],
  ['kneeR',     'kneeR',      0.42],
  ['footL',     'footL',      0.48],
  ['footR',     'footR',      0.48],
];
