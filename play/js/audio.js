/**
 * audio.js — all sound is synthesized live with Web Audio (no sound files).
 *
 *  - TV static: a looping white-noise hiss whose volume follows the CRT's static
 *    level every frame, so any snow on the screen (tuning, a pulled cartridge,
 *    bad rabbit-ear reception, the power-off) is heard as well as seen.
 *  - A faint relay click when the channel changes.
 *  - A chiptune: an original four-bar loop for the game (square-wave lead,
 *    triangle bass, noise drums), played only once the visitor starts the
 *    game, so someone just reading never hears music they didn't ask for.
 *
 * Browsers only allow sound after the visitor interacts with the page, so
 * nothing plays before the first click or key press. A mute toggle is remembered.
 */
const KEY = 'play-muted';
let muted = false;
try { muted = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked */ }

let ctx = null, master, staticGain, musicGain, noiseBuf;
const listeners = new Set();

function init() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);

  // Two seconds of white noise, reused by the static and the drums
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

  // Static: noise → band-limited like a TV speaker → gain driven by update()
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf; src.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;   // rolled off so it's a soft hiss, not a harsh one
  staticGain = ctx.createGain(); staticGain.gain.value = 0;
  src.connect(hp).connect(lp).connect(staticGain).connect(master);
  src.start();

  // Music bus, through a small speaker-ish lowpass
  const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 5200;
  musicGain = ctx.createGain(); musicGain.gain.value = 0;
  musicGain.connect(tone).connect(master);
}

/** Call from a user gesture: creates/resumes the audio context. */
function unlock() {
  init();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}
['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend(); else ctx.resume();
});

// --- The chiptune ------------------------------------------------------------------------
// 16th-note steps, four bars (Am – F – C – G). Lead notes: [step, midi, length in steps].
const BPM = 128, STEP = 60 / BPM / 4, BAR = 16;
const LEAD = [
  [[0, 76, 2], [2, 81, 2], [4, 84, 2], [6, 83, 1], [7, 81, 1], [8, 79, 2], [10, 81, 4], [14, 76, 2]],
  [[0, 77, 2], [2, 81, 2], [4, 84, 3], [7, 86, 1], [8, 84, 2], [10, 81, 2], [12, 77, 4]],
  [[0, 79, 2], [2, 76, 2], [4, 79, 2], [6, 84, 2], [8, 83, 1], [9, 84, 1], [10, 86, 2], [12, 88, 4]],
  [[0, 86, 2], [2, 83, 2], [4, 79, 2], [6, 83, 2], [8, 86, 3], [11, 84, 1], [12, 83, 2], [14, 79, 2]],
];
const ROOTS = [45, 41, 48, 43];               // A2, F2, C3, G2
const BASS_SHAPE = [0, 12, 7, 12];            // a bouncing root-octave-fifth-octave line
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

let musicOn = false, glitchy = false, nextTime = 0, step = 0, timer = 0;

function note(type, freq, t, dur, vol, detune = 0) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.setValueAtTime(vol, t + dur * 0.7);
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g).connect(musicGain);
  o.start(t); o.stop(t + dur + 0.02);
}
function drum(t, dur, vol, freq) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(musicGain);
  s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
}
function kick(t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  o.connect(g).connect(musicGain);
  o.start(t); o.stop(t + 0.17);
}
function scheduleStep(s, t) {
  const bar = Math.floor(s / BAR) % 4, i = s % BAR;
  const wob = () => (glitchy ? (Math.random() - 0.5) * 260 : 0);   // a scrambled cartridge plays out of tune
  for (const [at, m, len] of LEAD[bar]) if (at === i) note('square', hz(m), t, len * STEP * 0.95, 0.055, wob());
  if (i % 2 === 0) note('triangle', hz(ROOTS[bar] + BASS_SHAPE[(i / 2) % 4]), t, STEP * 1.8, 0.22, wob() * 0.5);
  if (i % 2 === 0) drum(t, 0.04, 0.06, 7000);                  // hi-hat
  if (i === 0 || i === 8 || i === 10) kick(t);
  if (i === 4 || i === 12) drum(t, 0.14, 0.12, 1800);          // snare
}
function scheduler() {
  if (!ctx || !musicOn) return;
  while (nextTime < ctx.currentTime + 0.15) {
    scheduleStep(step, nextTime);
    step = (step + 1) % (BAR * 4);
    nextTime += STEP;
  }
}

function setMusic(on) {
  if (on === musicOn || !ctx) return;
  musicOn = on;
  clearInterval(timer);
  if (on) {
    step = 0;
    nextTime = ctx.currentTime + 0.05;
    timer = setInterval(scheduler, 25);
    scheduler();
  }
}

export const audio = {
  get muted() { return muted; },
  setMuted(m) {
    muted = m;
    try { localStorage.setItem(KEY, m ? '1' : '0'); } catch { /* storage blocked */ }
    if (ctx) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.03);
    listeners.forEach((fn) => fn(m));
  },
  toggle() { this.setMuted(!muted); },
  /** The faint relay click of a TV tuner changing channels. */
  click() {
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = 2500; f.Q.value = 1.2;
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    s.connect(f).connect(g).connect(master);
    s.start(t, Math.random()); s.stop(t + 0.04);
  },
  /** For debugging: what the mixer is doing right now. */
  get state() { return ctx ? { ctx: ctx.state, static: +staticGain.gain.value.toFixed(3), music: +musicGain.gain.value.toFixed(3), playing: musicOn } : null; },
  onChange(fn) { listeners.add(fn); },
  /**
   * Once per frame.
   * staticLevel: 0..1 how much snow is on screen.
   * music: 0..1 how loud the game music should be (0 = not playing).
   * glitch: the game picture is scrambled.
   */
  update(staticLevel, music, glitch) {
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    staticGain.gain.setTargetAtTime(Math.min(1, staticLevel) * 0.12, t, 0.025);
    glitchy = glitch;
    if (music > 0.01) setMusic(true);
    musicGain.gain.setTargetAtTime(music * 0.5, t, 0.08);
    if (music <= 0.01 && musicOn && musicGain.gain.value < 0.005) setMusic(false);
  },
};
