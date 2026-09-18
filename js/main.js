/* ========================================
   Maroon & blush theme — motion
   Shared by the main page and blog posts
   ======================================== */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ========================================
   Preloader: count up, then slide away
   ======================================== */
const loader = document.getElementById('loader');
if (loader) {
  const num = loader.querySelector('span');
  const start = performance.now();
  const DUR = REDUCED ? 0 : 900;
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
   Menu
   ======================================== */
const menuBtn = document.getElementById('menu-btn');
if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => {
    document.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));
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
