/**
 * title.js — the title screen inside the TV: "CAMERON PAVLOSKE" in chunky
 * 3D letters bobbing in a wave over a slowly spinning sunburst, the
 * character waving below, and a blinking "Press Start". It's on CH 3
 * when the page loads, so the name is the first thing you see.
 */
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { part, mesh, MAT_GLOW } from './lowpoly.js';
import { createCharacter } from './character.js';

const FONT_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json';
let fontPromise = null;
export function preloadFont() {
  if (!fontPromise) fontPromise = new FontLoader().loadAsync(FONT_URL);
  return fontPromise;
}

export async function buildTitle() {
  const font = await preloadFont();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a3a7a);
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 100);
  camera.position.set(0, 0.2, 14);
  camera.lookAt(0, 0.4, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x6a5a8a, 1.6));
  const key = new THREE.DirectionalLight(0xfff0d8, 2.2);
  key.position.set(3, 5, 8);
  scene.add(key);

  // Sunburst behind everything
  const rays = [];
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 0.5) / 16) * Math.PI * 2;
    const tri = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a0) * 30, Math.sin(a0) * 30, 0), new THREE.Vector3(Math.cos(a1) * 30, Math.sin(a1) * 30, 0),
    ]);
    tri.computeVertexNormals();
    rays.push(part(tri, 0x3a4e9a));
  }
  const burst = mesh(rays, MAT_GLOW);
  burst.position.set(0, 1, -6);
  scene.add(burst);

  // Letters: one mesh each so they can wave
  const front = new THREE.MeshLambertMaterial({ color: 0xffd84a });
  const side = new THREE.MeshLambertMaterial({ color: 0xe8823a });
  const front2 = new THREE.MeshLambertMaterial({ color: 0xf6f1e4 });
  const side2 = new THREE.MeshLambertMaterial({ color: 0x2f8f83 });
  const letters = [];
  const row = (text, y, size, mats) => {
    const geos = [...text].map((ch) => {
      const g = new TextGeometry(ch, { font, size, depth: size * 0.45, curveSegments: 8, bevelEnabled: true, bevelThickness: size * 0.06, bevelSize: size * 0.04, bevelSegments: 3 });
      g.computeBoundingBox();
      return g;
    });
    const gap = size * 0.12;
    const widths = geos.map((g) => g.boundingBox.max.x - g.boundingBox.min.x);
    let x = -(widths.reduce((a, b) => a + b, 0) + gap * (geos.length - 1)) / 2;
    geos.forEach((g, i) => {
      g.translate(-g.boundingBox.min.x - widths[i] / 2, -size / 2, -size * 0.22);
      const m = new THREE.Mesh(g, mats);
      m.position.set(x + widths[i] / 2, y, 0);
      m.userData = { baseY: y, i: letters.length };
      scene.add(m);
      letters.push(m);
      x += widths[i] + gap;
    });
  };
  row('CAMERON', 2.6, 1.55, [front, side]);
  row('PAVLOSKE', 0.75, 1.3, [front2, side2]);

  // The character, waving
  const hero = createCharacter();
  hero.object.position.set(0, -2.9, 2);
  hero.object.scale.setScalar(1.5);
  scene.add(hero.object);
  // Little floor disk
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.3, 24), new THREE.MeshLambertMaterial({ color: 0x5f8a3f, flatShading: true }));
  disk.position.set(0, -3.05, 2);
  scene.add(disk);

  return {
    scene, camera,
    update(dt, t) {
      burst.rotation.z = t * 0.12;
      for (const m of letters) {
        const k = m.userData.i;
        m.position.y = m.userData.baseY + Math.sin(t * 2.4 - k * 0.45) * 0.14;
        m.rotation.y = Math.sin(t * 1.2 - k * 0.3) * 0.18;
      }
      hero.animate({ speed: 0, grounded: true, vy: 0, mode: 'ground', t }, dt);
      hero.object.rotation.y = Math.sin(t * 0.8) * 0.4;
      hero.wave?.(t);
    },
    /** Draw "Press Start" into the HUD. */
    /** "Press Start" (blinking) and, briefly after tuning in, the channel number. */
    drawHud(hud, t, osdNum = null) {
      const on = Math.floor(t * 1.6) % 2 === 0;
      hud.draw(`title:${on}:${osdNum}`, (g, w, h) => {
        if (on) hud.text('PRESS START', w / 2, h * 0.9, { size: 34, color: '#fff' });
        if (osdNum) hud.osd(osdNum);
      });
    },
  };
}
