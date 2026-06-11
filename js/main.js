/* ========================================
   Blueprint / drafting paper theme
   Shared by the main page and blog posts
   ======================================== */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ========================================
   Scroll ruler + grid parallax
   ======================================== */
const marker = document.getElementById('ruler-marker');
function onScroll() {
  const max = document.body.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
  if (marker) marker.style.top = 'calc(' + (p * 100) + '% - 5px)';
  if (!REDUCED) {
    const gy = (window.scrollY * 0.06).toFixed(1);
    document.body.style.backgroundPosition = '0 0, 0 0, 0 ' + gy + 'px, 0 ' + gy + 'px';
  }
}
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => { onScroll(); ticking = false; });
    ticking = true;
  }
}, { passive: true });
onScroll();

/* ========================================
   Reveal on scroll
   Blog post paragraphs and headings get the
   reveal treatment automatically.
   ======================================== */
document.querySelectorAll('.post > p, .post h2').forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal, .sec-heading, .proj-card, .spec-card, .doodle').forEach(el => io.observe(el));

/* ========================================
   Pencil trail cursor
   ======================================== */
const trail = document.getElementById('trail');
if (trail && !REDUCED && window.matchMedia('(pointer: fine)').matches) {
  const tctx = trail.getContext('2d');
  const sizeTrail = () => { trail.width = window.innerWidth; trail.height = window.innerHeight; };
  sizeTrail();
  window.addEventListener('resize', sizeTrail);
  let last = null;
  window.addEventListener('pointermove', e => {
    const pt = { x: e.clientX, y: e.clientY };
    if (last) {
      tctx.strokeStyle = 'rgba(44, 52, 74, 0.4)';
      tctx.lineWidth = 1.3;
      tctx.lineCap = 'round';
      tctx.beginPath();
      tctx.moveTo(last.x, last.y);
      tctx.lineTo(pt.x, pt.y);
      tctx.stroke();
    }
    last = pt;
  }, { passive: true });
  window.addEventListener('pointerout', () => { last = null; });
  window.addEventListener('scroll', () => { last = null; }, { passive: true });
  (function fadeTrail() {
    tctx.globalCompositeOperation = 'destination-out';
    tctx.fillStyle = 'rgba(0, 0, 0, 0.055)';
    tctx.fillRect(0, 0, trail.width, trail.height);
    tctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(fadeTrail);
  })();
}

/* ========================================
   SAY HELLO stamp
   ======================================== */
const stamp = document.getElementById('stamp');
if (stamp) {
  new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) { stamp.classList.add('in'); obs.disconnect(); }
    });
  }, { threshold: 0.8 }).observe(stamp);
}
