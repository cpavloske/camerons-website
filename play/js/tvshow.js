/**
 * tvshow.js — what's on TV before you start the game: a made-up late-night
 * local channel ("CH 07 · Night Owl"). A slow pan across a low-poly city
 * skyline under the moon, a lower-third banner, and a news ticker that
 * scrolls the latest posts from content.json.
 *
 * Clicking the TV (or pressing Enter) switches over to the console.
 */
import * as THREE from 'three';
import { part, mesh, MAT_GLOW } from './lowpoly.js';
import { skyDome, starfield } from './env.js';
import { formatDate } from './content.js';

export function buildChannel(content) {
  const scene = new THREE.Scene();
  scene.add(skyDome([[-1, 0x2a1a3a], [-0.05, 0x6a3a6a], [0.1, 0x2e2560], [0.5, 0x141340], [1, 0x07081e]]));
  scene.add(starfield(220));
  scene.fog = new THREE.Fog(0x2a2050, 30, 120);
  scene.add(new THREE.HemisphereLight(0x8a90d0, 0x2a1a30, 1.4));
  const moonLight = new THREE.DirectionalLight(0xc8d0ff, 1.0);
  moonLight.position.set(-6, 10, 4);
  scene.add(moonLight);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshBasicMaterial({ color: 0xfbf0c8, fog: false }));
  moon.position.set(-25, 30, -90);
  scene.add(moon);

  // Skyline: rows of buildings with lit windows, plus a river in front
  const parts = [], glow = [];
  let seed = 12;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let row = 0; row < 3; row++) {
    const z = -14 - row * 12;
    for (let x = -60; x < 60; x += 3 + rnd() * 3) {
      const w = 2.2 + rnd() * 2.5, d = 3 + rnd() * 2, h = 4 + rnd() * (row === 1 ? 22 : 12);
      parts.push(part(new THREE.BoxGeometry(w, h, d), [0x1b1838, 0x221d44, 0x262150][row], { x, y: h / 2, z }));
      if (rnd() < 0.15) parts.push(part(new THREE.ConeGeometry(w * 0.45, 3, 4), 0x2a2554, { x, y: h + 1.5, z, ry: Math.PI / 4 }));
      for (let y = 1.2; y < h - 0.6; y += 1.1) {
        for (let k = -w / 2 + 0.45; k < w / 2 - 0.3; k += 0.7) {
          if (rnd() > 0.42) continue;
          glow.push(part(new THREE.PlaneGeometry(0.36, 0.5), rnd() < 0.8 ? 0xffd37a : 0x9ad8ff, { x: x + k, y, z: z + d / 2 + 0.02 }));
        }
      }
    }
  }
  // Blinking red lights on the tallest towers
  const beacons = [];
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff3a3a }));
    b.position.set(-40 + i * 16 + rnd() * 4, 26 + rnd() * 4, -26);
    scene.add(b);
    beacons.push(b);
  }
  // River with streaks of reflected light
  parts.push(part(new THREE.PlaneGeometry(200, 30).rotateX(-Math.PI / 2), 0x141a3a, { y: 0, z: 2 }));
  for (let i = 0; i < 40; i++) glow.push(part(new THREE.PlaneGeometry(0.8 + rnd() * 1.6, 0.08).rotateX(-Math.PI / 2), 0x6a6aa0, { x: -50 + rnd() * 100, y: 0.02, z: -8 + rnd() * 10 }));
  scene.add(mesh(parts));
  scene.add(mesh(glow, MAT_GLOW));

  const camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 300);

  // Ticker text: the newest posts, plus an invitation to play
  const items = [
    'NOW PLAYING ON CH 3: CAMERON PAVLOSKE — grab the controller',
    ...content.posts.map((p) => `NEW POST (${formatDate(p.date).toUpperCase()}): ${p.title}`),
    'FORECAST: clear skies, a perfect night for video games',
  ];
  const ticker = items.join('   ✦   ') + '   ✦   ';
  let tickerW = 0;

  return {
    scene, camera,
    update(dt, t) {
      // Slow sideways pan, like a late-night skyline cam
      const x = Math.sin(t * 0.05) * 28;
      camera.position.set(x, 6 + Math.sin(t * 0.13) * 0.6, 14);
      camera.lookAt(x * 0.9, 9, -20);
      beacons.forEach((b, i) => { b.visible = ((t + i * 0.37) % 1.8) < 0.3; });
    },
    drawHud(hud, t) {
      // Redraw ~30 times a second so the ticker scrolls smoothly without
      // re-uploading the texture every single frame on fast displays.
      const frame = Math.floor(t * 30);
      hud.draw(`chan:${frame}`, (g, w, h) => {
        // Channel number, green on-screen display style
        hud.text('CH 07', w - 26, 38, { size: 34, color: '#7dff8a', outline: '#0a2a10', align: 'right', font: 'ui-monospace, Consolas, monospace', weight: 800 });
        // Lower third
        g.fillStyle = 'rgba(232, 130, 58, 0.92)';
        g.fillRect(0, h - 128, 210, 40);
        hud.text('NIGHT OWL', 105, h - 107, { size: 24, color: '#fff', outline: '#5a2a10' });
        g.fillStyle = 'rgba(20, 16, 40, 0.85)';
        g.fillRect(210, h - 128, w - 210, 40);
        hud.text('LIVE · DALLAS SKYLINE', 228, h - 107, { size: 20, color: '#f6f1e4', align: 'left', weight: 700 });
        // Ticker
        g.fillStyle = 'rgba(10, 8, 24, 0.92)';
        g.fillRect(0, h - 80, w, 44);
        g.fillStyle = '#e8823a';
        g.fillRect(0, h - 80, w, 3);
        g.font = '700 22px system-ui, "Segoe UI", sans-serif';
        if (!tickerW) tickerW = g.measureText(ticker).width;
        const off = (t * 90) % tickerW;
        g.fillStyle = '#ffd84a';
        g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillText(ticker, -off, h - 57);
        g.fillText(ticker, -off + tickerW, h - 57);
      });
    },
  };
}
