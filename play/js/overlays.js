/**
 * overlays.js — HTML panels drawn over the game: the reading overlay,
 * project and contact cards, the pause menu, and small toasts.
 *
 * Content is always inserted with textContent / real links (never innerHTML
 * from content.json), so anything in the JSON is safe to show.
 * While any panel is open the game is paused (Game listens to onOpen/onClose).
 */
import { postUrl, formatDate, progress } from './content.js';

/** Tiny DOM helper: h('a', { href: '/x', class: 'btn' }, 'Text', child...) */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

export class UI {
  /**
   * @param {HTMLElement} root  container for panels (covers the viewport)
   * @param {HTMLElement} toastRoot  where toasts appear (inside the game frame)
   * @param {object} content  parsed content.json
   * @param {object} hooks  { onOpen(kind), onClose(kind), onToggle(key, value), canExit(), onExit() }
   */
  constructor(root, toastRoot, content, hooks) {
    this.root = root;
    this.toastRoot = toastRoot;
    this.content = content;
    this.hooks = hooks;
    this.kind = null;
    this._returnFocus = null;
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); } // don't let the game reopen pause
      if (e.key === 'Tab') this._trapFocus(e);
    });
  }

  get isOpen() { return this.kind !== null; }

  _open(kind, panel) {
    if (this.isOpen) this.close(true);
    this.kind = kind;
    this._returnFocus = document.activeElement;
    this.root.replaceChildren(h('div', { class: 'ov-backdrop', onclick: () => this.close() }), panel);
    this.root.hidden = false;
    requestAnimationFrame(() => this.root.classList.add('open'));
    this.hooks.onOpen?.(kind);
    (panel.querySelector('[data-autofocus]') || panel.querySelector('a, button'))?.focus({ preventScroll: true });
  }

  close(silent = false) {
    if (!this.isOpen) return;
    const kind = this.kind;
    this.kind = null;
    this.root.classList.remove('open');
    this.root.hidden = true;
    this.root.replaceChildren();
    this._returnFocus?.focus?.({ preventScroll: true });
    if (!silent) this.hooks.onClose?.(kind);
  }

  _panel(label, kicker, title, ...body) {
    return h('section', { class: 'ov-panel', role: 'dialog', 'aria-modal': 'true', 'aria-label': label },
      h('button', { class: 'ov-close', type: 'button', 'aria-label': 'Close', onclick: () => this.close() }, '×'),
      kicker && h('p', { class: 'ov-kicker' }, kicker),
      title && h('h2', { class: 'ov-title' }, title),
      ...body,
      h('p', { class: 'ov-hint' }, 'Esc, B, or tap outside to keep playing'));
  }

  _trapFocus(e) {
    const f = [...this.root.querySelectorAll('a[href], button, input')].filter((el) => !el.disabled);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // --- Panels ------------------------------------------------------------------
  openPost(post) {
    this._open('post', this._panel(post.title, `Writing · ${formatDate(post.date)}`, post.title,
      h('p', { class: 'ov-body' }, post.summary),
      h('div', { class: 'ov-actions' },
        h('a', { class: 'ov-btn', href: postUrl(post), 'data-autofocus': true }, 'Read the full post'))));
  }

  openProject(p) {
    this._open('project', this._panel(p.name, p.kind || 'Project', p.name,
      h('p', { class: 'ov-body' }, p.description),
      p.note && h('p', { class: 'ov-note' }, p.note),
      p.tags?.length > 0 && h('ul', { class: 'ov-tags', 'aria-label': 'Built with' }, p.tags.map((t) => h('li', {}, t))),
      p.links?.length > 0 && h('div', { class: 'ov-actions' },
        p.links.map((l, i) => h('a', { class: 'ov-btn', href: l.url, rel: 'noopener', target: '_blank', 'data-autofocus': i === 0 || null }, l.label)))));
  }

  /** Every post: title, date, summary, and a link to the full article. */
  openWriting() {
    const posts = this.content.posts;
    this._open('writing', this._panel('Writing', 'Writing', 'Recent posts',
      h('ul', { class: 'ov-list' }, posts.map((p, i) => h('li', {},
        h('p', { class: 'ov-date' }, formatDate(p.date)),
        h('h3', {}, h('a', { href: postUrl(p), 'data-autofocus': i === 0 || null }, p.title)),
        h('p', {}, p.summary),
        h('a', { class: 'ov-more', href: postUrl(p) }, 'Read the full post →'))))));
  }

  /** Every project as a card. */
  openProjects() {
    const projects = this.content.projects;
    this._open('projects', this._panel('Projects', 'Projects', "Things I've built",
      h('ul', { class: 'ov-list' }, projects.map((p) => h('li', {},
        h('p', { class: 'ov-date' }, p.kind || 'Project'),
        h('h3', {}, p.name),
        h('p', {}, p.description),
        p.note && h('p', { class: 'ov-note' }, p.note),
        p.tags?.length > 0 && h('ul', { class: 'ov-tags', 'aria-label': 'Built with' }, p.tags.map((t) => h('li', {}, t))),
        p.links?.length > 0 && h('div', { class: 'ov-actions' },
          p.links.map((l) => h('a', { class: 'ov-btn', href: l.url, rel: 'noopener', target: '_blank' }, l.label))))))));
  }

  openAbout() {
    const a = this.content.about;
    this._open('about', this._panel('About', 'About', a.greeting,
      ...a.paragraphs.map((t) => h('p', { class: 'ov-body' }, t)),
      h('dl', { class: 'ov-facts' }, a.facts.flatMap((f) => [h('dt', {}, f.label), h('dd', {}, f.text)]))));
  }

  openContact() {
    const c = this.content.contact;
    const copyBtn = h('button', { class: 'ov-btn ghost', type: 'button', onclick: async () => {
      try { await navigator.clipboard.writeText(c.email); copyBtn.textContent = 'Copied!'; }
      catch { copyBtn.textContent = c.email; }
    } }, 'Copy email');
    this._open('contact', this._panel('Contact', 'You’ve got mail', 'Say hello',
      h('p', { class: 'ov-body' }, c.blurb),
      h('p', { class: 'ov-email' }, h('a', { href: `mailto:${c.email}`, 'data-autofocus': true }, c.email)),
      h('div', { class: 'ov-actions' },
        copyBtn,
        c.links.map((l) => h('a', { class: 'ov-btn', href: l.url, rel: 'noopener', target: '_blank' }, l.label)))));
  }

  openPause() {
    const { posts, projects, contact } = this.content;
    const toggle = (key, label) => {
      const btn = h('button', { class: 'pm-toggle', type: 'button', 'aria-pressed': String(!!progress.get(key)) }, `${label}: ${progress.get(key) ? 'On' : 'Off'}`);
      btn.addEventListener('click', () => {
        const v = !progress.get(key);
        progress.set(key, v);
        btn.setAttribute('aria-pressed', String(v));
        btn.textContent = `${label}: ${v ? 'On' : 'Off'}`;
        this.hooks.onToggle?.(key, v);
      });
      return btn;
    };
    const panel = h('section', { class: 'ov-panel pause', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Paused' },
      h('h2', { class: 'ov-title' }, 'Paused'),
      h('div', { class: 'pm-row' },
        h('button', { class: 'ov-btn', type: 'button', 'data-autofocus': true, onclick: () => this.close() }, 'Resume'),
        toggle('sound', 'Sound'),
        toggle('crt', 'CRT effect'),
        this.hooks.canExit?.() && h('button', { class: 'ov-btn ghost', type: 'button', onclick: () => { this.close(true); this.hooks.onExit?.(); } }, 'Exit game')),
      h('nav', { class: 'pm-links', 'aria-label': 'Every section' },
        h('h3', {}, 'About'),
        h('ul', {}, h('li', {}, h('a', { href: '#about', onclick: (e) => { e.preventDefault(); this.hooks.onSection ? this.hooks.onSection('about') : this.openAbout(); } }, 'About Cameron'))),
        h('h3', {}, 'Writing'),
        h('ul', {}, posts.map((p) => h('li', {}, h('a', { href: postUrl(p) }, p.title)))),
        h('h3', {}, 'Projects'),
        h('ul', {}, projects.map((p) => h('li', {}, p.links?.[0] ? h('a', { href: p.links[0].url, rel: 'noopener', target: '_blank' }, p.name) : h('span', {}, p.name)))),
        h('h3', {}, 'Contact'),
        h('ul', {},
          h('li', {}, h('a', { href: `mailto:${contact.email}` }, contact.email)),
          contact.links.map((l) => h('li', {}, h('a', { href: l.url, rel: 'noopener', target: '_blank' }, l.label))))));
    this._open('pause', panel);
  }

  /** A short message at the top of the game frame. */
  toast(text, ms = 2600) {
    const t = h('div', { class: 'toast', role: 'status' }, text);
    this.toastRoot.append(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, ms);
  }
}
