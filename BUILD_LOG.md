# Uptime O's Build Log

Source of truth: `DESIGN.md`. Runbook: `RUNBOOK.md`. Every session reads both, plus this log, before writing code.

## Status at a glance

| Phase | Model | State | Tag |
|---|---|---|---|
| 1. Audit and foundation | Opus 5.5 | done | `phase-1-done` |
| 2. Scene and box | Fable 5.2 | in progress | |
| 3. Back panel games | Opus | not started | |
| 4a. The bowl | Fable | not started | |
| 4b. Milk and O's | Fable | not started | |
| 4c. The TV | Fable | not started | |
| 5. Critique (Fable) + hardening (Opus) | Fable, Opus | not started | |

**Next step:** see the newest entry at the bottom of this file.

---

## How to run things

- Preview: `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000`.
- Tests, first time on a machine: `npm run test:install` (installs @playwright/test 1.64.1 and its Chromium).
- Tests, every time: **`npm test`**. It starts `python3 -m http.server 8000` itself, or reuses one already running on port 8000.
- What it checks (`tests/site.spec.js`): every page in `PAGES` returns 200 with no console or page errors; every preserved file returns 200; CNAME unchanged; every sitemap URL loads and the 3 original URLs are kept; GA ID and `analytics.js` on every page; zero requests to Google tracking hosts on localhost; only `analytics.js` calls `gtag(`; plain view shows every post, project, bio, and contact item; plain view preference survives a session; homepage links reach every post and project; section anchors exist; no FREE PRIZE INSIDE; with reduced motion there are zero running animations and `window.uptimeScene.motion` is false (once scene code exists); no horizontal scroll at 375, 768, 1440 on every page; no em dashes in body text or titles; every CDN URL in html/js/css is pinned to x.y.z.
- When a phase adds a page, add it to `PAGES` in the test. When it adds animation, it must expose `window.uptimeScene = { motion: <bool> }` and keep it false under reduced motion.

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

### 2026-11-09 · Opus 5.5 · Phase 1.2 plain view
- **Built:** `/ingredients.html` (JUST THE INGREDIENTS), `css/base.css` (reset, focus ring, skip link, `.topbar`, `.plain-link`, `.panel-head`, `.fine-print`, `.btn-chunky`, global reduced motion kill switch), `css/plain.css`, `js/prefs.js`.
- **Content:** bio paragraphs, the three facts, both posts (title, date, summary copied exactly from the current homepage), both projects (copy exact), contact blurb, email, LinkedIn, GitHub. Nothing invented.
- **Decisions:**
  - Plain view is its own page, not a mode of the homepage. It is lighter, crawlable, and never loads scene code. Session preference key `uptime-plain` in sessionStorage. Visiting `/ingredients.html` sets it `on`; any link with `data-plain="off"` (the BACK TO THE BOX link) clears it. The homepage will redirect to plain view when it is `on` (added with the scene in 1.3). `plain_view_toggle` fires only on a real change.
  - Ping in plain view: a 44px SVG in the bottom right corner that waves 3 times then stops. This is a stand in drawn from section 3 (yellow body, burgundy outline, two antenna ears, LED eyes, stubby legs). **Phase 2 owns Ping's final look and should replace this SVG to match.**
  - Added token `--dur-loop: 1600ms` for one idle loop cycle (Ping's wave).
  - `.claude/launch.json` now runs `python3 -m http.server 8000`, matching section 16.
- **Visual values:** page bg `--milk-cream`, text `--ink`, headings `--box-burgundy`, top strip `--box-burgundy` with `--milk-cream` text and `--sunny-yellow` wordmark in Titan One. Link underline 2px, offset 3px, hover color `--box-red`. Section dividers 1px `--shadow-soft`.
- **Tests:** test script not written yet (lands in 1.4). Checked by eye in the preview at desktop width.
- **Next:** 1.3 static fallback of the scene on `index.html`.

### 2026-11-09 · Opus 5.5 · Phase 1.3 static scene fallback on the homepage
- **Built:** new `index.html` and `css/scene.css`. The old homepage markup is gone; `css/style.css` and `js/main.js` stay because the two posts and 404 still use them until Phases 4b and 5.
- **Structure (Phase 2 builds on these ids and classes):**
  - `.topbar` with JUST THE INGREDIENTS (`data-plain="on"`).
  - `nav.flap` tabs: OPEN HERE `#front`, ABOUT `#about`, WRITING `#writing`, PROJECTS `#projects`, CONTACT `#contact`. Sticky top on desktop, fixed bottom tab bar under 768px (`--tabbar-h`).
  - `section.scene`: `.scene-wall`, `.scene-tv` (SVG CRT with rabbit ears, static color bars, `filter: blur(var(--dof-blur))`), `.scene-desk` (wood via `--grain` over a light to dark wood gradient), `article.face-front#front`, `a.scene-bowl` (SVG half eaten bowl, links to `#bowl`).
  - `div.panels`: `article.face-left#about` (nutrition label as a real `<table>` + MEET THE MAKER with the bio copy unchanged), `article.face-right#writing` (WHAT'S IN THE BOWL checklist + GRAB A SPOON), `article.face-back#projects` (PING'S SATURDAY FUN ZONE! heading + both project cards; Phase 3 adds games above), `article.face-bottom#contact` (barcode SVG, receipt with email, LinkedIn, GitHub, footer line, fine print).
  - `section.bowl-list#bowl`: the plain list of posts that always sits under the bowl (section 7).
  - Old blog "Back to writing" links (`index.html#writing`) still land on the writing panel.
- **Front face copy:** all of section 5 FRONT except the ribbon. `.ribbon-spot` is an empty reserved spot. Hero art is a placeholder bowl of O's; Phase 2 adds Ping with the giant spoon.
- **Visual values used:** box `--box-burgundy` with `--halftone` dots, 3px `--ink` border, `--shadow-contact` on the desk plus an inset right side shade. Logo Titan One, `--sunny-yellow` fill, 3px `--box-burgundy` stroke (`paint-order: stroke fill`), registration offset `-2px 1px 0 var(--box-red)`, then `--shadow-print`, then `5px 5px 0 var(--ink)`. Logo sized in container query units (17cqi / 24cqi) so it scales with the box. Starburst is a 20 point `clip-path` polygon in `--box-red`, rotated 12deg. Wall: `--wall-warm` to `--wall-shade` at 100deg with a `--light-warm` radial window glow from the top left. TV glow `drop-shadow(0 0 18px var(--tv-glow))`.
- **Tokens added:** `--dof-blur`, `--desk-top`, `--box-w`, `--box-ratio`, `--grain`, `--halftone`. Reason: scene geometry and textures shared by later phases.
- **Copy note:** footer adds "Uptime O's is not a real cereal." to make the original brand rule explicit. Homepage meta description had an em dash; replaced with a comma. Page title is now "Cameron Pavloske | Uptime O's".
- **Checked by eye:** 800px and 375px in the preview, no horizontal scroll at 375.
- **Tests:** test script not written yet (next sub step).
- **Next:** 1.4 Playwright test script.

### 2026-11-09 · Opus 5.5 · Phase 1.4 Playwright test script
- **Built:** `package.json` (dev only, no build step; `@playwright/test` pinned to 1.64.1), `playwright.config.js` (Chromium, port 8000, `reuseExistingServer`), `tests/site.spec.js` (58 checks, listed under "How to run things" above). `.gitignore` adds `test-results/` and `playwright-report/`.
- **Also changed:** the two posts, `blog/_template.html`, and `404.html` now load GA through `/js/analytics.js` (same ID, `G-81Y5DN2PHQ`) instead of the inline snippet, because the inline snippet sent page views from localhost. Their `<title>` and `og:title` suffix " — Cameron Pavloske" is now " | Cameron Pavloske" (no em dashes rule). Post bodies, titles, dates, and URLs are untouched.
- **Decision:** a console error counts as a failure unless it is a failed fetch from a non local host (so offline runs that cannot reach Google Fonts do not fail).
- **Tests:** `npm test` → 58 passed.
- **Next:** 1.5 add `/ingredients.html` to the sitemap, final Phase 1 check, tag `phase-1-done`.

### 2026-11-09 · Opus 5.5 · Phase 1.5 sitemap, Phase 1 done
- **Built:** `/ingredients.html` added to `sitemap.xml`; the 3 original URLs and their lastmod dates are unchanged.
- **Done when check (section 15):** test script passes (58/58); plain view shows all existing content (asserted by test); every existing URL still loads (asserted by test). Tagged `phase-1-done`.
- **Known issues and notes for Phase 2:**
  - The homepage is a static fallback only: a flat front face on the desk, the other faces as panels below. Phase 2 owns the real look and may restructure markup, but must keep the ids `front`, `about`, `writing`, `projects`, `contact`, `bowl`, keep every link the tests look for, and keep the panel scroll as the reduced motion and no JS view.
  - Ping in plain view is a stand in; Phase 2 defines Ping and should replace it to match.
  - Box Tops counter and SOUND toggle are not placed yet (Phases 3 and 4c).
  - Posts and 404 still use the old maroon `css/style.css` and `js/main.js`. Articles get restyled in 4b, 404 in 5. The JUST THE INGREDIENTS link is not on those pages yet for the same reason.
  - On desktop at short heights (about 600px) the bottom of the box sits below the fold. Phase 2 sizes the scene properly.
- **Next:** Phase 2, The scene and the box. Assigned model: **Fable**.

---

## Phase 2 plan (2026-11-09, Fable 5.2)

Sub steps, each one committed with tests run:
- **2.1** Tokens for the scene, HTML restructure, scene art: wall with window light, sideboard, HTML/CSS TV (soft focus), desk plane in CSS perspective, SVG bowl. Fallback (no JS, reduced motion) stays a static scene plus panel scroll.
- **2.2** Box faces as printed panels sized in container units (`cqi`), so the same markup works in the cube and in the panel scroll: front, left (nutrition), right (checklist), back (placeholder), bottom (barcode), top flap (decorative).
- **2.3** `js/scene.js`: builds the cube from the panels, poses, rotation by tabs, scroll, drag, swipe, arrow keys; per face lighting; contact shadow; MEET THE MAKER reading sheet.
- **2.4** `js/ping.js`: Ping idle, hover wave, 20s sleep and wake.
- **2.5** Opening sequence on the TV.
- **2.6** Check 375, 768, 1440; reference screenshots to `/design/reference/`; tag `phase-2-done`.

Architecture decisions (reasons):
- **One copy of every face.** Faces live in `.panels` in the HTML. With JS and motion allowed, `scene.js` moves them into `#box` and adds `html.is-3d`. Without that they stay as the panel scroll, which is the reduced motion and no JS view (section 14). No duplicated content.
- **The box is a square prism** (depth = width, taller than wide) so all four side faces are full size and readable. Section 5 calls it a cube with six faces.
- **Box is laid out at reading size and scaled down on the desk** (never scaled up), so text is always crisp. Desk pose: turned and small on the desk. Any other face: the box is "picked up", centered, straight on, at scale 1.
- **Rotation is state driven, not scrubbed.** Scroll position picks a face (one stop per `--stop` of scroll), tabs and swipes jump straight to a face by the shortest spin. Scrubbing through every face on a tab jump was dizzying.
- **MEET THE MAKER opens a reading sheet** (`<dialog>`) in cube mode because 300 words do not fit a box side at a readable size on a phone. In panel mode the bio is inline. Copy is unchanged.
- **GSAP eases and JS timings are read from tokens.css** (`--g-*`, `--dur-*`) so no timing value lives in JS.

### 2026-11-09 · Fable 5.2 · Phase 2.1 to 2.3 scene, faces, 3D box, Ping, Cameron feedback round 1
- **Built:** new `index.html` structure, `css/scene.css`, `css/faces.css`, `js/scene.js` (cube, poses, Lenis scroll stops, drag/swipe, arrow keys, per face lighting, contact shadow, opening sequence, MEET THE MAKER `<dialog>`), `js/ping.js` (idle bounce, antenna wiggle, blink, hover wave, 20s buffer then sleep, startled "Connected!" wake, fires `uptime:ping-wake`), `tests/shots.js` (reference screenshot script).
- **Cameron's feedback, applied:**
  1. "Make it like an actual cereal box": box is now real cereal proportions. Front and back are wide (`--box-ratio: 0.72`), sides are narrow (`--box-depth: 0.28` of height), top and bottom are shallow. Nutrition label and WHAT'S IN THE BOWL were redesigned as tall thin side panels; contact moved to a wide shallow bottom panel. Side panels use their own `--u` (1% of side width).
  2. "Still my personal site, don't make the whole thing about Uptime O's": the top bar wordmark is now "Cameron Pavloske"; the scene's `<h1>` is Cameron's name, role, and one line (`.hello`, top left, hides when the box turns away from the front). The box logo is no longer a heading.
  3. "More realistic, TV relevant, TV on the desk": cartoon outlines removed from the props. Bowl rebuilt with gradient ceramic, specular streak, warm bounce light from the desk, milk meniscus, shaded O's (`#o-real`), steel spoon with soft cast shadow. Box faces get a board sheen. Soft cast plus tight contact shadows. Paper grain and vignette (`.grade`) over the scene. The TV now stands on the back of the desk (`--tv-x`, `--tv-foot`), slightly soft (`--dof-tv`), and is the "latest" slot: its channels are built at runtime from the real post list and project cards (never retyped), an in focus "On now" caption links to the current channel, tapping the TV changes channel (`tv_channel_change`), and turning the box shows a NOW SHOWING card for that face. The TV pulls into focus for `--dur-focus` after each change.
- **Tokens added:** scene geometry (`--box-depth`, `--box-d`, `--fit`, `--desk-*`, `--rest-*`, `--lean`, `--tv-*`), textures (`--tex-wood`, `--tex-paper`, `--rays`, `--scanlines`, `--vignette`), materials (`--ceramic-deep`, `--steel-hi`, `--steel-dark`, `--o-light`, `--o-deep`, `--chrome`, `--sheen`, `--edge-wear`, `--fold`), JS timings (`--dur-spin` 900ms, `--dur-intro-*` totaling 2650ms, `--dur-focus`, `--dur-card`, `--ping-idle` 20000ms, etc.), GSAP ease names (`--g-spin: power3.inOut`, `--g-pop: back.out(1.8)`).
- **Tests:** 58 passed.
- **Next:** Cameron asked for Sid's room from Toy Story as inspiration (see next entry).

### 2026-11-09 · Opus 5.5 (Cameron switched mid Phase 2) · Phase 2.4 the room
- **Cameron's feedback:** "Take inspiration from Sid's room from Toy Story." Applied as mood only, never the film's designs (no recognizable wallpaper, skull motifs, or mutant toys), per the original everything rule: a dim, lived in kid's bedroom of someone who takes electronics apart. Fits Cameron as an engineer.
- **Built:** `css/room.css`. Faded striped wallpaper in shade (`--wall-dim` to `--wall-deep`, `--paper-stripe`, a `--paper-stain`), sun through blinds as slatted light (`--blind-light`, 12px slats every 22px), a light shaft with 6 drifting dust motes (`--beam`, `--dust`, `--dur-dust` 14s), corkboard (hand drawn "Home network v3" diagram, "Reboot it first" sticky, a photo, a patch list), shelf with an old router (green LEDs, one red), manuals, and a coiled patch cable on a hook. Desk clutter in focus: bare circuit board with chips, traces, cap, port; red screwdriver; tape roll; blue patch cable running from the back of the TV off the right edge. Vignette deepened.
- **Decision:** DESIGN.md section 4 says nothing else sits on the desk besides box, bowl, spoon. Cameron's direct requests (TV on the desk, Sid's room mood) override it.
- **Layout fixes:** compact top bar on phones and tablets; new tablet tier 768 to 1100px (`--desk-s: 0.5`, TV at 72%) so the TV is not hidden; "On now" caption sits under Cameron's name on phones and tablets.
- **Tests:** 58 passed. Checked by screenshot at 375, 768, 1440.
- **Known issues:** cable reads a little flat (no perspective taper). Corkboard text is blurred by depth of field by design.
- **Next (exact):** 1) Cameron reviews the room look. 2) Run `node tests/shots.js` (server on port 8000) to save reference screenshots into `/design/reference/`, commit, tag `phase-2-done`, push. 3) Phase 3 checkpoint: Phase 3 is assigned to Opus.
