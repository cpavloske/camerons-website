/* ==========================================================
   analytics.js: the only file that talks to Google Analytics.
   Google tag (gtag.js), measurement ID G-81Y5DN2PHQ.

   Include on every page as:
     <script src="/js/analytics.js" data-ga-id="G-81Y5DN2PHQ" defer></script>

   - Loads gtag.js async so it never blocks the scene.
   - Skips all tracking on localhost and local network IPs.
   - Other code reports scene interactions with
       window.uptimeTrack('box_face_view', { face: 'about' })
     never with gtag() directly. Allowed events are listed in
     DESIGN.md section 16.
   ========================================================== */
(function () {
  var script = document.currentScript;
  var GA_ID = (script && script.getAttribute('data-ga-id')) || 'G-81Y5DN2PHQ';

  var EVENTS = {
    box_face_view: 1, bowl_open: 1, post_scoop: 1, game_complete: 1,
    box_top_earned: 1, plain_view_toggle: 1, tv_channel_change: 1, contact_click: 1
  };

  function isLocal(host) {
    if (!host) return true; // file:// previews
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1') return true;
    if (/\.local(host)?$/.test(host) || /\.test$/.test(host)) return true;
    // Private IPv4 ranges: 10/8, 172.16/12, 192.168/16, 169.254/16
    var m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (m) {
      var a = +m[1], b = +m[2];
      if (a === 10 || a === 127) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 169 && b === 254) return true;
    }
    return false;
  }

  var local = isLocal(location.hostname);
  window.uptimeAnalytics = { id: GA_ID, enabled: !local, sent: [] };

  if (local) {
    // Local preview: record what would have been sent, send nothing.
    window.uptimeTrack = function (name, params) {
      if (!EVENTS[name]) return;
      window.uptimeAnalytics.sent.push({ name: name, params: params || {}, skipped: true });
    };
    return;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA_ID);

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  document.head.appendChild(tag);

  window.uptimeTrack = function (name, params) {
    if (!EVENTS[name]) return;
    window.uptimeAnalytics.sent.push({ name: name, params: params || {} });
    gtag('event', name, params || {});
  };
})();
