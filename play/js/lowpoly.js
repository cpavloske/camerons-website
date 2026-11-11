/**
 * lowpoly.js — helpers for building vertex-colored models
 * out of Three.js primitives. Every model in the game shares ONE material,
 * and parts are merged into as few meshes as possible, which keeps draw
 * calls (and phone GPUs) happy.
 *
 *   const geo = merge([
 *     part(new THREE.BoxGeometry(1, 1, 1), 0xff8800, { y: 0.5 }),
 *     part(new THREE.ConeGeometry(0.5, 1, 6), 0x2266aa, { y: 1.5 }),
 *   ]);
 *   scene.add(new THREE.Mesh(geo, MAT));
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * The shared material: vertex colors with smooth shading. Boxes still look
 * crisp (their normals are per-face); spheres and cylinders look rounded.
 */
export const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });

/** Unlit variant for things that glow (screens, stars, lights). */
export const MAT_GLOW = new THREE.MeshBasicMaterial({ vertexColors: true });

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

/**
 * Transform a geometry, strip it to position+normal, and paint every vertex
 * one color. Options: x, y, z, rx, ry, rz (radians), sx, sy, sz, s (uniform).
 */
export function part(geo, color, o = {}) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
  }
  const s = o.s ?? 1;
  _p.set(o.x || 0, o.y || 0, o.z || 0);
  _q.setFromEuler(_e.set(o.rx || 0, o.ry || 0, o.rz || 0));
  _s.set((o.sx ?? 1) * s, (o.sy ?? 1) * s, (o.sz ?? 1) * s);
  g.applyMatrix4(_m.compose(_p, _q, _s));
  paint(g, color);
  return g;
}

/** Paint a whole geometry one color (adds/overwrites the color attribute). */
export function paint(g, color) {
  _c.set(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = _c.r; arr[i * 3 + 1] = _c.g; arr[i * 3 + 2] = _c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

/** Merge painted parts into one geometry. */
export function merge(parts) {
  return mergeGeometries(parts, false);
}

/** Shortcut: merge parts and wrap in a Mesh with the shared material. */
export function mesh(parts, material = MAT) {
  const m = new THREE.Mesh(merge(parts), material);
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}
