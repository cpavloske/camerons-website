/* ==========================================================
   prefs.js: plain view preference (DESIGN.md section 10).
   The choice is remembered for the session only.
   Any link with data-plain="on" or data-plain="off" sets it.
   The plain page itself (body[data-plain-page]) turns it on.
   ========================================================== */
(function () {
  var KEY = 'uptime-plain';
  function get() { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } }
  function set(state) {
    var prev = get();
    try { sessionStorage.setItem(KEY, state); } catch (e) {}
    if (prev !== state && window.uptimeTrack) window.uptimeTrack('plain_view_toggle', { state: state });
  }

  window.uptimePlain = { get: get, set: set };

  if (document.body && document.body.hasAttribute('data-plain-page')) set('on');

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-plain]');
    if (a) set(a.getAttribute('data-plain'));
  });
})();
