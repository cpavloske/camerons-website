/* ========================================
   Maroon & blush theme — motion
   Shared by the main page and blog posts
   ======================================== */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ========================================
   Preloader: count up, then slide away.
   Plays once per session; the <head> script adds
   .no-intro on repeat views so it never shows.
   ======================================== */
const loader = document.getElementById('loader');
if (loader) {
  const num = loader.querySelector('span');
  const start = performance.now();
  const seen = document.documentElement.classList.contains('no-intro');
  try { sessionStorage.setItem('intro-seen', '1'); } catch (e) {}
  const DUR = REDUCED || seen ? 0 : 900;
  (function tick(now) {
    const p = DUR ? clamp((now - start) / DUR, 0, 1) : 1;
    num.textContent = Math.round(p * 100);
    if (p < 1) requestAnimationFrame(tick);
    else setTimeout(() => { loader.classList.add('done'); document.body.classList.add('loaded'); }, 120);
  })(start);
  // Safety net: never leave the loader up if a frame stalls
  setTimeout(() => { loader.classList.add('done'); document.body.classList.add('loaded'); }, 2200);
}

/* ========================================
   Pinned sections
   Each [data-pin] section's content is moved into a
   sticky stage followed by a spacer, so the section
   locks in place for a beat before scrolling on. Stages
   taller than the viewport don't pin.
   ======================================== */
const pins = [...document.querySelectorAll('[data-pin]')].map(sec => {
  const stage = document.createElement('div');
  stage.className = 'pin-stage';
  while (sec.firstChild) stage.appendChild(sec.firstChild);
  const hold = document.createElement('div');
  hold.className = 'pin-hold';
  hold.setAttribute('aria-hidden', 'true');
  sec.append(stage, hold);
  sec.classList.add('pin');
  return { sec, stage };
});

function updatePins() {
  const vh = window.innerHeight;
  pins.forEach(p => {
    const h = p.stage.offsetHeight;
    const ok = !REDUCED && h <= vh;
    p.sec.classList.toggle('pinned', ok);
    // Centre short stages in the viewport while they hold
    p.stage.style.setProperty('--top', (ok ? Math.max(0, (vh - h) / 2) : 0) + 'px');
  });
}
updatePins();
window.addEventListener('resize', updatePins);
window.addEventListener('load', updatePins);

/* ========================================
   Menu
   Closed, the menu is inert so its links stay out of
   the tab order. Open, the page behind it is inert
   instead, and Escape closes it.
   ======================================== */
const menuBtn = document.getElementById('menu-btn');
const menu = document.getElementById('menu');
if (menuBtn && menu) {
  const behind = [...document.body.children].filter(el => !el.matches('.nav, .menu, script'));
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    menu.inert = !open;
    behind.forEach(el => { el.inert = open; });
  };
  setMenu(false);
  menuBtn.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    setMenu(open);
    if (open) menu.querySelector('a').focus({ preventScroll: true });
  });
  document.querySelectorAll('.menu a, .nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setMenu(false);
      menuBtn.focus();
    }
  });
}

/* ========================================
   Split statements into words for staggered reveal
   ======================================== */
document.querySelectorAll('.words').forEach(el => {
  let i = 0;
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('i'); inner.textContent = part; inner.style.setProperty('--i', i++);
          w.appendChild(inner); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
});

/* ========================================
   Reveal on scroll
   ======================================== */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.15 });
document.querySelectorAll('[data-reveal], .words, .bubble, .post > p, .post h2').forEach(el => {
  if (el.matches('.post > p, .post h2')) el.setAttribute('data-reveal', '');
  io.observe(el);
});

/* ========================================
   Background swap when dark sections are in view
   ======================================== */
const darkIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) document.body.classList.toggle('on-dark', e.target.dataset.bg === 'dark');
  });
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('[data-bg]').forEach(el => darkIO.observe(el));

/* ========================================
   Scroll progress engine
   Each [data-progress] element gets --p (0..1) as it
   crosses the viewport. Children with --x/--y/--r get
   a staggered --pc so cards fan out one after another.
   ======================================== */
const tracked = [...document.querySelectorAll('[data-progress]')].map(el => ({
  el,
  kids: [...el.querySelectorAll('[data-stagger]')],
  start: parseFloat(el.dataset.start || 0),   // fraction of travel before anything moves
  span: parseFloat(el.dataset.span || 0.5),   // fraction of travel over which one child animates
  gap: parseFloat(el.dataset.gap || 0.12)     // stagger between children
}));

function progressOf(el, sticky) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  if (sticky) return clamp(-r.top / (r.height - vh), 0, 1);
  return clamp((vh - r.top) / (r.height + vh), 0, 1);
}

function updateProgress() {
  tracked.forEach(t => {
    const p = REDUCED ? 1 : progressOf(t.el, t.el.dataset.progress === 'sticky');
    t.el.style.setProperty('--p', p.toFixed(4));
    t.kids.forEach((k, i) => {
      const pc = REDUCED ? 1 : clamp((p - t.start - i * t.gap) / t.span, 0, 1);
      k.style.setProperty('--pc', pc.toFixed(4));
    });
  });
}

/* ========================================
   Header logo fades in once the hero name scrolls away
   ======================================== */
const heroName = document.getElementById('hero-name');
const navLogo = document.getElementById('nav-logo');

function updateHero() {
  if (!heroName || !navLogo) return;
  const gone = heroName.getBoundingClientRect().bottom < 0;
  navLogo.classList.toggle('show', gone);
}

/* ========================================
   Frame loop
   ======================================== */
let ticking = false;
function frame() {
  updateHero();
  updateProgress();
  ticking = false;
}
function requestFrame() {
  if (!ticking) { ticking = true; requestAnimationFrame(frame); }
}
window.addEventListener('scroll', requestFrame, { passive: true });
window.addEventListener('resize', requestFrame);
window.addEventListener('load', frame);
frame();
