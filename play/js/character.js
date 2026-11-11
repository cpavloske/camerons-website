/**
 * character.js — the player's look and animation.
 *
 * Original design: a small, round kid in a teal cap worn slightly back, an
 * orange hoodie, gray shorts, and oversized two-tone sneakers. Built from
 * smooth, higher-segment primitives.
 *
 * To swap the character: return any THREE.Object3D from createCharacter()
 * with its feet at y = 0 and facing +Z, plus animate(state, dt), impulse(n),
 * and wave(t). Nothing else depends on how it's built.
 */
import * as THREE from 'three';
import { part, mesh } from './lowpoly.js';

const C = {
  skin: 0xe2a77f,
  cap: 0x2f8f83,
  capBrim: 0xf3e6c8,
  hoodie: 0xe8823a,
  hoodieDark: 0xc4632a,
  shorts: 0x5b6170,
  shoeUpper: 0x2f8f83,
  shoeSole: 0xf6f1e4,
  shoeLace: 0xf3c34d,
  eye: 0x1d1a24,
  cheek: 0xe98a8a,
};

const S = 28; // radial segments for round parts

export function createCharacter() {
  const root = new THREE.Group();      // yaw (facing) is applied here
  const squashG = new THREE.Group();   // squash/stretch, anchored at the feet
  const pivot = new THREE.Group();     // flips, lean — rotates around the belly
  const body = new THREE.Group();      // holds every part
  pivot.position.y = 0.7;
  body.position.y = -0.7;
  root.add(squashG); squashG.add(pivot); pivot.add(body);

  // --- Torso: hoodie + shorts ---------------------------------------------------
  body.add(mesh([
    part(new THREE.CylinderGeometry(0.21, 0.27, 0.42, S), C.hoodie, { y: 0.63 }),
    part(new THREE.SphereGeometry(0.21, S, 12, 0, Math.PI * 2, 0, Math.PI / 2), C.hoodie, { y: 0.84, sy: 0.35 }), // rounded shoulders
    part(new THREE.TorusGeometry(0.17, 0.035, 10, S), C.hoodieDark, { y: 0.87, rx: Math.PI / 2 }),                  // collar
    part(new THREE.BoxGeometry(0.2, 0.09, 0.03), C.hoodieDark, { y: 0.56, z: 0.245, rx: -0.15 }),                    // pouch pocket
    part(new THREE.CylinderGeometry(0.265, 0.25, 0.12, S), C.shorts, { y: 0.44 }),
    part(new THREE.TorusGeometry(0.262, 0.018, 8, S), 0x4a4f5c, { y: 0.495, rx: Math.PI / 2 }),                     // waistband
  ]));

  // --- Head: face, cap ------------------------------------------------------------
  const head = new THREE.Group();
  head.position.y = 1.08;
  head.add(mesh([
    part(new THREE.SphereGeometry(0.3, 32, 24), C.skin, { sy: 0.95 }),
    // eyes: tall dark ovals
    part(new THREE.SphereGeometry(0.045, 16, 12), C.eye, { x: -0.1, y: 0.0, z: 0.262, sx: 0.65, sy: 1.15, sz: 0.5 }),
    part(new THREE.SphereGeometry(0.045, 16, 12), C.eye, { x: 0.1, y: 0.0, z: 0.262, sx: 0.65, sy: 1.15, sz: 0.5 }),
    // tiny highlights
    part(new THREE.SphereGeometry(0.012, 8, 6), 0xffffff, { x: -0.09, y: 0.025, z: 0.282 }),
    part(new THREE.SphereGeometry(0.012, 8, 6), 0xffffff, { x: 0.11, y: 0.025, z: 0.282 }),
    // cheeks
    part(new THREE.SphereGeometry(0.04, 14, 10), C.cheek, { x: -0.17, y: -0.07, z: 0.225, sz: 0.35, sy: 0.6, ry: -0.5 }),
    part(new THREE.SphereGeometry(0.04, 14, 10), C.cheek, { x: 0.17, y: -0.07, z: 0.225, sz: 0.35, sy: 0.6, ry: 0.5 }),
    // little smile
    part(new THREE.TorusGeometry(0.045, 0.011, 8, 20, Math.PI), C.eye, { y: -0.085, z: 0.272, rz: Math.PI, rx: -0.3 }),
    // cap: dome + brim + button, tilted slightly back
    part(new THREE.SphereGeometry(0.315, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), C.cap, { y: 0.06, rx: -0.12 }),
    part(new THREE.TorusGeometry(0.31, 0.018, 8, 40), C.cap, { y: 0.06, rx: Math.PI / 2 - 0.12 }),                 // dome rim
    part(new THREE.CylinderGeometry(0.2, 0.2, 0.035, S, 1, false, -Math.PI / 2, Math.PI), C.capBrim, { y: 0.09, z: 0.2, rx: 0.08, sx: 1.15 }),
    part(new THREE.SphereGeometry(0.035, 14, 10), C.capBrim, { y: 0.37, z: -0.04, sy: 0.6 }),
  ]));
  body.add(head);

  // --- Arms (pivot at the shoulder) ------------------------------------------------
  const makeArm = (side) => {
    const g = new THREE.Group();
    g.position.set(0.27 * side, 0.8, 0);
    g.add(mesh([
      part(new THREE.CapsuleGeometry(0.063, 0.14, 6, S), C.hoodie, { y: -0.12 }),
      part(new THREE.TorusGeometry(0.058, 0.014, 6, S), C.hoodieDark, { y: -0.21, rx: Math.PI / 2 }),             // cuff
      part(new THREE.SphereGeometry(0.08, 20, 14), C.skin, { y: -0.27 }),
    ]));
    g.rotation.z = 0.25 * side;
    body.add(g);
    return g;
  };
  const armL = makeArm(1), armR = makeArm(-1);

  // --- Legs with chunky two-tone sneakers (pivot at the hip) -----------------------
  const makeLeg = (side) => {
    const g = new THREE.Group();
    g.position.set(0.12 * side, 0.4, 0);
    g.add(mesh([
      part(new THREE.CapsuleGeometry(0.072, 0.14, 6, S), C.skin, { y: -0.14 }),
      // thick rounded sole
      part(new THREE.CapsuleGeometry(0.1, 0.18, 6, S), C.shoeSole, { y: -0.36, z: 0.05, rx: Math.PI / 2, sy: 1, sx: 1.12, sz: 0.38 }),
      // teal upper with a round toe
      part(new THREE.CapsuleGeometry(0.095, 0.12, 8, S), C.shoeUpper, { y: -0.28, z: 0.03, rx: Math.PI / 2, sz: 0.75 }),
      part(new THREE.CapsuleGeometry(0.02, 0.09, 4, 10), C.shoeLace, { y: -0.2, z: 0.07, rz: Math.PI / 2 }),
      part(new THREE.CapsuleGeometry(0.02, 0.07, 4, 10), C.shoeLace, { y: -0.215, z: 0.12, rz: Math.PI / 2 }),
    ]));
    body.add(g);
    return g;
  };
  const legL = makeLeg(1), legR = makeLeg(-1);

  // --- Animation -------------------------------------------------------------------
  let phase = 0, squash = 0, squashVel = 0, flip = 0;

  /** state: { speed (0..1), grounded, vy, mode, t } — mode: 'ground' | 'air' | 'double' */
  function animate(s, dt) {
    const run = s.grounded ? s.speed : 0;
    phase += dt * (6 + 8 * run) * (run > 0.05 ? 1 : 0.3);
    // Spring the squash value back toward zero (gives a bouncy wobble)
    squashVel += (-squash * 220 - squashVel * 16) * dt;
    squash += squashVel * dt;

    let legSwing = 0, armSwing = 0, lean = 0, bob = 0;
    const ease = 1 - Math.exp(-dt * 14);
    if (s.mode === 'ground') {
      legSwing = Math.sin(phase) * 0.9 * run;
      armSwing = -Math.sin(phase) * 0.8 * run;
      bob = Math.abs(Math.sin(phase)) * 0.06 * run + Math.sin(s.t * 2.2) * 0.01 * (1 - run);
      lean = 0.18 * run;
      armL.rotation.z = THREE.MathUtils.lerp(armL.rotation.z, 0.25, ease);
    } else {
      // Air pose: one leg tucked, arms up when rising
      const up = THREE.MathUtils.clamp(s.vy / 10, -1, 1);
      legSwing = 0.5;
      armL.rotation.z = THREE.MathUtils.lerp(armL.rotation.z, 0.4 + up * 1.6, ease);
    }
    armR.rotation.z = -armL.rotation.z;
    legL.rotation.x = legSwing;
    legR.rotation.x = s.mode === 'ground' ? -legSwing : -0.6;
    armL.rotation.x = armSwing;
    armR.rotation.x = -armSwing;

    flip = s.mode === 'double' ? Math.min(flip + dt * 16, Math.PI * 2) : 0;
    pivot.rotation.x = lean + flip;
    pivot.position.y = 0.7 + bob;
    const sq = THREE.MathUtils.clamp(squash, -0.4, 0.45);
    squashG.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
  }

  /** Kick the squash spring. Positive = squash (landing), negative = stretch. */
  function impulse(amount) { squashVel += amount * 14; }

  /** Call after animate() to wave the right hand. */
  function wave(t) {
    armR.rotation.z = -2.5 + Math.sin(t * 9) * 0.35;
    armR.rotation.x = 0;
  }

  return { object: root, animate, impulse, wave };
}
