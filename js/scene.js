import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/*
 * One red thread, two lights.
 *
 * The thread is a camera-facing ribbon whose centreline is rebuilt every frame
 * from three parametric shapes (a loose line, a heart, a trefoil knot) blended
 * by story weights that the scroll position drives. The two lights sit on the
 * ends of the thread, each with its own heartbeat; as the story goes on they
 * are coupled like Kuramoto oscillators until they beat in sync.
 */

const TAU = Math.PI * 2;
const SEGMENTS = 420;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function heartbeat(phase) {
  const f = phase - Math.floor(phase);
  return Math.exp(-(((f - 0.06) * 16) ** 2)) + 0.55 * Math.exp(-(((f - 0.25) * 16) ** 2));
}

function glowTexture() {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.12, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.22)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const pointFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * a * vAlpha);
  }
`;

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.small = Math.min(window.innerWidth, window.innerHeight) < 700;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    // The clear colour is encoded to sRGB once by the clear and again by the
    // OutputPass, so decode it one extra time to land on the real #0d0a09.
    this.renderer.setClearColor(new THREE.Color(0x0d0a09).convertSRGBToLinear(), 1);
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.small ? 1.6 : 1.75);
    this.renderer.setPixelRatio(this.pixelRatio);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0d0a09, 0.045);
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0, 15);

    // story targets (set from scroll) and their smoothed values
    this.target = { grow: 0, heart: 0, close: 0, sync: 0, knot: 0 };
    this.v = { ...this.target };

    this.time = 0;
    this.started = false;
    this.startAt = 0;
    this.finaleAt = -1;
    this.mouse = new THREE.Vector2();
    this.mouseSmooth = new THREE.Vector2();
    this.scrollVel = 0;
    this.drift = 0;

    this.phaseA = 0;
    this.phaseB = 0.43;

    this.#buildDust();
    this.#buildThread();
    this.#buildSouls();
    this.#buildPost();

    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('pointermove', (e) => {
      this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    });

    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.#frame());
  }

  /* ── construction ─────────────────────────────────────── */

  #buildDust() {
    const count = this.small ? 1300 : 2400;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = -18 + Math.random() * 24;
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

    this.dustUniforms = {
      uTime: { value: 0 },
      uPixel: { value: this.pixelRatio },
      uDrift: { value: 0 },
      uOpacity: { value: 0 },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms: this.dustUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime, uPixel, uDrift, uOpacity;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.05 + aSeed * 6.2831) * 0.5;
          p.y += cos(uTime * 0.04 + aSeed * 12.0) * 0.4;
          p.y = mod(p.y + uDrift * (0.4 + aSeed) + 10.0, 20.0) - 10.0;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (0.6 + aSeed * aSeed * 2.6) * uPixel * (9.0 / -mv.z);
          float tw = 0.45 + 0.55 * sin(uTime * (0.5 + aSeed * 1.7) + aSeed * 40.0);
          vAlpha = tw * uOpacity * 0.75;
          vColor = mix(vec3(1.0, 0.82, 0.62), vec3(1.0, 0.45, 0.38), step(0.86, aSeed));
        }
      `,
      fragmentShader: pointFrag,
    });

    this.dust = new THREE.Points(geo, mat);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  #buildThread() {
    const n = SEGMENTS;
    this.pts = Array.from({ length: n }, () => new THREE.Vector3());
    const pos = new Float32Array(n * 2 * 3);
    const t = new Float32Array(n * 2);
    const side = new Float32Array(n * 2);
    const index = [];
    for (let i = 0; i < n; i++) {
      t[i * 2] = t[i * 2 + 1] = i / (n - 1);
      side[i * 2] = -1;
      side[i * 2 + 1] = 1;
      if (i < n - 1) {
        const a = i * 2;
        index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aT', new THREE.BufferAttribute(t, 1));
    geo.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
    geo.setIndex(index);

    this.threadUniforms = {
      uTime: { value: 0 },
      uGrow: { value: 0 },
      uGlow: { value: 0.6 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color('#e2392b') },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms: this.threadUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aT;
        attribute float aSide;
        varying float vT;
        varying float vSide;
        void main() {
          vT = aT;
          vSide = aSide;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime, uGrow, uGlow, uOpacity;
        uniform vec3 uColor;
        varying float vT;
        varying float vSide;
        void main() {
          float across = 1.0 - abs(vSide);
          float body = pow(across, 1.4);
          float core = smoothstep(0.6, 1.0, across);
          float drawn = 1.0 - smoothstep(uGrow - 0.012, uGrow, vT);
          // small pulses that travel along the thread, from her to me
          float pulse = pow(0.5 + 0.5 * sin(vT * 26.0 + uTime * 2.2), 14.0);
          float head = exp(-pow((vT - uGrow) * 70.0, 2.0)) * (1.0 - step(0.995, uGrow));
          vec3 col = uColor * (0.85 + pulse * uGlow * 1.8) + vec3(1.0, 0.75, 0.6) * core * 0.45;
          col += vec3(1.0, 0.85, 0.7) * head * 3.0;
          gl_FragColor = vec4(col, (body * drawn + head * across) * uOpacity);
        }
      `,
    });

    this.thread = new THREE.Mesh(geo, mat);
    this.thread.frustumCulled = false;
    this.scene.add(this.thread);
  }

  #buildSouls() {
    const tex = glowTexture();
    const make = (color) => {
      const group = new THREE.Group();
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }),
      );
      const core = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, color: 0xfff4ea, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }),
      );
      group.add(halo, core);
      group.userData = { halo, core };
      this.scene.add(group);
      return group;
    };
    this.soulA = make(new THREE.Color('#ffc98a')); // me
    this.soulB = make(new THREE.Color('#ff8e86')); // her
  }

  #buildPost() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.8, 0.32, 0.12);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  /* ── shapes ───────────────────────────────────────────── */

  // Loose thread between two people. `close` pulls them together and calms it.
  #line(t, out) {
    const v = this.v;
    const sep = THREE.MathUtils.lerp(this.halfW * 0.86, Math.min(this.halfW * 0.42, 1.6), v.close);
    const env = Math.sin(Math.PI * t);
    const calm = 1 - v.close * 0.55;
    const time = this.time;
    out.set(
      THREE.MathUtils.lerp(-sep, sep, t),
      -0.5 - env * (0.5 + 0.3 * calm) + Math.sin(t * Math.PI * 3 + time * 0.6) * 0.28 * env * calm,
      Math.cos(t * Math.PI * 2 + time * 0.45) * 0.9 * env * calm,
    );
    return out;
  }

  #heart(t, out) {
    const gap = 0.025;
    const th = Math.PI + (gap + t * (1 - gap * 2)) * TAU;
    const s = 0.13 * this.fit;
    const x = 16 * Math.sin(th) ** 3;
    const y = 13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th);
    out.set(x * s, (y + 2.5) * s - 0.1, Math.sin(th * 2 + this.time * 0.8) * 0.25);
    return out;
  }

  // Trefoil: the simplest real knot.
  #knot(t, out) {
    const u = t * TAU;
    const s = 0.62 * this.fit;
    const x = Math.sin(u) + 2 * Math.sin(2 * u);
    const y = Math.cos(u) - 2 * Math.cos(2 * u);
    const z = -Math.sin(3 * u);
    const a = this.time * 0.35;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    out.set((x * ca + z * sa) * s, y * s + 0.15, (-x * sa + z * ca) * s);
    return out;
  }

  #updateThread() {
    const v = this.v;
    const tmpA = this._a || (this._a = new THREE.Vector3());
    const tmpB = this._b || (this._b = new THREE.Vector3());
    const heartW = easeInOut(clamp01(v.heart));
    const knotW = easeInOut(clamp01(v.knot));

    for (let i = 0; i < SEGMENTS; i++) {
      const t = i / (SEGMENTS - 1);
      const p = this.pts[i];
      this.#line(t, p);
      if (heartW > 0.001) p.lerp(this.#heart(t, tmpA), heartW);
      if (knotW > 0.001) p.lerp(this.#knot(t, tmpB), knotW);
    }

    const pos = this.thread.geometry.attributes.position.array;
    const cam = this.camera.position;
    const tan = this._t || (this._t = new THREE.Vector3());
    const view = this._v || (this._v = new THREE.Vector3());
    const side = this._s || (this._s = new THREE.Vector3());
    const width = (0.022 + knotW * 0.012) * (this.small ? 1.25 : 1);

    for (let i = 0; i < SEGMENTS; i++) {
      const p = this.pts[i];
      const prev = this.pts[Math.max(0, i - 1)];
      const next = this.pts[Math.min(SEGMENTS - 1, i + 1)];
      tan.subVectors(next, prev).normalize();
      view.subVectors(cam, p).normalize();
      side.crossVectors(tan, view).normalize();
      const t = i / (SEGMENTS - 1);
      const w = width * (0.45 + 0.55 * Math.pow(Math.sin(Math.PI * t), 0.25));
      const k = i * 6;
      pos[k] = p.x - side.x * w;
      pos[k + 1] = p.y - side.y * w;
      pos[k + 2] = p.z - side.z * w;
      pos[k + 3] = p.x + side.x * w;
      pos[k + 4] = p.y + side.y * w;
      pos[k + 5] = p.z + side.z * w;
    }
    this.thread.geometry.attributes.position.needsUpdate = true;
  }

  #updateSouls(dt, intro) {
    const v = this.v;
    // Two hearts with different resting rates; coupling grows with `sync`.
    const rateA = 1.08;
    const rateB = 0.92;
    const k = v.sync * 2.4;
    this.phaseA += dt * rateA;
    this.phaseB += dt * (rateB + k * Math.sin(TAU * (this.phaseA - this.phaseB)));

    const fin = this.finaleAt < 0 ? 0 : clamp01((this.time - this.finaleAt - 0.8) / 2.2);
    const souls = [
      [this.soulA, this.pts[0], this.phaseA],
      [this.soulB, this.pts[SEGMENTS - 1], this.phaseB],
    ];
    for (const [soul, at, phase] of souls) {
      soul.position.copy(at);
      const beat = heartbeat(phase);
      const { halo, core } = soul.userData;
      const scale = (this.small ? 1.25 : 1) * (1 - fin * 0.6);
      halo.scale.setScalar((1.25 + beat * 0.55 + v.knot * 0.6) * scale);
      core.scale.setScalar((0.26 + beat * 0.1) * scale);
      halo.material.opacity = intro * (0.4 + beat * 0.3) * (1 - fin * 0.7);
      core.material.opacity = intro * (1 - fin * 0.5);
    }
  }

  /* ── finale: the knot unravels into her name ──────────── */

  async #buildName(text) {
    try {
      await document.fonts.load('120px "Mrs Saint Delafield"');
    } catch (_) {
      /* fall back to whatever cursive is there */
    }
    const w = 1400;
    const h = 460;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    let size = h * 0.66;
    g.font = `${size}px "Mrs Saint Delafield", cursive`;
    const measured = g.measureText(text).width;
    if (measured > w * 0.9) size *= (w * 0.9) / measured;
    g.font = `${size}px "Mrs Saint Delafield", cursive`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.fillText(text, w / 2, h * 0.52);

    const data = g.getImageData(0, 0, w, h).data;
    const hits = [];
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        if (data[(y * w + x) * 4 + 3] > 130) hits.push(x, y);
      }
    }
    const pairs = hits.length / 2;
    if (!pairs) return;

    const count = this.small ? 3200 : 5200;
    const worldW = Math.min(11, this.halfW * 1.8);
    const target = new Float32Array(count * 3);
    const start = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const j = Math.floor(Math.random() * pairs) * 2;
      target[i * 3] = ((hits[j] - w / 2) / w) * worldW + (Math.random() - 0.5) * 0.02;
      target[i * 3 + 1] = (-(hits[j + 1] - h / 2) / w) * worldW + 0.35;
      target[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
      // every star of her name starts somewhere on the knot
      const p = this.pts[Math.floor(Math.random() * SEGMENTS)];
      start[i * 3] = p.x + (Math.random() - 0.5) * 0.06;
      start[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.06;
      start[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.06;
      seed[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(target, 3));
    geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

    this.nameUniforms = { uForm: { value: 0 }, uTime: { value: 0 }, uPixel: { value: this.pixelRatio } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.nameUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec3 aStart;
        attribute float aSeed;
        uniform float uForm, uTime, uPixel;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float e = clamp((uForm - aSeed * 0.4) / 0.6, 0.0, 1.0);
          e = e < 0.5 ? 4.0 * e * e * e : 1.0 - pow(-2.0 * e + 2.0, 3.0) / 2.0;
          vec3 p = mix(aStart, position, e);
          float arc = sin(e * 3.14159);
          p.z += arc * (aSeed - 0.5) * 3.0;
          p.y += arc * (fract(aSeed * 7.13) - 0.5) * 1.4;
          p.xy += vec2(sin(uTime * 0.9 + aSeed * 31.0), cos(uTime * 0.7 + aSeed * 17.0)) * 0.012 * e;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (0.9 + aSeed * 1.4) * uPixel * (7.0 / -mv.z);
          float tw = 0.6 + 0.4 * sin(uTime * (1.2 + aSeed * 2.0) + aSeed * 50.0);
          vAlpha = smoothstep(0.0, 0.08, uForm) * tw;
          vec3 gold = vec3(1.0, 0.78, 0.48);
          vec3 cream = vec3(1.0, 0.93, 0.85);
          vec3 red = vec3(1.0, 0.28, 0.2);
          vColor = mix(mix(gold, cream, aSeed), red, (1.0 - e) * 0.85 + step(0.9, fract(aSeed * 13.7)) * 0.6);
        }
      `,
      fragmentShader: pointFrag,
    });

    this.name = new THREE.Points(geo, mat);
    this.name.frustumCulled = false;
    this.scene.add(this.name);
    this.nameAt = this.time;
  }

  /* ── public ───────────────────────────────────────────── */

  start() {
    this.started = true;
    this.startAt = this.time;
  }

  set(values) {
    Object.assign(this.target, values);
  }

  setScrollVelocity(v) {
    this.scrollVel = v;
  }

  finale(name) {
    if (this.finaleAt >= 0) return;
    this.finaleAt = this.time;
    this.target.knot = 1;
    this.v.knot = 1;
    this.#buildName(name);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * 10;
    this.halfW = halfH * this.camera.aspect;
    this.fit = Math.min(1, this.halfW / 2.9);
  }

  /* ── loop ─────────────────────────────────────────────── */

  #frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;

    for (const key of Object.keys(this.target)) {
      const speed = key === 'knot' ? 6 : 2.4;
      this.v[key] = damp(this.v[key], this.target[key], speed, dt);
    }

    const intro = this.started ? easeInOut(clamp01((this.time - this.startAt) / 3.5)) : 0;

    // camera: drifts in on start, follows the hand a little
    this.mouseSmooth.x = damp(this.mouseSmooth.x, this.mouse.x, 2, dt);
    this.mouseSmooth.y = damp(this.mouseSmooth.y, this.mouse.y, 2, dt);
    const z = THREE.MathUtils.lerp(15, 10, intro) - this.v.close * 0.6;
    this.camera.position.set(this.mouseSmooth.x * 0.7, this.mouseSmooth.y * 0.45, z);
    this.camera.lookAt(0, 0, 0);

    this.drift += dt * (0.08 + Math.min(Math.abs(this.scrollVel), 4) * 0.25);
    this.dustUniforms.uTime.value = this.time;
    this.dustUniforms.uDrift.value = this.drift;
    this.dustUniforms.uOpacity.value = 0.25 + intro * 0.75;

    this.#updateThread();
    this.#updateSouls(dt, intro);

    const tu = this.threadUniforms;
    tu.uTime.value = this.time;
    tu.uGrow.value = this.v.grow;
    tu.uGlow.value = 0.5 + this.v.knot * 1.2 + this.v.sync * 0.4;

    let bloom = 0.8 + this.v.knot * 0.4;
    if (this.finaleAt >= 0) {
      const f = this.time - this.finaleAt;
      bloom += Math.exp(-(((f - 0.35) * 3) ** 2)) * 1.4; // the flash
      tu.uOpacity.value = 1 - clamp01((f - 0.9) / 1.6);
      if (this.nameUniforms) {
        this.nameUniforms.uTime.value = this.time;
        this.nameUniforms.uForm.value = clamp01((this.time - this.nameAt - 0.3) / 5.5);
      }
    }
    this.bloom.strength = bloom;

    this.composer.render();
  }
}
