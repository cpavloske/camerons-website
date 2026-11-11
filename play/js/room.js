/**
 * room.js — the living room at night, modeled to look real: a wood-grain
 * 4:3 tube TV on a long low stand, an original late-90s console beside it
 * with a cartridge labeled "CAMERON", a controller corded to the couch, a
 * remote on the coffee table, a floor lamp, and moonlight through a window.
 *
 * Realism comes from: physically based materials (wood, fabric, plastic,
 * brass, glass) with procedural textures and bump maps, rounded edges
 * everywhere, small set dressing (VCR, tapes, mug, magazines, curtains,
 * plant), a lamp and a moon that cast shadows, and soft reflections.
 * Shadows are baked once and only refreshed when something moves
 * (see `needsShadowUpdate` in main.js), so it stays fast on phones.
 *
 * The console is an original design (charcoal shell, teal stripe, four
 * front ports, top-loading slot) — not modeled on any real hardware.
 *
 * Returns the scene plus the meshes main.js needs for clicks and animation.
 * Units are meters; the floor is y = 0 and the TV faces +Z.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { screenGeometry } from './crt.js';

// TV screen size (4:3) and where its center sits
export const SCREEN = { w: 1.12, h: 0.84, x: -0.12, y: 1.12, z: 0.5 };

/**
 * @param {THREE.Material} screenMaterial  the CRT material showing the game picture
 * @param {THREE.WebGLRenderer} gl         used once to build soft reflections
 */
export function buildRoom(screenMaterial, gl) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07060a);
  scene.fog = new THREE.Fog(0x07060a, 8, 16);

  // Soft reflections so plastic, glass and brass catch a little light
  if (gl) {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.07;
    pmrem.dispose();
  }

  let seed = 77;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // --- Materials ---------------------------------------------------------------
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const woodDarkTex = woodTexture('#4a2c18', '#2a170b', 3);
  const woodTvTex = woodTexture('#7a4a26', '#4a2a12', 5);
  const woodTableTex = woodTexture('#6a4026', '#3e2412', 7);
  const fabricTex = noiseTexture('#5c6c4c', 0.16, 9);
  const M = {
    woodDark: std({ map: woodDarkTex, bumpMap: woodDarkTex, bumpScale: 0.6, roughness: 0.62 }),
    woodTv: std({ map: woodTvTex, bumpMap: woodTvTex, bumpScale: 0.5, roughness: 0.5 }),
    woodTable: std({ map: woodTableTex, bumpMap: woodTableTex, bumpScale: 0.5, roughness: 0.45 }),
    trim: std({ color: 0xcfc4ae, roughness: 0.7 }),
    plastic: std({ color: 0x151417, roughness: 0.42 }),
    plasticMatte: std({ color: 0x0c0b0d, roughness: 0.85 }),
    shell: std({ color: 0x2c2b31, roughness: 0.5 }),
    shellDark: std({ color: 0x1b1a1f, roughness: 0.6 }),
    rubber: std({ color: 0x141416, roughness: 0.95 }),
    grayPlastic: std({ color: 0x8a8a92, roughness: 0.5 }),
    cartridge: std({ color: 0x3a3a40, roughness: 0.6 }),
    accent: std({ color: 0x2f8f83, roughness: 0.45 }),
    orange: std({ color: 0xe8823a, roughness: 0.45 }),
    red: std({ color: 0x9a2424, roughness: 0.4 }),
    chrome: std({ color: 0xc8c8d0, roughness: 0.22, metalness: 1 }),
    brass: std({ color: 0xb08a48, roughness: 0.35, metalness: 0.9 }),
    knob: std({ color: 0x8a8478, roughness: 0.35, metalness: 0.6 }),
    fabric: std({ map: fabricTex, bumpMap: fabricTex, bumpScale: 1.2, roughness: 1 }),
    fabricDark: std({ map: fabricTex, bumpMap: fabricTex, bumpScale: 1.2, roughness: 1, color: 0xc8c8c0 }),
    pillow: std({ map: noiseTexture('#c8963a', 0.14, 4), roughness: 1 }),
    curtain: std({ map: noiseTexture('#8a5a3a', 0.12, 6), roughness: 1, side: THREE.DoubleSide }),
    ceramic: std({ color: 0xe8dcc0, roughness: 0.3 }),
    maroon: std({ color: 0x500000, roughness: 0.3 }),                     // Aggie maroon
    white: std({ color: 0xf2efe8, roughness: 0.3 }),
    coffee: std({ color: 0x2a160c, roughness: 0.2 }),
    terracotta: std({ color: 0xa8583a, roughness: 0.85 }),
    leaf: std({ color: 0x3f6a3a, roughness: 0.7, side: THREE.DoubleSide }),
    paper: std({ color: 0xe9dfc2, roughness: 0.9 }),
  };

  /** Add a mesh. o: x, y, z, rx, ry, rz, cast, receive, parent */
  const add = (geo, mat, o = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(o.x || 0, o.y || 0, o.z || 0);
    m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
    m.castShadow = o.cast !== false;
    m.receiveShadow = o.receive !== false;
    (o.parent || scene).add(m);
    return m;
  };
  const rbox = (w, h, d, r = 0.01, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2));
  const cyl = (rt, rb, h, seg = 24, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);

  // --- Lighting: a warm lamp, moonlight through the window, the TV's glow ------
  const hemi = new THREE.HemisphereLight(0x4a4668, 0x140e0c, 0.35);
  scene.add(hemi);
  const lamp = new THREE.PointLight(0xffac5e, 9, 10, 1.7);
  lamp.position.set(-3.0, 1.52, -0.42);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.bias = -0.004;
  lamp.shadow.normalBias = 0.03;
  lamp.shadow.radius = 4;
  scene.add(lamp);
  const tvLight = new THREE.PointLight(0x9ac8ff, 0, 7, 1.6);   // intensity driven by main.js
  tvLight.position.set(SCREEN.x, SCREEN.y, 1.2);
  scene.add(tvLight);
  const moon = new THREE.SpotLight(0x8ea6ff, 26, 0, 0.42, 0.5, 1.4);
  moon.position.set(7.2, 4.4, -0.3);
  moon.target.position.set(1.4, 0, 1.2);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.bias = -0.002;
  scene.add(moon, moon.target);

  // --- Shag carpet ------------------------------------------------------------------
  const carpetTex = carpetTexture();
  carpetTex.repeat.set(5, 5.7);
  add(new THREE.PlaneGeometry(7, 8).rotateX(-Math.PI / 2),
    std({ map: carpetTex, bumpMap: carpetTex, bumpScale: 3, roughness: 1 }), { z: 3.1, cast: false });

  // --- Walls: wallpaper, baseboards, crown molding, ceiling --------------------
  const paperTex = wallpaperTexture();
  const wallMat = (w, h = 3) => { const t = paperTex.clone(); t.needsUpdate = true; t.repeat.set(w / 0.9, h / 1.8); return std({ map: t, bumpMap: t, bumpScale: 0.4, roughness: 0.92 }); };
  const wallPiece = (w, h, o) => add(new THREE.PlaneGeometry(w, h), wallMat(w, h), { ...o, cast: false });
  wallPiece(7, 3, { y: 1.5, z: -0.9 });                                          // back wall
  wallPiece(8, 3, { x: -3.5, y: 1.5, z: 3.1, ry: Math.PI / 2 });                 // left wall
  // Right wall, built around the window opening (z 0.1..1.1, y 1.1..2.3)
  const WIN = { z0: 0.1, z1: 1.1, y0: 1.1, y1: 2.3 };
  wallPiece(1.0, 3, { x: 3.5, y: 1.5, z: -0.4, ry: -Math.PI / 2 });              // toward the back corner
  wallPiece(6.0, 3, { x: 3.5, y: 1.5, z: 4.1, ry: -Math.PI / 2 });               // toward the camera
  wallPiece(1.0, 1.1, { x: 3.5, y: 0.55, z: 0.6, ry: -Math.PI / 2 });            // under the window
  wallPiece(1.0, 0.7, { x: 3.5, y: 2.65, z: 0.6, ry: -Math.PI / 2 });            // over the window
  add(new THREE.PlaneGeometry(7, 8).rotateX(Math.PI / 2), std({ color: 0x2a2630, roughness: 1 }), { y: 3, z: 3.1, cast: false });
  // Baseboards + crown molding
  for (const [w, x, z, ry] of [[7, 0, -0.885, 0], [8, -3.485, 3.1, Math.PI / 2], [8, 3.485, 3.1, -Math.PI / 2]]) {
    add(rbox(w, 0.13, 0.03, 0.01), M.trim, { x, y: 0.065, z, ry, cast: false });
    add(rbox(w, 0.07, 0.05, 0.015), M.trim, { x, y: 2.965, z, ry, cast: false });
  }

  // --- Window: frame, muntins, night sky, curtains ------------------------------
  const wz = (WIN.z0 + WIN.z1) / 2, wy = (WIN.y0 + WIN.y1) / 2;
  const skyMat = new THREE.MeshBasicMaterial({ map: nightSkyTexture(), fog: false });
  add(new THREE.PlaneGeometry(3, 3), skyMat, { x: 4.4, y: 1.9, z: wz, ry: -Math.PI / 2, cast: false, receive: false });
  // The glass: rain beads and streaks running down it (shader at the bottom of this file)
  const rainGlass = rainGlassMaterial();
  add(new THREE.PlaneGeometry(1.0, 1.2), rainGlass, { x: 3.53, y: wy, z: wz, ry: -Math.PI / 2, cast: false, receive: false });
  // Rain falling outside, seen through the window
  const RAIN = 260;
  const rainPos = new Float32Array(RAIN * 6);
  const rainSeed = Array.from({ length: RAIN }, () => [3.7 + rnd() * 0.6, rnd(), WIN.z0 - 0.25 + rnd() * 1.5, 0.6 + rnd() * 0.5]);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x9fb4e0, transparent: true, opacity: 0.4, fog: false }));
  rain.frustumCulled = false;
  scene.add(rain);
  // Frame (casing) and the cross of muntins — the muntins cast a shadow in the moonlight
  add(rbox(0.1, 0.07, 1.16, 0.01), M.trim, { x: 3.47, y: WIN.y1 + 0.035, z: wz });
  add(rbox(0.14, 0.05, 1.2, 0.01), M.trim, { x: 3.45, y: WIN.y0 - 0.025, z: wz });   // sill
  add(rbox(0.1, 1.26, 0.07, 0.01), M.trim, { x: 3.47, y: wy, z: WIN.z0 - 0.035 });
  add(rbox(0.1, 1.26, 0.07, 0.01), M.trim, { x: 3.47, y: wy, z: WIN.z1 + 0.035 });
  add(rbox(0.04, 1.2, 0.035, 0.008), M.trim, { x: 3.5, y: wy, z: wz });
  add(rbox(0.04, 0.035, 1.0, 0.008), M.trim, { x: 3.5, y: wy, z: wz });
  // Invisible shadow masks so moonlight only comes through the opening
  const mask = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  for (const [h, d, y, z] of [[3, 4, 1.5, WIN.z0 - 2], [3, 6, 1.5, WIN.z1 + 3], [1.1, 1, 0.55, wz], [2, 1, 3.3, wz]]) {
    add(new THREE.BoxGeometry(0.05, h, d), mask, { x: 3.62, y, z, receive: false });
  }
  // Curtains on a brass rod, gathered to the sides
  add(cyl(0.012, 0.012, 1.7, 12), M.brass, { x: 3.4, y: 2.42, z: wz, rx: Math.PI / 2 });
  for (const side of [-1, 1]) {
    const g = new THREE.PlaneGeometry(0.42, 1.45, 14, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 46) * 0.028);   // folds
    g.computeVertexNormals();
    add(g, M.curtain, { x: 3.4, y: 1.68, z: wz + side * 0.66, ry: -Math.PI / 2 });
  }

  // --- On the back wall: a small shelf, an outlet -------------------------------
  add(rbox(0.9, 0.035, 0.2, 0.008), M.woodDark, { x: -2.2, y: 1.55, z: -0.79 });
  [[0x7a2a32, 0.24], [0x2f5a6a, 0.2], [0xc8963a, 0.26], [0x3c4a6a, 0.22]].forEach(([c, h], i) =>
    add(rbox(0.045, h, 0.15, 0.006), std({ color: c, roughness: 0.8 }), { x: -2.5 + i * 0.052, y: 1.57 + h / 2, z: -0.79, rz: i === 3 ? -0.16 : 0 }));
  add(cyl(0.05, 0.04, 0.09, 16), M.ceramic, { x: -1.95, y: 1.61, z: -0.79 });
  /**
   * A trailing pothos in a pot (top of the pot at PY): a leafy crown and vines
   * spilling over the shelf's front edge. vines: [[dx, dz, length], ...]
   */
  function trailingPothos(PX, PY, PZ, vines) {
    add(cyl(0.046, 0.046, 0.006, 16), std({ color: 0x2a1a10, roughness: 1 }), { x: PX, y: PY - 0.004, z: PZ, cast: false });
    const leafMats = [0x3f7a3a, 0x4f8a3e, 0x5f9a48, 0x356a32].map((c) => std({ color: c, roughness: 0.6, side: THREE.DoubleSide }));
    /** One heart-shaped leaf on a short stem. */
    const leaf = (x, y, z, ry, tilt, sz = 1) => {
      const g = new THREE.SphereGeometry(1, 10, 8);
      g.scale(0.022 * sz, 0.004, 0.03 * sz);
      g.translate(0, 0, 0.026 * sz);
      const m = add(g, leafMats[Math.floor(rnd() * leafMats.length)], { x, y, z });
      m.rotation.set(tilt, ry, 0, 'YXZ');
      return m;
    };
    for (let i = 0; i < 14; i++) {                       // crown
      const a = rnd() * Math.PI * 2, r = rnd() * 0.035;
      leaf(PX + Math.cos(a) * r, PY + 0.01 + rnd() * 0.05, PZ + Math.sin(a) * r, a + Math.PI / 2, -0.4 - rnd() * 0.5, 0.9 + rnd() * 0.4);
    }
    for (const [dx, dz, len] of vines) {                 // vines, with leaves along them
      const pts = [
        new THREE.Vector3(PX + dx * 0.5, PY + 0.02, PZ + dz * 0.4),
        new THREE.Vector3(PX + dx, PY + 0.01, PZ + dz + 0.05),               // out over the shelf's front edge
        new THREE.Vector3(PX + dx * 1.2, PY - len * 0.45, PZ + dz + 0.08),
        new THREE.Vector3(PX + dx * 1.4 + 0.02, PY - len, PZ + dz + 0.075),
      ];
      const vine = new THREE.CatmullRomCurve3(pts);
      add(new THREE.TubeGeometry(vine, 24, 0.0018, 5, false), leafMats[3], { cast: false });
      const n = Math.round(len / 0.045);
      for (let k = 1; k <= n; k++) {
        const q = vine.getPointAt(k / (n + 0.5));
        leaf(q.x, q.y, q.z, (k % 2 ? 1 : -1) * 1.2 + rnd() * 0.4, 0.9 + rnd() * 0.4, 0.75 + rnd() * 0.3);
      }
    }
  }
  trailingPothos(-1.95, 1.655, -0.79, [[0.02, 0.06, 0.32], [-0.03, 0.07, 0.24], [0.06, 0.05, 0.42], [0.09, 0.0, 0.2]]);
  add(rbox(0.07, 0.11, 0.008, 0.004), M.trim, { x: -1.2, y: 0.32, z: -0.893, cast: false });

  // --- TV stand: a long low unit with a shelf, a VCR and tapes ------------------
  add(rbox(3.2, 0.05, 0.75, 0.012), M.woodDark, { x: 0.6, y: 0.245, z: 0 });
  add(rbox(3.2, 0.04, 0.75, 0.01), M.woodDark, { x: 0.6, y: 0.03, z: 0 });
  add(new THREE.BoxGeometry(3.16, 0.2, 0.02), M.woodDark, { x: 0.6, y: 0.135, z: -0.36 });
  [-0.975, 0.985, 2.175].forEach((x) => add(rbox(0.05, 0.2, 0.75, 0.008), M.woodDark, { x, y: 0.135, z: 0 }));
  // VCR with a little green clock
  add(rbox(0.46, 0.1, 0.32, 0.008), M.plastic, { x: -0.45, y: 0.1, z: 0.12 });
  add(new THREE.BoxGeometry(0.2, 0.018, 0.01), M.plasticMatte, { x: -0.52, y: 0.115, z: 0.281, cast: false });
  add(new THREE.PlaneGeometry(0.09, 0.028), new THREE.MeshBasicMaterial({ map: clockTexture() }), { x: -0.31, y: 0.1, z: 0.2815, cast: false, receive: false });
  // VHS tapes with paper labels
  for (let i = 0; i < 7; i++) {
    const lean = i === 6 ? -0.22 : 0;
    add(rbox(0.026, 0.12, 0.19, 0.004), M.plastic, { x: 0.3 + i * 0.03, y: 0.11, z: 0.1, rz: lean });
    add(new THREE.PlaneGeometry(0.018, 0.085), std({ color: [0xe9dfc2, 0xd8e4ea, 0xf0d8a0][i % 3], roughness: 0.9 }), { x: 0.3 + i * 0.03 + lean * 0.05, y: 0.112, z: 0.1955, rz: lean, cast: false });
  }
  add(rbox(0.19, 0.03, 0.12, 0.004), M.plastic, { x: 0.72, y: 0.065, z: 0.12, ry: 0.2 });   // a loose tape lying flat

  // --- The TV -----------------------------------------------------------------------
  const tv = new THREE.Group();
  const cab = add(rbox(1.62, 1.18, 1.0, 0.035, 4), M.woodTv, { x: 0, y: 0.27 + 0.59, z: -0.1, parent: tv });
  add(rbox(1.2, 0.9, 0.5, 0.06), M.plasticMatte, { x: 0, y: 0.95, z: -0.72, parent: tv });       // back of the tube
  // Dark plastic face: the screen surround and the control strip
  add(rbox(SCREEN.w + 0.18, SCREEN.h + 0.18, 0.08, 0.02), M.plasticMatte, { x: SCREEN.x, y: SCREEN.y, z: 0.44, parent: tv });
  add(rbox(0.34, 0.98, 0.05, 0.015), M.plastic, { x: 0.6, y: SCREEN.y - 0.02, z: 0.41, parent: tv });
  // Bezel lip framing the glass (rounded, slightly glossy)
  const lip = [[SCREEN.w + 0.13, 0.075, 0, SCREEN.h / 2 + 0.022], [SCREEN.w + 0.13, 0.075, 0, -SCREEN.h / 2 - 0.022],
    [0.075, SCREEN.h + 0.13, -SCREEN.w / 2 - 0.022, 0], [0.075, SCREEN.h + 0.13, SCREEN.w / 2 + 0.022, 0]];
  for (const [w, h, dx, dy] of lip) add(rbox(w, h, 0.075, 0.025, 4), M.plastic, { x: SCREEN.x + dx, y: SCREEN.y + dy, z: 0.535, parent: tv });
  // Speaker grille slats, a brass trim line, a small badge
  for (let i = 0; i < 9; i++) add(rbox(0.22, 0.01, 0.016, 0.004), M.plasticMatte, { x: 0.6, y: 1.5 - i * 0.03, z: 0.438, parent: tv, cast: false });
  add(new THREE.BoxGeometry(0.22, 0.012, 0.012), M.brass, { x: 0.6, y: 1.2, z: 0.438, parent: tv, cast: false });
  add(rbox(0.09, 0.022, 0.008, 0.003), M.chrome, { x: 0.6, y: 0.68, z: 0.437, parent: tv, cast: false });
  // Two working knobs (top = channel up, bottom = channel down), each with a chrome ring and pointer
  const makeKnob = (y, r) => {
    const k = new THREE.Group();
    k.position.set(0.6, y, 0.44);
    add(cyl(r * 1.18, r * 1.18, 0.012, 32), M.chrome, { z: 0.004, rx: Math.PI / 2, parent: k });
    add(cyl(r * 0.92, r, 0.05, 32), M.knob, { z: 0.03, rx: Math.PI / 2, parent: k });
    add(rbox(r * 0.2, r * 0.85, 0.012, 0.003), M.plasticMatte, { y: r * 0.42, z: 0.058, parent: k, cast: false });
    tv.add(k);
    return k;
  };
  const knobUp = makeKnob(1.05, 0.05);
  const knobDown = makeKnob(0.92, 0.04);
  // Power button with a little LED
  const power = add(rbox(0.1, 0.06, 0.03, 0.008), M.red, { x: 0.6, y: 0.78, z: 0.445, parent: tv });
  const led = add(new THREE.SphereGeometry(0.011, 12, 8), new THREE.MeshBasicMaterial({ color: 0x401010 }), { x: 0.69, y: 0.86, z: 0.437, parent: tv, cast: false, receive: false });
  // The glass (gets the game picture)
  const screen = add(screenGeometry(SCREEN.w, SCREEN.h), screenMaterial, { x: SCREEN.x, y: SCREEN.y, z: SCREEN.z, parent: tv, cast: false, receive: false });

  // Rabbit-ear antenna: a base that twists (ears.rotation.y) and two chrome rods
  // that spread. main.js turns it and works out the reception from its angle.
  const ears = new THREE.Group();
  ears.position.set(0.2, 1.46, -0.2);
  add(cyl(0.085, 0.11, 0.05, 32), M.plastic, { y: 0.025, parent: ears });
  add(new THREE.SphereGeometry(0.085, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.plastic, { y: 0.05, parent: ears }).scale.y = 0.45;
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const rods = [-1, 1].map((side) => {
    const rod = new THREE.Group();
    rod.position.y = 0.06;
    rod.rotation.z = -side * 0.45;
    add(cyl(0.007, 0.009, 0.9, 12), M.chrome, { y: 0.45, parent: rod });
    add(new THREE.SphereGeometry(0.016, 12, 8), M.chrome, { y: 0.9, parent: rod });
    // A fat invisible sleeve so the thin rod is easy to click
    const hit = new THREE.Mesh(cyl(0.06, 0.06, 0.9, 6), hitMat);
    hit.position.y = 0.45;
    rod.add(hit);
    ears.add(rod);
    return rod;
  });
  tv.add(ears);
  scene.add(tv);

  // --- The console (original design), on the stand beside the TV ---------------
  const consoleG = new THREE.Group();
  consoleG.position.set(1.5, 0.27, 0.02);
  consoleG.rotation.y = -0.18;               // angled a little toward the couch
  const C = (geo, mat, o) => add(geo, mat, { ...o, parent: consoleG });
  C(rbox(0.62, 0.12, 0.5, 0.035, 4), M.shell, { y: 0.065 });                              // shell
  C(rbox(0.5, 0.03, 0.34, 0.012), M.shellDark, { y: 0.135, z: -0.02 });                   // raised top deck
  C(new THREE.BoxGeometry(0.34, 0.02, 0.085), M.plasticMatte, { y: 0.143, z: -0.03, cast: false }); // cartridge slot
  C(new THREE.BoxGeometry(0.625, 0.012, 0.012), M.accent, { y: 0.1, z: 0.246, cast: false });       // teal stripe
  C(rbox(0.07, 0.022, 0.045, 0.006), M.grayPlastic, { x: -0.19, y: 0.158, z: 0.1 });      // power slider
  C(rbox(0.05, 0.02, 0.045, 0.006), M.grayPlastic, { x: 0.19, y: 0.158, z: 0.1 });        // reset
  for (let i = 0; i < 6; i++) C(new THREE.BoxGeometry(0.3, 0.004, 0.008), M.plasticMatte, { y: 0.151, z: -0.13 - i * 0.012, cast: false }); // vents
  for (const x of [-0.21, -0.07, 0.07, 0.21]) {                                           // four controller ports
    C(rbox(0.075, 0.04, 0.02, 0.008), M.shellDark, { x, y: 0.045, z: 0.243, cast: false });
    C(new THREE.BoxGeometry(0.05, 0.02, 0.012), M.plasticMatte, { x, y: 0.045, z: 0.25, cast: false });
  }
  for (const [x, z] of [[-0.26, -0.2], [0.26, -0.2], [-0.26, 0.2], [0.26, 0.2]]) C(cyl(0.022, 0.022, 0.01, 12), M.rubber, { x, y: 0.003, z });
  const consoleLed = C(new THREE.SphereGeometry(0.008, 10, 8), new THREE.MeshBasicMaterial({ color: 0x103010 }), { x: -0.12, y: 0.152, z: 0.12, cast: false, receive: false });

  // The cartridge sticking out of the top, with a handwritten label
  const cart = new THREE.Group();
  cart.position.set(0, 0.24, -0.03);
  add(rbox(0.3, 0.2, 0.05, 0.008), M.cartridge, { parent: cart });
  add(rbox(0.3, 0.03, 0.06, 0.008), M.cartridge, { y: 0.09, parent: cart });
  for (const x of [-0.1, 0, 0.1]) add(rbox(0.06, 0.01, 0.062, 0.003), M.shellDark, { x, y: 0.106, parent: cart, cast: false });
  add(new THREE.PlaneGeometry(0.24, 0.13), std({ map: labelTexture(), roughness: 0.9 }), { y: -0.015, z: 0.0262, parent: cart, cast: false });
  consoleG.add(cart);
  scene.add(consoleG);

  // --- Couch: frame, plump cushions, a throw pillow, wooden feet ---------------
  const CZ = 3.3;
  add(rbox(2.36, 0.28, 0.95, 0.05, 4), M.fabricDark, { y: 0.26, z: CZ });                     // base
  add(rbox(2.36, 0.72, 0.22, 0.08, 4), M.fabricDark, { y: 0.56, z: CZ + 0.46, rx: 0.06 });    // back frame
  for (const s of [-1, 1]) {
    add(rbox(0.28, 0.56, 1.0, 0.11, 5), M.fabricDark, { x: s * 1.3, y: 0.42, z: CZ });         // arms
    add(rbox(1.07, 0.17, 0.74, 0.07, 5), M.fabric, { x: s * 0.545, y: 0.485, z: CZ - 0.07 });   // seat cushions
    add(rbox(1.05, 0.46, 0.2, 0.09, 5), M.fabric, { x: s * 0.545, y: 0.82, z: CZ + 0.28, rx: 0.2 }); // back cushions
  }
  add(rbox(0.4, 0.4, 0.13, 0.065, 5), M.pillow, { x: -0.86, y: 0.76, z: CZ + 0.16, rx: 0.32, rz: 0.2 });
  for (const [x, z] of [[-1.3, -0.4], [1.3, -0.4], [-1.3, 0.42], [1.3, 0.42]]) add(cyl(0.03, 0.022, 0.12, 12), M.woodDark, { x, y: 0.06, z: CZ + z });

  // --- Coffee table with a mug, magazines and the remote -----------------------
  const TY = 0.41; // table top surface
  add(rbox(1.2, 0.045, 0.6, 0.015, 4), M.woodTable, { y: TY - 0.0225, z: 2.0 });
  add(rbox(1.08, 0.02, 0.48, 0.006), M.woodTable, { y: 0.14, z: 2.0 });
  for (const [x, z] of [[-0.55, 1.75], [0.55, 1.75], [-0.55, 2.25], [0.55, 2.25]]) add(cyl(0.026, 0.02, TY - 0.04, 12), M.woodTable, { x, y: (TY - 0.04) / 2, z });
  // Mug: body, coffee, handle, on a coaster
  add(cyl(0.05, 0.05, 0.004, 24), M.woodDark, { x: -0.35, y: TY + 0.002, z: 2.1, cast: false });
  // An Aggie-maroon mug with a white band
  add(cyl(0.04, 0.036, 0.09, 24, true), M.maroon, { x: -0.35, y: TY + 0.049, z: 2.1 }).material.side = THREE.DoubleSide;
  add(cyl(0.0405, 0.0395, 0.014, 24, true), M.white, { x: -0.35, y: TY + 0.062, z: 2.1, cast: false });
  add(cyl(0.036, 0.036, 0.004, 24), M.maroon, { x: -0.35, y: TY + 0.006, z: 2.1, cast: false });
  add(cyl(0.036, 0.036, 0.002, 24), M.coffee, { x: -0.35, y: TY + 0.078, z: 2.1, cast: false });
  add(new THREE.TorusGeometry(0.024, 0.006, 8, 16, Math.PI), M.maroon, { x: -0.392, y: TY + 0.048, z: 2.1, rz: Math.PI / 2 });
  // A couple of magazines
  add(rbox(0.21, 0.006, 0.28, 0.002), std({ map: magazineTexture('#2f5a8a', '#f3c34d'), roughness: 0.4 }), { x: -0.05, y: TY + 0.004, z: 1.94, ry: 0.25 });
  add(rbox(0.21, 0.006, 0.28, 0.002), std({ map: magazineTexture('#8a2a3a', '#f6f1e4'), roughness: 0.4 }), { x: -0.03, y: TY + 0.011, z: 1.92, ry: -0.12 });
  // Remote (clickable → changes the channel)
  const remote = new THREE.Group();
  remote.position.set(0.27, TY + 0.012, 1.95);
  remote.rotation.y = -0.4;
  add(rbox(0.056, 0.022, 0.19, 0.009, 4), M.plastic, { parent: remote });
  add(cyl(0.008, 0.008, 0.006, 12), M.red, { x: -0.013, y: 0.012, z: -0.075, parent: remote, cast: false });
  add(new THREE.BoxGeometry(0.03, 0.01, 0.004), std({ color: 0x3a0a0a, roughness: 0.1 }), { z: -0.0955, parent: remote, cast: false });
  for (let r = 0; r < 5; r++) for (const x of [-0.014, 0, 0.014]) {
    add(cyl(0.0048, 0.0048, 0.005, 10), M.grayPlastic, { x, y: 0.012, z: -0.045 + r * 0.022, parent: remote, cast: false });
  }
  scene.add(remote);

  // --- Controller on the couch, and its cord back to the console ---------------
  const pad = new THREE.Group();
  pad.position.set(0.55, 0.59, 3.1);
  pad.rotation.set(0, 0.5, 0);
  const P = (geo, mat, o) => add(geo, mat, { ...o, parent: pad });
  P(rbox(0.26, 0.04, 0.1, 0.018, 4), M.shell, {});
  for (const s of [-1, 1]) {
    P(cyl(0.048, 0.05, 0.04, 24), M.shell, { x: s * 0.12, z: 0.03 });
    P(rbox(0.06, 0.04, 0.1, 0.018, 4), M.shell, { x: s * 0.13, z: 0.085, ry: -s * 0.4 });
  }
  P(cyl(0.011, 0.013, 0.022, 16), M.grayPlastic, { y: 0.03 });                 // stick
  P(new THREE.SphereGeometry(0.014, 12, 8), M.rubber, { y: 0.044 });
  P(rbox(0.034, 0.008, 0.011, 0.003), M.grayPlastic, { x: -0.1, y: 0.023, cast: false });   // d-pad
  P(rbox(0.011, 0.008, 0.034, 0.003), M.grayPlastic, { x: -0.1, y: 0.023, cast: false });
  P(cyl(0.011, 0.011, 0.01, 16), M.accent, { x: 0.09, y: 0.023, z: 0.01, cast: false });
  P(cyl(0.011, 0.011, 0.01, 16), M.orange, { x: 0.12, y: 0.023, z: -0.015, cast: false });
  scene.add(pad);
  const portWorld = new THREE.Vector3(-0.21, 0.045, 0.26).applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.18).add(consoleG.position);
  const cord = new THREE.CatmullRomCurve3([
    portWorld,
    new THREE.Vector3(portWorld.x - 0.02, 0.29, 0.42),       // over the front edge of the stand
    new THREE.Vector3(portWorld.x - 0.05, 0.1, 0.5),
    new THREE.Vector3(portWorld.x - 0.15, 0.015, 0.8),       // across the carpet
    new THREE.Vector3(1.15, 0.015, 1.5),
    new THREE.Vector3(0.95, 0.015, 2.3),
    new THREE.Vector3(1.0, 0.03, 2.75),
    new THREE.Vector3(0.78, 0.5, 2.93),
    new THREE.Vector3(0.6, 0.59, 3.03),
  ]);
  add(new THREE.TubeGeometry(cord, 120, 0.007, 8, false), M.rubber);

  // --- Floor lamp in the corner: brass base and pole, glowing shade (click to switch) ---
  const lampG = new THREE.Group();
  lampG.position.set(-3.0, 0, -0.42);   // tucked into the back-left corner
  add(cyl(0.15, 0.17, 0.03, 32), M.brass, { y: 0.015, parent: lampG });
  add(cyl(0.012, 0.014, 1.5, 16), M.brass, { y: 0.77, parent: lampG });
  const shadeMat = std({ color: 0xffe6c0, emissive: 0xff9c48, emissiveIntensity: 1.1, roughness: 1, side: THREE.DoubleSide });
  add(cyl(0.17, 0.27, 0.32, 32, true), shadeMat, { y: 1.6, parent: lampG, cast: false, receive: false });
  const bulb = add(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff0d0 }), { y: 1.55, parent: lampG, cast: false, receive: false });
  add(cyl(0.002, 0.002, 0.16, 6), M.brass, { x: 0.12, y: 1.4, parent: lampG, cast: false });          // pull chain
  add(new THREE.SphereGeometry(0.008, 8, 6), M.brass, { x: 0.12, y: 1.32, parent: lampG, cast: false });
  const lampHit = new THREE.Mesh(cyl(0.28, 0.28, 1.8, 8), new THREE.MeshBasicMaterial({ visible: false }));
  lampHit.position.y = 0.9;
  lampG.add(lampHit);
  scene.add(lampG);
  let lampOn = true;
  /** Click the lamp: the room drops to TV glow and moonlight (and back). */
  function toggleLamp() {
    lampOn = !lampOn;
    lamp.intensity = lampOn ? 9 : 0;
    shadeMat.emissiveIntensity = lampOn ? 1.1 : 0.02;
    shadeMat.color.set(lampOn ? 0xffe6c0 : 0x6a6050);
    bulb.visible = lampOn;
    hemi.intensity = lampOn ? 0.35 : 0.12;
    return lampOn;
  }

  // --- Side table with a potted plant ------------------------------------------
  add(cyl(0.27, 0.27, 0.03, 32), M.woodTable, { x: -1.78, y: 0.55, z: 3.2 });
  add(cyl(0.025, 0.025, 0.52, 12), M.woodTable, { x: -1.78, y: 0.275, z: 3.2 });
  add(cyl(0.16, 0.18, 0.03, 24), M.woodTable, { x: -1.78, y: 0.015, z: 3.2 });
  add(cyl(0.1, 0.075, 0.16, 24), M.terracotta, { x: -1.78, y: 0.645, z: 3.2 });
  add(cyl(0.092, 0.092, 0.01, 24), std({ color: 0x2a1a10, roughness: 1 }), { x: -1.78, y: 0.72, z: 3.2, cast: false });
  for (let i = 0; i < 9; i++) {   // arching leaves
    const a = (i / 9) * Math.PI * 2 + rnd(), len = 0.26 + rnd() * 0.12, tilt = 0.5 + rnd() * 0.5;
    const leaf = new THREE.SphereGeometry(1, 8, 6);
    leaf.scale(0.045, len / 2, 0.012);
    leaf.translate(0, len / 2, 0);
    const m = add(leaf, M.leaf, { x: -1.78, y: 0.72, z: 3.2 });
    m.rotation.set(tilt * Math.cos(a), 0, tilt * Math.sin(a));
  }

  // --- Texas A&M touch: the maroon mug on the coffee table ---------------------

  // --- A second wall shelf above the console, matching the one on the left -------
  // Books stacked flat, a small bookend-style clock, and a pothos trailing down.
  {
    const SX = 1.55, SY = 1.55, SZ = -0.79;
    add(rbox(0.9, 0.035, 0.2, 0.008), M.woodDark, { x: SX, y: SY, z: SZ });
    // A short stack of books lying flat, and two standing up
    [[0x2f5a6a, 0.04], [0x7a2a32, 0.034], [0xc8963a, 0.03]].reduce((y, [c, t], i) => {
      add(rbox(0.2 - i * 0.015, t, 0.15, 0.005), std({ color: c, roughness: 0.8 }), { x: SX + 0.24, y: y + t / 2, z: SZ, ry: (i - 1) * 0.08 });
      return y + t;
    }, SY + 0.0175);
    [[0x3c4a6a, 0.22], [0x5a6a3a, 0.2]].forEach(([c, h], i) =>
      add(rbox(0.045, h, 0.15, 0.006), std({ color: c, roughness: 0.8 }), { x: SX + 0.39 - i * 0.05, y: SY + 0.0175 + h / 2, z: SZ, rz: i ? 0.12 : 0 }));
    // Pot with a pothos whose vines hang well down the wall
    add(cyl(0.055, 0.044, 0.1, 16), M.ceramic, { x: SX - 0.18, y: SY + 0.0675, z: SZ });
    trailingPothos(SX - 0.18, SY + 0.115, SZ, [[0.02, 0.06, 0.5], [-0.04, 0.07, 0.36], [0.07, 0.05, 0.62], [0.11, 0.02, 0.3], [-0.08, 0.04, 0.44]]);
  }

  // --- An acoustic guitar on a stand in the corner ----------------------------
  // Modeled from the classic cutaway silhouette; no brand logo or trademark headstock.
  // Phosphor-bronze strings: lit like real metal (no glow), at real gauges
  const stringMat = std({ color: 0xb8956a, roughness: 0.35, metalness: 0.85 });
  const trebleMat = std({ color: 0xc8c8cc, roughness: 0.3, metalness: 0.9 });   // plain steel B and high E
  /** Smooth outline from points (x across the body, y along the guitar). */
  const outline = (pts) => { const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); sh.splineThru(pts.slice(1).map(([x, y]) => new THREE.Vector2(x, y))); sh.closePath(); return sh; };
  const fretY = (nut, scale, n) => nut - scale * (1 - Math.pow(2, -n / 12));
  /** Neck, fretboard with frets and dots, headstock with tuners, and the strings. */
  function neckAndHead(gt, { nut, scale, bridgeY, frets, joinY, front, wNut, wEnd, neckMat, boardMat, headMat, tunersPerSide, stringTop }) {
    const len = nut - joinY;
    const neck = new THREE.Shape([new THREE.Vector2(-wEnd / 2, joinY), new THREE.Vector2(wEnd / 2, joinY), new THREE.Vector2(wNut / 2, nut), new THREE.Vector2(-wNut / 2, nut)]);
    add(new THREE.ExtrudeGeometry(neck, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 }), neckMat, { z: front - 0.03, parent: gt });
    add(new THREE.ExtrudeGeometry(neck, { depth: 0.006, bevelEnabled: false }), boardMat, { z: front - 0.004, parent: gt });
    for (let n = 1; n <= frets; n++) {
      const y = fretY(nut, scale, n);
      if (y < joinY) break;
      const w = wNut + (wEnd - wNut) * ((nut - y) / len);
      add(new THREE.BoxGeometry(w, 0.0018, 0.002), M.chrome, { y, z: front + 0.003, parent: gt, cast: false });
      if ([3, 5, 7, 9, 15, 17, 19, 21].includes(n) || n === 12) {
        const ym = (y + fretY(nut, scale, n - 1)) / 2;
        for (const dx of n === 12 ? [-0.012, 0.012] : [0]) add(cyl(0.003, 0.003, 0.001, 10), M.white, { x: dx, y: ym, z: front + 0.0025, rx: Math.PI / 2, parent: gt, cast: false });
      }
    }
    add(new THREE.BoxGeometry(wNut + 0.002, 0.004, 0.006), M.white, { y: nut, z: front + 0.003, parent: gt, cast: false });   // nut
    // Headstock: a plain rounded paddle tilted back, with tuner posts and buttons
    const head = new THREE.Group();
    head.position.set(0, nut, front - 0.012);
    head.rotation.x = -0.18;
    const hw = tunersPerSide === 6 ? 0.075 : 0.085, hl = 0.19;
    add(rbox(hw, hl, 0.016, 0.02, 3), headMat, { x: tunersPerSide === 6 ? -0.012 : 0, y: hl / 2, parent: head });
    const posts = [];
    if (tunersPerSide === 6) for (let i = 0; i < 6; i++) posts.push([-0.03, 0.03 + i * 0.026, -1]);
    else for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) posts.push([sx * 0.026, 0.05 + i * 0.045, sx]);
    for (const [x, y, side] of posts) {
      add(cyl(0.0035, 0.0035, 0.012, 8), M.chrome, { x, y, z: 0.012, rx: Math.PI / 2, parent: head, cast: false });
      add(rbox(0.016, 0.01, 0.006, 0.003), M.chrome, { x: x + side * (hw / 2 + 0.006), y, z: -0.002, parent: head, cast: false });
    }
    gt.add(head);
    // Strings: from the saddle over the nut to their tuning posts, each at its real gauge
    // (.053" low E down to .012" high E; radius in meters).
    const GAUGE = [0.00067, 0.00053, 0.00041, 0.0003, 0.0002, 0.00015];
    head.updateMatrix();
    // Low E, A, D wind onto the bass-side posts nearest-first; G, B, high E onto the treble side
    const bass = posts.filter((q) => q[2] < 0).sort((a, b) => a[1] - b[1]);
    const treble = posts.filter((q) => q[2] > 0).sort((a, b) => a[1] - b[1]);
    const postFor = (i) => (treble.length ? (i < 3 ? bass[i] : treble[5 - i]) : bass[i]);
    const seg = (a, b, r, mat) => {
      const d = new THREE.Vector3().subVectors(b, a);
      const m = add(cyl(r, r, d.length(), 5), mat, { parent: gt, cast: false });
      m.position.copy(a).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    };
    for (let i = 0; i < 6; i++) {
      const k = i / 5 - 0.5;
      const saddle = new THREE.Vector3(k * 0.054, bridgeY, stringTop);
      const atNut = new THREE.Vector3(k * (wNut - 0.008), nut, front + 0.006);
      const [px, py] = postFor(i);
      const post = new THREE.Vector3(px, py, 0.016).applyMatrix4(head.matrix);
      const mat = i >= 4 ? trebleMat : stringMat;
      seg(saddle, atNut, GAUGE[i], mat);
      seg(atNut, post, GAUGE[i], mat);
    }
  }
  /** A simple black tubular stand that cradles the guitar's bottom and neck. */
  function guitarStand(parent, neckHeight) {
    const tube = (a, b, r = 0.008) => {
      const d = new THREE.Vector3().subVectors(b, a), m = add(cyl(r, r, d.length(), 10), M.plastic, { parent });
      m.position.copy(a).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const top = V(0, neckHeight, -0.16), hub = V(0, 0.16, -0.12);
    tube(hub, top); tube(hub, V(-0.17, 0.01, 0.12)); tube(hub, V(0.17, 0.01, 0.12)); tube(hub, V(0, 0.01, -0.32));
    tube(V(-0.12, 0.09, 0.05), V(0.12, 0.09, 0.05), 0.01);                    // cradle bar
    for (const x of [-0.12, 0.12]) tube(V(x, 0.09, 0.05), V(x, 0.15, 0.06), 0.009);
    tube(V(-0.03, neckHeight, -0.14), V(0.03, neckHeight, -0.14), 0.008);     // neck yoke
    for (const x of [-0.17, 0.17]) add(new THREE.SphereGeometry(0.012, 8, 6), M.rubber, { x, y: 0.01, z: 0.12, parent });
  }

  // Acoustic: cutaway body, spruce top, rosewood back and sides, ebony bridge
  {
    const stand = new THREE.Group();
    stand.position.set(2.62, 0, -0.42);
    stand.rotation.y = -0.3;
    stand.scale.setScalar(1.28);   // the room's furniture runs ~1.3x life size, so the guitar matches it
    scene.add(stand);
    guitarStand(stand, 0.7);
    const gt = new THREE.Group();
    gt.position.set(0, 0.085, 0.05);
    gt.rotation.x = -0.2;
    stand.add(gt);
    const D = 0.1, F = D + 0.004;
    const body = outline([[0, 0], [0.1, 0.006], [0.175, 0.05], [0.2, 0.13], [0.185, 0.22], [0.125, 0.29], [0.13, 0.35], [0.12, 0.395], [0.08, 0.41], [0.06, 0.45],
      [0.045, 0.5], [-0.045, 0.5], [-0.1, 0.49], [-0.142, 0.44], [-0.142, 0.36], [-0.122, 0.29], [-0.182, 0.22], [-0.2, 0.13], [-0.175, 0.05], [-0.1, 0.006]]);
    const spruce = spruceTexture();
    spruce.repeat.set(1 / 0.4, 1 / 0.5); spruce.offset.set(0.5, 0);
    add(new THREE.ExtrudeGeometry(body, { depth: D, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 40 }),
      [std({ map: spruce, roughness: 0.22 }), std({ map: woodTexture('#5a2e18', '#2a120a', 11), roughness: 0.3 })], { parent: gt });
    add(new THREE.CircleGeometry(0.05, 40), std({ color: 0x0a0604, roughness: 1 }), { y: 0.355, z: F + 0.001, parent: gt, cast: false });   // sound hole
    add(new THREE.RingGeometry(0.054, 0.064, 48), std({ color: 0x6a8a8a, roughness: 0.2, metalness: 0.4 }), { y: 0.355, z: F + 0.001, parent: gt, cast: false }); // rosette
    const guard = outline([[-0.035, 0.3], [-0.1, 0.27], [-0.13, 0.31], [-0.115, 0.38], [-0.07, 0.4]]);
    add(new THREE.ExtrudeGeometry(guard, { depth: 0.0015, bevelEnabled: false, curveSegments: 20 }), std({ map: tortoiseTexture(), roughness: 0.25 }), { z: F, parent: gt, cast: false });
    add(rbox(0.15, 0.028, 0.008, 0.006), std({ color: 0x141010, roughness: 0.4 }), { y: 0.13, z: F + 0.004, parent: gt, cast: false });   // bridge
    add(new THREE.BoxGeometry(0.075, 0.003, 0.006), M.white, { y: 0.135, z: F + 0.009, parent: gt, cast: false });                       // saddle
    for (let i = 0; i < 6; i++) add(cyl(0.003, 0.003, 0.004, 8), M.white, { x: (i - 2.5) * 0.011, y: 0.122, z: F + 0.009, rx: Math.PI / 2, parent: gt, cast: false });
    neckAndHead(gt, { nut: 0.78, scale: 0.645, bridgeY: 0.135, frets: 20, joinY: 0.49, front: F + 0.004, wNut: 0.044, wEnd: 0.056,
      neckMat: std({ color: 0x6a3a1e, roughness: 0.4 }), boardMat: std({ color: 0x141010, roughness: 0.5 }), headMat: std({ color: 0x141010, roughness: 0.25 }),
      tunersPerSide: 3, stringTop: F + 0.012 });
  }

  // --- Weather: rain and the odd flash of lightning ---------------------------
  let flashT = 0, nextFlash = 6 + rnd() * 8;
  const moonBase = moon.intensity;
  /** Called every frame by main.js. */
  function update(t, dt) {
    rainGlass.uniforms.uTime.value = t;
    // Rain outside: short slanted streaks falling and wrapping around
    for (let i = 0; i < RAIN; i++) {
      const [x, y0, z, sp] = rainSeed[i];
      const y = 0.8 + ((y0 - t * sp) % 1 + 1) % 1 * 1.9;
      rainPos.set([x, y, z, x - 0.01, y - 0.09, z + 0.02], i * 6);
    }
    rainGeo.attributes.position.needsUpdate = true;
    // Lightning: two quick flashes, then a long wait
    nextFlash -= dt;
    if (nextFlash <= 0) { flashT = 0.7; nextFlash = 10 + rnd() * 18; }
    let f = 0;
    if (flashT > 0) {
      flashT -= dt;
      const k = 0.7 - flashT;
      f = Math.max(0, 1 - Math.abs(k - 0.05) / 0.05) + 0.7 * Math.max(0, 1 - Math.abs(k - 0.24) / 0.07);
    }
    rainGlass.uniforms.uFlash.value = f;
    moon.intensity = moonBase * (1 + f * 5);
    skyMat.color.setScalar(1 + f * 2.5);
  }

  return {
    scene, screen, power, led, cart, consoleLed, remote, lamp, tvLight, tv, knobUp, knobDown, ears, rods, toggleLamp, update,
    /** Trigger a lightning flash right now (handy for testing). */
    lightning: () => { flashT = 0.7; },
    /** Clickable objects → what they mean. */
    clickables: [
      { object: screen, id: 'screen' },
      { object: power, id: 'power' },
      { object: knobUp, id: 'knobUp' },
      { object: knobDown, id: 'knobDown' },
      { object: ears, id: 'antenna' },
      { object: cab, id: 'tv' },
      { object: cart, id: 'cart' },
      { object: remote, id: 'remote' },
      { object: lampG, id: 'lamp' },
    ],
  };
}

// ============================ Procedural textures ============================

function canvasTexture(w, h, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

/** Wood: long wavy grain lines, pores, and the odd darker streak. */
function woodTexture(light, dark, seed) {
  return canvasTexture(512, 512, (g, w, h) => {
    const r = seeded(seed * 97 + 3);
    g.fillStyle = light; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const y = r() * h, amp = 2 + r() * 6, f = 0.004 + r() * 0.01, ph = r() * 6;
      g.strokeStyle = dark; g.globalAlpha = 0.05 + r() * 0.22; g.lineWidth = 0.5 + r() * 2.2;
      g.beginPath();
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.1) * amp * 0.3);
      g.stroke();
    }
    g.globalAlpha = 0.18; g.fillStyle = dark;
    for (let i = 0; i < 900; i++) g.fillRect(r() * w, r() * h, 3 + r() * 9, 1);
    g.globalAlpha = 1;
  });
}

/** Shag carpet: thousands of short fibers in a handful of warm browns. */
function carpetTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    const r = seeded(41);
    g.fillStyle = '#6a4026'; g.fillRect(0, 0, w, h);
    const cols = ['#7a4a2c', '#8a5634', '#5e3820', '#94603a', '#70442a', '#4e2e1a', '#a06a40'];
    g.lineCap = 'round';
    for (let i = 0; i < 16000; i++) {
      const x = r() * w, y = r() * h, a = r() * Math.PI * 2, l = 3 + r() * 7;
      g.strokeStyle = cols[Math.floor(r() * cols.length)];
      g.globalAlpha = 0.55 + r() * 0.45; g.lineWidth = 1 + r() * 1.6;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    g.globalAlpha = 1;
  });
}

/** Wallpaper: muted plum stripes with a small repeating diamond motif. */
function wallpaperTexture() {
  return canvasTexture(256, 512, (g, w, h) => {
    const r = seeded(13);
    g.fillStyle = '#39334e'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 64) {
      g.fillStyle = '#322c46'; g.fillRect(x, 0, 32, h);
      g.fillStyle = 'rgba(200,180,140,0.10)'; g.fillRect(x + 31, 0, 2, h); g.fillRect(x, 0, 1, h);
    }
    g.fillStyle = 'rgba(214,190,150,0.16)';
    for (let y = 16; y < h; y += 64) for (let x = 16; x < w; x += 64) {
      const yy = y + ((x / 64) % 2) * 32;
      g.beginPath(); g.moveTo(x, yy - 9); g.lineTo(x + 6, yy); g.lineTo(x, yy + 9); g.lineTo(x - 6, yy); g.fill();
    }
    g.fillStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < 2500; i++) g.fillRect(r() * w, r() * h, 1, 2);   // paper tooth
  });
}

/** Soft mottled cloth (couch, pillow, curtains). */
function noiseTexture(base, amount, seed) {
  const t = canvasTexture(256, 256, (g, w, h) => {
    const r = seeded(seed * 31 + 7);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${amount * r()})` : `rgba(255,255,255,${amount * 0.7 * r()})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
    g.strokeStyle = `rgba(0,0,0,${amount * 0.35})`; g.lineWidth = 1;   // weave
    for (let i = 0; i < w; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
  });
  t.repeat.set(3, 3);
  return t;
}




/** Tortoiseshell: dark amber with brown blotches. */
function tortoiseTexture() {
  const t = canvasTexture(128, 128, (g, w, h) => {
    const r = seeded(77);
    g.fillStyle = '#5a2a10'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(20,8,2,0.55)' : 'rgba(170,90,30,0.45)';
      g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 12, 2 + r() * 6, r() * 3, 0, 7); g.fill();
    }
  });
  t.repeat.set(6, 6);
  return t;
}

/** Spruce top: pale honey with fine straight grain. */
function spruceTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    const r = seeded(55);
    g.fillStyle = '#e6c48a'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2 + r() * 3) { g.fillStyle = `rgba(150,100,40,${0.06 + r() * 0.12})`; g.fillRect(x, 0, 1, h); }
  });
}

/** Window glass with rain: beads sitting on it and drops running down with trails. */
function rainGlassMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uFlash: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      uniform float uTime, uFlash;
      varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec2 uv = vUv * vec2(1.0, 1.2);
        float drops = 0.0;
        // Beads sitting on the glass
        vec2 gp = uv * 26.0, id = floor(gp), f = fract(gp) - 0.5;
        float r = h(id);
        vec2 o = vec2(h(id + 3.1), h(id + 7.7)) - 0.5;
        float size = 0.1 + 0.18 * r;
        drops += smoothstep(size, size * 0.5, length(f - o * 0.5)) * step(0.5, r);
        // Drops running down, leaving a trail
        float cols = 16.0, cx = floor(uv.x * cols), fx = fract(uv.x * cols) - 0.5;
        float rr = h(vec2(cx, 1.0)), speed = 0.15 + 0.35 * rr;
        float head = fract(-uTime * speed + rr * 7.0) * 1.5 - 0.15;
        float wob = sin(uv.y * 24.0 + cx * 3.0) * 0.12;
        float dx = abs(fx + wob), dy = uv.y - head;
        float headDrop = smoothstep(0.26, 0.1, dx) * smoothstep(0.035, 0.0, abs(dy));
        float trail = smoothstep(0.1, 0.03, dx) * step(0.0, dy) * exp(-dy * 5.0) * 0.55;
        drops += (headDrop + trail) * step(0.3, rr);
        vec3 base = vec3(0.07, 0.1, 0.2);
        vec3 lit = vec3(0.55, 0.65, 0.9) * (0.45 + uFlash * 2.5);
        gl_FragColor = vec4(mix(base, lit, clamp(drops, 0.0, 1.0)), 0.16 + clamp(drops, 0.0, 1.0) * 0.55 + uFlash * 0.12);
      }`,
  });
}

/** The night outside the window: deep blue sky, stars, a moon. */
function nightSkyTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    const r = seeded(5);
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a1030'); grad.addColorStop(1, '#27305c');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff';
    for (let i = 0; i < 90; i++) { g.globalAlpha = 0.3 + r() * 0.7; g.fillRect(r() * w, r() * h * 0.8, 1, 1); }
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(240,235,210,0.18)'; g.beginPath(); g.arc(150, 96, 30, 0, 7); g.fill();
    g.fillStyle = '#f4efd6'; g.beginPath(); g.arc(150, 96, 15, 0, 7); g.fill();
    g.fillStyle = '#10142c';   // a rooftop and tree line
    g.fillRect(0, 214, w, 42);
    for (let i = 0; i < 10; i++) { const x = r() * w; g.beginPath(); g.moveTo(x - 14, 216); g.lineTo(x, 180 + r() * 20); g.lineTo(x + 14, 216); g.fill(); }
  }, false);
}


/** A glossy magazine cover: color block, masthead bar, a few text lines. */
function magazineTexture(bg, fg) {
  return canvasTexture(128, 170, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.fillRect(10, 10, w - 20, 22);
    g.globalAlpha = 0.55;
    for (let i = 0; i < 5; i++) g.fillRect(10, 120 + i * 9, 40 + (i * 23) % 50, 4);
    g.globalAlpha = 0.3; g.beginPath(); g.arc(w * 0.6, 76, 30, 0, 7); g.fill();
    g.globalAlpha = 1;
  }, false);
}

/** The VCR's blinking-forever "12:00". */
function clockTexture() {
  return canvasTexture(96, 30, (g, w, h) => {
    g.fillStyle = '#04100a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#48ff9a'; g.font = 'bold 24px ui-monospace, Consolas, monospace';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('12:00', w / 2, h / 2 + 1);
  }, false);
}

/** The cartridge label: masking tape with "CAMERON" in marker. */
function labelTexture() {
  return canvasTexture(256, 140, (g) => {
    const r = seeded(9);
    g.fillStyle = '#e9dfc2'; g.fillRect(0, 0, 256, 140);
    g.fillStyle = 'rgba(160,140,100,0.25)';
    for (let i = 0; i < 40; i++) g.fillRect(r() * 256, r() * 140, 2, 2);
    g.save();
    g.translate(128, 76); g.rotate(-0.06);
    g.fillStyle = '#1d1a24';
    g.font = 'bold 54px "Segoe Print", "Bradley Hand", "Marker Felt", "Comic Sans MS", cursive';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('CAMERON', 0, 0);
    g.fillRect(-92, 30, 184, 3);
    g.restore();
  }, false);
}
