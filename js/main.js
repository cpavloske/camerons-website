/* ========================================
   Aurora Signal Background
   Smooth aurora waves with subtle scan lines
   for an AV/surveillance aesthetic
   ======================================== */
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

(function initAurora() {
  const canvas = document.getElementById('star-canvas');
  const ctx = canvas.getContext('2d');

  const isMobile = window.innerWidth < 768;
  let w = 0;
  let h = 0;

  // Pointer parallax — blobs lean gently toward the cursor
  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  if (!isMobile && !REDUCED_MOTION) {
    window.addEventListener('pointermove', e => {
      pointer.tx = e.clientX / w;
      pointer.ty = e.clientY / h;
    }, { passive: true });
  }

  // Aurora blobs — large soft color sources that drift slowly
  const BLOB_COUNT = isMobile ? 3 : 5;
  const blobs = [];

  // Scan line config
  const SCAN_LINE_GAP = 3;        // pixels between scan lines
  const SCAN_LINE_ALPHA = 0.03;   // very faint

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  // Predefined blob positions to ensure good coverage
  const blobSeeds = [
    { xFrac: 0.2, yFrac: 0.3 },   // top-left area
    { xFrac: 0.8, yFrac: 0.2 },   // top-right area
    { xFrac: 0.5, yFrac: 0.7 },   // center-bottom
    { xFrac: 0.15, yFrac: 0.8 },  // bottom-left
    { xFrac: 0.85, yFrac: 0.6 },  // right-center
  ];

  function createBlobs() {
    blobs.length = 0;
    const colors = [
      { r: 78,  g: 124, b: 255 },  // accent blue
      { r: 124, g: 58,  b: 237 },  // accent violet
      { r: 6,   g: 214, b: 160 },  // accent cyan
      { r: 78,  g: 124, b: 255 },  // blue again
      { r: 124, g: 58,  b: 237 },  // violet again
    ];

    for (let i = 0; i < BLOB_COUNT; i++) {
      const seed = blobSeeds[i];
      blobs.push({
        radius: Math.random() * 200 + (isMobile ? 300 : 500),
        color: colors[i % colors.length],
        alpha: Math.random() * 0.06 + 0.12,  // 0.12 – 0.18
        // Drift parameters
        xFreq:   Math.random() * 0.00006 + 0.00002,
        yFreq:   Math.random() * 0.00005 + 0.00002,
        xAmp:    Math.random() * (w * 0.15) + (w * 0.08),
        yAmp:    Math.random() * (h * 0.12) + (h * 0.06),
        xPhase:  Math.random() * Math.PI * 2,
        yPhase:  Math.random() * Math.PI * 2,
        // Base position — seeded for good coverage
        baseX: seed.xFrac * w,
        baseY: seed.yFrac * h,
        // Breathing
        breathFreq:  Math.random() * 0.0003 + 0.00015,
        breathPhase: Math.random() * Math.PI * 2,
        // Parallax strength — varies per blob for a sense of depth
        parallax: 30 + i * 18,
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);

    // Ease the pointer toward its target for a soft, weighty feel
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;

    // --- Draw aurora blobs with additive blending ---
    ctx.globalCompositeOperation = 'screen';
    for (const blob of blobs) {
      const bx = blob.baseX + Math.sin(time * blob.xFreq + blob.xPhase) * blob.xAmp
               + (pointer.x - 0.5) * blob.parallax;
      const by = blob.baseY + Math.cos(time * blob.yFreq + blob.yPhase) * blob.yAmp
               + (pointer.y - 0.5) * blob.parallax;

      const breath = Math.sin(time * blob.breathFreq + blob.breathPhase) * 0.3 + 0.7;
      const alpha = blob.alpha * breath;

      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, blob.radius);
      grad.addColorStop(0,   `rgba(${blob.color.r},${blob.color.g},${blob.color.b},${alpha})`);
      grad.addColorStop(0.4, `rgba(${blob.color.r},${blob.color.g},${blob.color.b},${alpha * 0.5})`);
      grad.addColorStop(0.7, `rgba(${blob.color.r},${blob.color.g},${blob.color.b},${alpha * 0.15})`);
      grad.addColorStop(1,   `rgba(${blob.color.r},${blob.color.g},${blob.color.b},0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, blob.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Switch back to normal blending for overlays
    ctx.globalCompositeOperation = 'source-over';

    // --- Scan lines (CRT / surveillance feel) ---
    ctx.fillStyle = `rgba(0,0,0,${SCAN_LINE_ALPHA})`;
    for (let y = 0; y < h; y += SCAN_LINE_GAP) {
      ctx.fillRect(0, y, w, 1);
    }

    // --- Slow scan beam (surveillance camera sweep) ---
    const beamY = ((time * 0.015) % (h + 200)) - 100;
    const beamGrad = ctx.createLinearGradient(0, beamY - 60, 0, beamY + 60);
    beamGrad.addColorStop(0, 'rgba(78,124,255,0)');
    beamGrad.addColorStop(0.5, 'rgba(78,124,255,0.04)');
    beamGrad.addColorStop(1, 'rgba(78,124,255,0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(0, beamY - 60, w, 120);

    // Reduced motion: render a single static frame
    if (!REDUCED_MOTION) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    resize();
    createBlobs();
  });

  requestAnimationFrame(() => {
    resize();
    createBlobs();
    requestAnimationFrame(draw);
  });
})();

/* ========================================
   Navbar Scroll Effect
   ======================================== */
(function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });
})();

/* ========================================
   Typewriter Effect
   ======================================== */
(function initTypewriter() {
  const el = document.querySelector('.hero-tagline');
  if (!el) return;

  const phrases = [
    'connecting the dots between IT and everything else.',
    'making complex systems make sense.',
    'finding the strategy hiding in your infrastructure.',
    'translating between engineers, executives, and everything in between.',
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  if (REDUCED_MOTION) {
    el.innerHTML = phrases[0] + '<span class="cursor"></span>';
    return;
  }

  function type() {
    const current = phrases[phraseIndex];

    if (!deleting) {
      el.innerHTML = current.substring(0, charIndex + 1) + '<span class="cursor"></span>';
      charIndex++;
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(type, 2200);
        return;
      }
      setTimeout(type, 70 + Math.random() * 40);
    } else {
      el.innerHTML = current.substring(0, charIndex) + '<span class="cursor"></span>';
      charIndex--;
      if (charIndex < 0) {
        deleting = false;
        charIndex = 0;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(type, 500);
        return;
      }
      setTimeout(type, 35);
    }
  }

  type();
})();

/* ========================================
   Scroll Indicator Fade
   ======================================== */
(function initScrollFade() {
  const indicator = document.querySelector('.scroll-indicator');
  if (!indicator) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 100) {
      indicator.classList.add('hidden');
    } else {
      indicator.classList.remove('hidden');
    }
  }, { passive: true });
})();

/* ========================================
   Active Nav Highlighting
   ======================================== */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -60% 0px' }
  );

  sections.forEach(section => observer.observe(section));
})();

/* ========================================
   Scroll Reveal
   ======================================== */
(function initReveal() {
  const reveals = document.querySelectorAll('.reveal');

  // Stagger siblings so grouped cards cascade in rather than land at once
  const groupCounts = new Map();
  reveals.forEach(el => {
    const parent = el.parentElement;
    const index = groupCounts.get(parent) || 0;
    el.style.transitionDelay = (index * 90) + 'ms';
    groupCounts.set(parent, index + 1);
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach(el => observer.observe(el));
})();

/* ========================================
   Cursor Spotlight on Cards
   ======================================== */
(function initSpotlight() {
  if (!window.matchMedia('(hover: hover)').matches) return;

  const cards = document.querySelectorAll('.project-card, .detail-card, .blog-item');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
  });
})();

/* ========================================
   Scroll Progress Bar
   ======================================== */
(function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;

  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--scroll', max > 0 ? window.scrollY / max : 0);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();

/* ========================================
   Telemetry HUD (Hero)
   Quiet NOC-style readouts: uptime, ping,
   and a throughput sparkline
   ======================================== */
(function initHud() {
  const uptimeEl = document.getElementById('hud-uptime');
  if (!uptimeEl) return;

  const pingEl = document.getElementById('hud-ping');
  const rateEl = document.getElementById('hud-rate');
  const spark = document.getElementById('hud-spark');
  const pad = n => String(n).padStart(2, '0');

  // Uptime since page load
  const start = Date.now();
  function uptime() {
    const s = Math.floor((Date.now() - start) / 1000);
    uptimeEl.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  }
  uptime();
  setInterval(uptime, 1000);

  // Latency wanders gently within a healthy range
  let ping = 14;
  function updatePing() {
    ping = Math.max(6, Math.min(40, ping + (Math.random() - 0.5) * 6));
    pingEl.textContent = Math.round(ping);
  }
  updatePing();

  // Throughput sparkline
  const ctx = spark.getContext('2d');
  const samples = [];
  const MAX_SAMPLES = 36;
  let rate = 2.4;

  function updateRate() {
    rate = Math.max(0.4, Math.min(8, rate + (Math.random() - 0.5) * 1.2));
    samples.push(rate);
    if (samples.length > MAX_SAMPLES) samples.shift();
    rateEl.textContent = rate.toFixed(1) + ' Mb/s';

    const w = spark.width;
    const h = spark.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(78, 124, 255, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    samples.forEach((v, i) => {
      const x = (i / (MAX_SAMPLES - 1)) * w;
      const y = h - 2 - (v / 8) * (h - 4);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // Prefill so the sparkline starts with history
  for (let i = 0; i < MAX_SAMPLES; i++) {
    rate = Math.max(0.4, Math.min(8, rate + (Math.random() - 0.5) * 1.2));
    samples.push(rate);
  }
  updateRate();

  if (!REDUCED_MOTION) {
    setInterval(updatePing, 2400);
    setInterval(updateRate, 800);
  }
})();
