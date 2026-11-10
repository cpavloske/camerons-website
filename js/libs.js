/* ==========================================================
   libs.js: pinned CDN libraries, loaded lazily on demand.
   Every third party script on the site comes through here so
   the exact versions live in one place (DESIGN.md section 12, 16).

     await uptimeLibs.load('gsap', 'ScrollTrigger');
     await uptimeLibs.load('matter');

   Never change a URL to an unpinned or "latest" version.
   ========================================================== */
(function () {
  var CDN = 'https://cdn.jsdelivr.net/npm/';
  var LIBS = {
    gsap:          CDN + 'gsap@3.15.0/dist/gsap.min.js',
    ScrollTrigger: CDN + 'gsap@3.15.0/dist/ScrollTrigger.min.js',
    DrawSVGPlugin: CDN + 'gsap@3.15.0/dist/DrawSVGPlugin.min.js',
    Flip:          CDN + 'gsap@3.15.0/dist/Flip.min.js',
    lenis:         CDN + 'lenis@1.3.27/dist/lenis.min.js',
    matter:        CDN + 'matter-js@0.20.0/build/matter.min.js'
  };
  // Plugins that need gsap first
  var NEEDS_GSAP = { ScrollTrigger: 1, DrawSVGPlugin: 1, Flip: 1 };
  var cache = {};

  function loadOne(name) {
    if (!LIBS[name]) return Promise.reject(new Error('Unknown library: ' + name));
    if (cache[name]) return cache[name];
    var before = NEEDS_GSAP[name] ? loadOne('gsap') : Promise.resolve();
    cache[name] = before.then(function () {
      return new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = LIBS[name];
        s.async = true;
        s.crossOrigin = 'anonymous';
        s.onload = function () { resolve(name); };
        s.onerror = function () { delete cache[name]; reject(new Error('Failed to load ' + name)); };
        document.head.appendChild(s);
      });
    });
    return cache[name];
  }

  window.uptimeLibs = {
    urls: LIBS,
    load: function () {
      return Promise.all([].slice.call(arguments).map(loadOne));
    }
  };
})();
