// Reference screenshots (DESIGN.md section 16).
// Run:  node tests/shots.js            -> writes to design/reference/
//       node tests/shots.js some/dir   -> writes somewhere else (for work in progress)
// Needs the local server on port 8000 (npm test starts one, or: python3 -m http.server 8000).
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'design', 'reference'));
const BASE = 'http://localhost:8000';
const WIDTHS = [[375, 812], [768, 1024], [1440, 900]];
const FACES = ['front', 'about', 'writing', 'projects', 'contact'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const [w, h] of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.addInitScript(() => { try { sessionStorage.setItem('uptime-intro', '1'); } catch (e) {} });
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForFunction(() => window.uptimeScene && window.uptimeScene.ready, null, { timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, `scene-${w}.png`) });
    for (const f of FACES.slice(1)) {
      await page.evaluate((face) => window.uptimeScene.goTo(face), f);
      await page.waitForTimeout(4200);   // spin, then the NOW SHOWING card clears
      await page.screenshot({ path: path.join(OUT, `face-${f}-${w}.png`) });
    }
    await ctx.close();
  }
  // still scene and panel scroll (reduced motion)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'reduced-motion-1440.png'), fullPage: true });
  await ctx.close();
  await browser.close();
  console.log('Saved screenshots to ' + OUT);
})();
