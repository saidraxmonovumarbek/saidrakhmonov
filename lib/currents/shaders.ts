/**
 * GLSL for the "currents" scene: a corrugated, liquid field of ridges that
 * flows around a chrome ball, with a ribbon of lava running through it.
 *
 * World units: the ball has radius 1 and sits at the origin. The fluid flows
 * toward +z (the ball "rolls" toward -z). Everything is analytic or
 * raymarched in one full-screen pass; bloom and grading happen after.
 */

export const FULLSCREEN_VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const COMMON = /* glsl */ `
precision highp float;
precision highp int;

uniform vec2  uRes;
uniform vec3  uCamPos;
uniform vec3  uCamRight;
uniform vec3  uCamUp;
uniform vec3  uCamFwd;
uniform float uFocal;
uniform float uTime;
uniform float uFlow;
uniform vec3  uBall;
uniform float uSettle;
uniform vec4  uHits;   // xy: seconds since / strength of last impact, zw: the one before
uniform float uBoost;
uniform float uHeat;
uniform float uEnc;

const float PI = 3.14159265;
const float TAU = 6.2831853;
const float P = 0.135;       // stripe period
const float H = 0.05;        // ridge height
const float A = 0.96;        // obstacle radius seen by the flow
const float LW = 0.16;       // half width of the lava ribbon (in stream units)
const vec3  L = vec3(-0.4466, 0.6253, -0.6402); // key light

const vec3 CREST  = vec3(0.60, 0.48, 0.96);
const vec3 VALLEY = vec3(0.028, 0.014, 0.065);
const vec3 KEY    = vec3(1.05, 0.95, 1.12);
const vec3 SKYC   = vec3(0.22, 0.15, 0.48);

float sq(float x) { return x * x; }

uint pcg(uvec2 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * 1664525u; v.y += v.x * 1664525u;
  v ^= v >> 16u;
  v.x += v.y * 1664525u; v.y += v.x * 1664525u;
  v ^= v >> 16u;
  return v.x;
}
float hash(vec2 i) { return float(pcg(uvec2(ivec2(i) + 65536))) * (1.0 / 4294967295.0); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  return noise(p) * 0.62 + noise(p * 2.07 + 13.1) * 0.27 + noise(p * 4.13 - 7.7) * 0.11;
}

// slow lateral drift of every line, carried along by the current
float meander(float s) {
  return 0.52 * sin(s * 0.155 + 1.7) + 0.26 * sin(s * 0.37 - 0.6) + 0.1 * sin(s * 0.83 + 2.2);
}

float ripple(float r, vec2 hit) {
  float tau = hit.x;
  float front = 0.6 + 3.6 * tau;
  return hit.y * exp(-tau * 0.75) * exp(-sq((r - front) / 1.05)) * sin((r - front) * 4.4);
}

struct Flow {
  float psi;   // stream function (lines are its level sets)
  float phi;   // potential (distance along the lines)
  float r;     // distance to the ball's axis
  float wake;  // turbulence behind the ball
  float ring;  // impact ripples
  float raw;   // stream value before the meander, for the lava's proximity to the ball
};

Flow flow(vec2 p) {
  Flow f;
  vec2 q = p - uBall.xz;
  float r0 = length(q);
  f.ring = ripple(r0, uHits.xy) + ripple(r0, uHits.zw);
  q += q / max(r0, 1e-3) * f.ring * 0.55;
  float r = length(q);
  f.r = r;
  float a2 = A * A * uSettle;
  float k = a2 / max(r * r, a2 * 0.6 + 1e-4);
  float psi = q.x * (1.0 - k);
  float phi = q.y * (1.0 + k);
  f.raw = psi;
  float s = phi - uFlow;
  psi += meander(s);

  float zr = q.y;
  float wd = 0.75 + 0.17 * max(zr, 0.0);
  float wake = uSettle * smoothstep(0.15, 1.5, zr) * exp(-max(zr, 0.0) * 0.05) * exp(-sq(f.raw / wd));
  f.wake = wake;
  if (wake > 0.01) {
    vec2 w = vec2(psi * 1.05, s * 0.42);
    float n1 = fbm(w);
    float n2 = noise(w * 1.9 + 9.1);
    psi += wake * ((n1 - 0.5) * 2.1 + (n2 - 0.5) * 0.7 + 0.42 * sin(s * 1.05 + psi * 1.7));
  }
  f.psi = psi;
  f.phi = phi;
  return f;
}

float ridge(float psi) {
  float c = 0.5 + 0.5 * cos(TAU * psi / P);
  return c * c * (3.0 - 2.0 * c);
}

float lavaMask(float psi) { return 1.0 - smoothstep(LW * 0.72, LW, abs(psi)); }

float heightOf(Flow f, float detail) {
  float h = H * detail * ridge(f.psi);
  h = mix(h, H * 0.4 * detail, lavaMask(f.psi));
  float men = uSettle * (0.3 * exp(-sq(max(f.r - 0.82, 0.0) / 0.34)));
  h += men;
  h -= 0.1 * f.wake;
  h += f.ring * 0.17;
  return h;
}

float fieldH(vec2 p, float detail) { return heightOf(flow(p), detail); }

vec3 lavaRamp(float x) {
  vec3 deep = vec3(0.55, 0.02, 0.22);
  vec3 pink = vec3(1.0, 0.08, 0.32);
  vec3 orange = vec3(1.0, 0.36, 0.04);
  vec3 gold = vec3(1.0, 0.78, 0.3);
  vec3 c = mix(deep, pink, smoothstep(0.0, 0.25, x));
  c = mix(c, orange, smoothstep(0.25, 0.6, x));
  return mix(c, gold, smoothstep(0.6, 1.0, x));
}

vec3 lavaEmission(Flow f) {
  float u = f.psi / LW;
  float core = 1.0 - u * u;
  float s = f.phi - uFlow;
  float n = fbm(vec2(f.psi * 9.0, s * 1.6));
  float m = noise(vec2(f.psi * 4.0 + 3.0, s * 0.7 - uTime * 0.6));
  float x = clamp(core * 0.8 + (n - 0.5) * 0.9 + (m - 0.5) * 0.35 - 0.08, 0.0, 1.0);
  return lavaRamp(x) * (0.9 + 2.2 * x * x * x) * uHeat;
}

vec3 sky(vec3 rd) {
  float y = rd.y;
  vec3 horizon = vec3(0.05, 0.026, 0.09);
  vec3 zenith = vec3(0.004, 0.002, 0.008);
  vec3 c = mix(horizon, zenith, pow(clamp(y + 0.02, 0.0, 1.0), 0.3));
  // the far end of the current glows faintly
  float ahead = max(dot(rd, normalize(vec3(0.0, 0.02, -1.0))), 0.0);
  c += vec3(0.6, 0.12, 0.32) * pow(ahead, 6.0) * exp(-abs(y) * 40.0) * 0.3;
  c += vec3(0.22, 0.08, 0.32) * exp(-abs(y) * 30.0) * 0.12;
  return c;
}

// what the chrome sees: a dark studio with a bright horizon band and a softbox
vec3 studio(vec3 rd) {
  float y = rd.y;
  vec3 c = mix(vec3(0.16, 0.14, 0.2), vec3(0.01, 0.01, 0.016), pow(clamp(y, 0.0, 1.0), 0.5));
  c += vec3(0.75, 0.7, 0.85) * exp(-abs(y - 0.04) * 16.0) * 0.6;
  c += vec3(1.0, 0.97, 1.05) * smoothstep(0.88, 0.94, dot(rd, L)) * 2.6;
  vec3 fill = normalize(vec3(0.8, 0.3, 0.35));
  c += vec3(0.55, 0.45, 0.95) * smoothstep(0.35, 1.0, dot(rd, fill)) * 0.22;
  return c;
}

vec3 fogColor(vec3 rd) { return sky(vec3(rd.x, min(rd.y, 0.0) * 0.2, rd.z)); }
`;

export const SCENE_FRAG = /* glsl */ `#version 300 es
${COMMON}
in vec2 vUv;
out vec4 outColor;

float sphSoftShadow(vec3 ro, vec3 rd, vec4 sph, float k) {
  vec3 oc = ro - sph.xyz;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - sph.w * sph.w;
  float h = b * b - c;
  float d = sqrt(max(0.0, sph.w * sph.w - h)) - sph.w;
  float t = -b - sqrt(max(h, 0.0));
  return (t < 0.0) ? 1.0 : smoothstep(0.0, 1.0, 2.5 * k * d / t);
}

float sphOcclusion(vec3 pos, vec3 nor, vec4 sph) {
  vec3 di = sph.xyz - pos;
  float l = length(di);
  float nl = dot(nor, di / l);
  float h = l / sph.w;
  return 1.0 - clamp((nl * 0.5 + 0.5) / (h * h), 0.0, 1.0) * 0.85;
}

float sphereHit(vec3 ro, vec3 rd) {
  vec3 oc = ro - uBall;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - 1.0;
  float h = b * b - c;
  if (h < 0.0) return -1.0;
  return -b - sqrt(h);
}

float detailAt(float t, float pix, vec3 rd) {
  // pixel footprint across the stripes, stretched at grazing angles
  float fp = t * pix * sqrt(1.0 + sq(rd.x) / max(sq(rd.y), 0.004));
  return smoothstep(2.6, 5.5, P / fp) * (1.0 - smoothstep(14.0, 32.0, t));
}

// shading for the field as seen in the ball (no relief, no shadows)
vec3 fieldInReflection(vec3 p, vec3 rd, float dist, float contrast) {
  Flow f = flow(p.xz);
  float rg = mix(0.5, ridge(f.psi), contrast);
  vec3 alb = mix(VALLEY, CREST, rg);
  vec3 col = alb * (KEY * 0.62 + SKYC * 0.3);
  float glow = exp(-abs(f.psi) * 3.5) * uSettle;
  col += alb * vec3(1.0, 0.38, 0.2) * glow * 1.4 * uHeat;
  col = mix(col, lavaEmission(f), lavaMask(f.psi));
  return mix(col, fogColor(rd), 1.0 - exp(-dist * 0.05));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float m = min(uRes.x, uRes.y);
  vec2 uv = (frag - 0.5 * uRes) / (0.5 * m);
  vec3 ro = uCamPos;
  vec3 rd = normalize(uCamFwd * uFocal + uCamRight * uv.x + uCamUp * uv.y);
  float pix = 2.0 / (uFocal * m);

  // ---- ball
  float tS = sphereHit(ro, rd);
  float tMax = 46.0;
  if (tS > 0.0) tMax = min(tMax, tS);

  // ---- field: march the height field inside the slab it can occupy
  float top = 0.07 + 0.2 * (uHits.y * exp(-uHits.x * 0.75));
  float tF = -1.0;
  float tStart = 1e9;
  if (rd.y < 0.0) tStart = max((top - ro.y) / rd.y, 0.0);
  // tall fluid (meniscus) hugs the ball: enter early when the ray passes near it
  {
    vec2 oc = ro.xz - uBall.xz;
    vec2 d2 = rd.xz;
    float a = dot(d2, d2);
    float b = dot(oc, d2);
    float c = dot(oc, oc) - 2.4 * 2.4;
    float disc = b * b - a * c;
    if (disc > 0.0 && a > 1e-6) {
      float t0 = (-b - sqrt(disc)) / a;
      float t1 = (-b + sqrt(disc)) / a;
      float tTop = rd.y < 0.0 ? max((0.42 - ro.y) / rd.y, 0.0) : (ro.y < 0.42 ? 0.0 : 1e9);
      float ent = max(t0, tTop);
      if (ent < t1) tStart = min(tStart, max(ent, 0.0));
    }
  }

  float t = tStart;
  if (t < tMax) {
    float prev = t;
    float detail = detailAt(t, pix, rd);
    for (int i = 0; i < 110; i++) {
      vec3 p = ro + rd * t;
      detail = detailAt(t, pix, rd);
      float gap = p.y - fieldH(p.xz, detail);
      if (gap < 0.0) {
        float lo = prev, hi = t;
        for (int j = 0; j < 5; j++) {
          float mid = 0.5 * (lo + hi);
          vec3 q = ro + rd * mid;
          if (q.y - fieldH(q.xz, detail) < 0.0) hi = mid; else lo = mid;
        }
        tF = hi;
        break;
      }
      if (gap < 0.0015 * t) { tF = t; break; }
      prev = t;
      float slope = 1.15 * detail + 0.35;
      t += max(0.8 * gap / (max(-rd.y, 0.0) + slope), 0.004 + 0.002 * t);
      if (t > tMax || p.y > 1.0 && rd.y >= 0.0) break;
    }
  }

  // ---- stripe filtering, computed in uniform control flow
  vec3 fp = ro + rd * (tF > 0.0 ? tF : min(tMax, 40.0));
  Flow f = flow(fp.xz);
  float fw = fwidth(f.psi / P);
  float contrast = 1.0 - smoothstep(0.16, 0.42, fw);

  // the same for the field as reflected in the ball
  float tS0 = max(tS, 0.0);
  vec3 bp = ro + rd * tS0;
  vec3 bn = normalize(bp - uBall);
  vec3 brf = reflect(rd, bn);
  float btp = (0.06 - bp.y) / min(brf.y, -0.02);
  Flow bf = flow((bp + brf * max(btp, 0.0)).xz);
  float bcontrast = 1.0 - smoothstep(0.14, 0.38, fwidth(bf.psi / P));

  vec3 col;
  bool ball = tS > 0.0 && (tF < 0.0 || tS < tF);

  if (ball) {
    vec3 pos = ro + rd * tS;
    vec3 n = normalize(pos - uBall);
    vec3 rf = reflect(rd, n);
    float ndv = max(dot(n, -rd), 0.0);
    vec3 env;
    if (rf.y < -0.02) {
      float tp = (0.06 - pos.y) / rf.y;
      vec3 hp = pos + rf * max(tp, 0.0);
      env = fieldInReflection(hp, rf, tS + tp, bcontrast);
      env = mix(env, studio(vec3(rf.x, 0.0, rf.z)), smoothstep(-0.12, -0.02, rf.y) * 0.6);
    } else {
      env = studio(rf);
    }
    float fres = 0.68 + 0.32 * pow(1.0 - ndv, 5.0);
    col = env * mix(vec3(0.78, 0.77, 0.84), vec3(1.0), fres) * fres;
    col += vec3(1.0, 0.96, 1.0) * pow(max(dot(rf, L), 0.0), 700.0) * 30.0;
    // sitting in the fluid: dark contact, lava light from below
    float near = exp(-abs(meander(-uFlow)) * 2.2) * uSettle;
    float low = smoothstep(0.75, 0.05, pos.y);
    col *= mix(1.0, 0.35, low * uSettle);
    col += vec3(1.0, 0.36, 0.12) * low * near * 0.9 * uHeat * max(-n.y + 0.35, 0.0);
    float fogA = 1.0 - exp(-tS * 0.045);
    col = mix(col, fogColor(rd), fogA);
  } else if (tF > 0.0) {
    vec3 p = ro + rd * tF;
    float detail = detailAt(tF, pix, rd);
    float e = max(0.004, tF * pix * 1.2);
    vec3 n = normalize(vec3(
      fieldH(p.xz - vec2(e, 0.0), detail) - fieldH(p.xz + vec2(e, 0.0), detail),
      2.0 * e,
      fieldH(p.xz - vec2(0.0, e), detail) - fieldH(p.xz + vec2(0.0, e), detail)
    ));

    float rg = mix(0.52, ridge(f.psi), contrast * (0.4 + 0.6 * detail));
    vec3 alb = mix(VALLEY, CREST, rg);
    // pink heat near the lava, cooler blue far from it
    float near = exp(-abs(f.psi) * 1.2);
    alb *= mix(vec3(0.85, 0.9, 1.15), vec3(1.15, 0.86, 1.0), near);

    vec4 sph = vec4(uBall, 1.0);
    float sh = sphSoftShadow(p + n * 0.01, L, sph, 6.0);
    float occ = sphOcclusion(p, n, sph);
    float dif = max(dot(n, L), 0.0);
    float rim = pow(clamp(1.0 + dot(rd, n), 0.0, 1.0), 3.0);
    vec3 h = normalize(L - rd);
    float spec = pow(max(dot(n, h), 0.0), 40.0) * (0.04 + 0.5 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0));

    col = alb * (KEY * dif * sh + SKYC * (0.16 + 0.2 * n.y) * occ);
    col += KEY * spec * sh * 0.8;
    col += vec3(0.5, 0.35, 1.0) * rim * 0.12 * occ;
    col *= mix(1.0, 0.55, f.wake);

    float glow = exp(-abs(f.psi) * 3.2) * (0.55 + 0.45 * uSettle);
    col += alb * vec3(1.0, 0.36, 0.18) * glow * 1.7 * uHeat;

    float lm = lavaMask(f.psi);
    if (lm > 0.0) {
      vec3 lava = lavaEmission(f);
      lava *= mix(0.45, 1.0, occ);
      col = mix(col, lava, lm);
    }

    col = mix(col, fogColor(rd), 1.0 - exp(-tF * 0.06));
  } else {
    col = sky(rd);
  }

  outColor = vec4(col * uEnc, 1.0);
}
`;

/* ------------------------------------------------------------------ */
/* Post: bloom chain and the final grade                               */
/* ------------------------------------------------------------------ */

export const DOWN_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uPrefilter;
uniform float uDec;
in vec2 vUv;
out vec4 outColor;
vec3 tap(vec2 o) { return texture(uTex, vUv + uTexel * o).rgb; }
void main() {
  vec3 c = tap(vec2(0.0)) * 0.5;
  c += (tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0)) + tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0))) * 0.125;
  if (uPrefilter > 0.5) {
    c *= uDec;
    float br = max(c.r, max(c.g, c.b));
    float soft = clamp(br - 0.7, 0.0, 1.0);
    soft = soft * soft / 1.0;
    float w = max(soft, br - 1.2) / max(br, 1e-4);
    c *= w;
    c *= 0.25;
  }
  outColor = vec4(c, 1.0);
}
`;

export const UP_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 outColor;
vec3 tap(vec2 o) { return texture(uTex, vUv + uTexel * o).rgb; }
void main() {
  vec3 c = tap(vec2(0.0)) * 4.0;
  c += (tap(vec2(-1.0, 0.0)) + tap(vec2(1.0, 0.0)) + tap(vec2(0.0, -1.0)) + tap(vec2(0.0, 1.0))) * 2.0;
  c += tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0)) + tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0));
  outColor = vec4(c / 16.0, 1.0);
}
`;

export const COMPOSITE_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2 uRes;
uniform vec2 uFocus;
uniform float uBoost;
uniform float uTime;
uniform float uDec;
uniform float uFade;
uniform float uBloomGain;
in vec2 vUv;
out vec4 outColor;

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = vUv;
  vec2 fromCenter = uv - 0.5;
  float edge = dot(fromCenter, fromCenter);

  // a touch of lens dispersion toward the corners
  vec2 ca = fromCenter * (0.0015 + 0.006 * uBoost) * edge * 4.0;
  vec3 col;
  col.r = texture(uScene, uv + ca).r;
  col.g = texture(uScene, uv).g;
  col.b = texture(uScene, uv - ca).b;

  // speed: zoom blur away from the ball
  if (uBoost > 0.02) {
    vec2 dir = (uv - uFocus) * 0.042 * uBoost;
    vec3 acc = col;
    float wsum = 1.0;
    float j = hash12(gl_FragCoord.xy + uTime);
    for (int i = 1; i < 9; i++) {
      float k = (float(i) + j) / 9.0;
      float w = 1.0 - k * 0.6;
      acc += texture(uScene, uv - dir * k).rgb * w;
      wsum += w;
    }
    col = acc / wsum;
  }
  col *= uDec;

  col += texture(uBloom, uv).rgb * uBloomGain;

  // grade: lift the shadows toward violet, warm the highlights
  col = col * vec3(1.02, 0.98, 1.04) + vec3(0.006, 0.002, 0.012);
  col *= 1.0 - edge * 1.15;
  col = aces(col * 1.1);
  col = pow(col, vec3(1.0 / 2.2));

  float grain = hash12(gl_FragCoord.xy + fract(uTime * 7.31) * 91.0) - 0.5;
  col += grain * 0.035;
  outColor = vec4(col * uFade, 1.0);
}
`;

export const SPARK_VERT = /* glsl */ `#version 300 es
in vec2 aPos;
in vec2 aUv;
in vec4 aColor;
out vec2 vUv;
out vec4 vColor;
void main() {
  vUv = aUv;
  vColor = aColor;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const SPARK_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform float uEnc;
in vec2 vUv;
in vec4 vColor;
out vec4 outColor;
void main() {
  float across = exp(-vUv.x * vUv.x * 3.5);
  float along = smoothstep(0.0, 0.35, vUv.y) * (0.35 + 0.65 * vUv.y);
  float a = across * along * vColor.a;
  outColor = vec4(vColor.rgb * a * uEnc, 1.0);
}
`;
