/* ========================================
   Network Topology Background
   ======================================== */
(function initNetwork() {
  const canvas = document.getElementById('star-canvas');
  const ctx = canvas.getContext('2d');

  const isMobile = window.innerWidth < 768;
  const R = 140, G = 29, B = 64;    // accent maroon #8C1D40
  const PR = 255, PG = 255, PB = 255; // packet color — white #FFFFFF

  // Hub nodes (routers/switches) and endpoints (devices)
  const HUB_COUNT = isMobile ? 5 : 12;
  const ENDPOINT_COUNT = isMobile ? 25 : 60;
  const HUB_REACH = isMobile ? 250 : 350;
  const PACKET_COUNT = isMobile ? 12 : 30;

  let nodes = [];
  let edges = [];   // persistent edge list rebuilt periodically
  let packets = []; // data packets traveling along edges
  let w = 0;
  let h = 0;
  let lastEdgeRebuild = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createNodes() {
    nodes = [];

    // Hub nodes — spread in a grid with jitter
    const hubCols = Math.ceil(Math.sqrt(HUB_COUNT * (w / h)));
    const hubRows = Math.ceil(HUB_COUNT / hubCols);
    const cellW = w / hubCols;
    const cellH = h / hubRows;
    for (let i = 0; i < HUB_COUNT; i++) {
      const col = i % hubCols;
      const row = Math.floor(i / hubCols);
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.06 + 0.02;
      nodes.push({
        x: cellW * (col + 0.3 + Math.random() * 0.4),
        y: cellH * (row + 0.3 + Math.random() * 0.4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 1.5 + 2.5,
        alpha: 0.8,
        pulseSpeed: Math.random() * 0.004 + 0.002,
        pulseOffset: Math.random() * Math.PI * 2,
        isHub: true,
      });
    }

    // Endpoint nodes
    for (let i = 0; i < ENDPOINT_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.12 + 0.04;
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 0.8 + 0.8,
        alpha: Math.random() * 0.3 + 0.3,
        pulseSpeed: Math.random() * 0.008 + 0.003,
        pulseOffset: Math.random() * Math.PI * 2,
        isHub: false,
      });
    }

    rebuildEdges();
    createPackets();
  }

  // Build stable edge list (hub-hub backbone + endpoint-to-hub spokes)
  function rebuildEdges() {
    edges = [];

    // Hub-to-hub backbone
    for (let i = 0; i < HUB_COUNT; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < HUB_COUNT; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HUB_REACH) {
          edges.push({ from: i, to: j, type: 'backbone' });
        }
      }
    }

    // Endpoint-to-nearest-hub spokes
    for (let i = HUB_COUNT; i < nodes.length; i++) {
      const ep = nodes[i];
      let closest = -1;
      let closestDist = Infinity;

      for (let h = 0; h < HUB_COUNT; h++) {
        const hub = nodes[h];
        const dx = ep.x - hub.x, dy = ep.y - hub.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HUB_REACH && dist < closestDist) {
          closest = h;
          closestDist = dist;
        }
      }

      if (closest >= 0) {
        edges.push({ from: i, to: closest, type: 'spoke' });
      }
    }
  }

  // Create data packets that travel along edges
  function createPackets() {
    packets = [];
    if (edges.length === 0) return;

    for (let i = 0; i < PACKET_COUNT; i++) {
      const edgeIdx = Math.floor(Math.random() * edges.length);
      packets.push({
        edge: edgeIdx,
        t: Math.random(),                      // position along edge 0-1
        speed: Math.random() * 0.003 + 0.001,  // travel speed
        forward: Math.random() > 0.5,          // direction
        size: Math.random() * 1.2 + 1,         // 1-2.2px
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);

    // Update node positions
    for (const node of nodes) {
      node.x += node.vx + Math.sin(time * 0.0003 + node.pulseOffset) * 0.03;
      node.y += node.vy + Math.cos(time * 0.0004 + node.pulseOffset) * 0.03;

      if (node.x < 0)  { node.x = 0; node.vx = Math.abs(node.vx); }
      if (node.x > w)  { node.x = w; node.vx = -Math.abs(node.vx); }
      if (node.y < 0)  { node.y = 0; node.vy = Math.abs(node.vy); }
      if (node.y > h)  { node.y = h; node.vy = -Math.abs(node.vy); }
    }

    // Rebuild edges every 2 seconds to account for drift
    if (time - lastEdgeRebuild > 2000) {
      rebuildEdges();
      // Re-assign packets to valid edges
      for (const pkt of packets) {
        if (pkt.edge >= edges.length) {
          pkt.edge = Math.floor(Math.random() * edges.length);
          pkt.t = 0;
        }
      }
      lastEdgeRebuild = time;
    }

    // --- Draw edges ---
    for (const edge of edges) {
      const a = nodes[edge.from];
      const b = nodes[edge.to];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const fade = Math.max(0, 1 - dist / HUB_REACH);

      const isBackbone = edge.type === 'backbone';
      ctx.lineWidth = isBackbone ? 1.2 : 0.5;
      const baseAlpha = isBackbone ? 0.25 : 0.15;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(${R},${G},${B},${baseAlpha * fade})`;
      ctx.stroke();
    }

    // --- Update & draw data packets ---
    for (const pkt of packets) {
      if (edges.length === 0) break;
      const edge = edges[pkt.edge];
      const a = nodes[edge.from];
      const b = nodes[edge.to];

      // Move packet along edge
      pkt.t += pkt.forward ? pkt.speed : -pkt.speed;

      // When packet reaches end, pick a new random edge (simulates routing)
      if (pkt.t > 1 || pkt.t < 0) {
        pkt.edge = Math.floor(Math.random() * edges.length);
        pkt.t = pkt.forward ? 0 : 1;
        pkt.forward = Math.random() > 0.5;
        continue;
      }

      // Interpolate position along edge
      const px = a.x + (b.x - a.x) * pkt.t;
      const py = a.y + (b.y - a.y) * pkt.t;

      // Bright glow trail
      ctx.beginPath();
      ctx.arc(px, py, pkt.size + 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${PR},${PG},${PB},0.08)`;
      ctx.fill();

      // Bright core
      ctx.beginPath();
      ctx.arc(px, py, pkt.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${PR},${PG},${PB},0.7)`;
      ctx.fill();
    }

    // --- Draw hub nodes with glow ---
    for (let i = 0; i < HUB_COUNT; i++) {
      const node = nodes[i];
      const pulse = Math.sin(time * node.pulseSpeed + node.pulseOffset) * 0.3 + 0.7;

      // Outer glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${R},${G},${B},${0.06 * pulse})`;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${R},${G},${B},${node.alpha * pulse})`;
      ctx.fill();
    }

    // --- Draw endpoint nodes ---
    for (let i = HUB_COUNT; i < nodes.length; i++) {
      const node = nodes[i];
      const pulse = Math.sin(time * node.pulseSpeed + node.pulseOffset) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${R},${G},${B},${node.alpha * pulse})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    resize();
    createNodes();
  });

  // Defer canvas work so the page paints first
  requestAnimationFrame(() => {
    resize();
    createNodes();
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
