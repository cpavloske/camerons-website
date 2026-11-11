/**
 * post.js — the play-styled reader: /play/post.html?slug=why-i-work-at-neat
 *
 * The real posts live at /blog/[slug].html and are never modified. This page
 * fetches the original, pulls the article text out of it, keeps only safe,
 * simple formatting (paragraphs, headings, lists, quotes, links, images…),
 * and shows it on the same cream "paper" as the game's overlays.
 *
 * Title and date come from content.json, so only posts listed there can be
 * opened. New posts work automatically once they're added to content.json.
 */
import { loadContent, formatDate } from './content.js';

const paper = document.getElementById('post');
const more = document.getElementById('more');

// Tags we keep from the original article; everything else is unwrapped or dropped.
const KEEP = new Set(['P', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'STRONG', 'EM', 'B', 'I',
  'A', 'IMG', 'FIGURE', 'FIGCAPTION', 'CODE', 'PRE', 'HR', 'BR', 'SUP', 'SUB', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD']);
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'SVG', 'NOSCRIPT']);

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...kids);
  return n;
}

/** Only http(s), mailto, and same-site links survive. */
function safeUrl(raw, base) {
  try {
    const u = new URL(raw, base);
    return ['http:', 'https:', 'mailto:'].includes(u.protocol) ? u.href : null;
  } catch { return null; }
}

/** Rebuild a node tree using only allowed tags and attributes. */
function clean(node, base) {
  const out = document.createDocumentFragment();
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) { out.append(child.textContent); continue; }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const tag = child.tagName;
    if (DROP.has(tag)) continue;
    if (!KEEP.has(tag)) { out.append(clean(child, base)); continue; }   // unwrap unknown wrappers
    const n = document.createElement(tag.toLowerCase());
    if (tag === 'A') {
      const href = safeUrl(child.getAttribute('href') || '', base);
      if (href) n.setAttribute('href', href);
      if (href && new URL(href).origin !== location.origin) n.setAttribute('rel', 'noopener');
    }
    if (tag === 'IMG') {
      const src = safeUrl(child.getAttribute('src') || '', base);
      if (!src) continue;
      n.setAttribute('src', src);
      n.setAttribute('alt', child.getAttribute('alt') || '');
      n.setAttribute('loading', 'lazy');
    }
    if (child.classList.contains('disclaimer')) n.className = 'reader-note';
    n.append(clean(child, base));
    out.append(n);
  }
  return out;
}

async function main() {
  const content = await loadContent();
  const slug = new URLSearchParams(location.search).get('slug');
  const i = content.posts.findIndex((p) => p.slug === slug);
  if (i < 0) {
    paper.replaceChildren(
      el('p', { class: 'ov-kicker' }, 'Writing'),
      el('h1', { class: 'reader-title' }, 'Post not found'),
      el('p', {}, 'That post isn’t in the list. ', el('a', { href: './#writing' }, 'See all writing'), '.'));
    paper.removeAttribute('aria-busy');
    return;
  }
  const post = content.posts[i];
  const original = `/blog/${post.slug}.html`;
  document.title = `${post.title} — Cameron Pavloske`;
  const canon = el('link', { rel: 'canonical', href: new URL(original, location.href).href });
  document.head.append(canon);

  const head = [
    el('p', { class: 'ov-kicker' }, `Writing · ${formatDate(post.date)}`),
    el('h1', { class: 'reader-title' }, post.title),
  ];

  let body;
  try {
    const res = await fetch(original);
    if (!res.ok) throw new Error(res.status);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const article = doc.querySelector('article.post') || doc.querySelector('article') || doc.querySelector('main');
    if (!article) throw new Error('no article');
    // Drop the parts this page already shows (back link, label, title, date)
    article.querySelectorAll('.back, .post-label, h1, .post-meta').forEach((n) => n.remove());
    body = el('div', { class: 'reader-body' }, clean(article, new URL(original, location.href)));
  } catch {
    // If the original can't be loaded, show the summary and a link instead
    body = el('div', { class: 'reader-body' },
      el('p', {}, post.summary),
      el('p', {}, el('a', { href: original }, 'Read the full post on the original page')));
  }

  paper.replaceChildren(...head, body,
    el('p', { class: 'reader-original' }, el('a', { href: original }, 'View the original page')));
  paper.removeAttribute('aria-busy');

  // Previous / next post
  const newer = content.posts[i - 1], older = content.posts[i + 1];
  const link = (p, label) => el('a', { href: `post.html?slug=${encodeURIComponent(p.slug)}` }, el('span', {}, label), p.title);
  more.replaceChildren(...[newer && link(newer, 'Newer'), older && link(older, 'Older')].filter(Boolean));
}

main();
