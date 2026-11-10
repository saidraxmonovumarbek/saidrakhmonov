/**
 * Procedural pixel-art landscape for the home page banner.
 *
 * Nothing here is an image file: the whole scene (sky, mountains, cliffs,
 * waterfalls, trees) is generated from seeded noise into a tiny 380x100
 * pixel buffer, then animated at ~12fps like a GIF. The canvas is scaled
 * up with `image-rendering: pixelated`.
 *
 * Want a different landscape? Change SEED. Want different colours? Edit
 * the two palettes at the bottom of this file.
 */

export type SceneTheme = "day" | "night";

export const SCENE_W = 380;
export const SCENE_H = 100;

const W = SCENE_W;
const H = SCENE_H;
/** y of the waterline */
const WL = 79;
const SEED = 7;

/* ------------------------------------------------------------------ */
/* colour helpers (pixels are packed 0xAABBGGRR for Uint32 ImageData)  */
/* ------------------------------------------------------------------ */

function rgb(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

function mix(a: number, b: number, t: number): number {
  const ar = a & 255;
  const ag = (a >> 8) & 255;
  const ab = (a >> 16) & 255;
  const br = b & 255;
  const bg = (b >> 8) & 255;
  const bb = (b >> 16) & 255;
  const r = (ar + (br - ar) * t) | 0;
  const g = (ag + (bg - ag) * t) | 0;
  const bl = (ab + (bb - ab) * t) | 0;
  return ((255 << 24) | (bl << 16) | (g << 8) | r) >>> 0;
}

/* ------------------------------------------------------------------ */
/* noise helpers                                                       */
/* ------------------------------------------------------------------ */

function hash1(n: number, seed: number): number {
  let h = Math.imul((n | 0) ^ Math.imul(seed | 0, 374761393), 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function hash2(x: number, y: number, seed: number): number {
  return hash1(Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663), seed);
}

const smooth = (f: number) => f * f * (3 - 2 * f);

function noise1(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = smooth(x - i);
  const a = hash1(i, seed);
  return a + (hash1(i + 1, seed) - a) * f;
}

function fbm1(x: number, seed: number, octaves = 4): number {
  let amp = 0.5;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise1(x, seed + o * 17) * amp;
    norm += amp;
    amp *= 0.5;
    x *= 2.03;
  }
  return sum / norm;
}

function noise2(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** ordered-dither threshold in (0, 1) */
const bayer = (x: number, y: number) =>
  (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

/* ------------------------------------------------------------------ */
/* palettes                                                            */
/* ------------------------------------------------------------------ */

interface Palette {
  sky: number[];
  farLit: number;
  farShade: number;
  snow: number;
  snowShade: number;
  midLit: number;
  midShade: number;
  forest: [number, number, number];
  rock: [number, number, number, number]; // dark -> light
  rockFar: [number, number, number, number];
  grass: [number, number, number]; // dark, mid, light
  leaf: [number, number, number];
  leafFar: [number, number, number];
  fg: [number, number, number];
  trunk: [number, number];
  water: [number, number]; // tint near, deep
  fall: [number, number, number]; // highlight, light, body
  foam: number;
  shimmer: number;
  cloud: [number, number];
  bird: number;
  ray: number;
  star: number;
  firefly: number;
  moon: [number, number];
}

function palette(theme: SceneTheme): Palette {
  const p = (...hexes: string[]) => hexes.map(rgb);
  if (theme === "night") {
    return {
      sky: p("#0b1026", "#101a3a", "#17264d", "#22355f", "#2f4a73", "#44638a"),
      farLit: rgb("#31476b"),
      farShade: rgb("#263a5c"),
      snow: rgb("#9fb6d6"),
      snowShade: rgb("#6c86b0"),
      midLit: rgb("#1f3a4f"),
      midShade: rgb("#182f43"),
      forest: p("#0f2434", "#153042", "#1c3d4f") as [number, number, number],
      rock: p("#141c2e", "#1d2940", "#2a3a55", "#3c4f6d") as Palette["rock"],
      rockFar: p("#1a2640", "#24334f", "#30435f", "#405675") as Palette["rock"],
      grass: p("#0f2d33", "#184148", "#24585a") as [number, number, number],
      leaf: p("#0d262f", "#153a40", "#205052") as [number, number, number],
      leafFar: p("#132c3b", "#1a3d49", "#24505a") as [number, number, number],
      fg: p("#050b14", "#0a1622", "#10232f") as [number, number, number],
      trunk: p("#070c15", "#131c2a") as [number, number],
      water: p("#1a3358", "#0d1b38") as [number, number],
      fall: p("#e4f1ff", "#a9c8ee", "#6f95cc") as [number, number, number],
      foam: rgb("#dcebff"),
      shimmer: rgb("#b9d2f5"),
      cloud: p("#33486f", "#26385a") as [number, number],
      bird: rgb("#0a1220"),
      ray: rgb("#cfe0ff"),
      star: rgb("#f4f7ff"),
      firefly: rgb("#e9ff8a"),
      moon: p("#f6f3e4", "#d4d3c8") as [number, number],
    };
  }
  return {
    sky: p("#7fb6d5", "#96c6dc", "#b1d6e0", "#cbe4e0", "#e2eedb", "#f1f1d3"),
    farLit: rgb("#a9c3cb"),
    farShade: rgb("#8fb0bd"),
    snow: rgb("#f4f8f6"),
    snowShade: rgb("#cfe0e4"),
    midLit: rgb("#6f9d92"),
    midShade: rgb("#5a897f"),
    forest: p("#2c5a4c", "#3a6f59", "#4c8767") as [number, number, number],
    rock: p("#33414d", "#4a5c69", "#657a86", "#8a9da5") as Palette["rock"],
    rockFar: p("#4d606b", "#627783", "#7d929b", "#9db0b5") as Palette["rock"],
    grass: p("#2e6a3d", "#4c9449", "#7cbf5e") as [number, number, number],
    leaf: p("#1f5136", "#2f7443", "#55a352") as [number, number, number],
    leafFar: p("#31654c", "#43805a", "#68a66a") as [number, number, number],
    fg: p("#0e2a1c", "#184226", "#2a6534") as [number, number, number],
    trunk: p("#2a1f1a", "#4a382b") as [number, number],
    water: p("#4f93a3", "#2d6781") as [number, number],
    fall: p("#ffffff", "#d9f1f4", "#a9d7e2") as [number, number, number],
    foam: rgb("#ffffff"),
    shimmer: rgb("#e6f7f2"),
    cloud: p("#ffffff", "#dcebed") as [number, number],
    bird: rgb("#22313a"),
    ray: rgb("#fff9d6"),
    star: rgb("#ffffff"),
    firefly: rgb("#ffffff"),
    moon: p("#ffffff", "#eeeeee") as [number, number],
  };
}

/* ------------------------------------------------------------------ */
/* drawing primitives                                                  */
/* ------------------------------------------------------------------ */

type Layer = Uint32Array;

function put(l: Layer, x: number, y: number, c: number) {
  if (x >= 0 && x < W && y >= 0 && y < H) l[y * W + x] = c;
}

/** Leafy blob lit from the upper left. */
function blob(
  l: Layer,
  cx: number,
  cy: number,
  r: number,
  cols: [number, number, number],
  seed: number,
) {
  const r0 = Math.ceil(r + 2);
  for (let y = -r0; y <= r0; y++) {
    for (let x = -r0; x <= r0; x++) {
      const px = Math.round(cx) + x;
      const py = Math.round(cy) + y;
      const edge = r + (hash2(px, py, seed) - 0.5) * 2.2;
      const d = Math.sqrt(x * x + y * y * 1.25);
      if (d > edge) continue;
      const lit =
        (-x * 0.55 - y * 0.85) / r / 2 +
        0.5 +
        (hash2(px, py, seed + 3) - 0.5) * 0.5;
      put(l, px, py, lit > 0.68 ? cols[2] : lit > 0.36 ? cols[1] : cols[0]);
    }
  }
}

function pine(
  l: Layer,
  cx: number,
  baseY: number,
  h: number,
  cols: [number, number, number],
  trunk: number,
  seed: number,
) {
  put(l, cx, baseY, trunk);
  put(l, cx, baseY - 1, trunk);
  const rows = h - 2;
  for (let r = 0; r < rows; r++) {
    const y = baseY - 2 - (rows - 1 - r);
    const half = Math.round((r % 4) * 0.55 + r * 0.26);
    for (let x = -half; x <= half; x++) {
      const n = hash2(cx + x, y, seed);
      const c = x < 0 && n > 0.35 ? cols[2] : x <= 0 || n > 0.6 ? cols[1] : cols[0];
      put(l, cx + x, y, c);
    }
  }
}

/* ------------------------------------------------------------------ */
/* scene                                                               */
/* ------------------------------------------------------------------ */

interface Fall {
  x0: number;
  x1: number;
  top: number[]; // top y per column
  bottom: number;
  speed: number;
}

interface CloudSprite {
  w: number;
  h: number;
  px: Uint8Array; // 0 empty, 1 light, 2 shade
  y: number;
  x0: number;
  speed: number;
}

export interface Scene {
  render(tick: number, out: Uint32Array): void;
}

export function createScene(theme: SceneTheme): Scene {
  const P = palette(theme);
  const night = theme === "night";

  const back = new Uint32Array(W * H);
  const mid = new Uint32Array(W * H); // 0 = transparent
  const fg = new Uint32Array(W * H); // 0 = transparent
  const falls: Fall[] = [];

  /* ---- sky ---- */
  const stops = P.sky.length - 1;
  for (let y = 0; y < H; y++) {
    const t = Math.min(1, y / WL) * stops;
    const i = Math.min(stops - 1, Math.floor(t));
    // keep flat bands of colour and only dither where two bands meet
    const f = Math.min(1, Math.max(0, (t - i - 0.28) / 0.44));
    for (let x = 0; x < W; x++) {
      back[y * W + x] = f > bayer(x, y) ? P.sky[i + 1] : P.sky[i];
    }
  }

  /* ---- moon ---- */
  if (night) {
    const mx = 214;
    const my = 20;
    for (let y = -14; y <= 14; y++) {
      for (let x = -14; x <= 14; x++) {
        const d = Math.sqrt(x * x + y * y);
        if (d <= 6.4) {
          const crater =
            (x + 2) * (x + 2) + (y - 1) * (y - 1) < 3 ||
            (x - 2) * (x - 2) + (y + 3) * (y + 3) < 2;
          put(back, mx + x, my + y, crater ? P.moon[1] : P.moon[0]);
        } else if (d < 13 && (13 - d) / 13 > bayer(mx + x, my + y) * 1.6) {
          put(back, mx + x, my + y, P.sky[3]);
        }
      }
    }
  }

  /* ---- far mountains ---- */
  const farTop: number[] = [];
  for (let x = 0; x < W; x++) {
    farTop[x] = Math.round(
      50 - fbm1(x * 0.021 + 3, SEED, 5) * 34 - noise1(x * 0.008, SEED + 5) * 6,
    );
  }
  for (let x = 0; x < W; x++) {
    const slope = farTop[Math.min(W - 1, x + 2)] - farTop[Math.max(0, x - 2)];
    for (let y = farTop[x]; y < WL; y++) {
      const depth = y - farTop[x];
      const lit = slope > 0 || (slope === 0 && hash2(x, y, 9) > 0.5);
      let c = lit ? P.farLit : P.farShade;
      const snowLine = 5 + hash1(x >> 1, 31) * 5 - (farTop[x] < 26 ? -4 : 0);
      if (farTop[x] < 34 && depth < snowLine) c = lit ? P.snow : P.snowShade;
      // haze towards the base
      const haze = (y - 52) / 30;
      if (haze > bayer(x, y)) c = P.sky[stops - 1];
      mid[y * W + x] = c;
    }
  }

  /* ---- mid mountains (forested) ---- */
  const midTop: number[] = [];
  for (let x = 0; x < W; x++) {
    midTop[x] = Math.round(
      68 - fbm1(x * 0.028 + 40, SEED + 2, 4) * 20 - (hash1(x, 77) > 0.6 ? 1 : 0),
    );
  }
  for (let x = 0; x < W; x++) {
    const slope = midTop[Math.min(W - 1, x + 2)] - midTop[Math.max(0, x - 2)];
    for (let y = midTop[x]; y < WL; y++) {
      const n = noise2(x * 0.35, y * 0.5, 21);
      mid[y * W + x] = slope > 0 || n > 0.62 ? P.midLit : P.midShade;
    }
  }

  /* ---- far shoreline forest ---- */
  for (let x = -2; x < W + 2; x += 2) {
    const h = 4 + Math.floor(hash1(x, 91) * 5);
    pine(mid, x + (hash1(x, 92) > 0.5 ? 1 : 0), WL - 1, h, P.forest, P.forest[0], x);
  }

  /* ---- cliffs ---- */
  const cliff = (opts: {
    x0: number;
    x1: number;
    base: number;
    amp: number;
    seed: number;
    rock: Palette["rock"];
    leaf: [number, number, number];
    fallsAt: { x0: number; x1: number; from?: number; speed: number }[];
    arch?: { cx: number; cy: number; rx: number; ry: number };
    taperL: number;
    taperR: number;
  }) => {
    const { x0, x1, base, amp, seed, rock, leaf } = opts;
    const top: number[] = [];
    for (let x = x0; x <= x1; x++) {
      let y = base + (fbm1(x * 0.045, seed, 3) - 0.5) * amp * 2;
      // stepped shoulders on each side
      const dl = x - x0;
      const dr = x1 - x;
      if (opts.taperL && dl < opts.taperL) {
        const k = 1 - dl / opts.taperL;
        y += Math.floor(k * 5) * ((WL - base) / 5) * 0.9;
      }
      if (opts.taperR && dr < opts.taperR) {
        const k = 1 - dr / opts.taperR;
        y += Math.floor(k * 5) * ((WL - base) / 5) * 0.9;
      }
      top[x] = Math.min(WL - 1, Math.round(y));
    }
    // river lips where the water leaves the plateau
    for (const f of opts.fallsAt) {
      if (f.from != null) continue;
      let lip = 0;
      for (let x = f.x0; x <= f.x1; x++) lip = Math.max(lip, top[x]);
      for (let x = f.x0 - 1; x <= f.x1 + 1; x++) top[x] = lip + 1;
    }

    for (let x = x0; x <= x1; x++) {
      if (x < 0 || x >= W) continue;
      const colShade = noise1(x * 0.22, seed + 8);
      for (let y = top[x]; y < WL + 1; y++) {
        if (opts.arch) {
          const a = opts.arch;
          const ex = (x - a.cx) / a.rx;
          const ey = (y - a.cy) / a.ry;
          if (ex * ex + ey * ey < 1 && y <= a.cy + a.ry) continue;
        }
        const depth = y - top[x];
        // strata + vertical crevices
        let v =
          noise2(x * 0.16, y * 0.34, seed + 1) * 0.55 +
          colShade * 0.3 +
          noise2(x * 0.5, y * 0.12, seed + 2) * 0.25;
        v += (x - x0) / (x1 - x0) < 0.5 ? 0.06 : -0.06;
        if (hash2(x, y >> 1, seed + 4) > 0.9) v -= 0.2;
        let c = v > 0.66 ? rock[3] : v > 0.5 ? rock[2] : v > 0.36 ? rock[1] : rock[0];
        // ledge highlights
        if (
          noise2(x * 0.11, y * 0.9, seed + 6) > 0.74 &&
          hash2(x >> 2, y, seed + 7) > 0.3
        )
          c = rock[3];
        // darker, wet rock near the water
        if (y > WL - 3 && hash2(x, y, seed + 9) > 0.3) c = rock[0];
        // grass cap with hanging moss
        const cap = 2 + Math.floor(hash1(x, seed + 11) * 2.4);
        if (depth < cap) {
          c = depth === 0 ? P.grass[2] : depth === 1 ? P.grass[1] : P.grass[0];
        }
        mid[y * W + x] = c;
      }
    }

    // arch underside shading
    if (opts.arch) {
      const a = opts.arch;
      for (let x = a.cx - a.rx - 1; x <= a.cx + a.rx + 1; x++) {
        for (let y = a.cy - a.ry - 2; y <= a.cy; y++) {
          const ex = (x - a.cx) / (a.rx + 1.5);
          const ey = (y - a.cy) / (a.ry + 1.5);
          const inside =
            ((x - a.cx) / a.rx) ** 2 + ((y - a.cy) / a.ry) ** 2 < 1;
          if (!inside && ex * ex + ey * ey < 1 && mid[y * W + x] !== 0)
            put(mid, x, y, rock[0]);
        }
      }
    }

    // trees along the plateau
    for (let x = x0 + 3; x <= x1 - 3; x++) {
      if (x < 0 || x >= W) continue;
      const overFall = opts.fallsAt.some(
        (f) => f.from == null && x >= f.x0 - 3 && x <= f.x1 + 3,
      );
      if (overFall) continue;
      const steep = Math.abs(top[x] - top[Math.min(x1, x + 2)]) > 3;
      if (steep) continue;
      const r = hash1(x, seed + 13);
      if (r > 0.86) {
        pine(mid, x, top[x], 9 + Math.floor(hash1(x, seed + 14) * 9), leaf, P.trunk[0], x + seed);
      } else if (r > 0.7) {
        const rad = 2.5 + hash1(x, seed + 15) * 3;
        const hgt = 2 + Math.floor(hash1(x, seed + 16) * 4);
        for (let k = 0; k < hgt; k++) put(mid, x, top[x] - k, P.trunk[0]);
        blob(mid, x, top[x] - hgt - rad + 1, rad, leaf, x + seed);
      } else if (r > 0.6) {
        blob(mid, x, top[x] - 1, 2, leaf, x + seed);
      }
    }

    for (const f of opts.fallsAt) {
      const ft: number[] = [];
      for (let x = f.x0; x <= f.x1; x++) {
        const jitter = f.from != null ? Math.round(hash1(x, seed + 20) * 2) : 0;
        ft.push((f.from ?? top[x]) + jitter);
      }
      falls.push({ x0: f.x0, x1: f.x1, top: ft, bottom: WL, speed: f.speed });
      if (f.from != null) {
        // dark cave mouth the spring pours out of
        for (let x = f.x0 - 1; x <= f.x1 + 1; x++)
          for (let y = f.from - 2; y <= f.from; y++) put(mid, x, y, rock[0]);
      }
    }
  };

  // distant cliff on the right, with a stone arch
  cliff({
    x0: 226,
    x1: 352,
    base: 49,
    amp: 5,
    seed: SEED + 100,
    rock: P.rockFar,
    leaf: P.leafFar,
    fallsAt: [{ x0: 262, x1: 269, speed: 1.1 }],
    arch: { cx: 314, cy: 70, rx: 13, ry: 11 },
    taperL: 16,
    taperR: 0,
  });
  // main cliff on the left
  cliff({
    x0: -10,
    x1: 184,
    base: 36,
    amp: 6,
    seed: SEED + 200,
    rock: P.rock,
    leaf: P.leaf,
    fallsAt: [
      { x0: 98, x1: 113, speed: 1.6 },
      { x0: 146, x1: 150, from: 54, speed: 1.3 },
    ],
    taperL: 0,
    taperR: 22,
  });

  // boulders in the pool
  const boulder = (cx: number, r: number) => {
    for (let y = -r; y <= 0; y++)
      for (let x = -r - 1; x <= r + 1; x++) {
        if ((x * x) / ((r + 1) * (r + 1)) + (y * y) / (r * r) > 1) continue;
        put(mid, cx + x, WL + y, y < -r + 2 && x < 1 ? P.rock[2] : y === 0 ? P.rock[0] : P.rock[1]);
      }
  };
  boulder(124, 3);
  boulder(88, 2);
  boulder(204, 3);
  boulder(282, 2);

  /* ---- foreground ---- */
  const trunk = (pts: [number, number][], thickBase: number, thickTop: number) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = ax + (bx - ax) * t;
        const y = ay + (by - ay) * t;
        const k = (i + t) / (pts.length - 1);
        const th = thickBase + (thickTop - thickBase) * k;
        for (let d = -th / 2; d <= th / 2; d++) {
          const px = Math.round(x + d);
          const py = Math.round(y);
          const light = d < -th / 2 + 1.2 && hash2(px, py, 55) > 0.25;
          put(fg, px, py, light ? P.trunk[1] : P.trunk[0]);
        }
      }
    }
  };

  // left tree
  trunk([[9, 100], [14, 66], [12, 40], [17, 14]], 7, 3);
  trunk([[13, 52], [26, 42], [38, 36]], 2.4, 1.4);
  trunk([[14, 30], [26, 20]], 2, 1);
  const canopyL: [number, number, number][] = [
    [6, 10, 13], [26, 5, 11], [44, 9, 9], [-2, 30, 10], [24, 21, 8],
    [58, 3, 8], [42, 32, 7], [34, 22, 6], [8, 42, 6], [68, 10, 5],
  ];
  canopyL.forEach(([x, y, r], i) => blob(fg, x, y, r, P.fg, 300 + i));

  // right tree
  trunk([[374, 100], [368, 62], [371, 36], [366, 14]], 7, 3);
  trunk([[369, 48], [356, 40], [346, 37]], 2.2, 1.2);
  const canopyR: [number, number, number][] = [
    [366, 8, 11], [380, 22, 9], [348, 3, 8], [352, 22, 6], [340, 34, 5],
    [334, 6, 5], [378, 44, 6],
  ];
  canopyR.forEach(([x, y, r], i) => blob(fg, x, y, r, P.fg, 400 + i));

  // undergrowth
  const bushes: [number, number, number][] = [
    [0, 97, 9], [14, 100, 7], [27, 102, 6], [40, 103, 5],
    [380, 96, 10], [365, 100, 8], [350, 102, 6], [337, 103, 5],
  ];
  bushes.forEach(([x, y, r], i) => blob(fg, x, y, r, P.fg, 500 + i));

  /* ---- dynamic actors ---- */
  const clouds: CloudSprite[] = [];
  const cloudCount = night ? 4 : 6;
  for (let i = 0; i < cloudCount; i++) {
    const w = 26 + Math.floor(hash1(i, 600) * 30);
    const h = 9 + Math.floor(hash1(i, 601) * 4);
    const px = new Uint8Array(w * h);
    const lobes = 4 + Math.floor(hash1(i, 602) * 3);
    for (let k = 0; k < lobes; k++) {
      const cx = 5 + ((w - 10) * (k + 0.5)) / lobes + (hash2(i, k, 603) - 0.5) * 4;
      const r = 3 + hash2(i, k, 604) * (h - 5) * (1 - Math.abs((k + 0.5) / lobes - 0.5));
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const dx = x - cx;
          const dy = (y - (h - 1)) * 1.15;
          if (dx * dx + dy * dy <= r * r)
            px[y * w + x] = y >= h - 2 || (y >= h - 4 && dx > 0) ? 2 : 1;
        }
    }
    clouds.push({
      w,
      h,
      px,
      y: 3 + Math.floor(hash1(i, 605) * 30),
      x0: hash1(i, 606) * (W + 60),
      speed: 0.05 + hash1(i, 607) * 0.11,
    });
  }

  const stars: { x: number; y: number; ph: number; big: boolean }[] = [];
  if (night) {
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.floor(hash1(i, 700) * W),
        y: Math.floor(hash1(i, 701) * 58),
        ph: hash1(i, 702) * 6.28,
        big: hash1(i, 703) > 0.9,
      });
    }
  }

  const flies: { x: number; y: number; a: number; b: number; c: number }[] = [];
  if (night) {
    for (let i = 0; i < 16; i++) {
      const left = i % 2 === 0;
      flies.push({
        x: left ? 20 + hash1(i, 800) * 70 : 290 + hash1(i, 800) * 70,
        y: 55 + hash1(i, 801) * 38,
        a: hash1(i, 802) * 6.28,
        b: hash1(i, 803) * 6.28,
        c: hash1(i, 804) * 6.28,
      });
    }
  }

  const grass: { x: number; h: number; ph: number }[] = [];
  for (let i = 0; i < 46; i++) {
    const left = i < 23;
    grass.push({
      x: left ? 34 + Math.floor(hash1(i, 900) * 30) : 296 + Math.floor(hash1(i, 900) * 44),
      h: 2 + Math.floor(hash1(i, 901) * 5),
      ph: hash1(i, 902) * 6.28,
    });
  }

  const sprite = (out: Uint32Array, c: CloudSprite, ox: number) => {
    for (let y = 0; y < c.h; y++) {
      const py = c.y + y;
      if (py < 0 || py >= WL) continue;
      for (let x = 0; x < c.w; x++) {
        const v = c.px[y * c.w + x];
        if (!v) continue;
        const px = ox + x;
        if (px < 0 || px >= W) continue;
        out[py * W + px] = v === 1 ? P.cloud[0] : P.cloud[1];
      }
    }
  };

  /* ---- per-frame ---- */
  function render(tick: number, out: Uint32Array) {
    out.set(back);

    // stars
    for (const s of stars) {
      const tw = Math.sin(tick * 0.12 + s.ph);
      if (tw < -0.55) continue;
      const i = s.y * W + s.x;
      out[i] = tw > 0.5 ? P.star : mix(out[i], P.star, 0.55);
      if (s.big && tw > 0.75) {
        if (s.x > 0) out[i - 1] = mix(out[i - 1], P.star, 0.5);
        if (s.x < W - 1) out[i + 1] = mix(out[i + 1], P.star, 0.5);
        if (s.y > 0) out[i - W] = mix(out[i - W], P.star, 0.5);
        out[i + W] = mix(out[i + W], P.star, 0.5);
      }
    }

    // shooting star, every ~22s
    if (night) {
      const cyc = tick % 260;
      if (cyc < 9) {
        const n = Math.floor(tick / 260);
        const sx = 60 + hash1(n, 710) * 220 + cyc * 5;
        const sy = 4 + hash1(n, 711) * 14 + cyc * 2;
        for (let k = 0; k < 7; k++) {
          const x = Math.round(sx - k * 1.6);
          const y = Math.round(sy - k * 0.64);
          if (x >= 0 && x < W && y >= 0 && y < WL)
            out[y * W + x] = mix(out[y * W + x], P.star, 1 - k / 7);
        }
      }
    }

    // clouds drift right to left
    for (const c of clouds) {
      const span = W + c.w + 40;
      const x = Math.round(((c.x0 - tick * c.speed) % span + span) % span) - c.w - 20;
      sprite(out, c, x);
    }

    // birds
    if (!night) {
      for (let b = 0; b < 4; b++) {
        const span = W + 160;
        const bx = Math.round(((tick * (0.42 + b * 0.05) + b * 97) % span) - 30 - b * 9);
        const by = Math.round(14 + b * 5 + Math.sin(tick * 0.07 + b * 2) * 3);
        const up = ((tick + b * 3) >> 2) % 2 === 0;
        const pts = up
          ? [[-2, -1], [-1, 0], [0, 0], [1, 0], [2, -1]]
          : [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [0, 1]];
        for (const [dx, dy] of pts) {
          const x = bx + dx;
          const y = by + dy;
          if (x >= 0 && x < W && y >= 0 && y < WL) out[y * W + x] = P.bird;
        }
      }
    }

    // mountains, cliffs, trees
    for (let i = 0; i < W * WL + W; i++) {
      const c = mid[i];
      if (c !== 0) out[i] = c;
    }

    // waterfalls
    for (const f of falls) {
      const wdt = f.x1 - f.x0;
      for (let x = f.x0; x <= f.x1; x++) {
        const k = x - f.x0;
        const edge = k === 0 || k === wdt;
        const top = f.top[k];
        for (let y = top; y < f.bottom; y++) {
          const yy = Math.floor(y - tick * f.speed);
          const streak = hash2(x, Math.floor(yy / 4), 41);
          const fine = hash2(x, yy, 42);
          let c = P.fall[2];
          if (streak > 0.52) c = P.fall[1];
          if (streak > 0.8 || fine > 0.93) c = P.fall[0];
          if (edge && fine > 0.35) c = P.fall[2];
          if (y === top) c = P.fall[0];
          out[y * W + x] = c;
        }
      }
    }

    // light rays through the trees
    if (!night) {
      for (let y = 0; y < WL; y++) {
        for (let x = 0; x < 250; x++) {
          const u = x - y * 0.62;
          let inten = 0;
          for (let k = 0; k < 4; k++) {
            const centre = 18 + k * 44 + (k % 2) * 9;
            const width = 7 + (k % 3) * 3;
            const d = Math.abs(u - centre) / width;
            if (d < 1)
              inten = Math.max(
                inten,
                (1 - d) * (0.55 + 0.45 * Math.sin(tick * 0.045 + k * 1.9)),
              );
          }
          inten *= 1 - x / 250;
          if (inten * 0.8 > bayer(x, y)) {
            const i = y * W + x;
            out[i] = mix(out[i], P.ray, 0.36);
          }
        }
      }
    }

    // water: wobbling mirror of everything above the waterline
    for (let y = WL; y < H; y++) {
      const d = y - WL;
      const srcY = Math.max(0, WL - 1 - Math.floor(d * 1.7));
      const wob = Math.round(Math.sin(y * 1.1 + tick * 0.3) * (0.7 + d * 0.07));
      const tint = mix(P.water[0], P.water[1], d / (H - WL));
      const amt = 0.42 + d * 0.018;
      const drift = Math.floor((tick + hash1(y, 60) * 40) / 6);
      for (let x = 0; x < W; x++) {
        const sx = Math.min(W - 1, Math.max(0, x + wob));
        let c = mix(out[srcY * W + sx], tint, amt);
        if (hash2((x + drift) >> 2, y, 61 + (drift >> 3)) > 0.93)
          c = mix(c, P.shimmer, 0.6);
        out[y * W + x] = c;
      }
    }

    // foam and mist where the falls land
    for (const f of falls) {
      const flick = tick >> 1;
      for (let x = f.x0 - 3; x <= f.x1 + 3; x++) {
        for (let y = f.bottom - 3; y <= f.bottom + 1; y++) {
          const reach = y < f.bottom - 1 ? 0.62 : 0.3;
          if (hash2(x, y, 70 + flick) > reach && x >= 0 && x < W)
            out[y * W + x] = P.foam;
        }
      }
      const cx = (f.x0 + f.x1) / 2;
      const spread = (f.x1 - f.x0) / 2 + 4;
      const puffs = 5 + (f.x1 - f.x0 > 8 ? 4 : 0);
      for (let p = 0; p < puffs; p++) {
        const life = 26 + Math.floor(hash1(p, 80 + f.x0) * 14);
        const age = (tick + Math.floor(hash1(p, 81 + f.x0) * life)) % life;
        const k = age / life;
        const px = cx + (hash1(p, 82 + f.x0) - 0.5) * 2 * spread + k * (hash1(p, 83) - 0.5) * 8;
        const py = f.bottom - 2 - k * 9;
        const r = 2 + k * 3;
        const alpha = (1 - k) * 0.6;
        for (let y = Math.floor(py - r); y <= py + r; y++) {
          for (let x = Math.floor(px - r); x <= px + r; x++) {
            if (x < 0 || x >= W || y < 0 || y >= H) continue;
            const dd = ((x - px) * (x - px) + (y - py) * (y - py)) / (r * r);
            if (dd > 1) continue;
            if (alpha * (1 - dd * 0.6) > bayer(x, y))
              out[y * W + x] = mix(out[y * W + x], P.foam, 0.55);
          }
        }
      }
    }

    // foreground silhouettes
    for (let i = 0; i < W * H; i++) {
      const c = fg[i];
      if (c !== 0) out[i] = c;
    }

    // grass blades swaying at the bottom
    for (const g of grass) {
      const sway = Math.round(Math.sin(tick * 0.09 + g.ph));
      for (let k = 0; k < g.h; k++) {
        const x = g.x + (k >= g.h - 2 ? sway : 0);
        const y = H - 1 - k;
        if (x >= 0 && x < W) out[y * W + x] = k === g.h - 1 ? P.fg[2] : P.fg[1];
      }
    }

    // fireflies
    for (const fl of flies) {
      const on = Math.sin(tick * 0.16 + fl.c);
      if (on < 0.1) continue;
      const x = Math.round(fl.x + Math.sin(tick * 0.03 + fl.a) * 7);
      const y = Math.round(fl.y + Math.cos(tick * 0.04 + fl.b) * 4);
      if (x < 1 || x >= W - 1 || y < 1 || y >= H - 1) continue;
      const i = y * W + x;
      out[i] = P.firefly;
      if (on > 0.6) {
        out[i - 1] = mix(out[i - 1], P.firefly, 0.35);
        out[i + 1] = mix(out[i + 1], P.firefly, 0.35);
        out[i - W] = mix(out[i - W], P.firefly, 0.35);
        out[i + W] = mix(out[i + W], P.firefly, 0.35);
      }
    }
  }

  return { render };
}
