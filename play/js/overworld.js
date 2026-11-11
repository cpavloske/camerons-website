/**
 * overworld.js — the level map: a little island with a dotted trail linking
 * a spot for each section of the site. Walk between spots with the arrow
 * keys / stick, or click (tap) any spot and the character walks there and
 * opens it.
 *
 * ADDING A SPOT:
 *   1. Add an entry to NODES (id, label, position, color, landmark, section).
 *   2. Connect it with an entry in EDGES.
 *   3. Handle its `section` in main.js openSection() (and overlays.js).
 *   Use `comingSoon: true` for a placeholder.
 */
import * as THREE from 'three';
import { MAP, RENDER } from './config.js';
import { part, mesh, MAT_GLOW } from './lowpoly.js';
import { skyDome, cedar, oak, cloud, starGeometry } from './env.js';
import { createCharacter } from './character.js';

export const NODES = [
  { id: 'home',     label: 'Home',     pos: [-11, 5],   color: 0xe8823a, landmark: 'house',   section: null },
  { id: 'about',    label: 'About',    pos: [-6, -1.5], color: 0x2f8f83, landmark: 'cabin',   section: 'about' },
  { id: 'writing',  label: 'Writing',  pos: [-0.5, 4],  color: 0xd9a441, landmark: 'library', section: 'writing' },
  { id: 'projects', label: 'Projects', pos: [5, -2],    color: 0x4ab8ff, landmark: 'servers', section: 'projects' },
  { id: 'contact',  label: 'Contact',  pos: [10.5, 4.5], color: 0xd04a8a, landmark: 'mailbox', section: 'contact' },
  { id: 'music',    label: 'Music',    pos: [7.5, -9],  color: 0x8a6ad0, landmark: 'stage',   section: 'music', comingSoon: true },
];
export const EDGES = [
  ['home', 'about', -1.2],
  ['about', 'writing', 1.2],
  ['writing', 'projects', -1.2],
  ['projects', 'contact', 1.2],
  ['projects', 'music', 1.4],
];
/** The "Exit game" button in the top-right of the map screen (game pixels). */
export const EXIT_BTN = { x: RENDER.width - 168, y: 14, w: 154, h: 46 };

/** Sections that award a star when first opened. */
export const STAR_SECTIONS = NODES.filter((n) => n.section && !n.comingSoon).map((n) => n.id);

const PAD_Y = 0.12;

export function buildOverworld({ progress, onOpen }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 4 / 3, 0.1, 300);
  scene.add(skyDome([[-1, 0x4a8ab0], [0, 0xcfe8f7], [0.25, 0x8ec5ea], [1, 0x4a7ac8]]));
  scene.fog = new THREE.Fog(0xcfe8f7, 40, 110);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6a8a5a, 1.7));
  const sun = new THREE.DirectionalLight(0xfff0d0, 2.2);
  sun.position.set(-6, 12, 8);
  scene.add(sun);

  const parts = [], glow = [];
  let seed = 31;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const P = (n) => new THREE.Vector3(n.pos[0], 0, n.pos[1]);
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

  // --- Island, beach, water --------------------------------------------------
  const island = new THREE.CylinderGeometry(17, 18, 2, 64, 1);
  jitter(island, 0.35);
  parts.push(part(island, 0x6fae4a, { y: -1, sz: 0.85 }));
  const beach = new THREE.CylinderGeometry(18.6, 19.5, 1, 64, 1);
  jitter(beach, 0.3);
  parts.push(part(beach, 0xe8d49a, { y: -0.95, sz: 0.85 }));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x3f8fc8 }));
  water.position.y = -0.7;
  scene.add(water);
  // Foam ring
  glow.push(part(new THREE.RingGeometry(19.3, 20.2, 64).rotateX(-Math.PI / 2), 0xe6f4ff, { y: -0.68, sz: 0.85 }));

  // --- Trails between spots ---------------------------------------------------
  const edges = EDGES.map(([a, b, bend]) => {
    const A = P(byId[a]), B = P(byId[b]);
    const mid = A.clone().add(B).multiplyScalar(0.5);
    const d = B.clone().sub(A);
    const perp = new THREE.Vector3(-d.z, 0, d.x).normalize();
    mid.addScaledVector(perp, bend);
    const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
    const pts = curve.getSpacedPoints(Math.ceil(curve.getLength() / 0.25));
    // Dots along the trail (skip the ends where the pads sit)
    const len = curve.getLength();
    for (let s = 1.1; s < len - 1.0; s += 0.75) {
      const p = curve.getPointAt(s / len);
      parts.push(part(new THREE.CylinderGeometry(0.2, 0.22, 0.08, 24), 0xf3e2b0, { x: p.x, y: 0.04, z: p.z }));
    }
    return { a, b, pts };
  });
  const neighbors = (id) => edges.flatMap((e) => (e.a === id ? [{ id: e.b, pts: e.pts }] : e.b === id ? [{ id: e.a, pts: [...e.pts].reverse() }] : []));
  const trailPoints = edges.flatMap((e) => e.pts);
  // Trees just south of a trail (between it and the camera) would hide the character
  const blocksView = (x, z) => trailPoints.some((p) => Math.abs(p.x - x) < 2.2 && z - p.z > 0 && z - p.z < 5.5)
    || NODES.some((n) => Math.abs(n.pos[0] - x) < 3 && z - n.pos[1] > -1 && z - n.pos[1] < 7);
  const nearTrail = (x, z, r) => trailPoints.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < r * r) || NODES.some((n) => (n.pos[0] - x) ** 2 + (n.pos[1] - z) ** 2 < (r + 2.5) ** 2);

  // --- Spots (pads), landmarks, labels, stars ---------------------------------
  const pickables = [];
  const stars = {};
  const starGeo = starGeometry(0.42);
  const starMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: 0x6a4a00 });
  for (const n of NODES) {
    const p = P(n);
    parts.push(part(new THREE.CylinderGeometry(0.85, 0.95, 0.24, 24), 0xf6f1e4, { x: p.x, y: PAD_Y, z: p.z }));
    parts.push(part(new THREE.CylinderGeometry(0.66, 0.66, 0.06, 24), n.comingSoon ? 0x9a94a8 : n.color, { x: p.x, y: 0.26, z: p.z }));
    parts.push(...landmark(n.landmark, p.x, p.z - 2.6, n.color, glow, rnd));

    const sign = labelSprite(n.comingSoon ? `${n.label} · Soon` : n.label, n.comingSoon ? '#9a94a8' : '#' + n.color.toString(16).padStart(6, '0'));
    sign.position.set(p.x, 3.3, p.z - 1.2);
    scene.add(sign);

    // Big invisible hit area so clicks/taps are forgiving
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 4, 24), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(p.x, 1.5, p.z - 1);
    hit.userData.node = n.id;
    scene.add(hit);
    pickables.push(hit);

    if (STAR_SECTIONS.includes(n.id) && !progress.hasStar(n.id)) {
      const s = new THREE.Mesh(starGeo, starMat);
      s.position.set(p.x, 1.6, p.z);
      scene.add(s);
      stars[n.id] = s;
    }
  }

  // --- Scenery: trees, rocks, flowers, clouds, a little dock -------------------
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = 3 + rnd() * 13.5;
    const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.82;
    if (nearTrail(x, z, 1.6) || blocksView(x, z)) continue;
    const s = 0.7 + rnd() * 0.6;
    if (rnd() < 0.55) parts.push(...cedar(x, 0, z, s)); else parts.push(...oak(x, 0, z, s));
  }
  for (let i = 0; i < 40; i++) {
    const a = rnd() * Math.PI * 2, r = 2 + rnd() * 15;
    const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.82;
    if (nearTrail(x, z, 0.7)) continue;
    const c = [0xf3c34d, 0xe86a7a, 0xf6f1e4, 0xb88ae8][i % 4];
    parts.push(part(new THREE.BoxGeometry(0.12, 0.12, 0.12), c, { x, y: 0.08, z }));
    parts.push(part(new THREE.BoxGeometry(0.04, 0.12, 0.04), 0x3f7a3a, { x, y: 0.0, z }));
  }
  for (let i = 0; i < 10; i++) {
    const a = rnd() * Math.PI * 2, r = 14 + rnd() * 3;
    parts.push(part(new THREE.DodecahedronGeometry(0.5 + rnd() * 0.6, 0), 0x9a9488, { x: Math.cos(a) * r, y: 0, z: Math.sin(a) * r * 0.82, ry: rnd() * 3 }));
  }
  // Dock off the south shore
  parts.push(part(new THREE.BoxGeometry(1.4, 0.12, 5), 0x9a7048, { x: -2, y: -0.25, z: 16.5 }));
  for (const [dx, dz] of [[-0.6, 14.5], [0.6, 14.5], [-0.6, 18.8], [0.6, 18.8]]) parts.push(part(new THREE.BoxGeometry(0.15, 0.9, 0.15), 0x6a4a2e, { x: -2 + dx, y: -0.5, z: dz }));
  for (let i = 0; i < 9; i++) parts.push(...cloud((rnd() - 0.5) * 70, 9 + rnd() * 5, -30 + rnd() * 20, 1.5 + rnd() * 1.5));

  scene.add(mesh(parts));
  scene.add(mesh(glow, MAT_GLOW));

  // --- The character -----------------------------------------------------------
  const hero = createCharacter();
  scene.add(hero.object);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }));
  scene.add(shadow);

  const state = {
    at: 'home',               // node we're standing on (null while walking)
    walk: null,               // { pts, i, to }
    queue: [],                // remaining node ids for a clicked destination
    openOnArrive: false,
    pos: P(byId.home).setY(PAD_Y + 0.12),
    yaw: 0,
    hop: 0,
  };
  const camTarget = state.pos.clone();
  camera.position.set(state.pos.x, MAP.cameraHeight, state.pos.z + MAP.cameraBack);
  camera.lookAt(state.pos);

  /** Shortest route (list of node ids, excluding start) via breadth-first search. */
  function route(from, to) {
    const prev = { [from]: null }, q = [from];
    while (q.length) {
      const id = q.shift();
      if (id === to) break;
      for (const nb of neighbors(id)) if (!(nb.id in prev)) { prev[nb.id] = id; q.push(nb.id); }
    }
    if (!(to in prev)) return [];
    const out = [];
    for (let id = to; id !== from; id = prev[id]) out.unshift(id);
    return out;
  }

  function startWalk(toId) {
    const nb = neighbors(state.at).find((x) => x.id === toId);
    if (!nb) return false;
    state.walk = { pts: nb.pts, i: 0, to: toId };
    state.at = null;
    return true;
  }

  /** Pick the neighbor whose on-screen direction best matches the stick/keys. */
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  function neighborInDirection(dx, dy) {
    let best = null, bestDot = 0.45;
    _a.copy(P(byId[state.at])).project(camera);
    for (const nb of neighbors(state.at)) {
      // Use the first stretch of the trail so curvy paths feel right
      _b.copy(nb.pts[Math.min(8, nb.pts.length - 1)]).project(camera);
      let vx = (_b.x - _a.x) * (4 / 3), vy = _b.y - _a.y;
      const l = Math.hypot(vx, vy) || 1;
      const dot = (vx / l) * dx + (vy / l) * dy;
      if (dot > bestDot) { bestDot = dot; best = nb.id; }
    }
    return best;
  }

  function arrive(id) {
    state.at = id;
    state.walk = null;
    state.hop = 1;
    hero.impulse(1.2);
    if (state.queue.length) { startWalk(state.queue.shift()); return; }
    if (state.openOnArrive) { state.openOnArrive = false; open(); }
  }

  function open() {
    const n = byId[state.at];
    if (!n || !n.section) return;
    if (stars[n.id]) { // collect the star for this spot
      const s = stars[n.id];
      delete stars[n.id];
      collecting.push({ s, t: 0 });
      progress.addStar(n.id);
    }
    onOpen(n);
  }
  const collecting = [];

  return {
    scene, camera,
    get node() { return state.at ? byId[state.at] : null; },
    get walking() { return !!state.walk; },

    /** Click/tap at game NDC (x, y in -1..1). Returns true if it hit a spot. */
    click(ndcX, ndcY) {
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      if (!hit) return false;
      const id = hit.object.userData.node;
      if (state.at === id) { open(); return true; }
      const from = state.at || state.walk.to;
      const path = route(from, id);
      if (!path.length) return true;
      state.openOnArrive = true;
      if (state.at) { state.queue = path.slice(1); startWalk(path[0]); }
      else state.queue = path; // finish the current stretch first
      return true;
    },

    /** Is a spot under this NDC point? (for the pointer cursor) */
    hover(ndcX, ndcY) {
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      return ray.intersectObjects(pickables, false).length > 0;
    },

    update(dt, t, input) {
      // Keyboard / stick: walk toward the neighbor in that direction
      const moved = input.consume('move');
      if (state.at && (moved || Math.hypot(input.dir.x, input.dir.y) > 0.5)) {
        const id = neighborInDirection(input.dir.x, input.dir.y);
        if (id) { state.queue = []; state.openOnArrive = false; startWalk(id); }
      }
      if (input.consume('confirm') && state.at) open();

      // Walk along the trail
      let speed = 0;
      if (state.walk) {
        let remaining = MAP.walkSpeed * dt;
        const w = state.walk;
        while (remaining > 0 && w.i < w.pts.length - 1) {
          const next = w.pts[w.i + 1];
          const d = Math.hypot(next.x - state.pos.x, next.z - state.pos.z);
          if (d <= remaining) { state.pos.x = next.x; state.pos.z = next.z; w.i++; remaining -= d; }
          else {
            state.pos.x += (next.x - state.pos.x) / d * remaining;
            state.pos.z += (next.z - state.pos.z) / d * remaining;
            state.yaw = approachAngle(state.yaw, Math.atan2(next.x - state.pos.x, next.z - state.pos.z), dt * 14);
            remaining = 0;
          }
        }
        speed = 1;
        if (w.i >= w.pts.length - 1) arrive(w.to);
      } else {
        state.yaw = approachAngle(state.yaw, 0, dt * 4); // face the camera when idle
      }

      // Small hop when arriving on a pad
      state.hop = Math.max(0, state.hop - dt * 4);
      const hopY = Math.sin(state.hop * Math.PI) * 0.35;
      hero.object.position.set(state.pos.x, PAD_Y + 0.12 + hopY, state.pos.z);
      hero.object.rotation.y = state.yaw;
      hero.animate({ speed, grounded: hopY < 0.01, vy: state.hop > 0.5 ? 3 : -3, mode: hopY < 0.01 ? 'ground' : 'air', t }, dt);
      shadow.position.set(state.pos.x, 0.3, state.pos.z);

      // Stars spin; collected ones fly up and shrink
      for (const s of Object.values(stars)) { s.rotation.y = t * 2; s.position.y = 1.6 + Math.sin(t * 2.4 + s.position.x) * 0.12; }
      for (const c of collecting.slice()) {
        c.t += dt;
        c.s.position.y += dt * 5; c.s.rotation.y += dt * 20; c.s.scale.setScalar(Math.max(0.01, 1 - c.t * 1.6));
        if (c.t > 0.65) { scene.remove(c.s); collecting.splice(collecting.indexOf(c), 1); }
      }

      // Camera follows smoothly
      const k = 1 - Math.exp(-MAP.cameraLerp * dt);
      camTarget.lerp(state.pos, k);
      camera.position.set(camTarget.x, MAP.cameraHeight, camTarget.z + MAP.cameraBack);
      camera.lookAt(camTarget.x, 0, camTarget.z - 1.2);
    },

    /** Star counter + the name of the spot you're on. */
    drawHud(hud, starCount, exitHover = false) {
      const n = state.at ? byId[state.at] : null;
      hud.draw(`map:${starCount}:${n ? n.id : '-'}:${exitHover}`, (g, w, h) => {
        // Exit game button
        const b = EXIT_BTN;
        hud.panel(b.x, b.y, b.w, b.h, exitHover ? 'rgba(232,130,58,0.95)' : 'rgba(20,16,28,0.72)');
        hud.text('EXIT GAME', b.x + b.w / 2, b.y + b.h / 2 + 1, { size: 21, weight: 800 });
        hud.panel(14, 14, 132, 46);
        hud.star(40, 37, 15);
        hud.text(`${starCount} / ${STAR_SECTIONS.length}`, 62, 38, { size: 26, align: 'left' });
        if (n) {
          const sub = n.comingSoon ? 'Coming soon' : n.section ? 'Press A / Space — or click' : 'Walk to a spot, or click one';
          hud.panel(w / 2 - 190, h - 92, 380, 74);
          hud.text(n.label.toUpperCase(), w / 2, h - 66, { size: 30, color: '#ffd84a' });
          hud.text(sub, w / 2, h - 34, { size: 17, weight: 700 });
        }
      });
    },
  };
}

/**
 * Shove a geometry's vertices around a bit for a hand-made look. The offset
 * comes from each vertex's original position, so duplicated vertices (seams,
 * cap centers) move together and no cracks open up.
 */
function jitter(geo, amt) {
  const p = geo.attributes.position;
  const h = (x, y, z, k) => {
    const v = Math.sin(Math.round(x * 100) * 12.9898 + Math.round(y * 100) * 78.233 + Math.round(z * 100) * 37.719 + k * 11.13) * 43758.5453;
    return v - Math.floor(v) - 0.5;
  };
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const edge = Math.hypot(x, z) > 1 ? 1 : 0; // keep the cap center still
    if (y > 0) p.setY(i, y + h(x, y, z, 1) * amt * 0.4 * edge);
    p.setX(i, x + h(x, y, z, 2) * amt * edge);
    p.setZ(i, z + h(x, y, z, 3) * amt * edge);
  }
  geo.computeVertexNormals();
}

function approachAngle(a, b, step) {
  const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return Math.abs(d) <= step ? b : a + Math.sign(d) * step;
}

/** A floating name tag that always faces the camera. */
function labelSprite(text, color) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.font = '900 34px system-ui, "Segoe UI", sans-serif';
  const w = Math.min(248, g.measureText(text).width + 34);
  g.fillStyle = 'rgba(20,16,28,0.78)';
  g.beginPath(); g.roundRect(128 - w / 2, 6, w, 52, 14); g.fill();
  g.fillStyle = color; g.fillRect(128 - w / 2 + 10, 50, w - 20, 4);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 30);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  s.scale.set(3.2, 0.8, 1);
  s.renderOrder = 5;
  return s;
}

/** Low-poly landmark buildings behind each spot. */
function landmark(kind, x, z, color, glow, rnd) {
  const out = [];
  const b = (dx, y, dz, sx, sy, sz, c, o = {}) => out.push(part(new THREE.BoxGeometry(sx, sy, sz), c, { x: x + dx, y, z: z + dz, ...o }));
  const roof = (dx, y, dz, r, h, c) => out.push(part(new THREE.ConeGeometry(r, h, 4), c, { x: x + dx, y, z: z + dz, ry: Math.PI / 4 }));
  switch (kind) {
    case 'house':
      b(0, 0.8, 0, 2.2, 1.6, 1.8, 0xf3e6c8);
      roof(0, 2.1, 0, 1.8, 1.1, 0xb24a3a);
      b(0, 0.5, 0.91, 0.5, 1.0, 0.05, 0x6a3a1e);
      glow.push(part(new THREE.BoxGeometry(0.4, 0.4, 0.05), 0xffd37a, { x: x - 0.7, y: 1.0, z: z + 0.91 }));
      glow.push(part(new THREE.BoxGeometry(0.4, 0.4, 0.05), 0xffd37a, { x: x + 0.7, y: 1.0, z: z + 0.91 }));
      b(0.6, 2.3, -0.3, 0.3, 0.8, 0.3, 0x8a8078);
      break;
    case 'library': {
      const cols = [0xc4453a, 0x2f8f83, 0xe8a33a, 0x5b6fb5, 0x7a4a8f, 0x3c7a4a];
      let y = 0;
      for (let i = 0; i < 9; i++) {
        const h = 0.32 + rnd() * 0.12, w = 1.9 - i * 0.08 + rnd() * 0.3;
        b((rnd() - 0.5) * 0.25, y + h / 2, 0, w, h, w * 0.7, cols[i % cols.length], { ry: (rnd() - 0.5) * 0.4 });
        b((rnd() - 0.5) * 0.1, y + h / 2, 0.02, w - 0.1, h - 0.1, w * 0.7 + 0.02, 0xf6f1e4);
        y += h;
      }
      out.push(part(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 24), 0x5a3418, { x: x + 0.3, y: y + 0.3, z }));
      out.push(part(new THREE.ConeGeometry(0.15, 0.4, 4), 0xf6f1e4, { x: x + 0.3, y: y + 0.7, z, rz: 0.4 })); // a quill
      break;
    }
    case 'cabin':
      for (let i = 0; i < 4; i++) b(0, 0.2 + i * 0.4, 0, 2.2, 0.38, 1.8, i % 2 ? 0x8f5a30 : 0x7a4a26);
      roof(0, 2.15, 0, 1.75, 0.9, 0x4a2a1a);
      b(0, 0.55, 0.92, 0.5, 1.1, 0.05, 0x4a2a1a);
      glow.push(part(new THREE.BoxGeometry(0.4, 0.35, 0.05), 0xffd37a, { x: x + 0.65, y: 1.0, z: z + 0.92 }));
      b(-0.75, 0.25, 1.4, 0.4, 0.5, 0.4, 0x5a3418); // rocking chair-ish stool
      break;
    case 'servers':
      for (let i = 0; i < 3; i++) {
        const h = 1.6 + i * 0.4;
        b(-0.8 + i * 0.8, h / 2, 0, 0.7, h, 0.8, 0x2a3346);
        for (let j = 0.3; j < h - 0.1; j += 0.25) {
          b(-0.8 + i * 0.8, j, 0.41, 0.5, 0.05, 0.02, 0x1a2131);
          glow.push(part(new THREE.BoxGeometry(0.06, 0.04, 0.02), [0x3ef08a, 0xffb43a, 0x4ab8ff][(i + Math.round(j * 4)) % 3], { x: x - 0.95 + i * 0.8 + rnd() * 0.3, y: j, z: z + 0.43 }));
        }
      }
      out.push(part(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 24), 0xb0b0b8, { x: x + 0.8, y: 3.0, z }));
      glow.push(part(new THREE.SphereGeometry(0.09, 24, 16), 0xff4a4a, { x: x + 0.8, y: 3.75, z }));
      break;
    case 'mailbox':
      b(0, 0.6, 0.6, 0.15, 1.2, 0.15, 0x6b6f80);
      b(0, 1.35, 0.6, 0.8, 0.55, 1.0, 0x2f8f83);
      out.push(part(new THREE.CylinderGeometry(0.4, 0.4, 1.0, 24, 1, false, 0, Math.PI), 0x3fae9f, { x, y: 1.62, z: z + 0.6, rx: Math.PI / 2, rz: Math.PI / 2 }));
      b(0.45, 1.7, 0.4, 0.05, 0.6, 0.06, 0xe8823a);
      b(0.45, 1.95, 0.55, 0.05, 0.2, 0.3, 0xe8823a);
      // A radio tower behind
      for (const s of [-1, 1]) out.push(part(new THREE.CylinderGeometry(0.04, 0.06, 4, 24), 0xc4c4cc, { x: x + s * 0.35 - 1.2, y: 2, z: z - 0.6, rz: -s * 0.08 }));
      glow.push(part(new THREE.SphereGeometry(0.1, 24, 16), 0xff4a4a, { x: x - 1.2, y: 4.05, z: z - 0.6 }));
      break;
    case 'stage':
      b(0, 0.25, 0, 2.6, 0.5, 1.8, 0x3a3550);
      b(-1.0, 1.0, -0.3, 0.6, 1.0, 0.5, 0x1d1a24);
      b(1.0, 1.0, -0.3, 0.6, 1.0, 0.5, 0x1d1a24);
      out.push(part(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 24), 0x4a4566, { x: x - 1.0, y: 1.1, z: z - 0.03, rx: Math.PI / 2 }));
      out.push(part(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 24), 0x4a4566, { x: x + 1.0, y: 1.1, z: z - 0.03, rx: Math.PI / 2 }));
      b(0, 0.9, 0.2, 0.05, 0.8, 0.05, 0x8a8a92); // mic stand
      // "Coming soon" sawhorse barrier
      b(0, 0.55, 1.4, 1.6, 0.18, 0.06, 0xf3c34d);
      b(-0.6, 0.3, 1.4, 0.08, 0.6, 0.08, 0x5a3418);
      b(0.6, 0.3, 1.4, 0.08, 0.6, 0.08, 0x5a3418);
      break;
  }
  return out;
}
