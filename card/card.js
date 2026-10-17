import { CARD } from './config.js';

const $ = (sel) => document.querySelector(sel);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const params = new URLSearchParams(location.search);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── words ─────────────────────────────────────────────── */

const lookup = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), CARD);
for (const el of document.querySelectorAll('[data-bind]')) {
  const v = lookup(el.dataset.bind);
  if (typeof v === 'string') el.textContent = v;
}

const guest = (params.get('to') || '').trim().slice(0, 60) || CARD.defaultGuest;
$('#guest').textContent = guest;
if (params.get('to')) document.title = `${guest}, you're invited`;

const day = (iso) => new Date(`${iso}T00:00:00`);
const time12 = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};
const first = CARD.events[0];
$('#date').textContent = day(first.date).toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

for (const ev of CARD.events) {
  const li = document.createElement('li');
  const b = document.createElement('b');
  b.textContent = ev.name;
  const when =
    ev.date === first.date
      ? time12(ev.start)
      : `${day(ev.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${time12(ev.start)}`;
  li.append(b, ` · ${when} · ${ev.venue}`);
  $('#events').append(li);
}

// sky: a scatter of stars, each on its own rhythm
for (let i = 0; i < 70; i++) {
  const s = document.createElement('i');
  const size = Math.random() < 0.15 ? 3 : Math.random() < 0.5 ? 2 : 1.4;
  s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 58}%;width:${size}px;height:${size}px;--t:${2 + Math.random() * 4}s;--d:${-Math.random() * 5}s`;
  $('#stars').append(s);
}

/* ── actions ───────────────────────────────────────────── */

function icsDate(iso, hhmm) {
  return `${iso.replaceAll('-', '')}T${hhmm.replace(':', '')}00`;
}

function downloadIcs() {
  const couple = `${CARD.names[0]} & ${CARD.names[1]}`;
  const esc = (s) => s.replace(/([,;\\])/g, '\\$1');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//wedding card//EN', 'CALSCALE:GREGORIAN'];
  CARD.events.forEach((ev, i) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.date}-${i}-${couple.replace(/\W/g, '')}@wedding-card`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(ev.date, ev.start)}`,
      `DTEND:${icsDate(ev.date, ev.end || ev.start)}`,
      `SUMMARY:${esc(`${ev.name} · ${couple}`)}`,
      `LOCATION:${esc(`${ev.venue}, ${ev.address}`)}`,
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${CARD.names.join('-')}-wedding.ics`.toLowerCase();
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$('#saveDate').addEventListener('click', downloadIcs);

// one Directions button per distinct address
const mapsUrl = (ev) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ev.venue}, ${ev.address}`)}`;
const places = CARD.events.filter((ev, i, all) => all.findIndex((o) => o.address === ev.address && o.venue === ev.venue) === i);
const dirTemplate = $('#directions');
places.forEach((ev, i) => {
  const a = i === 0 ? dirTemplate : dirTemplate.cloneNode();
  a.removeAttribute('id');
  a.href = mapsUrl(ev);
  a.textContent = places.length > 1 ? `${ev.name} · map` : 'Directions';
  if (i > 0) dirTemplate.parentNode.insertBefore(a, $('#rsvp'));
});

const rsvp = $('#rsvp');
if (CARD.rsvp?.whatsapp) {
  const text = `Assalamu alaikum! ${guest === CARD.defaultGuest ? 'We' : guest} would love to attend ${CARD.names[0]} & ${CARD.names[1]}'s wedding. In sha Allah, we'll be there.`;
  rsvp.href = `https://wa.me/${CARD.rsvp.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
} else {
  rsvp.hidden = true;
}

function countdown() {
  const d = Math.ceil((day(first.date) - Date.now()) / 86400000);
  $('#countdown').textContent =
    d > 1 ? `${d} days to go${CARD.rsvp?.by ? ` · kindly reply by ${day(CARD.rsvp.by).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}` : ''}` : d === 1 ? 'tomorrow' : d === 0 ? 'today' : 'with gratitude';
}
countdown();

/* ── layout ────────────────────────────────────────────── */

const env = $('#env');
const card = $('#card');
const sleeve = $('#sleeve');
const root = document.documentElement;
let geo = {};

function layout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const envW = Math.min(vw * 0.84, 360);
  const cardW = Math.min(vw * 0.88, 400, ((vh - 150) * 9) / 14);
  root.style.setProperty('--env-w', `${envW}px`);
  root.style.setProperty('--card-w', `${cardW}px`);
  const e = env.getBoundingClientRect();
  const cardH = (cardW * 14) / 9;
  const actionsH = $('#actions').offsetHeight || 90;
  const top = Math.max(12, (vh - cardH - 18 - actionsH) / 2);
  geo = { e, cardW, cardH, top, vw, vh };
  sleeve.style.height = state === 'done' ? '100%' : `${e.bottom}px`;
  $('#actions').style.top = `${top + cardH + 18}px`;
  if (state === 'done') card.style.transform = finalT();
  else if (state === 'sealed') card.style.transform = sealedT();
  rope.anchorTo(bowPoint());
}

// The card begins folded inside the envelope, rises out of it, then comes forward.
const sealedT = () => {
  const { e, cardW, cardH } = geo;
  return `translate(${e.left + e.width * 0.05}px, ${e.top + e.height * 0.06}px) scale(${(e.width * 0.9) / cardW}, ${(e.height * 0.9) / cardH})`;
};
const risenT = () => {
  const { e, cardW, cardH } = geo;
  const s = (e.width * 0.9) / cardW;
  return `translate(${e.left + e.width * 0.05}px, ${e.top + e.height * 0.55 - cardH * s}px) scale(${s})`;
};
const finalT = () => `translate(${(geo.vw - geo.cardW) / 2}px, ${geo.top}px) scale(1)`;

const bowPoint = () => {
  const b = $('#bow').getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
};

/* ── the golden thread: a small verlet rope ────────────── */

const rope = (() => {
  const canvas = $('#rope');
  const ctx = canvas.getContext('2d');
  const N = 17;
  const SEG = 9;
  const pts = Array.from({ length: N }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
  let anchored = true;
  let grab = -1;
  let target = { x: 0, y: 0 };
  let alpha = 1;
  let t = 0;
  let placed = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function anchorTo(p) {
    if (!placed) {
      pts.forEach((q, i) => {
        q.x = q.px = p.x + i * 2.2;
        q.y = q.py = p.y + i * SEG;
      });
      placed = true;
    }
    if (anchored) {
      pts[0].x = pts[0].px = p.x;
      pts[0].y = pts[0].py = p.y;
    }
  }

  function step() {
    t += 1 / 60;
    for (let i = 0; i < N; i++) {
      const q = pts[i];
      if ((i === 0 && anchored) || i === grab) continue;
      const vx = (q.x - q.px) * 0.985;
      const vy = (q.y - q.py) * 0.985;
      q.px = q.x;
      q.py = q.y;
      q.x += vx + (anchored && grab < 0 && i === N - 1 ? Math.sin(t * 1.6) * 0.18 : 0);
      q.y += vy + 0.42;
    }
    if (grab >= 0) {
      pts[grab].x = pts[grab].px = target.x;
      pts[grab].y = pts[grab].py = target.y;
    }
    for (let k = 0; k < 14; k++) {
      for (let i = 0; i < N - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const diff = (d - SEG) / d;
        const aFixed = (i === 0 && anchored) || i === grab;
        const bFixed = i + 1 === grab;
        if (aFixed && bFixed) continue;
        const wa = aFixed ? 0 : bFixed ? 1 : 0.5;
        const wb = bFixed ? 0 : aFixed ? 1 : 0.5;
        a.x += dx * diff * wa;
        a.y += dy * diff * wa;
        b.x -= dx * diff * wb;
        b.y -= dy * diff * wb;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < N - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.lineTo(pts[N - 1].x, pts[N - 1].y);
    };
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.strokeStyle = '#c99a45';
    ctx.lineWidth = 3;
    path();
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255, 236, 190, 0.85)';
    ctx.lineWidth = 1;
    path();
    ctx.stroke();
    // a small tassel at the loose end
    const end = pts[N - 1];
    const prev = pts[N - 2];
    const ang = Math.atan2(end.y - prev.y, end.x - prev.x);
    ctx.strokeStyle = '#e2bd6e';
    ctx.lineWidth = 1.1;
    for (let k = -3; k <= 3; k++) {
      const a = ang + k * 0.11;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x + Math.cos(a) * 15, end.y + Math.sin(a) * 15);
      ctx.stroke();
    }
    ctx.fillStyle = '#d9ad5b';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // How hard is she pulling? 0 = slack, 1 = about to come undone.
  function tension() {
    if (grab < 0 || !anchored) return 0;
    const g = pts[grab];
    const d = Math.hypot(g.x - pts[0].x, g.y - pts[0].y);
    const rest = grab * SEG;
    return clamp((d - rest * 0.95) / (rest * 0.45 + 40), 0, 1.2);
  }

  function nearest(x, y) {
    let best = -1;
    let bestD = 46;
    pts.forEach((q, i) => {
      if (i === 0) return;
      const d = Math.hypot(q.x - x, q.y - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  function nudge(strength = 6) {
    const q = pts[N - 1];
    q.px -= strength;
  }

  resize();
  window.addEventListener('resize', resize);

  return {
    anchorTo,
    step,
    draw,
    tension,
    nearest,
    nudge,
    grabAt(i, x, y) {
      grab = i;
      target = { x, y };
    },
    move(x, y) {
      target = { x, y };
    },
    letGo() {
      grab = -1;
    },
    release() {
      anchored = false;
    },
    get grabbed() {
      return grab >= 0;
    },
    fade(dt) {
      if (!anchored && grab < 0) alpha = Math.max(0, alpha - dt * 0.7);
    },
  };
})();

/* ── state & interaction ───────────────────────────────── */

let state = 'sealed';
const bow = $('#bow');

window.addEventListener('pointerdown', (e) => {
  if (state !== 'sealed') return;
  const i = rope.nearest(e.clientX, e.clientY);
  if (i > 0) {
    askForTilt();
    rope.grabAt(i, e.clientX, e.clientY);
    e.preventDefault();
  } else if (e.target.closest('#env') && !e.target.closest('#seal')) {
    rope.nudge(10);
  }
});
window.addEventListener('pointermove', (e) => {
  if (rope.grabbed) rope.move(e.clientX, e.clientY);
  pointerTilt(e);
});
window.addEventListener('pointerup', () => rope.letGo());
window.addEventListener('pointercancel', () => rope.letGo());
$('#seal').addEventListener('click', () => {
  askForTilt();
  untie();
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  rope.step();
  rope.fade(dt);
  rope.draw();

  if (state === 'sealed') {
    const k = rope.tension();
    bow.style.transform = `scale(${1 - Math.min(k, 1) * 0.35}) rotate(${Math.sin(now / 40) * k * 6}deg)`;
    if (k >= 1) untie();
  }
  if (state === 'done') tiltStep(dt);
  requestAnimationFrame(frame);
}

async function untie() {
  if (state !== 'sealed') return;
  state = 'untying';
  rope.release();
  navigator.vibrate?.(20);
  const ease = 'cubic-bezier(.5,0,.75,0)';
  bow.animate([{ opacity: 1 }, { transform: 'scale(.2) rotate(80deg)', opacity: 0 }], { duration: 500, easing: ease, fill: 'forwards' });
  $('#bandH').animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(-30%) scaleX(.5)', opacity: 0 }], { duration: 700, easing: ease, fill: 'forwards' });
  $('#bandV').animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(30%) scaleY(.5)', opacity: 0 }], { duration: 700, easing: ease, fill: 'forwards' });
  await wait(450);

  document.body.classList.add('is-opened');
  $('#seal').animate([{ opacity: 1 }, { transform: 'translateY(-14px) scale(1.2)', opacity: 0 }], { duration: 600, easing: 'ease-out', fill: 'forwards' });
  const flap = $('#flap');
  flap.animate([{ transform: 'perspective(900px) rotateX(0deg)' }, { transform: 'perspective(900px) rotateX(180deg)' }], {
    duration: 1000,
    easing: 'cubic-bezier(.45,0,.2,1)',
    fill: 'forwards',
  });
  setTimeout(() => (flap.style.zIndex = 0), 480);
  await wait(650);

  card.style.opacity = 1;
  await card.animate([{ transform: sealedT() }, { transform: risenT() }], { duration: 1150, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' }).finished;

  // The envelope falls away and the card comes forward.
  const fall = [
    ['.env__back', 0, 'translateY(70vh) rotate(-4deg)'],
    ['.env__pocket', 30, 'translateY(70vh) rotate(3deg)'],
  ];
  for (const [sel, delay, to] of fall) {
    $(sel).animate([{ transform: 'none', opacity: 1 }, { opacity: 0.4, offset: 0.25 }, { transform: to, opacity: 0 }], { duration: 950, delay, easing: ease, fill: 'forwards' });
  }
  flap.animate([{ transform: 'perspective(900px) rotateX(180deg)', opacity: 1 }, { transform: 'perspective(900px) translateY(70vh) rotateX(180deg)', opacity: 0 }], { duration: 950, easing: ease, fill: 'forwards' });
  const forward = card.animate([{ transform: risenT() }, { transform: finalT() }], { duration: 1400, delay: 150, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
  await wait(260);
  document.body.classList.add('is-out');
  sleeve.style.height = '100%';
  await forward.finished;

  card.style.transform = finalT();
  forward.cancel();
  state = 'done';
  await wait(200);
  $('#dio').classList.add('is-lit');
  document.body.classList.add('is-done');
}

/* ── after: the card answers to tilt, the lanterns swing ── */

const tilt = { rx: 0, ry: 0, trx: 0, try: 0, fromDevice: false, prevRy: 0, prevRx: 0 };
const lanterns = [...document.querySelectorAll('.lantern')].map((el, i) => ({ el, a: 0, v: 0, phase: i * 1.7 }));

function pointerTilt(e) {
  if (tilt.fromDevice || e.pointerType === 'touch') return;
  tilt.try = (e.clientX / innerWidth - 0.5) * 16;
  tilt.trx = -(e.clientY / innerHeight - 0.5) * 12;
}

function onOrientation(e) {
  if (e.gamma == null) return;
  tilt.fromDevice = true;
  tilt.try = clamp(e.gamma, -30, 30) * 0.5;
  tilt.trx = -clamp(e.beta - 45, -30, 30) * 0.4;
}

let askedTilt = false;
function askForTilt() {
  if (askedTilt) return;
  askedTilt = true;
  const D = window.DeviceOrientationEvent;
  if (!D) return;
  if (typeof D.requestPermission === 'function') {
    D.requestPermission()
      .then((r) => r === 'granted' && addEventListener('deviceorientation', onOrientation))
      .catch(() => {});
  } else {
    addEventListener('deviceorientation', onOrientation);
  }
}

function tiltStep(dt) {
  const k = 1 - Math.exp(-6 * dt);
  tilt.rx += (tilt.trx - tilt.rx) * k;
  tilt.ry += (tilt.try - tilt.ry) * k;
  if (reducedMotion) tilt.rx = tilt.ry = 0;
  $('#dio').style.transform = `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`;
  // the light sits above and in front, so shadows lean away from the tilt
  card.style.setProperty('--sx', `${(-tilt.ry * 0.5).toFixed(2)}px`);
  card.style.setProperty('--sy', `${(5 + tilt.rx * 0.5).toFixed(2)}px`);

  // lanterns: damped pendulums, pushed by how fast the card turns
  const push = (tilt.ry - tilt.prevRy) / Math.max(dt, 0.001);
  tilt.prevRy = tilt.ry;
  const now = performance.now() / 1000;
  for (const L of lanterns) {
    const wind = Math.sin(now * 0.9 + L.phase) * 1.4;
    const acc = -14 * L.a - 1.1 * L.v - push * 1.6 + wind;
    L.v += acc * dt;
    L.a = clamp(L.a + L.v * dt, -28, 28);
    L.el.style.setProperty('--swing', `${L.a.toFixed(2)}deg`);
  }
}

/* ── go ────────────────────────────────────────────────── */

window.addEventListener('resize', layout);
layout();
document.fonts?.ready.then(layout);
requestAnimationFrame(frame);

// ?open skips the envelope (useful for previews).
if (params.has('open')) {
  state = 'done';
  document.body.classList.add('is-opened', 'is-out', 'is-done');
  env.querySelectorAll('.env__back, .env__pocket, .env__flap, .seal, .band, .bow').forEach((el) => (el.style.display = 'none'));
  rope.release();
  card.style.opacity = 1;
  layout();
  $('#dio').classList.add('is-lit');
}
