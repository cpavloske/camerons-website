/* ==========================================================
   ping.js: Ping's behaviors on the front of the box (Phase 2).
   DESIGN.md section 3:
     idle        gentle bounce, antenna wiggle, blinking LED eyes
     hover, tap  waves
     20s idle    blinks slower, buffer wheel, then dozes off
     any input   wakes with a startled "Connected!"
   Starts only after scene.js reports the live scene is ready, so
   with reduced motion or no JS Ping simply stands still.
   Fires document event "uptime:ping-wake" when woken from sleep
   (Phase 3 awards a Box Top for it).
   Durations and eases come from tokens.css.
   ========================================================== */
(function () {
  'use strict';
  document.addEventListener('uptime:ready', start, { once: true });

  function start() {
    var gsap = window.gsap, ping = document.getElementById('ping');
    if (!gsap || !ping) return;
    var cs = getComputedStyle(document.documentElement);
    function tok(n) { return cs.getPropertyValue(n).trim(); }
    function sec(n) { return parseFloat(tok(n)) / 1000; }

    var antL = ping.querySelector('.ping-ant-l'), antR = ping.querySelector('.ping-ant-r');
    var eyes = ping.querySelectorAll('.ping-eye');
    var armL = ping.querySelector('.ping-arm-l');
    var wheel = ping.querySelector('.ping-wheel'), zzz = ping.querySelector('.ping-zzz');
    var bubble = document.getElementById('ping-bubble'), btn = document.getElementById('ping-btn');
    var soft = tok('--g-soft'), pop = tok('--g-pop');
    var state = 'awake';

    gsap.set(antL, { svgOrigin: '38 36' });
    gsap.set(antR, { svgOrigin: '82 36' });
    gsap.set(armL, { svgOrigin: '16 66' });
    gsap.set(wheel, { svgOrigin: '60 -12' });
    gsap.set(eyes, { transformOrigin: '50% 50%' });

    /* idle: bounce and antenna wiggle */
    var bounce = gsap.to(ping, { y: -8, duration: sec('--dur-bounce') / 2, ease: soft, yoyo: true, repeat: -1 });
    var wigL = gsap.fromTo(antL, { rotation: 5 }, { rotation: -7, duration: sec('--dur-wiggle') / 2, ease: soft, yoyo: true, repeat: -1 });
    var wigR = gsap.fromTo(antR, { rotation: -5 }, { rotation: 7, duration: sec('--dur-wiggle') / 2, ease: soft, yoyo: true, repeat: -1, delay: sec('--dur-wiggle') / 4 });

    /* blinking LED eyes */
    var blinkCall, blinkSlow = 1;
    function blink() {
      if (state !== 'asleep') gsap.to(eyes, { scaleY: 0.1, duration: sec('--dur-blink') * blinkSlow, ease: soft, yoyo: true, repeat: 1 });
      var min = sec('--ping-blink-min'), max = sec('--ping-blink-max');
      blinkCall = gsap.delayedCall((min + Math.random() * (max - min)) * blinkSlow, blink);
    }
    blink();

    /* hover or tap: wave */
    var waving = false;
    function wave() {
      if (state !== 'awake') { wake(); return; }
      if (waving) return; waving = true;
      var d = sec('--dur-wave') / 4;
      gsap.timeline({ onComplete: function () { waving = false; } })
        .to(armL, { rotation: 34, duration: d, ease: soft })
        .to(armL, { rotation: 6, duration: d, ease: soft })
        .to(armL, { rotation: 34, duration: d, ease: soft })
        .to(armL, { rotation: 0, duration: d, ease: soft });
    }
    btn.addEventListener('pointerenter', wave);
    btn.addEventListener('click', wave);
    btn.addEventListener('focus', wave);

    /* visitor idle: buffer, then doze */
    var idleTimer, bufferCall, spin, zFloat;
    function resetIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(buffer, sec('--ping-idle') * 1000);
    }
    function buffer() {
      state = 'buffering'; blinkSlow = 2.6;
      gsap.to(wheel, { opacity: 1, duration: sec('--dur-mid') });
      spin = gsap.to(wheel, { rotation: 360, duration: sec('--dur-bounce') / 1.5, ease: 'none', repeat: -1 });
      bufferCall = gsap.delayedCall(sec('--dur-buffer'), sleep);
    }
    function sleep() {
      state = 'asleep';
      gsap.to(wheel, { opacity: 0, duration: sec('--dur-mid') });
      gsap.to(eyes, { scaleY: 0.1, duration: sec('--dur-mid'), ease: soft });
      bounce.timeScale(0.4); wigL.timeScale(0.25); wigR.timeScale(0.25);
      gsap.to(zzz, { opacity: 1, duration: sec('--dur-mid') });
      zFloat = gsap.fromTo(zzz, { y: 4 }, { y: -6, duration: sec('--dur-bounce'), ease: soft, yoyo: true, repeat: -1 });
    }
    function wake() {
      if (state === 'awake') return;
      var wasAsleep = state === 'asleep';
      state = 'awake'; blinkSlow = 1;
      if (bufferCall) bufferCall.kill();
      if (spin) spin.kill();
      if (zFloat) zFloat.kill();
      gsap.to([wheel, zzz], { opacity: 0, duration: sec('--dur-fast') });
      bounce.timeScale(1); wigL.timeScale(1); wigR.timeScale(1);
      // startled: eyes wide, little jump
      gsap.killTweensOf(eyes);
      gsap.fromTo(eyes, { scaleY: 1.35, scaleX: 1.2 }, { scaleY: 1, scaleX: 1, duration: sec('--dur-slow'), ease: pop });
      gsap.fromTo(ping, { scale: 1.16, svgOrigin: '60 100' }, { scale: 1, duration: sec('--dur-slow'), ease: pop });
      say('Connected!');
      if (wasAsleep) document.dispatchEvent(new CustomEvent('uptime:ping-wake'));
    }
    var bubbleTimer;
    function say(text) {
      bubble.textContent = text; bubble.classList.add('is-on');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function () {
        bubble.classList.remove('is-on');
        setTimeout(function () { if (!bubble.classList.contains('is-on')) bubble.textContent = ''; }, sec('--dur-mid') * 1000);
      }, sec('--dur-bubble') * 1000);
    }
    function onInput() { if (state !== 'awake') wake(); resetIdle(); }
    ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(function (ev) {
      window.addEventListener(ev, onInput, { passive: true });
    });
    resetIdle();

    // for later phases and for tests
    window.uptimePing = {
      state: function () { return state; },
      wave: wave, sleep: function () { clearTimeout(idleTimer); buffer(); }, wake: wake, say: say,
      happy: function (on) { ping.classList.toggle('is-happy', on !== false); }
    };
  }
})();
