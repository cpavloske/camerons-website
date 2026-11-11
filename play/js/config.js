/**
 * config.js — knobs for tuning the look and feel.
 */

/** The game inside the TV. */
export const RENDER = {
  // Internal resolution of the TV picture, upscaled with nearest neighbor. Keep it 4:3.
  // 320x240 = very crunchy, 640x480 = readable but still pixelly, 960x720 = sharp.
  width: 640,
  height: 480,
  maxPixelRatio: 2,       // cap for the room render on high-DPI screens
};

/** The overworld map. */
export const MAP = {
  walkSpeed: 6.0,         // how fast the character walks between nodes (m/s)
  cameraHeight: 10.5,     // camera offset above the character
  cameraBack: 9.5,        // camera offset behind (toward +Z) the character
  cameraLerp: 5,          // how tightly the camera follows
};

/** The CRT look. Each value is 0 when the CRT effect is turned off. */
export const CRT = {
  curvature: 0.07,        // barrel distortion
  scanlines: 0.38,        // scanline darkness
  aberration: 0.0016,     // chromatic aberration offset (in UV)
  vignette: 0.55,
  glow: 0.22,             // soft bloom
};

/** Boot sequence timing (seconds after pressing power). */
export const BOOT = {
  dark: 0.35,             // black screen before the tube warms up
  line: 0.55,             // the horizontal line expanding
  static: 0.9,            // snow + hum
  glitchChance: 0.2,      // 1 in 5 boots glitch ("Try blowing on the cartridge")
};
