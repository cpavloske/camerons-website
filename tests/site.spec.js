// Uptime O's site checks (DESIGN.md section 16). Run with: npm test
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GA_ID = 'G-81Y5DN2PHQ';

// Every page a visitor can land on. Add new pages here.
const PAGES = [
  '/',
  '/ingredients.html',
  '/blog/cameras-on-your-network.html',
  '/blog/why-i-work-at-neat.html',
  '/404.html',
];

// Files that must stay exactly where they are.
const PRESERVED = [
  '/CNAME',
  '/google830d2e2b89d4ea3b.html',
  '/robots.txt',
  '/sitemap.xml',
  '/site.webmanifest',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.png',
  '/blog/og-cameras-on-your-network.png',
  '/blog/og-why-i-work-at-neat.png',
];

const ORIGINAL_SITEMAP_URLS = [
  'https://cameronpavloske.com/',
  'https://cameronpavloske.com/blog/cameras-on-your-network.html',
  'https://cameronpavloske.com/blog/why-i-work-at-neat.html',
];

// Real content only. These strings must appear in plain view.
const CONTENT = {
  posts: [
    'IT Leaders, Cameras Are on Your Network. Why Aren\'t They on Your Roadmap?',
    'Apr 5, 2026',
    'The most underleveraged sensor network in your organization is already installed.',
    'Why I Work at Neat',
    'Feb 28, 2026',
    'The story of how a question asked in a conference room in 2017 ultimately led me to Neat.',
  ],
  projects: ['Neat Pulse MCP Server', 'Neat Pad Clock'],
  bio: [
    'I\'m an engineer and proud Aggie',
    'Today, I help organizations carry those same systems forward.',
  ],
  contact: ['cpavloske@gmail.com'],
  links: [
    'https://www.linkedin.com/in/cameron-pavloske/',
    'https://github.com/cpavloske',
    'https://github.com/cpavloske/neat-pad-clock',
    '/blog/cameras-on-your-network.html',
    '/blog/why-i-work-at-neat.html',
  ],
};

const WIDTHS = [375, 768, 1440];
const TRACKERS = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com/;

function isLocalUrl(u) {
  return !u || u.startsWith('http://localhost') || u.startsWith('http://127.0.0.1');
}

// Collect console errors and page errors from our own origin.
function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const loc = msg.location().url;
    // Offline runs can fail to fetch Google Fonts; that is not our bug.
    if (!isLocalUrl(loc) && /Failed to load resource/.test(msg.text())) return;
    errors.push('console: ' + msg.text() + ' @ ' + loc);
  });
  return errors;
}

// Each test gets a fresh browser context, so plain view always starts off.

test.describe('pages and files', () => {
  for (const url of PAGES) {
    test(`loads ${url} with no console errors`, async ({ page }) => {
      const errors = watchErrors(page);
      const res = await page.goto(url, { waitUntil: 'load' });
      expect(res.status(), url).toBe(200);
      await page.waitForTimeout(400);
      expect(errors, errors.join('\n')).toEqual([]);
    });
  }

  for (const file of PRESERVED) {
    test(`preserved file ${file}`, async ({ request }) => {
      const res = await request.get(file);
      expect(res.status(), file).toBe(200);
    });
  }

  test('CNAME still points at the custom domain', async () => {
    expect(fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim()).toBe('cameronpavloske.com');
  });

  test('sitemap keeps every original URL and every URL loads', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const u of ORIGINAL_SITEMAP_URLS) expect(urls).toContain(u);
    for (const u of urls) {
      const local = u.replace('https://cameronpavloske.com', '');
      const res = await request.get(local || '/');
      expect(res.status(), u).toBe(200);
    }
  });
});

test.describe('analytics', () => {
  for (const url of PAGES) {
    test(`GA tag present on ${url} and silent on localhost`, async ({ page, request }) => {
      const html = await (await request.get(url)).text();
      expect(html).toContain(GA_ID);
      expect(html).toContain('/js/analytics.js');

      const hits = [];
      page.on('request', (r) => { if (TRACKERS.test(r.url())) hits.push(r.url()); });
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(300);
      expect(hits, 'tracking requests on localhost').toEqual([]);
      const enabled = await page.evaluate(() => window.uptimeAnalytics && window.uptimeAnalytics.enabled);
      expect(enabled).toBe(false);
    });
  }

  test('only analytics.js calls gtag', async () => {
    const offenders = listFiles(ROOT, /\.(html|js)$/)
      .filter((f) => !f.endsWith(path.join('js', 'analytics.js')))
      .filter((f) => /\bgtag\s*\(/.test(fs.readFileSync(f, 'utf8')));
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
  });
});

test.describe('plain view', () => {
  test('shows all existing content', async ({ page }) => {
    await page.goto('/ingredients.html');
    const text = await page.locator('main').innerText();
    for (const s of [...CONTENT.posts, ...CONTENT.projects, ...CONTENT.bio, ...CONTENT.contact]) {
      expect(text, s).toContain(s);
    }
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const l of CONTENT.links) expect(hrefs, l).toContain(l);
  });

  test('has no scripts beyond analytics and prefs', async ({ page }) => {
    await page.goto('/ingredients.html');
    const srcs = await page.$$eval('script[src]', (s) => s.map((x) => x.getAttribute('src')));
    expect(srcs.sort()).toEqual(['/js/analytics.js', '/js/prefs.js']);
  });

  test('preference is remembered for the session', async ({ page }) => {
    await page.goto('/ingredients.html');
    await page.goto('/');
    await expect(page).toHaveURL(/ingredients\.html$/);
    await page.getByRole('link', { name: /back to the box/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#front')).toBeVisible();
  });

  test('homepage links to plain view', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /just the ingredients/i })).toHaveAttribute('href', '/ingredients.html');
  });
});

test.describe('homepage content', () => {
  test('every post and project is reachable from the homepage', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const l of CONTENT.links) expect(hrefs, l).toContain(l);
    const text = await page.locator('body').innerText();
    for (const s of CONTENT.projects) expect(text).toContain(s);
  });

  test('all section anchors exist', async ({ page }) => {
    await page.goto('/');
    for (const id of ['front', 'about', 'writing', 'projects', 'contact', 'bowl']) {
      await expect(page.locator('#' + id)).toHaveCount(1);
    }
  });

  test('out of scope items are not built', async ({ page }) => {
    await page.goto('/');
    const text = (await page.locator('body').innerText()).toLowerCase();
    expect(text).not.toContain('free prize inside');
  });
});

test.describe('reduced motion', () => {
  for (const url of PAGES) {
    test(`no running animation on ${url}`, async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(600);
      const running = await page.evaluate(() =>
        document.getAnimations().filter((a) => a.playState === 'running').map((a) => a.animationName || a.constructor.name)
      );
      expect(running, url).toEqual([]);
      // Scene code reports its own motion state once it exists (Phase 2 onward).
      const motion = await page.evaluate(() => (window.uptimeScene ? window.uptimeScene.motion : false));
      expect(motion, 'scene motion flag').toBe(false);
      await context.close();
    });
  }
});

test.describe('responsive', () => {
  for (const width of WIDTHS) {
    for (const url of PAGES) {
      test(`no horizontal scroll at ${width}px on ${url}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(url, { waitUntil: 'load' });
        await page.waitForTimeout(200);
        const { sw, cw } = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth,
        }));
        expect(sw, `${url} at ${width}px`).toBeLessThanOrEqual(cw);
      });
    }
  }
});

test.describe('copy rules', () => {
  for (const url of PAGES) {
    test(`no em dashes on ${url}`, async ({ page }) => {
      await page.goto(url);
      const text = await page.locator('body').innerText();
      const title = await page.title();
      expect(text.includes('—'), 'em dash in body').toBe(false);
      expect(title.includes('—'), 'em dash in title').toBe(false);
    });
  }
});

test.describe('libraries', () => {
  test('every CDN script URL is pinned to an exact version', async () => {
    const files = listFiles(ROOT, /\.(html|js|css)$/);
    const bad = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/https:\/\/(?:cdn\.jsdelivr\.net\/npm|unpkg\.com|cdnjs\.cloudflare\.com\/ajax\/libs)\/[^\s'"`)]+/g)) {
        const u = m[0];
        const pinned = /@\d+\.\d+\.\d+\//.test(u) || /\/libs\/[^/]+\/\d+\.\d+\.\d+\//.test(u);
        if (!pinned) bad.push(path.relative(ROOT, f) + ': ' + u);
      }
    }
    expect(bad).toEqual([]);
  });
});

function listFiles(dir, re, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (['node_modules', '.git', 'test-results', 'playwright-report', 'tests', '.claude'].includes(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) listFiles(p, re, out);
    else if (re.test(name)) out.push(p);
  }
  return out;
}
