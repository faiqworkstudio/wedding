import { Music } from './music.js';

let CONFIG = {};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DAY = 86400000;

/* ── content ───────────────────────────────────────────── */

const lookup = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), CONFIG);

function bindText() {
  for (const el of $$('[data-bind]')) {
    const value = lookup(el.dataset.bind);
    if (typeof value === 'string') el.textContent = value;
  }
}

// Split into words and letters so each one can arrive on its own, slightly crooked.
function split(el) {
  const text = el.textContent;
  el.textContent = '';
  el.setAttribute('aria-label', text);
  let i = 0;
  for (const [n, word] of text.split(' ').entries()) {
    if (n) el.append(' ');
    const w = document.createElement('span');
    w.className = 'w';
    w.setAttribute('aria-hidden', 'true');
    const arabic = /[\u0600-\u06FF]/.test(word);
    for (const char of arabic ? [word] : word) {
      const c = document.createElement('span');
      c.className = 'ch';
      c.textContent = char;
      c.style.setProperty('--i', i++);
      c.style.setProperty('--r', `${(Math.random() - 0.5) * 14}deg`);
      w.append(c);
    }
    el.append(w);
  }
}

function buildChapters() {
  const root = $('#chapters');
  CONFIG.chapters.forEach((ch, idx) => {
    const section = document.createElement('section');
    section.className = 'panel panel--chapter';
    section.dataset.scene = `chapter-${idx}`;
    section.innerHTML = `
      <div class="chapter">
        <span class="chapter__num reveal-block" aria-hidden="true"></span>
        <p class="mono fade"></p>
        <h2 class="chapter__title reveal"></h2>
        <p class="chapter__body fade" style="--d:.9s"></p>
      </div>`;
    $('.chapter__num', section).textContent = ch.number;
    $('.mono', section).textContent = ch.meta;
    $('.chapter__title', section).textContent = ch.title;
    $('.chapter__body', section).textContent = ch.body;
    if (ch.photo) {
      const fig = document.createElement('figure');
      fig.className = 'print';
      fig.style.setProperty('--tilt', `${idx % 2 ? 3 : -3}deg`);
      const img = new Image();
      img.src = ch.photo;
      img.alt = '';
      img.loading = 'lazy';
      fig.append(img);
      $('.chapter', section).append(fig);
    }
    root.append(section);
  });
}

function buildThings() {
  const ul = $('#things');
  if (!ul || !CONFIG.smallThings) return;
  CONFIG.smallThings.items.forEach((item, i) => {
    const li = document.createElement('li');
    li.textContent = item;
    li.style.setProperty('--tilt', `${(i % 2 ? 1 : -1) * (0.6 + Math.random() * 1.6)}deg`);
    li.classList.add('reveal');
    ul.append(li);
  });
}

function daysTogether() {
  return Math.max(0, Math.floor((Date.now() - new Date(CONFIG.met + 'T00:00:00').getTime()) / DAY));
}

function buildNumbers() {
  const root = $('#numbers');
  if (!root || !CONFIG.numbers) return;
  CONFIG.numbers.lines.forEach((line, i) => {
    const div = document.createElement('div');
    div.className = 'number fade';
    div.style.setProperty('--d', `${i * 0.35}s`);
    const raw = line.value.replace('{days}', String(daysTogether()));
    div.innerHTML = `<span class="number__value"></span><span class="mono number__label"></span>`;
    const value = $('.number__value', div);
    value.textContent = /^\d+$/.test(raw) ? '0' : raw;
    value.dataset.to = /^\d+$/.test(raw) ? raw : '';
    $('.number__label', div).textContent = line.label;
    root.append(div);
  });
}

function countUp(el) {
  const to = Number(el.dataset.to);
  if (!el.dataset.to || el.dataset.done) return;
  el.dataset.done = '1';
  const dur = reducedMotion ? 1 : 2600;
  const t0 = performance.now();
  const tick = (now) => {
    const t = clamp01((now - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - t, 4))).toLocaleString();
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function buildVows() {
  const ol = $('#vows');
  if (!ol || !CONFIG.vows) return;
  for (const line of CONFIG.vows.lines) {
    const li = document.createElement('li');
    li.dataset.text = line;
    li.setAttribute('aria-label', line);
    ol.append(li);
  }
}

// Typed like someone thinking about each word, not like a machine.
async function typeVows() {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const caret = document.createElement('span');
  caret.className = 'caret';
  for (const li of $$('#vows li')) {
    const text = li.dataset.text;
    const out = document.createElement('span');
    out.setAttribute('aria-hidden', 'true');
    li.append(out, caret);
    if (reducedMotion) {
      out.textContent = text;
      continue;
    }
    for (const char of text) {
      out.textContent += char;
      let ms = 28 + Math.random() * 55;
      if (',;'.includes(char)) ms += 280;
      if ('.!?'.includes(char)) ms += 520;
      await wait(ms);
    }
    await wait(700);
  }
  setTimeout(() => caret.remove(), 2400);
}

function buildLetter() {
  const body = $('#letterBody');
  for (const para of CONFIG.letter.trim().split(/\n\s*\n/)) {
    const p = document.createElement('p');
    p.textContent = para.trim();
    body.append(p);
  }
}

/* ── dates ─────────────────────────────────────────────── */

function formatWeddingDate() {
  const d = new Date(CONFIG.wedding + 'T00:00:00');
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())} · ${pad(d.getMonth() + 1)} · ${d.getFullYear()}`;
}

function countdownText() {
  const target = new Date(CONFIG.wedding + 'T00:00:00').getTime();
  const diff = target - Date.now();
  if (diff <= -DAY) return `day ${Math.floor(-diff / DAY) + 1} of forever`;
  if (diff <= 0) return 'today. it is today.';
  const d = Math.floor(diff / DAY);
  const h = Math.floor((diff % DAY) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${d} days ${h} h ${m} m ${String(s).padStart(2, '0')} s ${CONFIG.until || 'until forever'}`;
}

/* ── boot ──────────────────────────────────────────────── */

export async function boot(config, themeName = 'thread') {
  CONFIG = config;
  bindText();
  buildChapters();
  buildThings();
  buildNumbers();
  buildVows();
  buildLetter();
  $$('.reveal').forEach(split);
  $('#finaleDate').textContent = formatWeddingDate();

  let scene = null;
  try {
    const { Scene, THEMES } = await import('./scene.js');
    scene = new Scene($('#scene'), THEMES[themeName]);
  } catch (err) {
    console.warn('3D scene unavailable, continuing without it.', err);
    document.body.classList.add('no-webgl');
  }

  if (scene && new URLSearchParams(location.search).has('debug')) window.scene = scene;

  const music = new Music(CONFIG.song, CONFIG.sound);

  /* reveal on view */
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        $$('.number__value', e.target).forEach(countUp);
        if (e.target.id === 'vows') typeVows();
        io.unobserve(e.target);
      }
    },
    { threshold: 0.35, rootMargin: '0px 0px -10% 0px' },
  );
  $$('.reveal, .fade, .reveal-block, .print, #vows').forEach((el) => io.observe(el));

  /* gate */
  const gate = $('#gate');
  function open() {
    if (gate.classList.contains('is-open')) return;
    gate.classList.add('is-open');
    document.body.classList.remove('is-locked');
    window.scrollTo(0, 0);
    music.start();
    scene?.start();
    const sound = $('#sound');
    if (music.silent) return;
    sound.hidden = false;
    requestAnimationFrame(() => sound.classList.add('is-shown'));
  }
  gate.addEventListener('click', open);
  gate.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });
  $('#sound').addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('is-muted', music.toggle());
  });

  /* scroll → story */
  const sections = () => Object.fromEntries($$('[data-scene]').map((el) => [el.dataset.scene, el]));
  let map = sections();

  // 0 when the section's top enters the bottom of the screen, 1 when its bottom leaves the top.
  function through(el) {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    return clamp01((vh - r.top) / (r.height + vh));
  }

  let lastY = window.scrollY;
  let lastT = performance.now();
  let tied = false;

  function onScroll() {
    const now = performance.now();
    const y = window.scrollY;
    const vel = ((y - lastY) / Math.max(1, now - lastT)) * 16;
    lastY = y;
    lastT = now;

    const max = document.documentElement.scrollHeight - window.innerHeight;
    $('#progress').style.transform = `scaleY(${max > 0 ? y / max : 0})`;

    if (!scene) return;
    const opening = through(map.opening);
    const knowing = through(map.verse || map['chapter-1'] || map['chapter-0']);
    const firstChapter = map['chapter-0'] || map.things;
    const storyStart = firstChapter.offsetTop;
    const storyEnd = map.knot.offsetTop;
    const story = clamp01((y + window.innerHeight * 0.5 - storyStart) / (storyEnd - storyStart));

    scene.setScrollVelocity(vel);
    scene.set({
      grow: smooth(0.22, 0.62, opening),
      heart: smooth(0.28, 0.45, knowing) * (1 - smooth(0.62, 0.8, knowing)),
      close: story,
      sync: smooth(0.1, 0.6, through(map.vows)),
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    map = sections();
    onScroll();
  });
  onScroll();
  setInterval(() => scene?.setScrollVelocity(0), 200);

  /* hold to tie the knot */
  const hold = $('#hold');
  const fill = $('#holdFill');
  // `knot.times` > 1 splits the hold into steps (e.g. three times "Qubool hai").
  const TIMES = Math.max(1, CONFIG.knot.times || 1);
  const HOLD_SECONDS = TIMES > 1 ? 1.8 : 3.2;
  const label = $('.hold__label', hold);
  const dots = [];
  if (TIMES > 1) {
    const row = document.createElement('div');
    row.className = 'hold__dots';
    row.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < TIMES; i++) dots.push(row.appendChild(document.createElement('i')));
    $('#knot').append(row);
  }
  let holding = false;
  let amount = 0;
  let done = 0;
  let lastFrame = 0;

  function holdLoop(now) {
    const dt = Math.min(0.25, (now - lastFrame) / 1000);
    lastFrame = now;
    amount = clamp01(amount + (holding ? dt / HOLD_SECONDS : -dt / 0.9));
    fill.style.strokeDashoffset = String(339.3 * (1 - amount));
    scene?.set({ knot: ((done + amount) / TIMES) * 0.92 });
    if (amount >= 1) {
      done++;
      if (done >= TIMES) return tie();
      stepDone();
      return;
    }
    if (holding || amount > 0) requestAnimationFrame(holdLoop);
  }

  function stepDone() {
    dots[done - 1]?.classList.add('is-on');
    navigator.vibrate?.([30, 60, 30]);
    music.chime?.(done);
    release();
    amount = 0;
    fill.style.strokeDashoffset = '339.3';
    hold.classList.add('is-step');
    setTimeout(() => hold.classList.remove('is-step'), 900);
    const steps = CONFIG.knot.steps;
    if (steps?.[done]) label.textContent = steps[done];
  }

  function press(e) {
    if (tied) return;
    e.preventDefault();
    if (holding) return;
    holding = true;
    hold.classList.add('is-holding');
    lastFrame = performance.now();
    requestAnimationFrame(holdLoop);
    navigator.vibrate?.(12);
  }
  function release() {
    holding = false;
    hold.classList.remove('is-holding');
  }

  hold.addEventListener('pointerdown', (e) => {
    hold.setPointerCapture?.(e.pointerId);
    press(e);
  });
  hold.addEventListener('pointerup', release);
  hold.addEventListener('pointercancel', release);
  hold.addEventListener('lostpointercapture', release);
  hold.addEventListener('contextmenu', (e) => e.preventDefault());
  hold.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) press(e);
  });
  hold.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'Enter') release();
  });

  function tie() {
    if (tied) return;
    tied = true;
    dots.forEach((d) => d.classList.add('is-on'));
    holding = false;
    navigator.vibrate?.([40, 90, 40]);
    $('#knot').classList.add('is-done');
    $('#finale').classList.add('is-in');
    scene?.finale(CONFIG.starName || CONFIG.her);
    music.swell();
    map.knot.scrollIntoView({ behavior: 'smooth', block: 'end' });
    document.body.classList.add('is-tied');

    const count = $('#countdown');
    const update = () => (count.textContent = countdownText());
    update();
    setInterval(update, 1000);
  }

  /* the letter */
  const letter = $('#letter');
  function openLetter() {
    letter.hidden = false;
    requestAnimationFrame(() => letter.classList.add('is-open'));
    $('#letterClose').focus();
  }
  function closeLetter() {
    letter.classList.remove('is-open');
    setTimeout(() => (letter.hidden = true), 900);
    $('#envelope').focus();
  }
  $('#envelope').addEventListener('click', openLetter);
  $('#letterClose').addEventListener('click', closeLetter);
  letter.addEventListener('click', (e) => {
    if (e.target === letter) closeLetter();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !letter.hidden) closeLetter();
  });
}
