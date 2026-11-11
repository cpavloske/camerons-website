/**
 * main.js — page entry point for /play/. Runs the whole show:
 *
 *   room  → the living room. The TV is on CH 3, the game's title screen
 *           (CAMERON PAVLOSKE), so the name is the first thing you see.
 *           Click the remote (or the TV's knobs: top = up, bottom = down) to change channels:
 *             CH 3 Game · CH 4 About · CH 5 Writing · CH 6 Projects
 *             CH 7 Contact · CH 8 Night Owl (late-night skyline + ticker)
 *           Click the TV (or press Enter) to play CH 3 / open that section.
 *           1 in 5 times you flip back to CH 3 the cartridge glitches —
 *           click the cartridge to blow on it.
 *   title → camera pushes into the TV; the map starts when it arrives
 *   map   → the overworld; each spot opens its section. EXIT GAME goes back.
 *   exit  → CRT shutoff, camera back to the couch, TV back on CH 3
 *
 * The top nav bar opens any section at any time. Overlays (HTML panels) and
 * the pause menu sit on top and pause the game.
 */
import * as THREE from 'three';
import { BOOT, RENDER } from './config.js';
import { loadContent, progress } from './content.js';
import { UI } from './overlays.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';
import { createScreenMaterial, screenToGameUV } from './crt.js';
import { buildRoom, SCREEN } from './room.js';
import { Hud } from './hud.js';
import { buildTitle, preloadFont } from './title.js';
import { buildOverworld, STAR_SECTIONS, EXIT_BTN } from './overworld.js';
import { buildChannel } from './tvshow.js';
import { buildSectionChannel } from './channels.js';
import { audio } from './audio.js';

const canvas = document.getElementById('game');
const hint = document.getElementById('hint');
preloadFont();
// Loading bar milestones (see the inline script in index.html)
const loaded = (p) => window.__playProgress?.(p);
loaded(0.4);                      // the 3D library and game code have arrived
const content = await loadContent();
loaded(0.5);

const renderer = new Renderer(canvas);
const input = new Input();
const hud = new Hud();
const screenMat = createScreenMaterial(renderer.target.texture);
screenMat.uniforms.uCrt.value = progress.get('crt') ? 1 : 0;
const room = buildRoom(screenMat, renderer.gl);
loaded(0.7);                      // living room built
const U = screenMat.uniforms;

// --- Cameras: the wide room shot, and the shot framed on the TV --------------
const cam = new THREE.PerspectiveCamera(38, renderer.aspect, 0.05, 50);
/** Wide shot over the couch. On narrow (portrait) screens, back up so the TV and console still fit. */
function introPose() {
  if (renderer.aspect < 1) {
    return { pos: new THREE.Vector3(0.8, 2.7, 6.2), look: new THREE.Vector3(0.36, 0.75, 0.5) };
  }
  const look = new THREE.Vector3(0.45, 0.7, 0.7);
  const pos = new THREE.Vector3(1.6, 1.7, 5.0);
  const k = Math.max(1, Math.pow(1.4 / renderer.aspect, 0.85));
  return { pos: look.clone().add(pos.sub(look).multiplyScalar(k)), look };
}
function framedPose() {
  // Fit the bezel (screen + a little frame) to the window, keeping 4:3
  const fw = SCREEN.w + 0.26, fh = SCREEN.h + 0.22;
  const half = Math.max(fh / 2, fw / 2 / renderer.aspect);
  const dist = half / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  return { pos: new THREE.Vector3(SCREEN.x, SCREEN.y, SCREEN.z + 0.04 + dist), look: new THREE.Vector3(SCREEN.x, SCREEN.y, SCREEN.z), framed: true };
}
/** Wider lens on portrait screens so the TV fits side to side. */
const lens = () => { cam.fov = renderer.aspect < 1 ? 50 : 42; };
lens();
cam.aspect = renderer.aspect;
cam.updateProjectionMatrix();
const INTRO = introPose();
const camLook = INTRO.look.clone();
cam.position.copy(INTRO.pos);
cam.lookAt(camLook);
let camTween = null; // { from, to, t, dur, done }
let framed = false;
const moveCam = (to, dur, done) => { camTween = { from: { pos: cam.position.clone(), look: camLook.clone() }, to, t: 0, dur, done }; };
window.addEventListener('resize', () => {
  lens();
  cam.aspect = renderer.aspect;
  cam.updateProjectionMatrix();
  if (camTween) return;
  const p = framed ? framedPose() : introPose();
  cam.position.copy(p.pos); camLook.copy(p.look);
});

// --- What can be on the TV ------------------------------------------------------------
const title = await buildTitle();
loaded(0.85);                     // title font loaded
let ui;
const map = buildOverworld({ progress, onOpen: (node) => openSection(node) });
loaded(0.95);                     // map built
const GAME = { id: 'game', num: 3, label: 'the game' };
const CHANNELS = [
  GAME,
  buildSectionChannel(content, 'about', 4),
  buildSectionChannel(content, 'writing', 5),
  buildSectionChannel(content, 'projects', 6),
  buildSectionChannel(content, 'contact', 7),
  Object.assign(buildChannel(content), { id: 'nightowl', num: 8 }),
];
let ch = CHANNELS.indexOf(GAME);
let osdT = 0;          // seconds left to show the "CH 03" number on the title screen
let tuneT = 0;         // static burst while the cartridge boots back up
const tuneSnow = () => (tuneT > 0 ? 0.6 * Math.min(1, tuneT / 0.14) : 0);   // soft, and fades out
// Changing channels works like a 90s TV: the picture blanks to black for a moment
// while the tuner locks on, with a faint relay click, then the new channel pops in.
let blinkT = 0;
const BLINK_TIME = 0.16;
function channelBlink() { blinkT = BLINK_TIME; audio.click(); }
let glitched = new URLSearchParams(location.search).has('glitch');

function openSection(node) {
  if (['about', 'writing', 'projects', 'contact'].includes(node.section)) openOnTv(node.section);
  else ui.toast(`${node.label} is coming soon`);
}
const starCount = () => STAR_SECTIONS.filter((id) => progress.hasStar(id)).length;

// --- UI ---------------------------------------------------------------------------------
let mode = 'room';     // 'room' | 'title' | 'map' | 'exit' | 'tv' (a section showing on the TV)
let panelOpen = false;
ui = new UI(document.getElementById('overlay'), document.querySelector('.toasts'), content, {
  onOpen: () => { panelOpen = true; input.enabled = false; input.clear(); },
  onClose: () => {
    panelOpen = false; input.enabled = true; input.clear();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search); // drop #section
  },
  onToggle: (key, v) => { if (key === 'crt') U.uCrt.value = v ? 1 : 0; },
  canExit: () => mode === 'map',
  onExit: () => exitGame(),
  onSection: (id) => openOnTv(id),
});
// --- Sections on the TV ---------------------------------------------------------
// Each section is its own channel (CH 4–7) showing the whole section as pages.
// Opening one (top nav, clicking the TV on that channel, a map spot, a deep link)
// tunes to it and pushes the camera in. The picture is the same channel page from
// the couch or up close; zooming in just brings you closer. Page buttons and links
// on the glass are clickable either way, and ← → flip pages.
let tvReturn = 'room';   // where stepping back goes: 'room' | 'map' | 'title'
let tvChan = null;       // the channel being viewed up close (a section, the game on CH 3, or Night Owl)
const srEl = document.getElementById('tv-sr');
/** Keep a hidden HTML copy of the page on screen, for screen readers. */
function updateSr(chan = tvChan || (mode === 'room' && CHANNELS[ch].srNodes ? CHANNELS[ch] : null)) {
  srEl.replaceChildren(...(chan?.srNodes ? chan.srNodes() : []));
}
function tvHint() {
  if (tvChan === GAME && cartOut) return setHint('The cartridge is out — click it to put it back in');
  if (tvChan === GAME && glitched) return setHint('The picture is scrambled — pull the cartridge out and put it back in (click it twice)');
  const pages = tvChan && tvChan.pageCount > 1 ? '← → or the on-screen buttons flip pages · ' : '';
  const play = tvChan === GAME ? 'Click the screen to play · ' : '';
  setHint(`${play}${pages}Turn a knob to change channels · Esc or click outside the TV to step back`);
}
/** Turn a knob while zoomed in: change channels without leaving the close-up. */
function zoomTune(dir) { zoomTo(ch + dir); }
function zoomTo(index) {
  ch = (index + CHANNELS.length) % CHANNELS.length;
  channelBlink();
  hud.clear();
  tvChan = CHANNELS[ch];
  tvChan.reset?.();
  if (tvChan === GAME) { osdT = 2.5; glitched = glitched || Math.random() < BOOT.glitchChance; }
  tvHint();
  updateSr();
}
function openOnTv(section) {
  if (mode === 'exit') return;
  if (ui.isOpen) ui.close(true);                         // e.g. picked from the pause menu
  const idx = CHANNELS.findIndex((c) => c.id === section);
  const chan = CHANNELS[idx];
  if (!chan) return;
  if ((mode === 'room' || (mode === 'tv' && tvReturn === 'room')) && idx !== ch) { ch = idx; channelBlink(); }
  if (chan !== tvChan && !(mode === 'room' && idx === ch)) chan.reset();   // keep the page if you were already reading it
  tvChan = chan;
  hud.clear();
  if (mode === 'room') { tvReturn = 'room'; mode = 'tv'; moveCam(framedPose(), 1.1); }
  else if (mode !== 'tv') { tvReturn = mode; mode = 'tv'; }   // map or title: already framed on the TV
  tvHint();
  updateSr();
}
function closeTv() {
  if (mode !== 'tv') return;
  if (location.hash) history.replaceState(null, '', location.pathname + location.search); // drop #section
  if (tvReturn === 'room') {                            // back to the couch, still on that channel and page
    mode = 'room';
    framed = false;
    moveCam(introPose(), 1.2);
    roomHint();
  } else { mode = tvReturn; hud.clear(); setHint(''); }
  tvChan = null;
  updateSr();
}
/** Flip the page of a section channel. */
function flipPage(chan, dir) {
  if (chan?.flip?.(dir)) { hud.clear(); updateSr(chan); }
}
/** Act on something clicked on a channel page. Returns true if it did something. */
function doPageAction(chan, a) {
  if (!a) return false;
  if (a.type === 'prev' || a.type === 'next') { flipPage(chan, a.type === 'next' ? 1 : -1); return true; }
  if (a.type === 'link') {
    const external = /^https?:/.test(a.href) && !a.href.startsWith(location.origin);
    if (external) window.open(a.href, '_blank', 'noopener'); else location.href = a.href;
    return true;
  }
  return false;
}
/** A point on the glass (mesh UV) → pixels of the 640x480 picture. */
function gamePx(uv) {
  const g = toGame(uv);
  return [(g.x + 1) / 2 * RENDER.width, (1 - (g.y + 1) / 2) * RENDER.height];
}

function pause() { if (!panelOpen) ui.openPause(); }
// Sound on/off (the button in the top nav, or M)
const soundBtn = document.querySelector('[data-sound]');
function showSound(m) {
  if (!soundBtn) return;
  soundBtn.setAttribute('aria-pressed', String(!m));
  soundBtn.setAttribute('aria-label', m ? 'Sound off. Turn sound on' : 'Sound on. Turn sound off');
  soundBtn.classList.toggle('off', m);
}
showSound(audio.muted);
audio.onChange(showSound);
soundBtn?.addEventListener('click', () => audio.toggle());
window.addEventListener('keydown', (e) => {
  if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA/.test(e.target.tagName)) audio.toggle();
});

// Your name in the top nav goes home: back to the couch from a close-up or the game
document.querySelector('[data-home]')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (panelOpen) ui.close();
  if (mode === 'tv') closeTv();
  if (mode === 'map') exitGame();
});

// --- Section shortcuts (top nav) and deep links like /play/#writing ---------------------
const SECTIONS = ['about', 'writing', 'projects', 'contact'];
function openFromHash() {
  const id = location.hash.slice(1);
  if (SECTIONS.includes(id)) openSection({ section: id, label: id });
}
document.querySelectorAll('[data-open]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  history.replaceState(null, '', `#${a.dataset.open}`);
  openFromHash();
}));
window.addEventListener('hashchange', openFromHash);

const setHint = (text) => { hint.textContent = text; hint.hidden = !text; };
function roomHint() {
  if (mode !== 'room') return setHint('');
  const c = CHANNELS[ch];
  if (c === GAME && cartOut) return setHint('The cartridge is out — click it to put it back in');
  if (c === GAME && glitched) return setHint('The picture is scrambled — pull the cartridge out and put it back in (click it twice)');
  if (c === GAME) return setHint('Click the TV to play · click the remote or a TV knob to change channels');
  if (c.id === 'nightowl') return setHint('Click the remote or a TV knob to change channels (CH 3 is the game)');
  return setHint(`Click the TV to zoom in${c.pageCount > 1 ? ' · ← → flip pages' : ''} · click the remote or a TV knob to change channels`);
}

// --- Warm-up on load: a bright line opens into the picture ---------------------------
let warmT = 0;
U.uPower.value = 1;
room.led.material.color.set(0x3aff6a);
room.consoleLed.material.color.set(0xff3a3a);
function updateWarm(dt) {
  if (warmT > 1) return;
  warmT += dt;
  U.uLineW.value = THREE.MathUtils.clamp((warmT - 0.15) / 0.3, 0, 1);
  U.uOpen.value = THREE.MathUtils.clamp((warmT - 0.4) / 0.35, 0, 1);
}

// --- Channels ----------------------------------------------------------------------------
function tune(index) {
  // Mid-game, changing the channel leaves the game: you stay up close on the TV, now
  // watching the new channel (CH 3 shows the title again; click it to play)
  if (mode === 'title' || mode === 'map') {
    hud.clear();
    tvReturn = 'room';
    mode = 'tv';
    return zoomTo(index);
  }
  if (mode === 'tv' && tvReturn === 'room') return zoomTo(index);
  if (mode !== 'room') return;
  const next = (index + CHANNELS.length) % CHANNELS.length;
  if (next === ch) return;
  ch = next;
  channelBlink();
  hud.clear();
  if (CHANNELS[ch] === GAME) {
    osdT = 2.5;
    // The old cartridge doesn't always come through cleanly…
    glitched = glitched || Math.random() < BOOT.glitchChance;
  }
  roomHint();
  updateSr();   // keep the screen-reader copy on the current channel
}
/** Click-turn a knob one detent (with a little overshoot), like an old dial. */
const knobTurns = new Map();
function turnKnob(knob, dir) {
  const k = knobTurns.get(knob) || { target: 0 };
  k.target += dir * Math.PI / 6;
  knobTurns.set(knob, k);
}
function updateKnobs(dt) {
  for (const [knob, k] of knobTurns) knob.rotation.z += (k.target - knob.rotation.z) * Math.min(1, dt * 18);
}
// --- Rabbit ears: twist them (click or drag) and the reception changes -------------
// Broadcast channels (CH 4–8) come in clearly near their own "sweet spot" angle — the
// game on CH 3 comes straight from the console, so it's never affected. Twist too far
// and you get snow, ghosting, wavy lines, and eventually a rolling picture.
// They start in the sweet spot, so the TV is clear on load.
const SWEET = { 4: 0.2, 5: -0.25, 6: 0.3, 7: -0.15, 8: 0.1 };
let antAngle = 0, badWarned = false;
function reception() {
  if (CHANNELS[ch] === GAME) return 0;   // the console is wired in, so the antenna can't touch it
  const target = SWEET[CHANNELS[ch].num] ?? 0;
  const d = Math.abs(((antAngle - target + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
  return THREE.MathUtils.clamp((d - 0.4) / 1.1, 0, 1);   // 0 = perfect, 1 = awful
}
function twistAntenna(by) {
  antAngle += by;
  if (!badWarned && reception() > 0.5) {   // (only possible on a broadcast channel)
    badWarned = true;
    ui.toast('Bad reception! Keep twisting the rabbit ears to tune it back in');
  }
}
let earDrag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (panelOpen || (mode !== 'room' && mode !== 'tv')) return;
  const hit = pick(e);
  if (hit?.id !== 'antenna') return;
  earDrag = { x: e.clientX, moved: 0, id: e.pointerId };
  canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!earDrag || e.pointerId !== earDrag.id) return;
  const dx = e.clientX - earDrag.x;
  earDrag.x = e.clientX;
  earDrag.moved += Math.abs(dx);
  twistAntenna(dx * 0.012);
});
const endEarDrag = (e) => {
  if (!earDrag || e.pointerId !== earDrag.id) return;
  if (earDrag.moved < 5) twistAntenna(0.55);   // a click twists it a notch
  earDrag = null;
};
canvas.addEventListener('pointerup', endEarDrag);
canvas.addEventListener('pointercancel', endEarDrag);

const nextChannel = () => tune(ch + 1);
const prevChannel = () => tune(ch - 1);
// Number keys tune directly; PageUp/PageDown flip
window.addEventListener('keydown', (e) => {
  if (panelOpen || mode === 'exit' || e.repeat) return;
  const m = /^(Digit|Numpad)([3-8])$/.exec(e.code);
  if (m) { tune(CHANNELS.findIndex((c) => c.num === Number(m[2]))); e.preventDefault(); }
  if (e.code === 'PageUp' || e.code === 'BracketRight') { nextChannel(); e.preventDefault(); }
  if (e.code === 'PageDown' || e.code === 'BracketLeft') { prevChannel(); e.preventDefault(); }
});

/** Clicking the TV (or Enter) does whatever the current channel offers. */
function activateTV() {
  if (mode !== 'room' || panelOpen) return;
  const c = CHANNELS[ch];
  if (c === GAME) {
    if (cartOut) { ui.toast('Put the cartridge back in first'); return; }
    if (glitched) { ui.toast('The game is scrambled — pull the cartridge out and put it back in'); return; }
    return play();
  }
  if (c.id === 'nightowl') { ui.toast('Click the remote or a TV knob to change channels — CH 3 is the game'); return; }
  openSection({ section: c.id, label: c.id });
}

// --- The cartridge: click to pull it out (the console's picture turns to static),
// click again to push it back in (static, then the game boots back up to the title).
// Pulling and reseating it is also how you fix the scrambled picture.
let cartOut = false;
function refreshHints() {
  if (mode === 'room') roomHint();
  else if (mode === 'tv') tvHint();
  else if (mode === 'title') setHint(cartOut ? 'The cartridge is out — click it to put it back in' : '');
}
function pullCart() {
  if (cartOut) return;
  cartOut = true;
  hud.clear();
  if (mode === 'map') mode = 'title';           // the game stops the moment the cartridge comes out
  refreshHints();
}
function insertCart() {
  if (!cartOut) return;
  cartOut = false;
  glitched = false;                              // a reseated cartridge always reads cleanly
  U.uGlitch.value = 0;
  tuneT = 0.6;                                   // a burst of static while it boots back up
  osdT = 2.5;
  hud.clear();
  refreshHints();
}
function toggleCart() { cartOut ? insertCart() : pullCart(); }

// --- Play: push into the TV, then start the map -----------------------------------------
function play() {
  mode = 'title';
  setHint('');
  hud.clear();
  if (renderer.aspect < 1 && matchMedia('(pointer: coarse)').matches) ui.toast('Tip: turn your phone sideways for a bigger screen', 4000);
  moveCam(framedPose(), 1.4, () => startGame());
}
/** Zoomed in on CH 3: clicking the screen starts the game right there. */
function playFromCloseUp() {
  if (cartOut) return ui.toast('Put the cartridge back in first');
  if (glitched) return ui.toast('The game is scrambled — pull the cartridge out and put it back in');
  tvChan = null;
  updateSr();
  mode = 'title';
  startGame();
}
function startGame() {
  if (mode !== 'title' || cartOut) return;
  mode = 'map';
  input.clear();
  hud.clear();
  ui.toast('Walk with the arrow keys or stick — or just click a spot', 4200);
}

// --- Exit: CRT shutoff, camera back to the couch, TV back on CH 3 -----------------------
let exitT = 0;
function exitGame() {
  if (mode !== 'map') return;
  mode = 'exit';
  exitT = 0;
  hud.clear();
  framed = false;
  moveCam(introPose(), 1.6);
}
function updateExit(dt) {
  exitT += dt;
  const t = exitT;
  // Picture squeezes to a line, the line shrinks to a dot, a beat of black…
  U.uOpen.value = THREE.MathUtils.clamp(1 - t / 0.22, 0, 1);
  U.uLineW.value = THREE.MathUtils.clamp(1 - (t - 0.22) / 0.2, 0, 1);
  U.uPower.value = t < 0.5 ? 1 : 0;
  if (t > 0.95) {
    // …then the title screen warms back up on CH 3
    mode = 'room';
    ch = CHANNELS.indexOf(GAME);
    U.uPower.value = 1; U.uStatic.value = 0;
    warmT = 0;
    osdT = 2.5;
    input.clear();
    roomHint();
  }
}

/** Is a game-UV point on the map's Exit button? */
function onExitButton(g) {
  const px = (g.x + 1) / 2 * RENDER.width, py = (1 - (g.y + 1) / 2) * RENDER.height;
  const b = EXIT_BTN;
  return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
}
let exitHover = false;

// --- Clicking: raycast into the room; clicks on the glass go into the game -------------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pick(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, cam);
  const hits = raycaster.intersectObjects(room.clickables.map((c) => c.object), true);
  if (!hits.length) return null;
  const obj = hits[0].object;
  const entry = room.clickables.find((c) => c.object === obj || c.object.getObjectById(obj.id));
  return entry ? { id: entry.id, uv: hits[0].uv } : null;
}
function toGame(uv) {
  const g = screenToGameUV(uv.x, uv.y, U.uCrt.value > 0);
  return { x: g.u * 2 - 1, y: g.v * 2 - 1 };
}
canvas.addEventListener('click', (e) => {
  if (panelOpen) return;
  const hit = pick(e);
  if (mode === 'tv') {
    // Up close: knobs change channels, the rabbit ears and the cartridge still work, buttons
    // and links on the glass work, and clicking anywhere else steps back
    if (hit?.id === 'knobUp') { turnKnob(room.knobUp, -1); return zoomTune(1); }
    if (hit?.id === 'knobDown') { turnKnob(room.knobDown, 1); return zoomTune(-1); }
    if (hit?.id === 'antenna') return;              // handled by the drag/click code
    if (hit?.id === 'cart') return toggleCart();
    if (hit?.id === 'screen') {
      if (tvChan === GAME) return playFromCloseUp();
      const [px, py] = gamePx(hit.uv); doPageAction(tvChan, tvChan?.hitTest?.(px, py)); return;
    }
    return closeTv();
  }
  if (!hit) return;
  if (mode === 'room') {
    if (hit.id === 'antenna') return;   // handled by the drag/click code above
    if (hit.id === 'lamp') { room.toggleLamp(); return; }
    if (hit.id === 'remote') return nextChannel();
    if (hit.id === 'knobUp') { turnKnob(room.knobUp, -1); return nextChannel(); }
    if (hit.id === 'knobDown') { turnKnob(room.knobDown, 1); return prevChannel(); }
    if (hit.id === 'cart') return toggleCart();
    if (hit.id === 'screen' && CHANNELS[ch].hitTest) {   // page buttons and links work from the couch too
      const [px, py] = gamePx(hit.uv);
      if (doPageAction(CHANNELS[ch], CHANNELS[ch].hitTest(px, py))) return;
    }
    if (hit.id === 'screen' || hit.id === 'power' || hit.id === 'tv') return activateTV();
  }
  if ((mode === 'title' || mode === 'map') && hit.id === 'cart') return toggleCart();
  if (mode === 'title' || mode === 'map') {        // the TV's own controls still work while you play
    if (hit.id === 'knobUp') { turnKnob(room.knobUp, -1); return nextChannel(); }
    if (hit.id === 'knobDown') { turnKnob(room.knobDown, 1); return prevChannel(); }
    if (hit.id === 'remote') return nextChannel();
  }
  if (mode === 'title' && hit.id === 'screen') return startGame();
  if (mode === 'map' && hit.id === 'screen') {
    const g = toGame(hit.uv);
    if (onExitButton(g)) return exitGame();
    map.click(g.x, g.y);
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const hit = pick(e);
  let pointer = false;
  exitHover = false;
  if (hit) {
    if (mode === 'room') pointer = true;                                     // everything in the room does something
    else if (mode === 'tv') {
      if (['knobUp', 'knobDown', 'antenna', 'cart'].includes(hit.id)) pointer = true;
      else if (hit.id === 'screen') pointer = tvChan === GAME ? !cartOut : !!tvChan?.hitTest?.(...gamePx(hit.uv));
    } else if (mode === 'title') pointer = ['cart', 'knobUp', 'knobDown', 'remote'].includes(hit.id) || (hit.id === 'screen' && !cartOut);
    else if (mode === 'map') {
      if (['cart', 'knobUp', 'knobDown', 'remote'].includes(hit.id)) pointer = true;
      else if (hit.id === 'screen') { const g = toGame(hit.uv); exitHover = onExitButton(g); pointer = exitHover || map.hover(g.x, g.y); }
    }
  }
  canvas.style.cursor = pointer ? 'pointer' : 'default';
});

roomHint();
openFromHash();   // /play/#writing etc. opens that section on the TV

// --- Main loop ----------------------------------------------------------------------------
let last = performance.now(), time = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
  last = now;
  time += dt;
  input.update();
  U.uTime.value = time;

  if (!panelOpen && mode !== 'room' && mode !== 'tv' && input.consume('pause')) pause();
  if (panelOpen && (input.consume('back') || input.consume('pause'))) ui.close();

  // Camera moves
  if (camTween) {
    camTween.t += dt;
    const k = Math.min(1, camTween.t / camTween.dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    cam.position.lerpVectors(camTween.from.pos, camTween.to.pos, e);
    camLook.lerpVectors(camTween.from.look, camTween.to.look, e);
    if (k >= 1) { const done = camTween.done; framed = !!camTween.to.framed; camTween = null; done?.(); }
  }
  cam.lookAt(camLook);

  updateKnobs(dt);
  room.update(time, dt);   // rain on the window, lightning
  // Shadows are baked; redraw them for the first moments and while anything in the room is moving
  const cartY = 0.24 + (cartOut ? 0.17 : 0);
  if (time < 1.5 || Math.abs(room.cart.position.y - cartY) > 0.001 || Math.abs(antAngle - room.ears.rotation.y) > 0.002) renderer.refreshShadows();
  // Rabbit ears follow the twist; the rods splay a bit as they turn
  room.ears.rotation.y += (antAngle - room.ears.rotation.y) * Math.min(1, dt * 12);
  room.rods.forEach((rod, i) => { rod.rotation.z = (i ? -1 : 1) * (0.45 + Math.sin(room.ears.rotation.y * 1.7) * 0.15); });
  if (mode !== 'room') {   // the console's picture is always clean
    U.uGhost.value = 0; U.uRoll.value = 0;
    if (mode !== 'exit') U.uStatic.value = 0;
  }

  // Cartridge slides out of / back into the slot
  room.cart.position.y += (cartY - room.cart.position.y) * Math.min(1, dt * 10);

  let game = null;
  // The tube's warm-up finishes no matter where you go (the exit sequence drives the tube itself)
  if (mode !== 'exit') updateWarm(dt);
  if (mode === 'room') {
    if (!panelOpen && (input.consume('confirm') || input.consume('start'))) {
      if (CHANNELS[ch] === GAME && cartOut) insertCart();
      else if (CHANNELS[ch] === GAME && glitched) { pullCart(); setTimeout(insertCart, 900); }
      else activateTV();
    }
    if (!panelOpen && input.consume('back')) prevChannel();
    // Changing channels: a short burst of static
    tuneT = Math.max(0, tuneT - dt);
    // Reception from the rabbit ears (flickers a little when it's bad)
    const bad = reception() * (0.9 + Math.random() * 0.1);
    U.uStatic.value = Math.max(tuneSnow(), bad * 0.7);
    U.uGhost.value = bad;
    U.uRoll.value = bad > 0.55 ? (bad - 0.55) * 0.6 : 0;
    osdT = Math.max(0, osdT - dt);

    const c = CHANNELS[ch];
    if (!panelOpen && c.flip && input.consume('move')) flipPage(c, input.dir.x > 0.5 ? 1 : input.dir.x < -0.5 ? -1 : 0);
    if (c === GAME && cartOut) {
      U.uStatic.value = 1; U.uGlitch.value = 0;
      hud.draw('cart-out', () => {});
      game = null;
    } else if (c === GAME) {
      title.update(dt, glitched ? time * 0.2 : time);
      U.uGlitch.value = glitched ? 0.7 + Math.sin(time * 13) * 0.3 : 0;
      if (glitched) {
        hud.draw(`glitch:${osdT > 0}`, (g, w, h) => {
          hud.panel(w / 2 - 250, h / 2 - 50, 500, 100, 'rgba(10,8,20,0.85)');
          hud.text('Try blowing on the cartridge', w / 2, h / 2, { size: 30, color: '#ffd84a' });
          if (osdT > 0) hud.osd(3);
        });
      } else title.drawHud(hud, time, osdT > 0 ? 3 : null);
      game = title;
    } else {
      U.uGlitch.value = 0;
      c.update(dt, time);
      c.drawHud(hud, time);
      game = c;
    }
  } else if (mode === 'title') {
    tuneT = Math.max(0, tuneT - dt);
    if (cartOut) { U.uStatic.value = 1; hud.draw('cart-out', () => {}); game = null; }
    else {
      U.uStatic.value = tuneSnow();
      title.update(dt, time);
      title.drawHud(hud, time);
      game = title;
    }
    if (!panelOpen && (input.consume('confirm') || input.consume('start'))) startGame();
  } else if (mode === 'map') {
    if (!panelOpen && input.consume('back')) exitGame();
    if (!panelOpen) map.update(dt, time, input);
    map.drawHud(hud, starCount(), exitHover);
    game = map;
  } else if (mode === 'tv') {
    // Up close on a section channel: the same page you see from the couch
    if (!panelOpen) {
      if (input.consume('pause') || input.consume('back')) closeTv();
      if (input.consume('move')) flipPage(tvChan, input.dir.x > 0.5 ? 1 : input.dir.x < -0.5 ? -1 : 0);
      if (tvChan === GAME && (input.consume('confirm') || input.consume('start'))) playFromCloseUp();
    }
    osdT = Math.max(0, osdT - dt);
    tuneT = Math.max(0, tuneT - dt);
    const bad = tvReturn === 'room' ? reception() * (0.9 + Math.random() * 0.1) : 0;   // the rabbit ears still matter
    U.uStatic.value = Math.max(tuneSnow(), bad * 0.7);
    U.uGhost.value = bad;
    U.uRoll.value = bad > 0.55 ? (bad - 0.55) * 0.6 : 0;
    U.uGlitch.value = 0;
    if (tvChan === GAME) {
      if (cartOut) { U.uStatic.value = 1; hud.draw('cart-out', () => {}); game = null; }
      else {
        title.update(dt, glitched ? time * 0.2 : time);
        U.uGlitch.value = glitched ? 0.7 + Math.sin(time * 13) * 0.3 : 0;
        if (glitched) hud.draw('glitch', (g, w, h) => {
          hud.panel(w / 2 - 250, h / 2 - 50, 500, 100, 'rgba(10,8,20,0.85)');
          hud.text('Try blowing on the cartridge', w / 2, h / 2, { size: 30, color: '#ffd84a' });
        });
        else title.drawHud(hud, time, osdT > 0 ? 3 : null);
        game = title;
      }
    } else if (tvChan) { tvChan.update?.(dt, time); tvChan.drawHud(hud, time); game = tvChan; }
  } else if (mode === 'exit') {
    updateExit(dt);
    game = exitT < 0.45 ? map : null;
  }

  // Sound: hiss whenever there's snow on the glass. The chiptune plays only once you've
  // started the game (title and map), never just from having the TV on CH 3.
  {
    const inGame = !cartOut && (mode === 'title' || mode === 'map');
    const near = mode === 'room' ? 0.6 : 1;                       // the TV is across the room from the couch
    const snow = U.uStatic.value * U.uPower.value * near;
    const music = inGame && U.uPower.value > 0.5 ? (panelOpen ? 0.4 : 1) * (1 - Math.min(1, U.uStatic.value)) : 0;
    audio.update(snow, music, false);
  }

  // Channel-change blank: black, then the picture pops back in over the last few frames
  blinkT = Math.max(0, blinkT - dt);
  U.uBlack.value = blinkT > 0.04 ? 1 : blinkT / 0.04;

  // TV glow lights the room
  room.tvLight.intensity = U.uPower.value * (1 - U.uBlack.value * 0.85) * (1.1 + U.uStatic.value * 0.4) * (0.95 + Math.random() * 0.05);
  renderer.render(game, hud, room.scene, cam);
  // First picture is up: fade out the loading screen (and cancel the fallback to the plain page)
  // (Setting the whole class also recovers if a slow connection had already fallen back to the plain page.)
  if (!started) { started = true; loaded(1); document.documentElement.className = 'game ready'; }
}
let started = false;
requestAnimationFrame(frame);

window.__play = { map, title, room, cam, U, get mode() { return mode; }, get channel() { return CHANNELS[ch].num; }, tune: (n) => tune(CHANNELS.findIndex((c) => c.num === n)), nextChannel, activateTV, toggleCart, startGame, audio };
