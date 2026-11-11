/**
 * env.js — reusable scenery pieces: gradient sky, trees, clouds, stars.
 * Everything is vertex colored and cheap.
 */
import * as THREE from 'three';
import { part, paint } from './lowpoly.js';

/**
 * A big inside-out sphere with a vertical color gradient.
 * stops: [[heightT (-1..1), hex], ...] sorted bottom to top.
 */
export function skyDome(stops, radius = 180) {
  const geo = new THREE.SphereGeometry(radius, 32, 20);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color(), a = new THREE.Color(), b = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / radius;
    let j = 0;
    while (j < stops.length - 2 && t > stops[j + 1][0]) j++;
    const [t0, c0] = stops[j], [t1, c1] = stops[j + 1];
    const k = THREE.MathUtils.clamp((t - t0) / (t1 - t0), 0, 1);
    c.copy(a.set(c0)).lerp(b.set(c1), k);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -10;
  m.frustumCulled = false;
  m.onBeforeRender = (r, s, cam) => m.position.copy(cam.position); // always centered on the camera
  return m;
}

/** Texas cedar: stacked cones. Returns painted parts. */
export function cedar(x, y, z, s = 1) {
  return [
    part(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 24), 0x5a3a24, { x, y: y + 0.4 * s, z, s }),
    part(new THREE.ConeGeometry(0.9, 1.6, 20), 0x2f5a3a, { x, y: y + 1.3 * s, z, s }),
    part(new THREE.ConeGeometry(0.7, 1.3, 20), 0x386a43, { x, y: y + 2.0 * s, z, s, ry: 0.4 }),
    part(new THREE.ConeGeometry(0.45, 1.0, 20), 0x44794d, { x, y: y + 2.6 * s, z, s }),
  ];
}

/** Round live oak: trunk + lumpy canopy. */
export function oak(x, y, z, s = 1) {
  return [
    part(new THREE.CylinderGeometry(0.16, 0.24, 1.4, 24), 0x5e4030, { x, y: y + 0.7 * s, z, s }),
    part(new THREE.IcosahedronGeometry(1.2, 2), 0x5f8a3f, { x, y: y + 2.0 * s, z, s, sy: 0.75 }),
    part(new THREE.IcosahedronGeometry(0.8, 2), 0x6f9a48, { x: x + 0.7 * s, y: y + 2.3 * s, z: z + 0.2 * s, s }),
    part(new THREE.IcosahedronGeometry(0.7, 2), 0x557d38, { x: x - 0.6 * s, y: y + 2.2 * s, z: z - 0.3 * s, s }),
  ];
}

/** A puffy cloud from a few icosahedrons. */
export function cloud(x, y, z, s = 1, color = 0xfff6ef) {
  return [
    part(new THREE.IcosahedronGeometry(1.4, 2), color, { x, y, z, s, sy: 0.6 }),
    part(new THREE.IcosahedronGeometry(1.0, 2), color, { x: x + 1.4 * s, y: y - 0.1 * s, z, s, sy: 0.6 }),
    part(new THREE.IcosahedronGeometry(1.0, 2), color, { x: x - 1.3 * s, y: y - 0.15 * s, z: z + 0.3 * s, s, sy: 0.55 }),
  ];
}

/** Twinkle-free starfield as points on a far sphere. */
export function starfield(count = 300, radius = 150) {
  const pos = new Float32Array(count * 3);
  let seed = 3;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const u = r() * Math.PI * 2, v = 0.08 + r() * 0.9;
    pos.set([Math.cos(u) * Math.cos(v) * radius, Math.sin(v) * radius, Math.sin(u) * Math.cos(v) * radius], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false, fog: false }));
  p.frustumCulled = false;
  p.onBeforeRender = (rr, s, cam) => p.position.copy(cam.position);
  return p;
}

/** A chunky 5-point star (collectible). Returns a painted geometry. */
export function starGeometry(r = 0.5, color = 0xffd84a) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 3 });
  g.translate(0, 0, -0.11);
  return part(g, color);
}

/** Recolor a geometry in place. */
export { paint };
