/* ========================================
   Aurora Signal Background
   Smooth aurora waves with subtle scan lines
   for an AV/surveillance aesthetic
   ======================================== */
(function initAurora() {
  const canvas = document.getElementById('star-canvas');
  const ctx = canvas.getContext('2d');

  const isMobile = window.innerWidth < 768;
  let w = 0;
  let h = 0;

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
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);

    // --- Draw aurora blobs with additive blending ---
    ctx.globalCompositeOperation = 'screen';
    for (const blob of blobs) {
      const bx = blob.baseX + Math.sin(time * blob.xFreq + blob.xPhase) * blob.xAmp;
      const by = blob.baseY + Math.cos(time * blob.yFreq + blob.yPhase) * blob.yAmp;

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

    requestAnimationFrame(draw);
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
  const phrases = [
    'modernizing the systems connecting the world.',
    'connecting physical and digital worlds.',
    'engineering smarter infrastructure.',
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

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
   Scroll Reveal
   ======================================== */
(function initReveal() {
  const reveals = document.querySelectorAll('.reveal');

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
