/**
 * plain.js — keeps the plain page (the real-text fallback in index.html) in
 * sync with content.json. The HTML ships with a snapshot so it works with
 * JavaScript off; when JavaScript is on, this refreshes it so a new post in
 * content.json shows up without touching index.html.
 *
 * It has no 3D dependencies, so it still runs when WebGL or the 3D library
 * is unavailable — which is exactly when the plain page is shown.
 */
import { loadContent, formatDate, postUrl } from './content.js';

const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...kids.flat().filter((k) => k !== null && k !== undefined && k !== false));
  return n;
};
const fill = (name, ...kids) => document.querySelector(`[data-fill="${name}"]`)?.replaceChildren(...kids.flat());

try {
  const c = await loadContent();

  fill('about',
    c.about.paragraphs.map((t) => el('p', {}, t)),
    el('dl', { class: 'ov-facts' }, c.about.facts.flatMap((f) => [el('dt', {}, f.label), el('dd', {}, f.text)])));

  fill('writing', c.posts.map((p) => el('li', {},
    el('p', { class: 'ov-date' }, formatDate(p.date)),
    el('h3', {}, el('a', { href: postUrl(p) }, p.title)),
    el('p', {}, p.summary))));

  fill('projects', c.projects.map((p) => el('li', {},
    el('p', { class: 'ov-date' }, p.kind || 'Project'),
    el('h3', {}, p.name),
    el('p', {}, p.description),
    p.note && el('p', { class: 'ov-note' }, p.note),
    el('p', { class: 'plain-tags' }, (p.tags || []).join(' · '),
      (p.links || []).flatMap((l, i) => [i ? ' · ' : ' — ', el('a', { href: l.url, rel: 'noopener' }, l.label)])))));

  fill('contact',
    el('p', {}, c.contact.blurb),
    el('p', { class: 'ov-email' }, el('a', { href: `mailto:${c.contact.email}` }, c.contact.email)),
    el('p', { class: 'plain-tags' }, 'Also on ', c.contact.links.flatMap((l, i) => [i ? ' · ' : '', el('a', { href: l.url, rel: 'noopener' }, l.label)])));
} catch {
  // content.json didn't load — the snapshot already in the page stays as it is
}
