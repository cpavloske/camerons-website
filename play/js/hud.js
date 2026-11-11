/**
 * hud.js — text drawn *inside* the TV picture (star counter, node names,
 * "Press Start"). It's a 2D canvas the size of the game resolution, laid over
 * the 3D view, so it gets the same CRT treatment as everything else.
 *
 * (Long-form content — posts, projects, contact — uses the HTML overlays in
 * overlays.js instead, so it stays crisp and accessible.)
 */
import * as THREE from 'three';
import { RENDER } from './config.js';

export class Hud {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = RENDER.width;
    this.canvas.height = RENDER.height;
    this.g = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, depthTest: false, depthWrite: false })
    ));
    this._key = '';
  }

  /** Redraw only when something changed. `key` summarizes the state. */
  draw(key, fn) {
    if (key === this._key) return;
    this._key = key;
    const g = this.g;
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    fn(g, this.canvas.width, this.canvas.height, this);
    this.texture.needsUpdate = true;
  }

  /** Chunky outlined text. */
  text(str, x, y, { size = 28, color = '#fff', outline = '#1d1a24', align = 'center', weight = 900, font = 'system-ui, "Segoe UI", sans-serif' } = {}) {
    const g = this.g;
    g.font = `${weight} ${size}px ${font}`;
    g.textAlign = align;
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = Math.max(3, size / 5);
    g.strokeStyle = outline;
    g.strokeText(str, x, y);
    g.fillStyle = color;
    g.fillText(str, x, y);
    return g.measureText(str).width;
  }

  /** Word-wrapped plain text. Returns the y after the last line. */
  wrap(str, x, y, maxW, lineH, { size = 20, color = '#fff', weight = 600, font = 'system-ui, "Segoe UI", sans-serif', maxLines = 3 } = {}) {
    const g = this.g;
    g.font = `${weight} ${size}px ${font}`;
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = color;
    const words = String(str).split(/\s+/);
    let line = '', lines = 0;
    for (let i = 0; i < words.length; i++) {
      const test = line ? `${line} ${words[i]}` : words[i];
      if (g.measureText(test).width > maxW && line) {
        if (lines === maxLines - 1) { g.fillText(line + '…', x, y); return y + lineH; }
        g.fillText(line, x, y); y += lineH; lines++; line = words[i];
      } else line = test;
    }
    if (line) { g.fillText(line, x, y); y += lineH; }
    return y;
  }

  /** Green on-screen channel number, top-right, like an old TV. */
  osd(num) {
    this.text(`CH ${String(num).padStart(2, '0')}`, this.canvas.width - 26, 38, {
      size: 34, color: '#7dff8a', outline: '#0a2a10', align: 'right', font: 'ui-monospace, Consolas, monospace', weight: 800,
    });
  }

  /** Rounded panel. */
  panel(x, y, w, h, color = 'rgba(20,16,28,0.72)', r = 12) {
    const g = this.g;
    g.fillStyle = color;
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    g.fill();
  }

  /** Five-point star icon. */
  star(x, y, r, color = '#ffd84a') {
    const g = this.g;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.lineWidth = 4; g.strokeStyle = '#1d1a24'; g.stroke();
    g.fillStyle = color; g.fill();
  }

  clear() { this.draw('', () => {}); }
}
