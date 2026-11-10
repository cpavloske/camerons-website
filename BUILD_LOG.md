# Uptime O's Build Log

Source of truth: `DESIGN.md`. Runbook: `RUNBOOK.md`. Every session reads both, plus this log, before writing code.

## Status at a glance

| Phase | Model | State | Tag |
|---|---|---|---|
| 1. Audit and foundation | Opus 5.5 | in progress | |
| 2. Scene and box | Fable | not started | |
| 3. Back panel games | Opus | not started | |
| 4a. The bowl | Fable | not started | |
| 4b. Milk and O's | Fable | not started | |
| 4c. The TV | Fable | not started | |
| 5. Critique (Fable) + hardening (Opus) | Fable, Opus | not started | |

**Next step:** see the newest entry at the bottom of this file.

---

## How to run things

- Preview: `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000`.
- Tests (filled in once the test script lands in Phase 1).

---

## Phase 1 audit (2026-11-09, Opus 5.5)

### What exists today (main and redesign at 90f476d)
- `index.html`: maroon and blush editorial one pager. Sections: hero, statement, about (head cutout), writing (2 posts), projects (2 cards), contact, footer. JSON-LD Person + WebSite. Loader, pinned sections, fullscreen menu (`js/main.js`, `css/style.css`).
- `blog/cameras-on-your-network.html` and `blog/why-i-work-at-neat.html`: articles using `css/style.css` and `js/main.js`, BlogPosting JSON-LD, per post og images in `/blog/`.
- `blog/_template.html`: post template with POST_* placeholders.
- `404.html`: "No signal" page, root relative paths.
- `og-image.html` (noindex template used to render `og-image.png`), `og-image.png`.
- Preserved files: `CNAME` (cameronpavloske.com), `google830d2e2b89d4ea3b.html`, `robots.txt`, `sitemap.xml` (3 URLs), `site.webmanifest`, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-image.png`, `blog/og-cameras-on-your-network.png`, `blog/og-why-i-work-at-neat.png`.
- Images: `img/cameron.jpg` (used in JSON-LD), `img/cameron-cutout.png` (old about section).
- No CDN JS libraries in use today. Google Fonts: Inter Tight.

### Google Analytics (recorded per section 16)
- Measurement ID: **`G-81Y5DN2PHQ`**
- Current tag, identical on index, both posts, template, and 404:
  ```html
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-81Y5DN2PHQ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-81Y5DN2PHQ');
  </script>
  ```
- Not on `og-image.html` (render template, noindex) or the verification file. That stays as is.

### Real content inventory (the only content the site may use)
- Posts:
  1. "IT Leaders, Cameras Are on Your Network. Why Aren't They on Your Roadmap?" / Apr 5, 2026 (`2026-04-05`) / "The most underleveraged sensor network in your organization is already installed. The IT leaders who move first will build an advantage that compounds over time." / `/blog/cameras-on-your-network.html`
  2. "Why I Work at Neat" / Feb 28, 2026 (`2026-02-28`) / "The story of how a question asked in a conference room in 2017 ultimately led me to Neat." / `/blog/why-i-work-at-neat.html`
- Projects:
  1. Neat Pulse MCP Server (AI tooling; TypeScript, MCP, Node.js, REST API; private, no link)
  2. Neat Pad Clock (Side project; HTML, Open-Meteo API, GitHub Pages; github.com/cpavloske/neat-pad-clock)
- Bio: two About paragraphs plus the three facts (Expertise, Currently, Off the clock), LinkedIn link.
- Contact: cpavloske@gmail.com, linkedin.com/in/cameron-pavloske, github.com/cpavloske, plus the contact blurb.

### Gaps against DESIGN.md
| # | DESIGN.md requirement | Today | Phase that closes it |
|---|---|---|---|
| 1 | Sec 2 brand tokens in one `tokens.css` | Colors hard coded in `style.css` | 1 |
| 2 | Sec 10 plain view `JUST THE INGREDIENTS`, session remembered | None | 1 |
| 3 | Sec 16 static fallback of the scene built before any 3D | None | 1 |
| 4 | Sec 16 Playwright test script | None | 1 |
| 5 | Sec 16 single `analytics.js`, no tracking on localhost / LAN, custom events | Inline tag fires everywhere, including localhost | 1 (loader), events wired in the phase that builds each interaction |
| 6 | Sec 12 pinned CDN libs (GSAP, Lenis, Matter.js) | None used | 1 (pins recorded in `js/libs.js`) |
| 7 | Sec 4 desk, bowl, TV scene with depth of field, opening sequence | None | 2 |
| 8 | Sec 5 3D box: front, sides, flap nav, bottom barcode with full copy | None | 2 (static copy lands in 1) |
| 9 | Sec 3 Ping mascot with idle, hover, sleep | None | 2 |
| 10 | Sec 5 back panel games, Sec 8 Box Tops, mail in panel | None | 3 |
| 11 | Sec 7 bowl zoom, O's as posts, title flags | None | 4a |
| 12 | Sec 7 physics, ripples, scoop transition, article header + spoon progress bar | Articles use old maroon style | 4b |
| 13 | `blog/_template.html` in new article style | Old style | 4b (with the article header) |
| 14 | Sec 4 and 6 TV loops, channel changes, NOW SHOWING, commercials, barcode receipt, Sec 9 shelf, Sec 11 sound | None | 4c |
| 15 | `404.html` restyle: Ping looking for a missing cable | Old "No signal" page | 5 (needs Ping from Phase 2) |
| 16 | Sec 14 a11y, WCAG AA, Lighthouse 90+ | Partial | 5 |
| 17 | Sec 13 mobile: sticky bottom tab bar, swipe, 375/768/1440 | n/a | 1 (bar in fallback), 2 (swipe) |
| 18 | No em dashes in site copy | Em dash in homepage meta description and in post `<title>` / `og:title` suffix " — Cameron Pavloske" | 1 (new pages), 4b (post heads, when articles are restyled) |
| 19 | `JUST THE INGREDIENTS` link at the top of every page | None | 1 (home, plain view), 4b (articles), 5 (404) |
| 20 | Section 16: add new pages to `sitemap.xml` | n/a | 1 (`/ingredients.html`) |

### Out of scope (section 15), do not build
Prize inside, `FREE PRIZE INSIDE!` ribbon, shake mechanic. Leave a clean empty spot on the front face for the ribbon.

---

## Entries

### 2026-11-09 · Opus 5.5 · Phase 1.1 tokens, analytics, pinned libs
- **Built:** `css/tokens.css` (brand palette from section 2, supporting scene palette, fonts, type scale, spacing, shadows, easing, durations, layout). `js/analytics.js` (only file that touches gtag). `js/libs.js` (lazy loader holding every pinned CDN URL).
- **Decisions:**
  - Fonts: Titan One (logo, chunky rounded), Archivo variable (condensed panel caps at `font-stretch: 72%`, nutrition label grotesque at normal width, fine print at 80%), Source Serif 4 (articles and body). All Google Fonts. Google Fonts has no version pinning; it is a stylesheet, not a library, so this is accepted.
  - GA: the tag now loads from `js/analytics.js`, included as `<script src="/js/analytics.js" data-ga-id="G-81Y5DN2PHQ" defer>`. The ID appears literally in every page and in the script. It skips localhost, `*.local`, `*.test`, and private IPs (10/8, 127/8, 172.16/12, 192.168/16, 169.254/16), so phone previews over Wi-Fi do not count either. Scene code calls `window.uptimeTrack(name, params)`; only the 8 events in section 16 are allowed. Old pages (posts, 404, template) still carry the original inline tag until they are restyled; it is byte identical to before.
  - Pinned libs (jsDelivr, all checked 200): gsap 3.15.0 (+ ScrollTrigger, DrawSVGPlugin, Flip), lenis 1.3.27, matter-js 0.20.0. Picked versions at least 2 weeks old; gsap 3.15.1 came out Nov 4 so it was skipped.
- **Tokens added beyond section 2:** wood, wall, ceramic, TV, steel, and O colors for the scene props; alpha helpers built from the brand colors. Reason: the static scene needs them and section 16 requires them to live in tokens.css.
- **Tests:** test script not written yet (lands in 1.3).
- **Next:** 1.2 plain view at `/ingredients.html`.
