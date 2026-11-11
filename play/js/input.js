/**
 * input.js — keyboard + gamepad merged into one simple state.
 *
 *   input.dir           {x, y}  held direction, -1..1 (y = up on screen)
 *   input.consume(a)    true once per press of an action:
 *                       'confirm' (Space / Enter / A / Start), 'back' (B / Backspace),
 *                       'pause' (Esc / Start), 'move' (any new direction press)
 *
 * Mouse and touch clicks are handled in main.js by raycasting into the TV.
 */

const DEADZONE = 0.35;

export class Input {
  constructor() {
    this.dir = { x: 0, y: 0 };
    this.enabled = true;
    this._keys = new Set();
    this._pressed = new Set();
    this._padPrev = [];
    this._stickWasNeutral = true;

    window.addEventListener('keydown', (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      // While a panel is open, leave the keyboard to the page (Tab, Space on buttons).
      if (!this.enabled) return;
      // Let keyboard users activate focused links/buttons outside the game normally
      if (e.target && /^(A|BUTTON)$/.test(e.target.tagName) && (e.code === 'Space' || e.code === 'Enter')) return;
      const dirKey = DIR_KEYS[e.code];
      if (dirKey) { e.preventDefault(); if (!e.repeat) this.press('move'); }
      if (e.repeat) return;
      this._keys.add(e.code);
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); this.press('confirm'); }
      if (e.code === 'Escape') this.press('pause');
      if (e.code === 'Backspace') { e.preventDefault(); this.press('back'); }
    });
    window.addEventListener('keyup', (e) => this._keys.delete(e.code));
    window.addEventListener('blur', () => this._keys.clear());
  }

  consume(action) {
    if (this._pressed.has(action)) { this._pressed.delete(action); return true; }
    return false;
  }
  press(action) { this._pressed.add(action); }
  clear() { this._pressed.clear(); }

  /** Call once per frame. */
  update() {
    let x = 0, y = 0;
    for (const code of this._keys) {
      const d = DIR_KEYS[code];
      if (d) { x += d[0]; y += d[1]; }
    }

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const b = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
      const prev = this._padPrev[p.index] || [];
      const edge = (i) => b(i) && !prev[i];
      let sx = Math.abs(p.axes[0] || 0) > DEADZONE ? p.axes[0] : 0;
      let sy = Math.abs(p.axes[1] || 0) > DEADZONE ? -p.axes[1] : 0;
      if (b(12)) sy = 1; if (b(13)) sy = -1; if (b(14)) sx = -1; if (b(15)) sx = 1; // D-pad
      x += sx; y += sy;
      const neutral = !sx && !sy;
      if (!neutral && this._stickWasNeutral) this.press('move');
      this._stickWasNeutral = neutral;
      if (edge(0)) this.press('confirm');                    // A
      if (edge(1)) this.press('back');                       // B
      if (edge(9)) { this.press('pause'); this.press('start'); } // Start
      this._padPrev[p.index] = p.buttons.map((btn) => btn.pressed);
    }

    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    this.dir.x = this.enabled ? x : 0;
    this.dir.y = this.enabled ? y : 0;
  }
}

const DIR_KEYS = {
  ArrowUp: [0, 1], KeyW: [0, 1],
  ArrowDown: [0, -1], KeyS: [0, -1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};
