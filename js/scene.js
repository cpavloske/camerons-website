/* ==========================================================
   scene.js: the live scene (Phase 2).
   - Moves the face panels onto a CSS 3D box and adds html.is-3d.
   - Rotates the box by tabs, scroll, drag, swipe, and arrow keys.
   - Lights each face, reshapes the contact shadow, runs the
     opening sequence on the TV.
   If reduced motion is on, or a library fails to load, nothing
   here runs and the page stays the still scene plus panel scroll.
   All colors, durations, and eases are read from tokens.css.
   ========================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Public state. Tests read .motion; later phases listen for events.
  var api = window.uptimeScene = { motion: false, ready: false, face: 'front', goTo: function () {} };

  var scene = document.getElementById('scene');
  var rig = document.getElementById('box');
  function bail() { root.classList.remove('intro-pending'); }
  if (!scene || !rig || REDUCED || !window.uptimeLibs ||
      !(window.CSS && CSS.supports('transform-style', 'preserve-3d'))) { bail(); return; }

  window.uptimeLibs.load('gsap', 'lenis').then(init).catch(bail);

  /* ---------- tokens ---------- */
  var cs = getComputedStyle(root);
  function tok(name) { return cs.getPropertyValue(name).trim(); }
  function num(name) { return parseFloat(tok(name)); }
  function sec(name) { return parseFloat(tok(name)) / 1000; }

  var FACES = ['front', 'about', 'writing', 'projects', 'contact'];   // nav and scroll order
  var RING = ['front', 'writing', 'projects', 'about'];               // order around the box, for swipes
  // Unit normals in box space (x right, y down, z toward the viewer)
  var NORMALS = { front: [0, 0, 1], projects: [0, 0, -1], writing: [1, 0, 0], about: [-1, 0, 0], top: [0, -1, 0], contact: [0, 1, 0] };
  var LIGHT = norm([-0.45, -0.5, 0.74]);   // morning sun: upper left, in front

  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function init() {
    var gsap = window.gsap, Lenis = window.Lenis;
    var track = document.getElementById('track');
    var cam = document.getElementById('cam');
    var shadow = document.getElementById('box-shadow');
    var tvScreen = document.getElementById('tv-screen');
    var hint = document.getElementById('hint');
    var tabs = [].slice.call(document.querySelectorAll('.flap a[data-face]'));

    /* ---------- build the cube: one copy of every face ---------- */
    var faceEls = {};
    FACES.forEach(function (name) {
      var el = document.getElementById(name);
      if (el.parentNode !== rig) rig.appendChild(el);
      faceEls[name] = el;
    });
    faceEls.top = rig.querySelector('.face-top');
    root.classList.add('is-3d');
    api.motion = true;

    /* ---------- MEET THE MAKER reading sheet ---------- */
    var maker = document.getElementById('maker');
    var makerOpen = document.getElementById('maker-open');
    var sheet = document.createElement('dialog');
    sheet.className = 'sheet';
    sheet.setAttribute('aria-labelledby', 'maker-h');
    sheet.setAttribute('data-lenis-prevent', '');
    var close = document.createElement('button');
    close.type = 'button'; close.className = 'btn-chunky sheet-close'; close.textContent = 'Close';
    sheet.appendChild(close); sheet.appendChild(maker);
    document.body.appendChild(sheet);
    makerOpen.addEventListener('click', function () { sheet.showModal(); lenis.stop(); });
    close.addEventListener('click', function () { sheet.close(); });
    sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });
    sheet.addEventListener('close', function () { lenis.start(); makerOpen.focus(); });

    /* ---------- geometry ---------- */
    var M = {};
    function measure() {
      M.w = scene.clientWidth; M.h = scene.clientHeight;
      M.bw = rig.offsetWidth; M.bh = rig.offsetHeight; M.bd = M.bh * num('--box-depth');
      M.fit = Math.min(1, num('--fit') * M.w / M.bw);   // scale that fits a wide face on screen
      M.stop = (track.offsetHeight - scene.offsetHeight) / 5;
      M.deskS = Math.min(num('--desk-s'), 0.8 * M.w / M.bw); M.deskX = num('--desk-xf') * M.w; M.foot = num('--desk-foot');
      M.readX = num('--read-xf') * M.w;
    }
    // Where the box sits for each face. s: scale, z: push back so the facing panel is at true size.
    function poseFor(name) {
      if (name === 'front') {
        return { x: M.deskX, y: M.h * (M.foot - 0.5) - M.bh * M.deskS / 2, s: M.deskS,
                 rx: num('--rest-rx'), ry: num('--rest-ry'), z: -M.bd / 2, lift: 0 };
      }
      // sides are narrow and shown at full size; the wide faces shrink to fit small screens
      var p = { x: M.readX, y: 0, s: 1, rx: 0, ry: 0, z: -M.bw / 2, lift: 1 };
      if (name === 'about') p.ry = 90;
      if (name === 'writing') p.ry = -90;
      if (name === 'projects') { p.ry = 180; p.z = -M.bd / 2; p.s = M.fit; }
      if (name === 'contact') { p.rx = 90; p.z = -M.bh / 2; p.s = M.fit; }
      return p;
    }

    var pose = { x: 0, y: 0, s: 1, rx: 0, ry: 0, z: 0, lift: 0 };
    var lean = 0, dragRy = 0;
    var shadeMax = num('--shade-max');

    function render() {
      var ry = pose.ry + lean + dragRy;
      rig.style.transform =
        'translate3d(' + pose.x.toFixed(2) + 'px,' + pose.y.toFixed(2) + 'px,0) scale(' + pose.s.toFixed(4) + ') ' +
        'translateZ(' + pose.z.toFixed(2) + 'px) rotateX(' + pose.rx.toFixed(3) + 'deg) rotateY(' + ry.toFixed(3) + 'deg)';

      // lighting: rotateY then rotateX applied to each normal
      var a = ry * Math.PI / 180, b = pose.rx * Math.PI / 180;
      var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      for (var k in NORMALS) {
        var n = NORMALS[k];
        var x = n[0] * ca + n[2] * sa, z0 = -n[0] * sa + n[2] * ca;
        var y = n[1] * cb - z0 * sb, z = n[1] * sb + z0 * cb;
        var lit = Math.max(0, x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]);
        var sh = clamp((LIGHT[2] - lit) / LIGHT[2], 0, 1) * shadeMax;
        faceEls[k].style.setProperty('--sh', sh.toFixed(3));
      }

      // contact shadow: footprint width follows the turn, fades as the box is lifted
      var foot = Math.abs(ca) + Math.abs(sa) * M.bd / M.bw;
      var k2 = pose.s / M.deskS;
      shadow.style.transform = 'translateX(' + pose.x.toFixed(1) + 'px) scale(' + (foot * k2 * (1 - pose.lift * 0.35)).toFixed(3) + ',' + (1 + pose.lift * 0.6).toFixed(3) + ')';
      shadow.style.opacity = (1 - pose.lift * 0.72).toFixed(3);
    }

    /* ---------- going to a face ---------- */
    var active = 'front';
    function goTo(name, opts) {
      opts = opts || {};
      if (FACES.indexOf(name) < 0) return;
      var changed = name !== active;
      active = api.face = name;
      var t = poseFor(name);
      // shortest spin to the target angle
      t.ry += 360 * Math.round((pose.ry - t.ry) / 360);
      gsap.killTweensOf(pose);
      if (opts.instant) { for (var k in t) pose[k] = t[k]; render(); }
      else gsap.to(pose, Object.assign(t, { duration: sec('--dur-spin'), ease: tok('--g-spin'), onUpdate: render }));

      scene.setAttribute('data-face', name);
      FACES.forEach(function (f) { faceEls[f].inert = f !== name; });
      tabs.forEach(function (a) {
        if (a.getAttribute('data-face') === name) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
      if (!opts.fromScroll) syncScroll(FACES.indexOf(name));
      if (changed) {
        hideHint();
        if (window.uptimeTrack) window.uptimeTrack('box_face_view', { face: name });
        document.dispatchEvent(new CustomEvent('uptime:face', { detail: { face: name } }));
      }
    }
    api.goTo = goTo;

    /* ---------- smooth scroll, one stop per face ---------- */
    var lenis = new Lenis({ autoRaf: false });
    api.lenis = lenis;
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    var lockUntil = 0, snapTimer = 0;
    function trackTop() { return track.getBoundingClientRect().top + window.scrollY; }
    function syncScroll(i) {
      lockUntil = performance.now() + 250;
      lenis.scrollTo(trackTop() + i * M.stop, { immediate: true, force: true });
    }
    lenis.on('scroll', function () {
      if (performance.now() < lockUntil) return;
      var prog = (window.scrollY - trackTop()) / M.stop;
      if (prog > 4.02) { if (lean) { lean = 0; render(); } return; }   // past the box: free scroll to the post list
      var i = clamp(Math.round(prog), 0, 4);
      lean = (i - prog) * num('--lean');
      if (FACES[i] !== active) goTo(FACES[i], { fromScroll: true });
      else render();
      clearTimeout(snapTimer);
      snapTimer = setTimeout(function () {
        var p = (window.scrollY - trackTop()) / M.stop;
        if (p > 4.02 || Math.abs(p - Math.round(p)) < 0.02) return;
        lenis.scrollTo(trackTop() + clamp(Math.round(p), 0, 4) * M.stop, { duration: sec('--dur-snap') });
      }, 170);
    });

    /* ---------- links ---------- */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (FACES.indexOf(id) >= 0) { e.preventDefault(); goTo(id); }
      else if (id && document.getElementById(id)) {
        e.preventDefault();
        lenis.scrollTo('#' + id, { offset: -num('--topbar-h') });
        history.replaceState(null, '', '#' + id);
      }
    });

    /* ---------- drag and swipe to spin ---------- */
    var drag = null;
    rig.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      drag = { x: e.clientX, y: e.clientY, on: false, id: e.pointerId };
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
        drag.on = true; rig.classList.add('is-dragging');
        try { rig.setPointerCapture(drag.id); } catch (err) {}
      }
      dragRy = clamp(dx * 0.32, -100, 100);
      render();
    });
    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var was = drag.on, turn = dragRy; drag = null;
      if (!was) return;
      rig.classList.remove('is-dragging');
      // fold the drag into the pose so the next tween starts from where the box is
      pose.ry += turn; dragRy = 0;
      var next = active;
      if (Math.abs(turn) > 18) {
        var i = RING.indexOf(active);
        if (i < 0) next = 'front';                          // from the bottom, any swipe goes home
        else next = RING[(i + (turn < 0 ? 1 : -1) + RING.length) % RING.length];
      }
      if (next === active) gsap.to(pose, Object.assign(settle(), { duration: sec('--dur-return'), ease: tok('--g-pop'), onUpdate: render }));
      else goTo(next);
      // a drag is not a click
      window.addEventListener('click', swallow, true);
      setTimeout(function () { window.removeEventListener('click', swallow, true); }, 0);
    }
    function settle() { var t = poseFor(active); t.ry += 360 * Math.round((pose.ry - t.ry) / 360); return t; }
    function swallow(e) { e.stopPropagation(); e.preventDefault(); }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    /* ---------- arrow keys ---------- */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (sheet.open || e.altKey || e.metaKey || e.ctrlKey) return;
      var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      var i = FACES.indexOf(active) + (e.key === 'ArrowRight' ? 1 : -1);
      if (i < 0 || i >= FACES.length) return;
      e.preventDefault(); goTo(FACES[i]);
    });

    /* ---------- hint ---------- */
    var hintTimer = setTimeout(function () { hint.classList.add('is-on'); }, sec('--hint-delay') * 1000 + introLength());
    function hideHint() { clearTimeout(hintTimer); hint.classList.remove('is-on'); }
    rig.addEventListener('pointerdown', hideHint);

    /* ---------- TV static (canvas noise, drawn only while visible) ---------- */
    var canvas = tvScreen.querySelector('.tv-static'), ctx = canvas.getContext('2d');
    var staticOn = false, ink = tok('--ink'), cream = tok('--milk-cream');
    function drawStatic() {
      if (!staticOn) return;
      ctx.globalAlpha = 1; ctx.fillStyle = ink; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = cream;
      for (var i = 0; i < 1500; i++) {
        ctx.globalAlpha = Math.random() * 0.9;
        ctx.fillRect((Math.random() * canvas.width) | 0, (Math.random() * canvas.height) | 0, 2, 1);
      }
      setTimeout(drawStatic, 60);
    }
    function show(what) {
      tvScreen.setAttribute('data-show', what);
      var on = what === 'static';
      if (on && !staticOn) { staticOn = true; drawStatic(); } else staticOn = on;
    }
    function click() {
      tvScreen.classList.remove('tv-click'); void tvScreen.offsetWidth; tvScreen.classList.add('tv-click');
    }
    api.tv = { show: show, click: click };

    /* ---------- TV channels: one real post or project each ----------
       Read from the page so titles and dates are never retyped here. */
    var card = document.getElementById('tv-card');
    var cap = document.getElementById('tv-caption');
    var tvHit = document.getElementById('tv-hit');
    var el = { ch: document.getElementById('tv-ch'), kicker: document.getElementById('tv-kicker'),
               title: document.getElementById('tv-title'), meta: document.getElementById('tv-meta') };
    var channels = [];
    [].forEach.call(document.querySelectorAll('#bowl .post-list li'), function (li, i) {
      var a = li.querySelector('a'), t = li.querySelector('time');
      channels.push({ kicker: i === 0 ? 'Latest writing' : 'Writing', title: a.textContent.trim(),
                      meta: t ? t.textContent.trim() : '', href: a.getAttribute('href') });
    });
    [].forEach.call(document.querySelectorAll('#projects .project'), function (li) {
      var a = li.querySelector('h3 a');
      channels.push({ kicker: 'Project: ' + li.querySelector('.kicker').textContent.trim(),
                      title: li.querySelector('h3').textContent.trim(),
                      meta: li.querySelector('.tags').textContent.trim(),
                      href: a ? a.getAttribute('href') : '#projects', ext: !!a });
    });
    var chan = 0, cardTimer = 0, focusTimer = 0;
    function paint(c, tone, label) {
      card.setAttribute('data-tone', tone);
      card.setAttribute('data-len', c.title.length < 26 ? 'short' : 'long');
      el.ch.textContent = label; el.kicker.textContent = c.kicker; el.title.textContent = c.title; el.meta.textContent = c.meta;
    }
    function paintChannel() {
      var c = channels[chan];
      paint(c, String(chan % 4), 'CH 0' + (chan + 1));
      cap.querySelector('span').textContent = c.title;
      cap.setAttribute('href', c.href);
      if (c.ext) { cap.setAttribute('target', '_blank'); cap.setAttribute('rel', 'noopener noreferrer'); }
      else { cap.removeAttribute('target'); cap.removeAttribute('rel'); }
    }
    // a burst of static, a click, then the picture; the TV pulls into focus for a moment
    function tune(fn) {
      clearTimeout(cardTimer);
      show('static');
      setTimeout(function () { click(); fn(); show('card'); }, sec('--dur-tv-static') * 1000);
      root.style.setProperty('--dof-tv-now', '0px');
      clearTimeout(focusTimer);
      focusTimer = setTimeout(function () { root.style.removeProperty('--dof-tv-now'); }, sec('--dur-focus') * 1000);
    }
    tvHit.addEventListener('click', function () {
      chan = (chan + 1) % channels.length;
      tune(paintChannel);
      if (window.uptimeTrack) window.uptimeTrack('tv_channel_change');
    });
    // turning the box changes the channel to a title card for that face, then back
    document.addEventListener('uptime:face', function (e) {
      if (!api.ready) return;
      var face = e.detail.face;
      if (face === 'front') { tune(paintChannel); return; }
      var tab = document.querySelector('.flap a[data-face="' + face + '"]');
      tune(function () { paint({ kicker: 'Now showing', title: tab.textContent.trim(), meta: '' }, 'now', ''); });
      cardTimer = setTimeout(function () { tune(paintChannel); }, sec('--dur-card') * 1000);
    });
    api.tv.channels = channels;

    /* ---------- opening sequence (DESIGN.md section 4) ---------- */
    function introLength() {
      return root.classList.contains('intro-pending')
        ? (sec('--dur-intro-static') + sec('--dur-intro-bars') + sec('--dur-intro-pull')) * 1000 : 0;
    }
    function settled() {
      root.style.removeProperty('--dof-back'); root.style.removeProperty('--dof-fore'); root.style.removeProperty('--dof-tv-now');
      root.classList.add('is-settled');
      gsap.set(cam, { clearProps: 'transform,transformOrigin' });
      show('card');
      api.ready = true;
      document.dispatchEvent(new CustomEvent('uptime:ready'));
    }
    function intro() {
      if (!root.classList.contains('intro-pending')) { settled(); return; }
      try { sessionStorage.setItem('uptime-intro', '1'); } catch (e) {}
      var r = tvScreen.getBoundingClientRect(), c = scene.getBoundingClientRect();
      var k = Math.min(c.width / r.width, c.height / r.height) * 0.98;
      var ox = r.left + r.width / 2 - c.left, oy = r.top + r.height / 2 - c.top;
      gsap.set(cam, { transformOrigin: ox + 'px ' + oy + 'px', x: c.width / 2 - ox, y: c.height / 2 - oy, scale: k });
      var dof = { back: 0, fore: parseFloat(tok('--dof-intro')) };
      var tvRatio = parseFloat(tok('--dof-tv')) / parseFloat(tok('--dof-blur'));
      function applyDof() {
        root.style.setProperty('--dof-back', dof.back.toFixed(2) + 'px');
        root.style.setProperty('--dof-tv-now', (dof.back * tvRatio).toFixed(2) + 'px');
        root.style.setProperty('--dof-fore', dof.fore.toFixed(2) + 'px');
      }
      applyDof(); show('static');
      root.classList.remove('intro-pending');

      var t1 = sec('--dur-intro-static'), t2 = t1 + sec('--dur-intro-bars'), pull = sec('--dur-intro-pull');
      var tl = gsap.timeline({ onComplete: finish });
      tl.add(function () { click(); show('bars'); }, t1)
        .add(function () { click(); show('card'); }, t2)
        .to(cam, { x: 0, y: 0, scale: 1, duration: pull, ease: tok('--g-spin') }, t2)
        .to(dof, { back: parseFloat(tok('--dof-blur')), fore: 0, duration: pull, ease: tok('--g-spin'), onUpdate: applyDof }, t2);
      var done = false;
      function finish() {
        if (done) return; done = true;
        window.removeEventListener('pointerdown', skip, true);
        window.removeEventListener('keydown', skip, true);
        settled();
      }
      function skip() { tl.progress(1); }   // any tap or key skips
      window.addEventListener('pointerdown', skip, true);
      window.addEventListener('keydown', skip, true);
    }

    /* ---------- start ---------- */
    measure();
    var start = (location.hash || '').slice(1);
    goTo(FACES.indexOf(start) >= 0 ? start : 'front', { instant: true, fromScroll: FACES.indexOf(start) < 0 });
    render();
    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { measure(); goTo(active, { instant: true }); }, 120);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); render(); });
    intro();
  }
})();
