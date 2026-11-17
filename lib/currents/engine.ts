import {
  COMPOSITE_FRAG,
  DOWN_FRAG,
  FULLSCREEN_VERT,
  SCENE_FRAG,
  SPARK_FRAG,
  SPARK_VERT,
  UP_FRAG,
} from "./shaders";

/**
 * Real-time "currents" scene. A chrome ball drops into a flowing field of
 * ridges, then rolls along a ribbon of lava while the camera moves through a
 * loop of shots. Hold the pointer to accelerate, tap to make the ball jump.
 *
 * Plain WebGL2, no dependencies. Call `destroy()` to free everything.
 */

export type CurrentsOptions = {
  /** Render one still frame and never animate. */
  still?: boolean;
  /** Film time (seconds) of the still frame. Defaults to the top-down shot. */
  at?: number;
  /** Called once the first frame is on screen. */
  onReady?: () => void;
  /** Called if the GPU context is lost or WebGL2 is unavailable mid-run. */
  onError?: () => void;
  /** Read every frame: 0..1 loudness of the music's low end, to pulse the lava with. */
  getLevel?: () => number;
};

export type Currents = {
  setPointer: (x: number, y: number) => void;
  releasePointer: () => void;
  setBoost: (on: boolean) => void;
  jump: () => void;
  setVisible: (visible: boolean) => void;
  /** 0 at the top of the page, 1 once a full screen has been scrolled. */
  setScroll: (progress: number) => void;
  /** Halve the frame rate, for when the scene is mostly covered. */
  setLowPower: (low: boolean) => void;
  resize: () => void;
  destroy: () => void;
};

type Vec3 = [number, number, number];

type Shot = {
  az: number;
  el: number;
  dist: number;
  fov: number;
  target: Vec3;
  roll: number;
};

const REST_Y = 0.5;
const GRAVITY = 28;
const BASE_SPEED = 3.1;
const BOOST_SPEED = 3.4;
const MAX_SPARKS = 700;
const FLOW_WRAP = 20000;

const INTRO: Shot = { az: 0.95, el: 0.6, dist: 10.5, fov: 42, target: [0, 0, -1.2], roll: 0 };
const SHOTS: Shot[] = [
  // low chase behind the ball, the lava running out ahead of it
  { az: 0.16, el: 0.15, dist: 5.8, fov: 54, target: [0, 0.2, -2.6], roll: -0.035 },
  // high, almost top-down: the lines part around the ball like a poster
  { az: -0.32, el: 1.05, dist: 7.6, fov: 38, target: [0, 0, 0.7], roll: 0.12 },
  // side glide, stripes sweeping across the frame
  { az: 1.32, el: 0.21, dist: 6.4, fov: 40, target: [0, 0.2, -0.6], roll: 0 },
  // from the front, the ball coming at you
  { az: 2.72, el: 0.19, dist: 6.3, fov: 44, target: [0, 0.3, 0.6], roll: 0.03 },
];
const HOLD = 6.5;
const MOVE = 3.6;
const INTRO_HOLD = 3.1;

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const meander = (s: number) =>
  0.52 * Math.sin(s * 0.155 + 1.7) + 0.26 * Math.sin(s * 0.37 - 0.6) + 0.1 * Math.sin(s * 0.83 + 2.2);

function mixShot(a: Shot, b: Shot, t: number): Shot {
  return {
    az: lerp(a.az, b.az, t),
    el: lerp(a.el, b.el, t),
    dist: lerp(a.dist, b.dist, t),
    fov: lerp(a.fov, b.fov, t),
    target: [lerp(a.target[0], b.target[0], t), lerp(a.target[1], b.target[1], t), lerp(a.target[2], b.target[2], t)],
    roll: lerp(a.roll, b.roll, t),
  };
}

/** Where the camera is in the film at time `t` (seconds since start). */
function shotAt(t: number): Shot {
  if (t < INTRO_HOLD) return INTRO;
  if (t < INTRO_HOLD + MOVE) return mixShot(INTRO, SHOTS[0], ease((t - INTRO_HOLD) / MOVE));
  const loop = (t - INTRO_HOLD - MOVE) % (SHOTS.length * (HOLD + MOVE));
  const index = Math.floor(loop / (HOLD + MOVE));
  const local = loop - index * (HOLD + MOVE);
  const from = SHOTS[index];
  const to = SHOTS[(index + 1) % SHOTS.length];
  if (local < HOLD) return from;
  return mixShot(from, to, ease((local - HOLD) / MOVE));
}

const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

type Spark = {
  p: Vec3;
  v: Vec3;
  life: number;
  age: number;
  size: number;
  hue: number; // 0 lava, 1 lavender droplet, 2 ember
};

export function createCurrents(canvas: HTMLCanvasElement, options: CurrentsOptions = {}): Currents | null {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const floatTargets = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
  gl.getExtension("OES_texture_float_linear");
  const enc = floatTargets ? 1 : 0.25;

  /* ---------------- programs ---------------- */

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`currents: shader failed to compile\n${log}`);
    }
    return shader;
  };

  type Program = { program: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };
  const programs: Program[] = [];
  const link = (vert: string, frag: string, attribs: string[]): Program => {
    const program = gl.createProgram()!;
    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    attribs.forEach((name, i) => gl.bindAttribLocation(program, i, name));
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`currents: program failed to link\n${gl.getProgramInfoLog(program)}`);
    }
    const u: Program["u"] = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) u[info.name] = gl.getUniformLocation(program, info.name);
    }
    const made = { program, u };
    programs.push(made);
    return made;
  };

  let scene: Program, down: Program, up: Program, composite: Program, sparks: Program;
  try {
    scene = link(FULLSCREEN_VERT, SCENE_FRAG, ["aPos"]);
    down = link(FULLSCREEN_VERT, DOWN_FRAG, ["aPos"]);
    up = link(FULLSCREEN_VERT, UP_FRAG, ["aPos"]);
    composite = link(FULLSCREEN_VERT, COMPOSITE_FRAG, ["aPos"]);
    sparks = link(SPARK_VERT, SPARK_FRAG, ["aPos", "aUv", "aColor"]);
  } catch (error) {
    console.error(error);
    programs.forEach((p) => gl.deleteProgram(p.program));
    return null;
  }

  /* ---------------- geometry ---------------- */

  const quadVao = gl.createVertexArray()!;
  const quadBuf = gl.createBuffer()!;
  gl.bindVertexArray(quadVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const FLOATS_PER_VERT = 8;
  const sparkData = new Float32Array(MAX_SPARKS * 6 * FLOATS_PER_VERT);
  const sparkVao = gl.createVertexArray()!;
  const sparkBuf = gl.createBuffer()!;
  gl.bindVertexArray(sparkVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuf);
  gl.bufferData(gl.ARRAY_BUFFER, sparkData.byteLength, gl.DYNAMIC_DRAW);
  const stride = FLOATS_PER_VERT * 4;
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 16);
  gl.bindVertexArray(null);

  /* ---------------- render targets ---------------- */

  type Target = { fb: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number };
  const makeTarget = (w: number, h: number): Target => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (floatTargets) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { fb, tex, w, h };
  };
  const freeTarget = (t: Target) => {
    gl.deleteFramebuffer(t.fb);
    gl.deleteTexture(t.tex);
  };

  let sceneTarget: Target | null = null;
  let bloom: Target[] = [];

  /* ---------------- sizing ---------------- */

  const dpr = () => Math.min(window.devicePixelRatio || 1, 1.5);
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  // pixels the raymarch may shade per frame; the canvas itself stays sharp
  const budget = coarse ? 520_000 : 1_500_000;
  // extra scale on top of the budget, lowered if frames run long
  let quality = 1;
  let width = 1;
  let height = 1;

  const allocate = () => {
    const rect = canvas.getBoundingClientRect();
    const scale = dpr();
    width = Math.max(1, Math.round(rect.width * scale));
    height = Math.max(1, Math.round(rect.height * scale));
    canvas.width = width;
    canvas.height = height;
    const fit = Math.min(1, Math.sqrt(budget / (width * height))) * quality;
    const sw = Math.max(1, Math.round(width * fit));
    const sh = Math.max(1, Math.round(height * fit));
    if (sceneTarget) freeTarget(sceneTarget);
    bloom.forEach(freeTarget);
    sceneTarget = makeTarget(sw, sh);
    bloom = [];
    let bw = sw;
    let bh = sh;
    for (let i = 0; i < 5; i++) {
      bw = Math.max(1, Math.round(bw / 2));
      bh = Math.max(1, Math.round(bh / 2));
      bloom.push(makeTarget(bw, bh));
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  /* ---------------- simulation state ---------------- */

  const still = !!options.still;
  const state = {
    clock: still ? (options.at ?? INTRO_HOLD + MOVE + (HOLD + MOVE) + 2) : 0,
    flow: still ? 37 : 0,
    ballY: still ? REST_Y : 17,
    ballV: 0,
    dropAt: 0.55,
    dropped: still,
    hits: [still ? 9 : 99, 0, 99, 0] as [number, number, number, number],
    boost: 0,
    boostHeld: false,
    pointer: [0, 0] as [number, number],
    pointerSmooth: [0, 0] as [number, number],
    shake: 0,
    heat: 1,
    beat: 0,
    emitCarry: 0,
    visible: true,
    alive: true,
    scroll: 0,
    scrollSmooth: 0,
    lowPower: false,
    skip: false,
  };
  const particles: Spark[] = [];

  const rand = (a: number, b: number) => a + Math.random() * (b - a);

  const spawn = (s: Spark) => {
    if (particles.length < MAX_SPARKS) particles.push(s);
  };

  const splash = (strength: number) => {
    const count = Math.round(170 * strength);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(2, 9) * (0.4 + strength);
      const lav = Math.random() < 0.35;
      spawn({
        p: [Math.cos(a) * 0.95, 0.2, Math.sin(a) * 0.95],
        v: [Math.cos(a) * sp, rand(3, 11) * (0.5 + strength), Math.sin(a) * sp],
        life: rand(0.5, 1.3),
        age: 0,
        size: lav ? rand(0.03, 0.06) : rand(0.018, 0.04),
        hue: lav ? 1 : 0,
      });
    }
  };

  const impact = (speed: number) => {
    const strength = clamp(speed / 26, 0, 1);
    if (strength < 0.06) return;
    state.hits = [0, strength, state.hits[0], state.hits[1]];
    state.shake = Math.max(state.shake, strength);
    splash(strength);
  };

  // ambient embers drifting with the current
  for (let i = 0; i < 70; i++) {
    spawn({
      p: [rand(-14, 14), rand(0.3, 5), rand(-30, 8)],
      v: [rand(-0.2, 0.2), rand(-0.05, 0.25), 0],
      life: rand(4, 9),
      age: rand(0, 4),
      size: rand(0.012, 0.03),
      hue: 2,
    });
  }

  const stepSim = (dt: number) => {
    state.clock += dt;
    const wantBoost = state.boostHeld ? 1 : 0;
    state.boost += (wantBoost - state.boost) * (1 - Math.exp(-dt / (wantBoost > state.boost ? 0.35 : 0.9)));
    const speed = BASE_SPEED * (1 + (BOOST_SPEED - 1) * state.boost);
    state.flow = (state.flow + speed * dt) % FLOW_WRAP;
    // the music: fast attack, slow release
    const level = options.getLevel?.() ?? 0;
    state.beat += (level - state.beat) * (1 - Math.exp(-dt / (level > state.beat ? 0.04 : 0.32)));
    state.heat = 1 + 0.35 * state.boost + 0.6 * state.beat;

    // the ball
    if (!state.dropped && state.clock >= state.dropAt) state.dropped = true;
    if (state.dropped) {
      state.ballV -= GRAVITY * dt;
      state.ballY += state.ballV * dt;
      if (state.ballY <= REST_Y && state.ballV < 0) {
        const hitSpeed = -state.ballV;
        state.ballY = REST_Y;
        impact(hitSpeed);
        state.ballV = hitSpeed > 2.2 ? hitSpeed * 0.33 : 0;
      }
      if (state.ballY <= REST_Y + 1e-3 && Math.abs(state.ballV) < 1e-3) {
        // riding the ridges: a small bob
        state.ballY = REST_Y + 0.012 * Math.sin(state.clock * 9.0) * (0.4 + state.boost);
      }
    }
    state.hits[0] += dt;
    state.hits[2] += dt;
    state.shake *= Math.exp(-dt * 3.2);

    // sparks where the lava meets the ball
    const settled = clamp(1 - (state.ballY - REST_Y) / 0.9, 0, 1);
    const lavaNear = Math.exp(-Math.abs(meander(-state.flow)) * 2.2) * settled;
    state.emitCarry += dt * (14 + 70 * state.boost + 45 * state.beat) * lavaNear;
    while (state.emitCarry >= 1) {
      state.emitCarry -= 1;
      const side = Math.random() < 0.5 ? -1 : 1;
      const ang = rand(0.1, 0.9);
      spawn({
        p: [side * Math.cos(ang) * 0.9, rand(0.1, 0.3), Math.sin(ang) * 0.9],
        v: [side * rand(0.4, 2.6), rand(1.5, 5.5) * (1 + state.boost * 0.6), speed * rand(0.5, 1.2) + rand(0, 2)],
        life: rand(0.35, 0.9),
        age: 0,
        size: rand(0.012, 0.03),
        hue: 0,
      });
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const s = particles[i];
      s.age += dt;
      if (s.hue === 2) {
        s.p[0] += s.v[0] * dt;
        s.p[1] += s.v[1] * dt;
        s.p[2] += (speed * 0.95) * dt;
        if (s.p[2] > 9 || s.age > s.life) {
          s.p = [rand(-14, 14), rand(0.3, 5), rand(-34, -20)];
          s.age = 0;
        }
        continue;
      }
      s.v[1] -= (s.hue === 1 ? 20 : 11) * dt;
      s.v[0] *= Math.exp(-dt * 0.6);
      s.v[2] += (speed - s.v[2]) * (1 - Math.exp(-dt * 1.5)) * 0.5;
      s.p[0] += s.v[0] * dt;
      s.p[1] += s.v[1] * dt;
      s.p[2] += s.v[2] * dt;
      if (s.age > s.life || s.p[1] < -0.05) particles.splice(i, 1);
    }
  };

  /* ---------------- camera ---------------- */

  const cam = {
    pos: [0, 0, 0] as Vec3,
    right: [1, 0, 0] as Vec3,
    up: [0, 1, 0] as Vec3,
    fwd: [0, 0, -1] as Vec3,
    focal: 1,
    shift: [0, 0] as [number, number],
  };

  const placeCamera = () => {
    const shot = shotAt(state.clock);
    const t = state.clock;
    const b = state.boost;
    const ps = state.pointerSmooth;
    // tall screens see a lot of far field: look further down and pull back a bit
    const portrait = clamp(1 - width / height, 0, 0.5);
    // scrolling the page lifts the camera away, like pulling back from the scene
    const sc = state.scrollSmooth;
    const az = shot.az + ps[0] * 0.3 + Math.sin(t * 0.21) * 0.05 + sc * 0.25;
    const el = clamp(lerp(shot.el + portrait * 0.55 + sc * 0.35 - ps[1] * 0.1, 0.075, b * 0.65), 0.06, 1.35);
    const dist = shot.dist * (1 - 0.17 * b) * (1 + portrait * 0.35) * (1 + sc * 0.45);
    const fov = shot.fov + 20 * b;
    const sh = state.shake * 0.12 + b * 0.025 + state.beat * 0.012;
    const target: Vec3 = [
      shot.target[0] + Math.sin(t * 1.31) * 0.03 + Math.sin(t * 23.0) * sh,
      shot.target[1] + REST_Y + (state.ballY - REST_Y) * 0.25 + Math.sin(t * 1.73 + 1) * 0.025 + Math.sin(t * 19.0 + 2) * sh,
      shot.target[2],
    ];
    const pos: Vec3 = [
      target[0] + dist * Math.sin(az) * Math.cos(el),
      target[1] + dist * Math.sin(el),
      target[2] + dist * Math.cos(az) * Math.cos(el),
    ];
    pos[1] = Math.max(pos[1], 0.55);
    const fwd = norm([target[0] - pos[0], target[1] - pos[1], target[2] - pos[2]]);
    let right = norm(cross(fwd, [0, 1, 0]));
    let upv = cross(right, fwd);
    const roll = shot.roll + ps[0] * -0.03 + Math.sin(t * 0.37) * 0.01;
    const c = Math.cos(roll);
    const s = Math.sin(roll);
    const r2: Vec3 = [right[0] * c + upv[0] * s, right[1] * c + upv[1] * s, right[2] * c + upv[2] * s];
    const u2: Vec3 = [upv[0] * c - right[0] * s, upv[1] * c - right[1] * s, upv[2] * c - right[2] * s];
    right = r2;
    upv = u2;
    cam.pos = pos;
    cam.right = right;
    cam.up = upv;
    cam.fwd = fwd;
    cam.focal = 1 / Math.tan((fov * Math.PI) / 360);
    // on wide screens the content sits in the middle: frame the ball to the right of it
    const wide = clamp((width / height - 1.1) * 1.6, 0, 0.95);
    cam.shift = [wide * (1 - 0.6 * b), 0];
  };

  /** Project a world point to clip space (null if behind the camera). */
  const project = (p: Vec3, w: number, h: number): [number, number, number] | null => {
    const d: Vec3 = [p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]];
    const z = dot(d, cam.fwd);
    if (z < 0.15) return null;
    const m = Math.min(w, h);
    const ux = (dot(d, cam.right) / z) * cam.focal + cam.shift[0];
    const uy = (dot(d, cam.up) / z) * cam.focal + cam.shift[1];
    return [(ux * m) / w, (uy * m) / h, z];
  };

  /** Is the segment from the camera to `p` blocked by the ball? */
  const hiddenByBall = (p: Vec3) => {
    const ball: Vec3 = [0, state.ballY, 0];
    const d: Vec3 = [p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]];
    const len = Math.hypot(d[0], d[1], d[2]);
    const rd: Vec3 = [d[0] / len, d[1] / len, d[2] / len];
    const oc: Vec3 = [cam.pos[0] - ball[0], cam.pos[1] - ball[1], cam.pos[2] - ball[2]];
    const b = dot(oc, rd);
    const c = dot(oc, oc) - 1;
    const h = b * b - c;
    if (h < 0) return false;
    const t = -b - Math.sqrt(h);
    return t > 0 && t < len;
  };

  /* ---------------- drawing ---------------- */

  const fullscreen = () => {
    gl.bindVertexArray(quadVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const buildSparks = (w: number, h: number) => {
    let n = 0;
    const px = 2 / Math.min(w, h);
    const push = (x: number, y: number, u: number, v: number, c: [number, number, number, number]) => {
      const o = n * FLOATS_PER_VERT;
      sparkData[o] = x;
      sparkData[o + 1] = y;
      sparkData[o + 2] = u;
      sparkData[o + 3] = v;
      sparkData[o + 4] = c[0];
      sparkData[o + 5] = c[1];
      sparkData[o + 6] = c[2];
      sparkData[o + 7] = c[3];
      n++;
    };
    const stretch = 0.03 + 0.05 * state.boost;
    for (const s of particles) {
      if (hiddenByBall(s.p)) continue;
      const head = project(s.p, w, h);
      if (!head) continue;
      const tailP: Vec3 = [s.p[0] - s.v[0] * stretch, s.p[1] - s.v[1] * stretch, s.p[2] - s.v[2] * stretch];
      const tail = project(tailP, w, h);
      if (!tail) continue;
      const k = s.age / s.life;
      let color: [number, number, number, number];
      if (s.hue === 0) {
        const heat = 1 - k;
        color = [3.2 * heat + 0.6, 1.9 * heat * heat + 0.15, 0.5 * heat * heat * heat, 1 - k * k];
      } else if (s.hue === 1) {
        color = [1.1, 0.85, 1.9, (1 - k) * 0.9];
      } else {
        const fade = Math.sin(Math.PI * clamp(k, 0, 1));
        color = [1.4, 0.55, 0.9, fade * 0.4];
      }
      const aspectX = h / Math.min(w, h);
      const aspectY = w / Math.min(w, h);
      // screen-space direction from tail to head, in pixel-uniform units
      let dx = (head[0] - tail[0]) * aspectY;
      let dy = (head[1] - tail[1]) * aspectX;
      let len = Math.hypot(dx, dy);
      const maxLen = (s.hue === 2 ? 14 : 40) * px;
      if (len > maxLen) {
        dx *= maxLen / len;
        dy *= maxLen / len;
        len = maxLen;
      }
      const sizePx = clamp((s.size / head[2]) * cam.focal * Math.min(w, h) * 0.5, 1.4, 4.5);
      // embers that drift right past the lens would only smear the frame
      if (s.hue === 2) color[3] *= clamp((head[2] - 1.5) / 3, 0, 1);
      const half = sizePx * px;
      if (len < 1e-5) {
        dx = 0;
        dy = half;
      }
      const l = Math.max(len, 1e-5);
      const nx = (-dy / l) * half;
      const ny = (dx / l) * half;
      // extend a little past the head so the bright end is round
      const ex = (dx / l) * half;
      const ey = (dy / l) * half;
      const toClip = (x: number, y: number): [number, number] => [x / aspectY, y / aspectX];
      const hx = head[0] * aspectY + ex;
      const hy = head[1] * aspectX + ey;
      const tx = head[0] * aspectY - dx - (len < 1e-5 ? ex * 2 : 0);
      const ty = head[1] * aspectX - dy - (len < 1e-5 ? ey * 2 : 0);
      const a = toClip(tx + nx, ty + ny);
      const b = toClip(tx - nx, ty - ny);
      const c = toClip(hx + nx, hy + ny);
      const d = toClip(hx - nx, hy - ny);
      push(a[0], a[1], 1, 0, color);
      push(b[0], b[1], -1, 0, color);
      push(c[0], c[1], 1, 1, color);
      push(c[0], c[1], 1, 1, color);
      push(b[0], b[1], -1, 0, color);
      push(d[0], d[1], -1, 1, color);
      if (n >= MAX_SPARKS * 6) break;
    }
    return n;
  };

  const render = () => {
    if (!sceneTarget) return;
    placeCamera();
    const st = sceneTarget;

    // 1. scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, st.fb);
    gl.viewport(0, 0, st.w, st.h);
    gl.disable(gl.BLEND);
    gl.useProgram(scene.program);
    const u = scene.u;
    gl.uniform2f(u.uRes, st.w, st.h);
    gl.uniform3fv(u.uCamPos, cam.pos);
    gl.uniform3fv(u.uCamRight, cam.right);
    gl.uniform3fv(u.uCamUp, cam.up);
    gl.uniform3fv(u.uCamFwd, cam.fwd);
    gl.uniform1f(u.uFocal, cam.focal);
    gl.uniform2f(u.uShift, cam.shift[0], cam.shift[1]);
    gl.uniform1f(u.uTime, state.clock % 1000);
    gl.uniform1f(u.uFlow, state.flow);
    gl.uniform3f(u.uBall, 0, state.ballY, 0);
    gl.uniform1f(u.uSettle, clamp(1 - (state.ballY - REST_Y) / 0.9, 0, 1));
    gl.uniform4f(u.uHits, state.hits[0], state.hits[1], state.hits[2], state.hits[3]);
    gl.uniform1f(u.uBoost, state.boost);
    gl.uniform1f(u.uHeat, state.heat);
    gl.uniform1f(u.uEnc, enc);
    fullscreen();

    // 2. sparks, additive, into the scene so they bloom
    const count = buildSparks(st.w, st.h);
    if (count) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(sparks.program);
      gl.uniform1f(sparks.u.uEnc, enc);
      gl.bindVertexArray(sparkVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, sparkData, 0, count * FLOATS_PER_VERT);
      gl.drawArrays(gl.TRIANGLES, 0, count);
      gl.disable(gl.BLEND);
    }

    // 3. bloom
    gl.useProgram(down.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(down.u.uTex, 0);
    let src: Target = st;
    bloom.forEach((dst, i) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
      gl.viewport(0, 0, dst.w, dst.h);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform2f(down.u.uTexel, 1 / src.w, 1 / src.h);
      gl.uniform1f(down.u.uPrefilter, i === 0 ? 1 : 0);
      gl.uniform1f(down.u.uDec, 1 / enc);
      fullscreen();
      src = dst;
    });
    gl.useProgram(up.program);
    gl.uniform1i(up.u.uTex, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = bloom.length - 1; i > 0; i--) {
      const from = bloom[i];
      const to = bloom[i - 1];
      gl.bindFramebuffer(gl.FRAMEBUFFER, to.fb);
      gl.viewport(0, 0, to.w, to.h);
      gl.bindTexture(gl.TEXTURE_2D, from.tex);
      gl.uniform2f(up.u.uTexel, 1 / from.w, 1 / from.h);
      fullscreen();
    }
    gl.disable(gl.BLEND);

    // 4. composite to the screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(composite.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, st.tex);
    gl.uniform1i(composite.u.uScene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bloom[0].tex);
    gl.uniform1i(composite.u.uBloom, 1);
    gl.activeTexture(gl.TEXTURE0);
    const focus = project([0, state.ballY, 0], st.w, st.h);
    gl.uniform2f(composite.u.uFocus, focus ? focus[0] * 0.5 + 0.5 : 0.5, focus ? focus[1] * 0.5 + 0.5 : 0.5);
    gl.uniform2f(composite.u.uRes, width, height);
    gl.uniform1f(composite.u.uBoost, state.boost);
    gl.uniform1f(composite.u.uTime, state.clock % 1000);
    gl.uniform1f(composite.u.uDec, 1 / enc);
    gl.uniform1f(composite.u.uFade, still ? 1 : clamp(state.clock / 0.9, 0, 1));
    gl.uniform1f(composite.u.uBloomGain, (floatTargets ? 0.55 : 0.7) * (1 + 0.4 * state.boost + 0.35 * state.beat));
    fullscreen();
  };

  /* ---------------- loop ---------------- */

  let raf = 0;
  let last = 0;
  let slowFrames = 0;
  let readySent = false;

  const frame = (now: number) => {
    raf = 0;
    if (!state.alive) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    const raw = last ? now - last : 16;
    last = now;

    // drop resolution if the GPU cannot keep up
    if (raw > 26 && raw < 250) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 45 && quality > 0.45) {
      quality = Math.max(0.45, quality * 0.82);
      slowFrames = 0;
      allocate();
    }

    const k = 1 - Math.exp(-dt / 0.45);
    state.pointerSmooth[0] += (state.pointer[0] - state.pointerSmooth[0]) * k;
    state.pointerSmooth[1] += (state.pointer[1] - state.pointerSmooth[1]) * k;

    state.scrollSmooth += (state.scroll - state.scrollSmooth) * (1 - Math.exp(-dt / 0.3));
    stepSim(dt);
    state.skip = state.lowPower && !state.skip;
    if (!state.skip) render();
    if (!readySent) {
      readySent = true;
      options.onReady?.();
    }
    if (state.visible) raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (still || raf || !state.alive || !state.visible) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  };

  const drawStill = () => {
    placeCamera();
    render();
    if (!readySent) {
      readySent = true;
      options.onReady?.();
    }
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    state.alive = false;
    cancelAnimationFrame(raf);
    options.onError?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  allocate();
  if (still) drawStill();
  else wake();

  return {
    setPointer(x, y) {
      state.pointer = [clamp(x, -1, 1), clamp(y, -1, 1)];
    },
    releasePointer() {
      state.pointer = [0, 0];
    },
    setBoost(on) {
      state.boostHeld = on;
    },
    jump() {
      if (!state.dropped || state.ballY > REST_Y + 0.2) return;
      state.ballV = 10.5;
      state.ballY = REST_Y + 0.01;
    },
    setVisible(visible) {
      state.visible = visible;
      if (visible) wake();
    },
    setScroll(progress) {
      // a still frame stays put: redrawing on every scroll event is not worth it
      if (!still) state.scroll = clamp(progress, 0, 1);
    },
    setLowPower(low) {
      state.lowPower = low;
    },
    resize() {
      allocate();
      if (still) drawStill();
    },
    destroy() {
      state.alive = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("webglcontextlost", onLost);
      if (sceneTarget) freeTarget(sceneTarget);
      bloom.forEach(freeTarget);
      programs.forEach((p) => gl.deleteProgram(p.program));
      gl.deleteBuffer(quadBuf);
      gl.deleteBuffer(sparkBuf);
      gl.deleteVertexArray(quadVao);
      gl.deleteVertexArray(sparkVao);
    },
  };
}
