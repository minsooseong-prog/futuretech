/* interactions.js — 모든 상호작용을 한 곳에 정의한다.
   각 항목: { id, cat, label(다국어 키가 아니라 도감용 표시), run(app) }
   run 안에서는 반드시 "말 + 그 말에 어울리는 몸동작"을 함께 실행한다. */

import { say } from './i18n.js';
import { pick, rand, chance, randInt } from './util.js';

export const EVENTS = [];
export const BY_ID = new Map();

const E = (id, cat, ko, en, run) => {
  const ev = { id, cat, name: { ko, en }, run };
  EVENTS.push(ev); BY_ID.set(id, ev);
  return ev;
};

/** 말 + 동작 */
const R = (app, clip, key, opt) => app.char.react(clip, say(key), opt);

/* ══════════════════ 1. 몸 만지기 (클릭) ══════════════════ */
E('touch.head', 'body', '머리 클릭', 'Click head', (a) => {
  R(a, 'pain', 'click_head'); a.char.spawnFx('star', a.char.sk.pts.headCenter.x, a.char.sk.pts.headCenter.y - 30, 3);
});
E('touch.chest', 'body', '가슴 클릭', 'Click chest', (a) => R(a, 'surprise', 'click_chest'));
E('touch.belly', 'body', '배 클릭', 'Click belly', (a) => R(a, 'tickle_react', 'click_belly', { loops: 2 }));
E('touch.shoulderL', 'body', '왼쪽 어깨', 'Left shoulder', (a) => R(a, 'look_around', 'click_shoulder'));
E('touch.shoulderR', 'body', '오른쪽 어깨', 'Right shoulder', (a) => R(a, 'shrug', 'click_shoulder'));
E('touch.elbowL', 'body', '왼쪽 팔꿈치', 'Left elbow', (a) => R(a, 'flex', 'click_elbow', { loops: 1 }));
E('touch.elbowR', 'body', '오른쪽 팔꿈치', 'Right elbow', (a) => R(a, 'punch', 'click_elbow'));
E('touch.handL', 'body', '왼손 잡기', 'Left hand', (a) => R(a, 'wave', 'click_hand'));
E('touch.handR', 'body', '오른손 잡기', 'Right hand', (a) => R(a, 'peace', 'click_hand'));
E('touch.kneeL', 'body', '왼쪽 무릎', 'Left knee', (a) => R(a, 'kick', 'click_knee'));
E('touch.kneeR', 'body', '오른쪽 무릎', 'Right knee', (a) => R(a, 'stumble', 'click_knee'));
E('touch.footL', 'body', '왼발', 'Left foot', (a) => R(a, 'tickle_react', 'click_foot', { loops: 2 }));
E('touch.footR', 'body', '오른발', 'Right foot', (a) => R(a, 'balance', 'click_foot', { loops: 1 }));
E('touch.face', 'body', '얼굴 정면 클릭', 'Poke face', (a) => R(a, 'block', 'click_face'));
E('touch.pelvis', 'body', '골반 클릭', 'Click hip', (a) => R(a, 'angry', 'click_pelvis', { loops: 1 }));

E('dbl.head', 'body', '머리 더블클릭', 'Double-click head', (a) => R(a, 'knock', 'dbl_head', { loops: 2 }));
E('dbl.chest', 'body', '가슴 더블클릭', 'Double-click chest', (a) => R(a, 'angry', 'dbl_chest', { loops: 2 }));
E('dbl.hand', 'body', '손 더블클릭', 'Double-click hand', (a) => {
  R(a, 'wave_big', 'dbl_hand'); a.char.spawnFx('impact', a.char.sk.pts.handL.x, a.char.sk.pts.handL.y, 1);
});
E('dbl.foot', 'body', '발 더블클릭', 'Double-click foot', (a) => R(a, 'kick_high', 'dbl_foot'));
E('touch.spam', 'body', '연속으로 마구 클릭', 'Spam clicking', (a) => {
  R(a, 'angry', 'poke_many', { loops: 3 });
  a.char.spawnFx('impact', a.char.sk.pts.chest.x, a.char.sk.pts.chest.y, 2);
});

/* ══════════════════ 2. 잡고 끌기 ══════════════════ */
E('drag.head', 'drag', '머리를 잡고 끌기', 'Drag by head', (a) => R(a, null, 'drag_head'));
E('drag.chest', 'drag', '몸통을 잡고 끌기', 'Drag by torso', (a) => R(a, null, 'drag_body'));
E('drag.belly', 'drag', '허리를 잡고 끌기', 'Drag by waist', (a) => R(a, null, 'drag_body'));
E('drag.shoulderL', 'drag', '왼쪽 어깨 끌기', 'Drag left shoulder', (a) => R(a, null, 'drag_arm'));
E('drag.shoulderR', 'drag', '오른쪽 어깨 끌기', 'Drag right shoulder', (a) => R(a, null, 'drag_arm'));
E('drag.elbowL', 'drag', '왼 팔꿈치 끌기', 'Drag left elbow', (a) => R(a, null, 'drag_arm'));
E('drag.elbowR', 'drag', '오른 팔꿈치 끌기', 'Drag right elbow', (a) => R(a, null, 'drag_arm'));
E('drag.handL', 'drag', '왼손 잡고 끌기', 'Drag left hand', (a) => R(a, null, 'drag_hand'));
E('drag.handR', 'drag', '오른손 잡고 끌기', 'Drag right hand', (a) => R(a, null, 'drag_hand'));
E('drag.kneeL', 'drag', '왼 무릎 끌기', 'Drag left knee', (a) => R(a, null, 'drag_leg'));
E('drag.kneeR', 'drag', '오른 무릎 끌기', 'Drag right knee', (a) => R(a, null, 'drag_leg'));
E('drag.footL', 'drag', '왼발 잡고 거꾸로', 'Drag left foot', (a) => R(a, null, 'drag_foot'));
E('drag.footR', 'drag', '오른발 잡고 거꾸로', 'Drag right foot', (a) => R(a, null, 'drag_foot'));
E('drag.shake', 'drag', '잡은 채로 마구 흔들기', 'Shake while holding', (a) => {
  R(a, null, 'dizzy'); a.char.dizzyT = 3;
  a.char.spawnFx('star', a.char.sk.pts.headCenter.x, a.char.sk.pts.headCenter.y - 26, 4);
});
E('drag.high', 'drag', '아주 높이 들어올리기', 'Lift very high', (a) => R(a, null, 'scared'));
E('throw', 'drag', '멀리 던지기', 'Throw far', (a) => R(a, null, 'thrown'));
E('land_soft', 'drag', '살짝 착지', 'Soft landing', (a) => R(a, null, 'drop_soft'));
E('land_hard', 'drag', '세게 떨어지기', 'Hard landing', (a) => {
  R(a, null, 'drop_hard');
  a.char.spawnFx('impact', a.char.x, a.char.y + 50, 2);
});
E('recover', 'drag', '스스로 일어나기', 'Get up by himself', (a) => R(a, null, 'recover'));

/* ══════════════════ 3. 커서 제스처 ══════════════════ */
E('g.tickle', 'gesture', '몸 위에서 커서 비비기', 'Tickle with cursor', (a) => R(a, 'tickle_react', 'tickle', { loops: 2 }));
E('g.poke', 'gesture', '콕 찌르기', 'Poke', (a) => R(a, 'dodge', 'poke'));
E('g.shake', 'gesture', '커서 마구 흔들기', 'Shake the cursor', (a) => R(a, 'dizzy', 'shake_cursor', { loops: 1 }));
E('g.circle_cw', 'gesture', '시계 방향 원 그리기', 'Circle clockwise', (a) => R(a, 'spin', 'circle_cw'));
E('g.circle_ccw', 'gesture', '반시계 방향 원 그리기', 'Circle counter-clockwise', (a) => R(a, 'dizzy', 'circle_ccw', { loops: 1 }));
E('g.fast', 'gesture', '커서를 아주 빠르게', 'Very fast cursor', (a) => R(a, 'surprise', 'fast_cursor'));
E('g.slow', 'gesture', '아주 천천히 다가가기', 'Approach slowly', (a) => R(a, 'tiptoe', 'slow_cursor', { loops: 2 }));
E('g.hover_head', 'gesture', '머리 위에 오래 두기', 'Hover above head', (a) => R(a, 'look_up', 'hover_head'));
E('g.hover_feet', 'gesture', '발밑에 오래 두기', 'Hover at feet', (a) => R(a, 'look_around', 'hover_feet'));
E('g.flick', 'gesture', '스치듯 지나가기', 'Flick past', (a) => R(a, 'dodge', 'flick'));
E('g.zigzag', 'gesture', '지그재그로 움직이기', 'Zigzag', (a) => R(a, 'shake_head', 'zigzag'));
E('g.leave', 'gesture', '창 밖으로 커서 빼기', 'Cursor leaves window', (a) => R(a, 'look_around', 'cursor_left'));
E('g.return', 'gesture', '커서가 다시 돌아옴', 'Cursor returns', (a) => R(a, 'wave', 'cursor_back'));
E('g.idle', 'gesture', '커서를 오래 가만히', 'Cursor idle', (a) => R(a, 'knock', 'cursor_idle'));
E('g.chase', 'gesture', '커서를 따라다니게 하기', 'Make him chase', (a) => {
  a.char.follow = !a.char.follow;
  R(a, a.char.follow ? 'cheer' : 'shrug', a.char.follow ? 'follow_on' : 'follow_off');
});

/* ══════════════════ 4. 선택 박스 ══════════════════ */
E('box.catch', 'box', '박스로 졸라맨 가두기', 'Box him in', (a) => R(a, 'wall', 'box_catch', { loops: 2 }));
E('box.small', 'box', '아주 작은 박스', 'Tiny box', (a) => R(a, 'scared', 'box_small', { loops: 2 }));
E('box.big', 'box', '아주 큰 박스', 'Huge box', (a) => R(a, 'reach_up', 'box_big'));
E('box.empty', 'box', '빈 곳에 박스', 'Empty box', (a) => R(a, 'look_around', 'box_empty'));
E('box.shake', 'box', '박스를 그리며 흔들기', 'Wobbly box', (a) => R(a, 'dizzy', 'box_shake', { loops: 1 }));
E('box.walkin', 'box', '박스 안으로 걸어 들어가기', 'Walk into the box', (a) => R(a, 'tiptoe', 'box_catch', { loops: 2 }));

/* ══════════════════ 5. 우클릭 명령 ══════════════════ */
const M = (id, ko, en, clip, sayKey, opt) =>
  E('m.' + id, 'menu', ko, en, (a) => R(a, clip, sayKey, opt));

M('wave', '인사하기', 'Wave', 'wave', 'menu_wave');
M('wave_big', '두 손 흔들기', 'Big wave', 'wave_big', 'menu_wave');
M('bow', '인사(절)', 'Bow', 'bow', 'menu_bow');
M('clap', '박수', 'Clap', 'clap', 'menu_clap', { loops: 4 });
M('cheer', '만세', 'Cheer', 'cheer', 'menu_cheer');
M('laugh', '웃기', 'Laugh', 'laugh', 'menu_laugh', { loops: 3 });
M('cry', '울기', 'Cry', 'cry', 'menu_cry', { loops: 2 });
M('angry', '화내기', 'Get angry', 'angry', 'menu_angry', { loops: 3 });
M('surprise', '놀라기', 'Be surprised', 'surprise', 'menu_surprise');
M('scared', '무서워하기', 'Be scared', 'scared', 'menu_scared', { loops: 3 });
M('shy', '부끄러워하기', 'Be shy', 'shy', 'menu_surprise', { loops: 2 });
M('shrug', '어깨 으쓱', 'Shrug', 'shrug', 'menu_shrug');
M('think', '생각하기', 'Think', 'think', 'menu_think', { loops: 2 });
M('ponder', '고민하기', 'Ponder', 'ponder', 'auto_ponder', { loops: 2 });
M('facepalm', '이마 짚기', 'Facepalm', 'facepalm', 'menu_shrug');
M('salute', '경례', 'Salute', 'salute', 'menu_bow');
M('flex', '근육 자랑', 'Flex', 'flex', 'menu_pushup', { loops: 2 });
M('heart', '하트 만들기', 'Make a heart', 'heart', 'menu_wave');
M('peace', '브이 포즈', 'Peace sign', 'peace', 'menu_selfie');
M('stretch', '기지개', 'Stretch', 'stretch', 'menu_stretch');
M('stretch_side', '옆구리 늘리기', 'Side stretch', 'stretch_side', 'menu_stretch');
M('yawn', '하품', 'Yawn', 'yawn', 'menu_yawn');
M('sneeze', '재채기', 'Sneeze', 'sneeze', 'menu_sneeze');
M('shiver', '떨기', 'Shiver', 'shiver', 'menu_shiver', { loops: 4 });
M('itch', '긁기', 'Scratch', 'itch', 'menu_shrug', { loops: 2 });
M('sit', '앉기', 'Sit down', 'sit', 'menu_sit', { loops: 3 });
M('sit_cross', '양반다리', 'Sit cross-legged', 'sit_cross', 'menu_sit', { loops: 3 });
M('lie', '눕기', 'Lie down', 'lie', 'menu_lie', { loops: 3 });
M('sleep', '자기', 'Sleep', 'sleep', 'menu_sleep', { loops: 5 });
M('kneel', '무릎 꿇기', 'Kneel', 'kneel', 'menu_bow', { loops: 2 });
M('meditate', '명상', 'Meditate', 'meditate', 'menu_meditate', { loops: 3 });
M('pray', '기도', 'Pray', 'pray', 'menu_meditate', { loops: 2 });
M('pushup', '팔굽혀펴기', 'Push-ups', 'pushup', 'menu_pushup', { loops: 5 });
M('situp', '윗몸일으키기', 'Sit-ups', 'situp', 'menu_situp', { loops: 4 });
M('squat', '스쿼트', 'Squats', 'squat', 'menu_pushup', { loops: 5 });
M('jumpingjack', '점핑잭', 'Jumping jacks', 'jumpingjack', 'menu_pushup', { loops: 6 });
M('headbang', '헤드뱅잉', 'Headbang', 'headbang', 'menu_dance', { loops: 8 });
M('dance1', '춤 1', 'Dance 1', 'dance1', 'menu_dance', { loops: 5 });
M('dance2', '춤 2', 'Dance 2', 'dance2', 'menu_dance', { loops: 5 });
M('robot', '로봇춤', 'Robot dance', 'robot', 'menu_dance', { loops: 3 });
M('floss', '플로스', 'Floss', 'floss', 'menu_dance', { loops: 8 });
M('breakdance', '브레이크댄스', 'Breakdance', 'breakdance', 'menu_dance', { loops: 4 });
M('moonwalk', '문워크', 'Moonwalk', 'moonwalk', 'menu_moon', { loops: 4 });
M('spin', '제자리 돌기', 'Spin', 'spin', 'menu_spin');
M('flip', '백덤블링', 'Backflip', 'flip', 'menu_flip');
M('cartwheel', '옆돌기', 'Cartwheel', 'cartwheel', 'menu_flip');
M('roll', '구르기', 'Roll', 'roll', 'menu_flip');
M('handstand', '물구나무', 'Handstand', 'handstand', 'menu_handstand', { loops: 3 });
M('balance', '외발 서기', 'Balance', 'balance', 'menu_handstand', { loops: 2 });
M('tiptoe', '까치발로 걷기', 'Tiptoe', 'tiptoe', 'menu_walk', { loops: 4 });
M('kick', '발차기', 'Kick', 'kick', 'menu_kick');
M('kick_high', '높이 차기', 'High kick', 'kick_high', 'menu_kick');
M('punch', '주먹', 'Punch', 'punch', 'menu_kick');
M('punch_combo', '연속 주먹', 'Punch combo', 'punch_combo', 'menu_kick');
M('block', '막기', 'Block', 'block', 'menu_scared');
M('dodge', '피하기', 'Dodge', 'dodge', 'menu_scared');
M('wall', '보이지 않는 벽', 'Invisible wall', 'wall', 'menu_wall', { loops: 3 });
M('rope', '밧줄 당기기', 'Pull the rope', 'rope', 'menu_pushup', { loops: 3 });
M('whistle', '휘파람', 'Whistle', 'whistle', 'auto_sing', { loops: 2 });
M('selfie', '셀카 찍기', 'Take a selfie', 'selfie', 'menu_selfie');
M('knock', '문 두드리기', 'Knock', 'knock', 'menu_think', { loops: 2 });
M('count', '손가락 세기', 'Count fingers', 'count', 'auto_count');
M('point_far', '멀리 가리키기', 'Point far', 'point_far', 'menu_point');
M('look_around', '두리번거리기', 'Look around', 'look_around', 'auto_look');
M('look_up', '위 올려다보기', 'Look up', 'look_up', 'sys_night');
M('nod', '끄덕이기', 'Nod', 'nod', 'menu_wave');
M('shake_head', '고개 젓기', 'Shake head', 'shake_head', 'menu_shrug');
M('drink', '물 마시기', 'Drink', 'drink', 'auto_happy');
M('swim', '헤엄치기', 'Swim', 'swim', 'menu_flip', { loops: 4 });
M('crawl', '기어가기', 'Crawl', 'crawl', 'menu_walk', { loops: 4 });
M('celebrate', '축하하기', 'Celebrate', 'celebrate', 'menu_cheer');
M('tpose', 'T 포즈', 'T-pose', 'tpose', 'menu_shrug', { loops: 2 });
M('faint', '기절하기', 'Faint', 'faint', 'menu_cry');
M('selfcheck', '몸 상태 확인', 'Check himself', 'selfcheck', 'auto_selfcheck');

E('m.jump', 'menu', '점프', 'Jump', (a) => { a.char.jump(950); a.char.say(say('menu_jump')); });
E('m.superjump', 'menu', '아주 높이 점프', 'Super jump', (a) => { a.char.jump(1700); a.char.say(say('menu_jump')); });
E('m.walk', 'menu', '걷기', 'Walk', (a) => {
  a.char.walkTo(rand(60, a.world.width - 60), false); a.char.say(say('menu_walk'));
});
E('m.run', 'menu', '달리기', 'Run', (a) => {
  a.char.walkTo(rand(60, a.world.width - 60), true); a.char.say(say('menu_run'));
});
E('m.come', 'menu', '여기로 와', 'Come here', (a) => {
  a.char.walkTo(a.input.mx, Math.abs(a.input.mx - a.char.x) > 300);
  a.char.say(say('come'));
});
E('m.look', 'menu', '날 봐', 'Look at me', (a) => {
  a.char.faceTo(a.input.mx); a.char.lookAt(a.input.mx, a.input.my, 1);
  R(a, 'nod', 'auto_greet_cursor');
});
E('m.stop', 'menu', '멈춰', 'Stop', (a) => {
  a.char.stopWalk(); a.char.stopAction(); a.char.follow = false;
  R(a, 'shrug', 'follow_off');
});

/* ══════════════════ 6. 키보드 ══════════════════ */
E('k.left', 'key', '← 왼쪽으로', 'Arrow left', (a) => { a.char.walkTo(a.char.x - 160); a.char.say(say('key_left')); });
E('k.right', 'key', '→ 오른쪽으로', 'Arrow right', (a) => { a.char.walkTo(a.char.x + 160); a.char.say(say('key_right')); });
E('k.run', 'key', 'Shift + 방향키로 달리기', 'Shift to run', (a) => { a.char.runFlag = true; a.char.say(say('key_run')); });
E('k.space', 'key', 'Space 점프', 'Space to jump', (a) => { a.char.jump(950); a.char.say(say('key_jump')); });
E('k.d', 'key', 'D 춤추기', 'D to dance', (a) => R(a, pick(['dance1', 'dance2', 'robot', 'floss']), 'menu_dance', { loops: 5 }));
E('k.s', 'key', 'S 앉기', 'S to sit', (a) => R(a, 'sit', 'menu_sit', { loops: 4 }));
E('k.z', 'key', 'Z 자기', 'Z to sleep', (a) => R(a, 'sleep', 'menu_sleep', { loops: 6 }));
E('k.w', 'key', 'W 손 흔들기', 'W to wave', (a) => R(a, 'wave', 'menu_wave'));
E('k.f', 'key', 'F 백덤블링', 'F to flip', (a) => R(a, 'flip', 'menu_flip'));
E('k.x', 'key', 'X 발차기', 'X to kick', (a) => R(a, 'kick', 'menu_kick'));
E('k.c', 'key', 'C 색 바꾸기', 'C to change color', (a) => a.ui.randomColor());
E('k.h', 'key', 'H 도움말 열기', 'H for help', (a) => { a.ui.toggle('menu'); a.char.say(say('key_hi')); });
E('k.q', 'key', 'Q 무작위 동작', 'Q random action', (a) => a.fire(pick(EVENTS.filter((e) => e.cat === 'menu')).id));

/* ══════════════════ 7. 환경 변화 ══════════════════ */
E('s.resize', 'system', '창 크기 바꾸기', 'Resize the window', (a) => R(a, 'surprise', 'sys_resize'));
E('s.hidden', 'system', '다른 탭으로 이동', 'Switch tab away', (a) => a.char.say(say('sys_hidden')));
E('s.visible', 'system', '탭으로 돌아오기', 'Come back to tab', (a) => R(a, 'wave_big', 'sys_visible'));
E('s.night', 'system', '밤에 접속하기', 'Visit at night', (a) => R(a, 'look_up', 'sys_night'));
E('s.bg', 'system', '배경 이미지 바꾸기', 'Change background', (a) => R(a, 'look_around', 'sys_bg'));
E('s.color', 'system', '캐릭터 색 바꾸기', 'Change his color', (a) => {
  R(a, 'spin', 'sys_color');
  a.char.spawnFx('note', a.char.sk.pts.headCenter.x, a.char.sk.pts.headCenter.y, 3, '✦');
});
E('s.rainbow', 'system', '무지개 모드 켜기', 'Rainbow mode', (a) => R(a, 'celebrate', 'sys_color'));
E('s.lang', 'system', '언어 바꾸기', 'Change language', (a) => R(a, 'nod', 'sys_lang'));
E('s.first', 'system', '처음 방문', 'First visit', (a) => R(a, 'wave', 'sys_first'));
E('s.return', 'system', '다시 방문', 'Return visit', (a) => R(a, 'wave_big', 'sys_return'));
E('s.idle_long', 'system', '오래 아무것도 안 하기', 'Long idle', (a) => R(a, 'yawn', 'sys_idle_long'));
E('s.post', 'system', '게시판에 글 쓰기', 'Write on the board', (a) => R(a, 'clap', 'sys_post', { loops: 3 }));
E('s.scroll', 'system', '휠 굴리기', 'Scroll the wheel', (a) => R(a, 'dizzy', 'sys_scroll', { loops: 1 }));
E('s.reset', 'system', '전체 초기화', 'Reset everything', (a) => R(a, 'faint', 'sys_reset'));
E('s.size', 'system', '크기 바꾸기', 'Change his size', (a) => R(a, 'selfcheck', 'auto_selfcheck'));

/* ══════════════════ 8. 혼자 하는 행동 ══════════════════ */
const A = (id, ko, en, fn) => E('a.' + id, 'auto', ko, en, fn);

A('wander', '혼자 돌아다니기', 'Wanders around', (a) => {
  a.char.walkTo(rand(60, a.world.width - 60), chance(0.2));
  if (chance(0.5)) a.char.say(say('auto_wander'));
});
A('explore', '먼 곳까지 탐험', 'Explores far away', (a) => {
  a.char.walkTo(a.char.x < a.world.width / 2 ? a.world.width - 70 : 70, true);
  a.char.say(say('auto_explore'));
});
A('sit', '앉아서 쉬기', 'Sits to rest', (a) => R(a, chance(0.5) ? 'sit' : 'sit_cross', 'auto_sit', { loops: 4 }));
A('sleep', '낮잠 자기', 'Takes a nap', (a) => {
  R(a, 'sleep', 'auto_sleep', { loops: 8 });
  a.char.zzzTimer = 0;
});
A('wake', '잠에서 깨기', 'Wakes up', (a) => R(a, 'wake', 'auto_wake'));
A('look', '두리번거리기', 'Looks around', (a) => R(a, 'look_around', 'auto_look'));
A('stretch', '기지개 켜기', 'Stretches', (a) => R(a, 'stretch', 'auto_stretch'));
A('yawn', '하품하기', 'Yawns', (a) => R(a, 'yawn', 'auto_yawn'));
A('dance', '혼자 춤추기', 'Dances alone', (a) => {
  R(a, pick(['dance1', 'dance2', 'floss', 'robot']), 'auto_dance', { loops: 5 });
  a.char.spawnFx('note', a.char.sk.pts.headCenter.x + 30, a.char.sk.pts.headCenter.y, 2, '♪');
});
A('sing', '노래 흥얼거리기', 'Hums a song', (a) => {
  R(a, 'whistle', 'auto_sing', { loops: 2 });
  a.char.spawnFx('note', a.char.sk.pts.headCenter.x + 26, a.char.sk.pts.headCenter.y - 10, 3, '♪');
});
A('ponder', '멍하니 생각하기', 'Ponders life', (a) => R(a, 'ponder', 'auto_ponder', { loops: 2 }));
A('count', '걸음 수 세기', 'Counts his steps', (a) => R(a, 'count', 'auto_count'));
A('bored', '심심해하기', 'Gets bored', (a) => R(a, 'shrug', 'auto_bored'));
A('happy', '기분 좋아하기', 'Feels good', (a) => R(a, 'cheer', 'auto_happy'));
A('exercise', '혼자 운동하기', 'Works out', (a) => R(a, pick(['pushup', 'squat', 'jumpingjack', 'situp']), 'menu_pushup', { loops: 5 }));
A('jumpfun', '이유 없이 점프', 'Jumps for fun', (a) => { a.char.jump(880); a.char.say(say('auto_jumpfun')); });
A('pebble', '돌멩이 차기', 'Kicks a pebble', (a) => {
  R(a, 'kick', 'auto_pebble');
  setTimeout(() => a.char.spawnFx('dust', a.char.x + a.char.dir * 40, a.char.y + 55, 3), 350);
});
A('climb', '창 위로 올라가기', 'Climbs onto a window', (a) => {
  const p = a.world.randomPlatform();
  if (!p) { a.char.jump(1000); return; }
  a.char.walkTo(p.x + p.w / 2);
  a.char.say(say('auto_climb'));
  a.char.climbTarget = p;
});
A('sit_dangle', '가장자리에 걸터앉기', 'Sits on an edge', (a) => R(a, 'sit_dangle', 'auto_sit', { loops: 4 }));
A('greet_cursor', '커서에게 인사하기', 'Greets the cursor', (a) => {
  a.char.faceTo(a.input.mx); R(a, 'wave', 'auto_greet_cursor');
});
A('selfcheck', '몸 확인하기', 'Checks his body', (a) => R(a, 'selfcheck', 'auto_selfcheck'));
A('balance', '외발로 서 보기', 'Tries to balance', (a) => R(a, 'balance', 'auto_happy', { loops: 2 }));
A('meditate', '명상하기', 'Meditates', (a) => R(a, 'meditate', 'menu_meditate', { loops: 3 }));
A('shiver', '추워하기', 'Feels cold', (a) => R(a, 'shiver', 'menu_shiver', { loops: 4 }));

/* 자율 행동 후보 */
export const AUTO_IDS = EVENTS.filter((e) => e.cat === 'auto').map((e) => e.id);
export const MENU_IDS = EVENTS.filter((e) => e.cat === 'menu').map((e) => e.id);
export const TOTAL = EVENTS.length;

export const CATEGORIES = ['body', 'drag', 'gesture', 'box', 'menu', 'key', 'system', 'auto'];
export const CAT_LABEL_KEY = {
  body: 'catBody', drag: 'catDrag', gesture: 'catGesture', box: 'catBox',
  menu: 'catMenu', key: 'catKey', system: 'catSystem', auto: 'catAuto',
};

void randInt;
