/**
 * content.js — loads play/content.json (the single source for posts,
 * projects, about text, and contact links) and the player's progress.
 */

let cache = null;

export async function loadContent() {
  if (cache) return cache;
  const res = await fetch(new URL('../content.json', import.meta.url));
  if (!res.ok) throw new Error(`content.json: ${res.status}`);
  cache = await res.json();
  // Newest posts first
  cache.posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return cache;
}

/**
 * Where "Read the full post" goes: the play-styled reader, which shows the
 * original /blog/[slug].html article in the play site's formatting.
 */
export function postUrl(post) {
  return `${new URL('../../post.html', import.meta.url).pathname}?slug=${encodeURIComponent(post.slug)}`;
}

/** "2026-04-05" -> "Apr 5, 2026" without timezone surprises. */
export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

// --- Progress (collected stars + settings), saved in localStorage -----------
const KEY = 'cp-play-v1';
const defaults = { stars: [], sound: true, crt: true };

function read() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...defaults }; }
}
let state = read();
function write() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode etc. — fine */ }
}

export const progress = {
  hasStar: (id) => state.stars.includes(id),
  addStar(id) { if (!state.stars.includes(id)) { state.stars.push(id); write(); } },
  get starCount() { return state.stars.length; },
  get(key) { return state[key]; },
  set(key, value) { state[key] = value; write(); },
};
