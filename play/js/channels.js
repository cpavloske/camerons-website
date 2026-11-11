/**
 * channels.js — one TV channel per section of the site (About, Writing,
 * Projects, Contact). Each channel shows the whole section, drawn straight
 * into the TV picture: a colored backdrop with drifting stripes, a big header,
 * the channel number, and the content from content.json laid out on pages.
 *
 * The page looks the same from the couch and zoomed in. When a section is
 * longer than one screen it's split into pages, flipped with the on-screen
 * ◀ PREV / NEXT ▶ buttons or the arrow keys. Links on the page ("READ THE
 * POST ▶", an email address, GitHub) are clickable: main.js turns a click on
 * the glass into game pixels and asks hitTest() what's there.
 */
import * as THREE from 'three';
import { formatDate, postUrl } from './content.js';
import { RENDER } from './config.js';

const LOOK = {
  writing:  { title: 'WRITING',  bg: ['#3a2a6a', '#1e1640'], accent: '#ffd84a' },
  projects: { title: 'PROJECTS', bg: ['#0f2a40', '#08141f'], accent: '#4ab8ff' },
  about:    { title: 'ABOUT',    bg: ['#1f4a3a', '#0e2620'], accent: '#7de0c0' },
  contact:  { title: 'CONTACT',  bg: ['#5a1f3a', '#2a0e1c'], accent: '#ff9ac8' },
};

// Layout of the 640x480 picture
const W = RENDER.width, H = RENDER.height;
const X = 36, MAXW = W - 72;
const TOP = 138, BOTTOM = 408;              // content area
const FONT = 'system-ui, "Segoe UI", sans-serif';
const STYLE = {
  small: { size: 14, weight: 700, lh: 22, color: 'rgba(255,255,255,0.7)' },
  big:   { size: 24, weight: 800, lh: 29, color: '#ffffff' },
  body:  { size: 18, weight: 500, lh: 25, color: '#e8ecf6' },
  note:  { size: 16, weight: 500, lh: 22, color: 'rgba(232,236,246,0.75)', italic: true },
  tags:  { size: 14, weight: 700, lh: 26, color: 'rgba(255,255,255,0.65)' },
  link:  { size: 17, weight: 800, lh: 30 },
  gap:   { lh: 16 },
};
const fontOf = (st) => `${st.italic ? 'italic ' : ''}${st.weight} ${st.size}px ${FONT}`;

// A scratch canvas for measuring text when laying out pages
const measure = document.createElement('canvas').getContext('2d');
function wrapLines(text, st, maxW = MAXW) {
  measure.font = fontOf(st);
  const out = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (measure.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
  }
  if (line) out.push(line);
  return out;
}

export function buildSectionChannel(content, id, num) {
  const look = LOOK[id];
  // An empty scene: the HUD paints the whole picture
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(look.bg[1]);
  const camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 10);

  // --- The section as a list of "rows": each one line of text, a gap, or a link
  const rows = [];
  const push = (type, text, extra = {}) => wrapLines(text, STYLE[type]).forEach((t) => rows.push({ type, text: t, h: STYLE[type].lh, ...extra }));
  const gap = () => rows.push({ type: 'gap', h: STYLE.gap.lh });
  const link = (label, href) => rows.push({ type: 'link', text: `${label} ▶`, href, h: STYLE.link.lh });

  if (id === 'writing') {
    for (const p of content.posts) {
      push('small', formatDate(p.date).toUpperCase());
      push('big', p.title);
      push('body', p.summary);
      link('READ THE POST', postUrl(p));
      gap();
    }
  } else if (id === 'projects') {
    for (const p of content.projects) {
      push('small', (p.kind || 'Project').toUpperCase());
      push('big', p.name);
      push('body', p.description);
      if (p.note) push('note', p.note);
      if (p.tags?.length) push('tags', p.tags.join('  ·  '));
      for (const l of p.links || []) link(l.label.toUpperCase(), l.url);
      gap();
    }
  } else if (id === 'about') {
    push('small', content.site.role.toUpperCase());
    push('big', content.about.greeting);
    content.about.paragraphs.forEach((t) => { push('body', t); gap(); });
    for (const f of content.about.facts) { push('small', f.label.toUpperCase()); push('body', f.text); gap(); }
  } else if (id === 'contact') {
    push('body', content.contact.blurb);
    gap();
    push('small', 'EMAIL');
    link(content.contact.email.toUpperCase(), `mailto:${content.contact.email}`);
    gap();
    push('small', 'ALSO ON');
    for (const l of content.contact.links) link(l.label.toUpperCase(), l.url);
  }
  while (rows.length && rows[rows.length - 1].type === 'gap') rows.pop();

  // --- Pack rows into screen-sized pages (never end a page on a label or title)
  const pages = [];
  let cur = [], y = 0;
  for (const r of rows) {
    if (r.type === 'gap' && !cur.length) continue;
    if (y + r.h > BOTTOM - TOP && cur.length) {
      const carry = [];
      while (cur.length && ['small', 'big'].includes(cur[cur.length - 1].type)) carry.unshift(cur.pop());
      pages.push(cur);
      cur = carry; y = carry.reduce((a, c) => a + c.h, 0);
    }
    cur.push(r); y += r.h;
  }
  if (cur.length) pages.push(cur);
  if (!pages.length) pages.push([]);

  let page = 0;
  let hits = [];        // clickable areas on the current page: { x, y, w, h, action }
  const BTN = { prev: { x: X, y: H - 62, w: 116, h: 36 }, next: { x: W - X - 116, y: H - 62, w: 116, h: 36 } };

  return {
    scene, camera, id, num,
    get page() { return page; },
    get pageCount() { return pages.length; },
    reset() { page = 0; },
    /** Flip by +1 / -1. Returns true if the page changed. */
    flip(dir) {
      const next = Math.max(0, Math.min(pages.length - 1, page + dir));
      if (next === page) return false;
      page = next;
      return true;
    },
    /** What's at this point of the picture (game pixels)? { type: 'prev' | 'next' | 'link', href } or null */
    hitTest(px, py) {
      for (const hb of hits) if (px >= hb.x && px <= hb.x + hb.w && py >= hb.y && py <= hb.y + hb.h) return hb.action;
      return null;
    },
    /** The current page as plain HTML nodes, for the hidden screen-reader copy. */
    srNodes() {
      const out = [Object.assign(document.createElement('h2'), { textContent: `${look.title} — page ${page + 1} of ${pages.length}` })];
      let para = null;
      for (const r of pages[page]) {
        if (r.type === 'link') {
          const a = Object.assign(document.createElement('a'), { href: r.href, textContent: r.text.replace(' ▶', '') });
          out.push(Object.assign(document.createElement('p'), {})); out[out.length - 1].append(a); para = null;
        } else if (r.type === 'gap') para = null;
        else {
          if (!para) { para = document.createElement('p'); out.push(para); }
          para.append(`${r.text} `);
        }
      }
      return out;
    },
    update() {},
    drawHud(hud, t) {
      const drift = Math.floor(t * 20);
      hud.draw(`sec:${id}:${drift}:${page}`, (g, w, h) => {
        // Backdrop + drifting diagonal stripes
        const grad = g.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, look.bg[0]); grad.addColorStop(1, look.bg[1]);
        g.fillStyle = grad; g.fillRect(0, 0, w, h);
        g.save();
        g.globalAlpha = 0.08; g.fillStyle = '#ffffff';
        const off = (drift * 1.5) % 80;
        for (let x = -h; x < w + h; x += 80) {
          g.beginPath();
          g.moveTo(x + off, 0); g.lineTo(x + off + 36, 0); g.lineTo(x + off + 36 - h, h); g.lineTo(x + off - h, h);
          g.fill();
        }
        g.restore();

        // Header
        hud.osd(num);
        hud.text(look.title, X, 74, { size: 54, color: look.accent, align: 'left' });
        g.fillStyle = look.accent; g.fillRect(X, 108, 120, 5);

        // This page's rows
        hits = [];
        let y = TOP;
        g.textAlign = 'left'; g.textBaseline = 'middle';
        for (const r of pages[page]) {
          const st = STYLE[r.type];
          const cy = y + r.h / 2;
          if (r.type === 'link') {
            g.font = fontOf(st);
            const tw = g.measureText(r.text).width;
            g.fillStyle = 'rgba(0,0,0,0.3)';
            g.beginPath(); g.roundRect(X - 8, cy - 14, tw + 16, 28, 8); g.fill();
            g.fillStyle = look.accent; g.fillText(r.text, X, cy + 1);
            hits.push({ x: X - 8, y: cy - 14, w: tw + 16, h: 28, action: { type: 'link', href: r.href } });
          } else if (r.type !== 'gap') {
            g.font = fontOf(st);
            g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillText(r.text, X + 1, cy + 2);   // soft drop shadow
            g.fillStyle = st.color; g.fillText(r.text, X, cy);
          }
          y += r.h;
        }

        // Page controls, only when there's more than one page
        if (pages.length > 1) {
          const button = (b, label, enabled, action) => {
            g.globalAlpha = enabled ? 1 : 0.3;
            g.strokeStyle = look.accent; g.lineWidth = 2;
            g.fillStyle = 'rgba(0,0,0,0.3)';
            g.beginPath(); g.roundRect(b.x, b.y, b.w, b.h, 8); g.fill(); g.stroke();
            g.font = `800 16px ${FONT}`; g.textAlign = 'center'; g.fillStyle = look.accent;
            g.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1);
            g.globalAlpha = 1;
            if (enabled) hits.push({ ...b, action: { type: action } });
          };
          button(BTN.prev, '◀ PREV', page > 0, 'prev');
          button(BTN.next, 'NEXT ▶', page < pages.length - 1, 'next');
          g.font = `800 16px ui-monospace, Consolas, monospace`; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.8)';
          g.fillText(`${page + 1} / ${pages.length}`, w / 2, BTN.prev.y + BTN.prev.h / 2 + 1);
        }
      });
    },
  };
}
