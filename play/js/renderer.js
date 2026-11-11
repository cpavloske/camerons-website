/**
 * renderer.js — two passes per frame:
 *   1. The game (title screen or map) + the HUD → a small 640x480 texture.
 *   2. The living room → the screen, with that texture on the TV glass
 *      (the CRT shader in crt.js does the upscale + tube look).
 */
import * as THREE from 'three';
import { RENDER } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.gl.outputColorSpace = THREE.SRGBColorSpace;
    // The room is lit like a real one: filmic tone mapping and soft shadows.
    // (Tone mapping only applies to the room pass, never to the game picture.)
    this.gl.toneMapping = THREE.ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.25;
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = THREE.PCFSoftShadowMap;
    // Shadows are static: render them once, then only when something moves
    this.gl.shadowMap.autoUpdate = false;
    this.gl.shadowMap.needsUpdate = true;
    this.target = new THREE.WebGLRenderTarget(RENDER.width, RENDER.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
    });
    this.target.texture.colorSpace = THREE.SRGBColorSpace;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Ask for the room's shadows to be redrawn on the next frame. */
  refreshShadows() { this.gl.shadowMap.needsUpdate = true; }

  get aspect() { return this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight); }

  resize() {
    this.gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, RENDER.maxPixelRatio));
    this.gl.setSize(window.innerWidth, window.innerHeight, false);
  }

  /**
   * @param {{scene, camera}|null} game  what's on the TV (null = nothing)
   * @param {import('./hud.js').Hud} hud
   * @param {THREE.Scene} room
   * @param {THREE.Camera} roomCamera
   */
  render(game, hud, room, roomCamera) {
    const gl = this.gl;
    gl.setRenderTarget(this.target);
    gl.setClearColor(0x000000, 1);
    gl.clear();
    if (game) gl.render(game.scene, game.camera);
    gl.autoClear = false;
    gl.render(hud.scene, hud.camera);
    gl.autoClear = true;
    gl.setRenderTarget(null);
    gl.render(room, roomCamera);
  }
}

/** True if this browser can make a WebGL context at all. */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}
