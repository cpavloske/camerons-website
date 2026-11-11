/**
 * crt.js — the TV picture tube.
 *
 * The game renders to a small 640x480 texture; this material shows it on
 * the TV's glass with a CRT look: barrel curvature, scanlines, chromatic
 * aberration, vignette, and a soft glow. It also draws the power-on effect
 * (a bright line that expands into the picture), static snow, and the
 * "dirty cartridge" glitch.
 *
 * Every effect strength lives in config.js (CRT). Turning the CRT effect off
 * sets uCrt = 0, which zeroes all of them for a clean, flat picture.
 */
import * as THREE from 'three';
import { CRT, RENDER } from './config.js';

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */`
  uniform sampler2D tGame;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uCrt;       // 1 = CRT effect on, 0 = off
  uniform float uPower;     // overall tube brightness (0 = off)
  uniform float uLineW;     // power-on line width 0..1
  uniform float uOpen;      // power-on vertical opening 0..1
  uniform float uStatic;    // snow amount 0..1
  uniform float uBlack;     // channel-change blank: picture goes black 0..1
  uniform float uGlitch;    // dirty-cartridge glitch 0..1
  uniform float uGhost;     // bad antenna reception: ghost image + wavy lines 0..1
  uniform float uRoll;      // bad vertical hold: picture rolls (speed)
  uniform float uCurv, uScan, uAberr, uVig, uGlow;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  vec2 curve(vec2 uv, float k) {
    uv = uv * 2.0 - 1.0;
    uv *= 1.0 + k * dot(uv, uv) * 0.5;
    uv *= 1.0 - k * 0.5;            // keep corners roughly in frame
    return uv * 0.5 + 0.5;
  }

  vec3 pic(vec2 uv) {
    if (uGlitch > 0.0) {
      float band = floor(uv.y * 24.0) + floor(uTime * 9.0);
      uv.x += (hash(vec2(band, 1.0)) - 0.5) * 0.12 * uGlitch;
      uv.y += step(0.92, hash(vec2(band, 3.0))) * 0.05 * uGlitch;
    }
    float a = uAberr * uCrt;
    vec3 c = vec3(
      texture2D(tGame, uv + vec2(a, 0.0)).r,
      texture2D(tGame, uv).g,
      texture2D(tGame, uv - vec2(a, 0.0)).b);
    if (uGlitch > 0.0) {
      float band = floor(uv.y * 24.0) + floor(uTime * 9.0);
      if (hash(vec2(band, 7.0)) > 0.7) c = c.brg;
    }
    return c;
  }

  void main() {
    vec2 uv = curve(vUv, uCurv * uCrt);
    vec3 col = vec3(0.0);
    float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    vec2 puv = uv; // picture coords (bad reception bends these; the frame stays put)
    if (uRoll > 0.0) puv.y = fract(puv.y + uTime * uRoll);
    if (uGhost > 0.0) puv.x += sin(puv.y * 38.0 + uTime * 7.0) * 0.006 * uGhost + (hash(vec2(floor(puv.y * 120.0), floor(uTime * 20.0))) - 0.5) * 0.012 * uGhost;

    if (inside > 0.0 && uPower > 0.0) {
      col = pic(puv);
      if (uGhost > 0.0) col = (col + pic(puv - vec2(0.025, 0.0)) * 0.45 * uGhost) / (1.0 + 0.45 * uGhost);
      if (uRoll > 0.0) col *= 0.25 + 0.75 * smoothstep(0.0, 0.05, fract(puv.y)); // dark bar where the picture wraps
      // Soft glow: a few wide taps
      vec2 o = 2.5 / uRes;
      vec3 bloom = (texture2D(tGame, uv + vec2(o.x, o.y)).rgb + texture2D(tGame, uv - vec2(o.x, o.y)).rgb +
                    texture2D(tGame, uv + vec2(o.x, -o.y)).rgb + texture2D(tGame, uv - vec2(o.x, -o.y)).rgb) * 0.25;
      col += bloom * bloom * uGlow * uCrt;
      // Scanlines (one per game pixel row) with a faint shimmer
      float s = 0.5 + 0.5 * cos(uv.y * uRes.y * 6.2831853);
      col *= 1.0 - uScan * uCrt * s;
      // Static snow
      float n = hash(floor(uv * uRes * 0.5) + floor(uTime * 40.0) * 17.0);
      col = mix(col, vec3(n * 0.9), uStatic);
      // Vignette
      vec2 d = uv - 0.5;
      col *= 1.0 - uVig * uCrt * dot(d, d) * 2.2;
      // Power-on / power-off: a bright line that opens into the picture
      float halfH = mix(0.004, 0.5, uOpen * uOpen);
      float mask = step(abs(uv.y - 0.5), halfH) * step(abs(uv.x - 0.5), uLineW * 0.5);
      col = col * mask + vec3(1.0, 0.98, 0.95) * (1.0 - uOpen) * mask * 1.4;
      col *= uPower * (1.0 - uBlack);
    }

    // The glass itself: dark green-gray tube, a faint diagonal glare
    vec3 glass = vec3(0.006, 0.008, 0.008);
    float glare = smoothstep(0.55, 0.0, length((vUv - vec2(0.28, 0.78)) * vec2(1.0, 1.6))) * 0.025;
    col += glass + glare;
    col += 0.012 * uPower * inside;  // tube glow lifts the blacks a touch
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/** Material for the TV glass. `texture` is the game's render target texture. */
export function createScreenMaterial(texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      tGame: { value: texture },
      uRes: { value: new THREE.Vector2(RENDER.width, RENDER.height) },
      uTime: { value: 0 },
      uCrt: { value: 1 },
      uPower: { value: 0 },
      uLineW: { value: 0 },
      uOpen: { value: 0 },
      uStatic: { value: 0 },
      uBlack: { value: 0 },
      uGlitch: { value: 0 },
      uGhost: { value: 0 },
      uRoll: { value: 0 },
      uCurv: { value: CRT.curvature },
      uScan: { value: CRT.scanlines },
      uAberr: { value: CRT.aberration },
      uVig: { value: CRT.vignette },
      uGlow: { value: CRT.glow },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });
}

/**
 * Same barrel curve as the shader, in JS — converts a click on the glass
 * (mesh UV) to the matching point in the game picture.
 */
export function screenToGameUV(u, v, crtOn) {
  const k = crtOn ? CRT.curvature : 0;
  let x = u * 2 - 1, y = v * 2 - 1;
  const f = (1 + k * (x * x + y * y) * 0.5) * (1 - k * 0.5);
  x *= f; y *= f;
  return { u: x * 0.5 + 0.5, v: y * 0.5 + 0.5 };
}

/** A slightly bulged 4:3 plane for the tube glass (bulges toward +Z). */
export function screenGeometry(w, h, bulge = 0.04) {
  const g = new THREE.PlaneGeometry(w, h, 12, 9);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (w / 2), y = p.getY(i) / (h / 2);
    p.setZ(i, bulge * (1 - (x * x + y * y) / 2));
  }
  g.computeVertexNormals();
  return g;
}
