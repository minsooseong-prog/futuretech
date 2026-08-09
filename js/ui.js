/* ui.js — 상단바, 창(메인 메뉴·게시판·설정·도감), 우클릭 메뉴, 박스 메뉴, 배경 관리 */

import { el, $, clamp, pick, rand } from './util.js';
import { t, setLang, getLang, LANGS, LANG_NAMES } from './i18n.js';
import {
  settings, setSetting, COLOR_PRESETS, getPosts, addPost, removePost,
  saveBackground, loadBackground, clearBackground, resetEverything,
  statsSnapshot, isFound, foundCount,
} from './store.js';
import { EVENTS, CATEGORIES, CAT_LABEL_KEY, MENU_IDS, BY_ID, TOTAL } from './interactions.js';

export class UI {
  constructor(app) {
    this.app = app;
    this.root = $('#ui');
    this.panels = {};
    this.ctx = null;
    this.boxMenu = null;
    this.bgUrl = null;
    this.build();
    this.applyBackground();
  }

  /* ─────────── 구조 ─────────── */
  build() {
    // 상단바
    this.topbar = el('div', { class: 'topbar', id: 'topbar' },
      el('div', { class: 'brand' },
        el('span', { class: 'dot' }),
        el('span', { id: 'brandText' }, t('title'))),
      el('nav', { class: 'nav', id: 'nav' })
    );
    this.root.append(this.topbar);
    this.renderNav();

    for (const key of ['menu', 'board', 'settings', 'codex']) this.makePanel(key);
    this.layoutPanels();

    window.addEventListener('resize', () => this.layoutPanels());
  }

  renderNav() {
    const nav = $('#nav', this.root);
    nav.innerHTML = '';
    const items = [['menu', '☰'], ['board', '✎'], ['settings', '⚙'], ['codex', '★']];
    for (const [k, icon] of items) {
      nav.append(el('button', { class: 'navbtn', 'data-p': k, onclick: () => this.toggle(k) },
        el('span', { class: 'ic' }, icon), t(k)));
    }
    $('#brandText', this.root).textContent = t('title');
  }

  makePanel(key) {
    const body = el('div', { class: 'pbody' });
    const p = el('section', { class: 'panel', id: 'panel-' + key, 'data-key': key },
      el('header', { class: 'phead' },
        el('h2', {}, t(key)),
        el('button', { class: 'x', title: t('close'), onclick: () => this.close(key) }, '×')),
      body);
    p.style.display = 'none';
    this.root.append(p);
    this.panels[key] = { node: p, body, open: false };
    this.makeDraggable(p, p.querySelector('.phead'));
    return p;
  }

  makeDraggable(node, handle) {
    let sx = 0, sy = 0, ox = 0, oy = 0, on = false;
    handle.style.cursor = 'grab';
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('x')) return;
      on = true; sx = e.clientX; sy = e.clientY;
      const r = node.getBoundingClientRect();
      ox = r.left; oy = r.top;
      node.style.right = 'auto';
      handle.setPointerCapture(e.pointerId);
      handle.style.cursor = 'grabbing';
    });
    handle.addEventListener('pointermove', (e) => {
      if (!on) return;
      node.style.left = clamp(ox + e.clientX - sx, 0, window.innerWidth - node.offsetWidth) + 'px';
      node.style.top = clamp(oy + e.clientY - sy, 44, window.innerHeight - 60) + 'px';
    });
    const end = () => { on = false; handle.style.cursor = 'grab'; };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  layoutPanels() {
    const w = window.innerWidth;
    const narrow = w < 780;
    const put = (k, left, top) => {
      const n = this.panels[k].node;
      n.style.left = left; n.style.top = top; n.style.right = 'auto';
    };
    if (narrow) {
      put('menu', '12px', '150px'); put('codex', '12px', '150px');
      put('board', '12px', '150px'); put('settings', '12px', '150px');
    } else {
      put('menu', '24px', '190px');
      put('codex', '24px', '190px');
      put('board', (w - 400) + 'px', '190px');
      put('settings', (w - 400) + 'px', '190px');
    }
  }

  /* 같은 자리에 겹치는 창끼리는 서로 닫는다 */
  columnMates(key) {
    return ({ menu: ['codex'], codex: ['menu'], board: ['settings'], settings: ['board'] })[key] || [];
  }

  open(key) {
    for (const m of this.columnMates(key)) this.close(m);
    const p = this.panels[key];
    p.open = true;
    p.node.style.display = 'flex';
    p.node.classList.add('in');
    this.render(key);
    document.querySelectorAll('.navbtn').forEach((b) => b.classList.toggle('on', this.panels[b.dataset.p].open));
  }
  close(key) {
    const p = this.panels[key];
    p.open = false;
    p.node.style.display = 'none';
    document.querySelectorAll('.navbtn').forEach((b) => b.classList.toggle('on', this.panels[b.dataset.p].open));
  }
  toggle(key) { this.panels[key].open ? this.close(key) : this.open(key); }
  closeAll() {
    for (const k of Object.keys(this.panels)) this.close(k);
    this.hideContextMenu(); this.hideBoxMenu();
  }

  refreshAll() {
    this.renderNav();
    for (const k of Object.keys(this.panels)) {
      this.panels[k].node.querySelector('.phead h2').textContent = t(k);
      if (this.panels[k].open) this.render(k);
    }
  }

  render(key) {
    const b = this.panels[key].body;
    b.innerHTML = '';
    if (key === 'menu') this.renderMenu(b);
    if (key === 'board') this.renderBoard(b);
    if (key === 'settings') this.renderSettings(b);
    if (key === 'codex') this.renderCodex(b);
  }

  /* ─────────── 메인 메뉴 ─────────── */
  renderMenu(b) {
    const s = statsSnapshot();
    const mm = Math.floor(s.seconds / 60);
    b.append(
      el('p', { class: 'lead' }, t('welcome')),
      el('h3', {}, t('howto')),
      el('ul', { class: 'howto' },
        ...['howto1', 'howto2', 'howto3', 'howto4', 'howto5'].map((k) => el('li', {}, t(k)))),
      el('h3', {}, t('stats')),
      el('div', { class: 'stats' },
        stat(t('statInteract'), `${foundCount()} / ${TOTAL}`),
        stat(t('statSteps'), String(s.steps || 0)),
        stat(t('statThrows'), String(s.throws || 0)),
        stat(t('statTime'), `${mm}m`)),
      el('div', { class: 'row wrap gap' },
        el('button', { class: 'btn', onclick: () => this.app.fire(pick(MENU_IDS)) }, '🎲'),
        el('button', { class: 'btn', onclick: () => this.app.fire('m.dance1') }, t('catMenu')),
        el('button', { class: 'btn', onclick: () => this.open('codex') }, t('codex')))
    );
    function stat(k, v) { return el('div', { class: 'stat' }, el('b', {}, v), el('span', {}, k)); }
  }

  /* ─────────── 게시판 ─────────── */
  renderBoard(b) {
    const name = el('input', { class: 'inp', placeholder: t('boardName'), maxlength: '20' });
    const text = el('textarea', { class: 'inp ta', placeholder: t('boardText'), maxlength: '300', rows: '3' });
    const list = el('div', { class: 'posts' });

    const draw = () => {
      list.innerHTML = '';
      const posts = getPosts();
      if (!posts.length) { list.append(el('p', { class: 'muted' }, t('boardEmpty'))); return; }
      for (const p of posts) {
        list.append(el('article', { class: 'post' },
          el('div', { class: 'prow' },
            el('b', {}, p.name || t('anon')),
            el('time', {}, new Date(p.at).toLocaleString()),
            el('button', { class: 'del', title: t('delete'), onclick: () => { removePost(p.id); draw(); } }, '×')),
          el('p', {}, p.text)));
      }
    };

    b.append(
      el('div', { class: 'form' },
        name, text,
        el('div', { class: 'row gap' },
          el('button', {
            class: 'btn primary', onclick: () => {
              const v = text.value.trim();
              if (!v) return;
              addPost(name.value.trim() || t('anon'), v);
              text.value = '';
              draw();
              this.app.fire('s.post');
            }
          }, t('boardPost')))),
      el('p', { class: 'muted small' }, t('boardSaved')),
      list);
    draw();
  }

  /* ─────────── 설정 ─────────── */
  renderSettings(b) {
    const app = this.app;

    /* 언어 */
    const langRow = el('div', { class: 'row wrap gap' },
      ...LANGS.map((L) => el('button', {
        class: 'chip' + (getLang() === L ? ' on' : ''),
        onclick: () => {
          setLang(L); setSetting('lang', L);
          this.refreshAll(); app.fire('s.lang');
        }
      }, LANG_NAMES[L])));

    /* 색상 */
    const swatches = el('div', { class: 'swatches' },
      ...COLOR_PRESETS.map((c) => el('button', {
        class: 'sw' + (settings.color === c ? ' on' : ''),
        style: { background: c }, title: c,
        onclick: () => { this.setColor(c); this.render('settings'); }
      })));
    const picker = el('input', {
      type: 'color', value: settings.color, class: 'colorpick',
      oninput: (e) => this.setColor(e.target.value, false),
      onchange: (e) => this.setColor(e.target.value),
    });

    /* 배경 */
    const file = el('input', {
      type: 'file', accept: 'image/*', style: { display: 'none' },
      onchange: async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        await saveBackground(f);
        await this.applyBackground();
        app.fire('s.bg');
      }
    });

    b.append(
      section(t('setLang'), langRow),
      section(t('setColor'),
        swatches,
        el('div', { class: 'row gap mt' },
          el('label', { class: 'lbl' }, t('setColorPick')), picker,
          el('button', { class: 'btn', onclick: () => this.randomColor() }, '🎲')),
        toggle(t('setRainbow'), settings.rainbow, (v) => { setSetting('rainbow', v); if (v) app.fire('s.rainbow'); })),
      section(t('setBg'),
        el('div', { class: 'row wrap gap' },
          el('button', { class: 'btn primary', onclick: () => file.click() }, t('setBgUpload')),
          el('button', {
            class: 'btn', onclick: async () => { await clearBackground(); await this.applyBackground(); }
          }, t('setBgClear')),
          file),
        el('div', { class: 'row wrap gap mt' },
          ...[['cover', 'setBgCover'], ['contain', 'setBgContain'], ['tile', 'setBgTile']].map(([v, k]) =>
            el('button', {
              class: 'chip' + (settings.bgFit === v ? ' on' : ''),
              onclick: () => { setSetting('bgFit', v); this.applyBackground(); this.render('settings'); }
            }, t(k)))),
        slider(t('setBgDim'), settings.bgDim, 0, 0.8, 0.05, (v) => { setSetting('bgDim', v); this.applyBackground(); })),
      section(t('catAuto'),
        toggle(t('setAuto'), settings.autonomy, (v) => setSetting('autonomy', v)),
        toggle(t('setPhysics'), settings.physics, (v) => setSetting('physics', v)),
        toggle(t('setTalk'), settings.talk, (v) => setSetting('talk', v)),
        toggle(t('setTrail'), settings.trail, (v) => setSetting('trail', v))),
      section(t('settings'),
        slider(t('setSize'), settings.size, 0.5, 2.2, 0.05, (v) => { setSetting('size', v); app.fire('s.size'); }),
        slider(t('setSpeed'), settings.speed, 0.4, 2, 0.05, (v) => setSetting('speed', v)),
        slider(t('setTextSize'), settings.textSize, 10, 30, 1, (v) => setSetting('textSize', v)),
        slider(t('setGround'), settings.groundPct, 0.5, 0.98, 0.01, (v) => { setSetting('groundPct', v); app.world.resize(); })),
      el('div', { class: 'row mt' },
        el('button', {
          class: 'btn danger', onclick: async () => {
            if (!confirm(t('setResetAsk'))) return;
            app.fire('s.reset');
            await resetEverything();
            setTimeout(() => location.reload(), 900);
          }
        }, t('setResetAll')))
    );

    function section(title, ...kids) {
      return el('div', { class: 'sect' }, el('h3', {}, title), ...kids);
    }
    function toggle(label, val, fn) {
      const inp = el('input', { type: 'checkbox', onchange: (e) => fn(e.target.checked) });
      inp.checked = !!val;
      return el('label', { class: 'sw-row' }, inp, el('span', {}, label));
    }
    function slider(label, val, min, max, step, fn) {
      const out = el('b', {}, String(Math.round(val * 100) / 100));
      const inp = el('input', {
        type: 'range', min, max, step, value: val,
        oninput: (e) => { const v = parseFloat(e.target.value); out.textContent = String(Math.round(v * 100) / 100); fn(v); }
      });
      return el('div', { class: 'slider' }, el('label', {}, label, out), inp);
    }
  }

  setColor(c, fire = true) {
    setSetting('color', c);
    setSetting('rainbow', false);
    document.documentElement.style.setProperty('--accent', c);
    if (fire) this.app.fire('s.color');
  }
  randomColor() {
    const c = pick(COLOR_PRESETS.filter((x) => x !== settings.color));
    this.setColor(c);
    if (this.panels.settings.open) this.render('settings');
  }

  /* ─────────── 도감 ─────────── */
  renderCodex(b) {
    const wrap = el('div', { class: 'codex' });
    const head = el('div', {},
      el('p', { class: 'lead' }, `${foundCount()} / ${TOTAL}`),
      el('p', { class: 'muted small' }, t('codexHint')));
    const bar = el('div', { class: 'progress' }, el('i', { style: { width: (foundCount() / TOTAL * 100) + '%' } }));
    const lang = getLang();
    for (const cat of CATEGORIES) {
      const list = EVENTS.filter((e) => e.cat === cat);
      wrap.append(el('h3', {}, `${t(CAT_LABEL_KEY[cat])} (${list.filter((e) => isFound(e.id)).length}/${list.length})`));
      wrap.append(el('div', { class: 'cgrid' },
        ...list.map((e) => el('div', {
          class: 'citem' + (isFound(e.id) ? ' found' : ''),
          title: e.id,
          onclick: () => { if (e.cat === 'menu' || e.cat === 'auto') this.app.fire(e.id); },
        }, isFound(e.id) ? (lang === 'ko' ? e.name.ko : e.name.en) : '???'))));
    }
    b.append(head, bar, wrap);
  }

  /* ─────────── 우클릭 메뉴 ─────────── */
  showContextMenu(x, y, part) {
    this.hideContextMenu();
    const lang = getLang();
    const label = (id) => { const e = BY_ID.get(id); return e ? (lang === 'ko' ? e.name.ko : e.name.en) : id; };

    const quick = ['m.come', 'm.look', 'g.chase', 'm.stop', 'm.jump'];
    const partItems = part ? [`touch.${part}`].filter((id) => BY_ID.has(id)) : [];

    const search = el('input', { class: 'inp cm-search', placeholder: '🔎' });
    const list = el('div', { class: 'cm-list' });

    const fill = (q = '') => {
      list.innerHTML = '';
      const add = (id) => {
        const n = label(id);
        if (q && !n.toLowerCase().includes(q)) return;
        list.append(el('button', {
          class: 'cm-item', onclick: () => { this.app.fire(id); this.hideContextMenu(); }
        }, n));
      };
      if (!q) {
        list.append(el('div', { class: 'cm-sec' }, t('ctxTitle')));
        quick.forEach(add);
        partItems.forEach(add);
        list.append(el('div', { class: 'cm-sec' }, t('catMenu')));
      }
      MENU_IDS.filter((id) => !quick.includes(id)).forEach(add);
    };
    fill();
    search.addEventListener('input', () => fill(search.value.trim().toLowerCase()));

    const menu = el('div', { class: 'ctxmenu' }, search, list);
    document.body.append(menu);
    const w = menu.offsetWidth, h = menu.offsetHeight;
    menu.style.left = clamp(x, 6, window.innerWidth - w - 6) + 'px';
    menu.style.top = clamp(y, 6, window.innerHeight - h - 6) + 'px';
    this.ctx = menu;
    setTimeout(() => search.focus(), 30);
    this._ctxOff = (e) => { if (!menu.contains(e.target)) this.hideContextMenu(); };
    setTimeout(() => document.addEventListener('pointerdown', this._ctxOff), 0);
  }
  hideContextMenu() {
    if (this.ctx) { this.ctx.remove(); this.ctx = null; }
    if (this._ctxOff) { document.removeEventListener('pointerdown', this._ctxOff); this._ctxOff = null; }
  }

  /* ─────────── 박스 명령 메뉴 ─────────── */
  showBoxMenu(rect) {
    this.hideBoxMenu();
    const lang = getLang();
    const ids = ['m.dance1', 'm.sit', 'm.jump', 'm.spin', 'm.sleep', 'm.flip'];
    const label = (id) => { const e = BY_ID.get(id); return e ? (lang === 'ko' ? e.name.ko : e.name.en) : id; };
    const m = el('div', { class: 'boxmenu' },
      el('div', { class: 'bm-title' }, t('boxTitle')),
      el('div', { class: 'bm-row' },
        ...ids.map((id) => el('button', {
          class: 'chip', onclick: () => { this.app.fire(id); this.hideBoxMenu(); }
        }, label(id))),
        el('button', { class: 'chip', onclick: () => this.hideBoxMenu() }, t('close'))));
    document.body.append(m);
    m.style.left = clamp(rect.x0, 6, window.innerWidth - m.offsetWidth - 6) + 'px';
    m.style.top = clamp(rect.y1 + 8, 50, window.innerHeight - m.offsetHeight - 6) + 'px';
    this.boxMenu = m;
    this._bmT = setTimeout(() => this.hideBoxMenu(), 7000);
  }
  hideBoxMenu() {
    if (this.boxMenu) { this.boxMenu.remove(); this.boxMenu = null; }
    if (this._bmT) { clearTimeout(this._bmT); this._bmT = null; }
  }

  /* ─────────── 배경 ─────────── */
  async applyBackground() {
    const bg = $('#bg');
    const blob = await loadBackground();
    if (this.bgUrl) { URL.revokeObjectURL(this.bgUrl); this.bgUrl = null; }
    if (blob) {
      this.bgUrl = URL.createObjectURL(blob);
      bg.style.backgroundImage = `url(${this.bgUrl})`;
      bg.style.backgroundSize = settings.bgFit === 'tile' ? 'auto' : settings.bgFit;
      bg.style.backgroundRepeat = settings.bgFit === 'tile' ? 'repeat' : 'no-repeat';
      bg.style.backgroundPosition = 'center';
      bg.classList.add('has');
    } else {
      bg.style.backgroundImage = '';
      bg.classList.remove('has');
    }
    $('#bgdim').style.opacity = String(settings.bgDim);
  }

  /* ─────────── 발판 측정 (열린 창 위를 걸어다닌다) ─────────── */
  measurePlatforms() {
    const out = [];
    const tb = this.topbar.getBoundingClientRect();
    out.push({ x: tb.left, y: tb.bottom, w: tb.width });
    for (const k of Object.keys(this.panels)) {
      const p = this.panels[k];
      if (!p.open) continue;
      const r = p.node.getBoundingClientRect();
      out.push({ x: r.left, y: r.top, w: r.width });
    }
    return out;
  }
}

void rand;
