# UPTIME O's
### The cameronpavloske.com Saturday Morning Edition

> Part of a balanced enterprise breakfast.

This document is the source of truth for the redesign. Every design and copy decision traces back to it. If something is not covered here, match the spirit: a 1990s Saturday morning cereal box, lovingly made, with real substance hiding inside the fun.

---

## 1. The Concept

The homepage is a single scene: a cereal box of Uptime O's standing on a desk, next to a half eaten bowl of O's in milk, with an old CRT television playing in the background. Visitors spin the box to explore and dip a spoon into the bowl to read.

The feeling is a Saturday morning already in progress. Someone poured a bowl, got halfway through it, and is turning the box around to read every panel while cartoons play on the TV behind them.

The joke only works if the content underneath is real. Every panel links to real writing, real projects, and real experience. Playful surface, serious substance.

### Guiding rules
1. **Nostalgic, not ironic.** This is a love letter to Saturday mornings, not a parody of them.
2. **Original everything.** No resemblance to any real cereal brand, mascot, box layout, or logo. Ping and Uptime O's are their own thing.
3. **Every gag earns its place.** Each joke reveals real information about Cameron's work.
4. **Readers can always escape.** A plain view is one tap away from anywhere.

---

## 2. Brand System

### Color
| Token | Hex | Use |
|---|---|---|
| `--box-burgundy` | `#2b1018` | Primary box color, logo outline, dark text |
| `--box-red` | `#c8202f` | Starbursts, sale badges, "NEW!" flags |
| `--sunny-yellow` | `#ffc928` | Logo fill, highlights, Ping's accents |
| `--milk-cream` | `#fff6e3` | Panels, nutrition label, bowl milk |
| `--sky-blue` | `#4fb3e8` | Back panel game backgrounds, Saturday sky |
| `--grass-green` | `#3fae4a` | Success states, completed games |
| `--ink` | `#1a1a1a` | Fine print and body text |

Rules: Burgundy and yellow are the brand. Red is for excitement only (starbursts, NEW flags), never for body text. Cream is the reading surface.

### Type
- **Logo and headlines:** a chunky, rounded display face with a thick outline and a drop shadow. Bouncy baseline is allowed on the logo only.
- **Panel headings:** a bold condensed sans, all caps, for "FREE PRIZE INSIDE!" style callouts.
- **Nutrition label:** a tight, bold grotesque in the style of a real food label, black on cream with heavy rules.
- **Body and articles:** a highly readable serif. Articles must feel like a good book, not a box.
- **Fine print:** a small condensed sans at reduced opacity.

### Texture
- Subtle printed cardboard: slight paper grain, faint halftone dots in large color fields, a little registration offset on the logo.
- Box edges show a fold line and a hint of wear. Not dirty. Loved.

### Banned
- Real cereal brand names, mascots, slogans, or box layouts
- Purple gradients, generic glassmorphism, rounded card grids
- Emoji used as icons
- Stock photography

---

## 3. The Mascot: Ping

Ping is a cheerful little network router with two antenna ears, a rounded body, stubby legs, and two blinking LED eyes. Ping's color is sunny yellow with a burgundy outline.

**Personality:** helpful, energetic, a little goofy, always running toward the next connection.

**Behaviors**
- **Idle:** gentle bounce, antenna wiggle.
- **Hover or tap:** waves.
- **Visitor idle 20 seconds:** Ping's eyes blink slower, a spinning buffer wheel appears above his head, then he dozes off. Any input wakes him with a startled "Connected!"
- **Box shake:** Ping holds on for dear life.
- **Game completed:** Ping does a little victory hop and LED eyes turn green.
- **Error or 404:** Ping looks around for a missing cable.

Ping appears on the front, guides the back panel games, and pops up in plain view as a small corner wave only.

---

## 4. The Scene: Desk, Bowl, and TV

The whole homepage lives in one composed scene, viewed from a slightly elevated angle as if sitting at the desk.

### The desk
- A warm wooden desk surface with visible grain, lit by soft morning light from one side.
- The cereal box stands upright on the desk, center or slightly left. It is the hero of the scene.
- Nothing else sits on the desk besides the box, the bowl, and the spoon.

### The bowl
- A ceramic bowl in front of and to the right of the box.
- It is **half eaten**: a shallow pool of milk with a scattering of O's floating in it, a few soggy ones stuck to the inside edge.
- A spoon rests in the bowl, handle angled toward the viewer.
- A couple of stray O's and a small milk drip sit on the desk next to the bowl.
- The O's drift slowly in the milk. This is the Writing section (see section 7).

### The TV
- An old CRT television with rabbit ear antennas sits in the background, slightly out of focus (soft depth of field blur) so it never competes with the box.
- The screen glows and flickers gently, casting a faint shifting light on the desk.
- The TV plays Saturday morning programming made of original, simple animated loops: Ping cartoons, color bars between shows, and channel changes.
- The TV reacts to the visitor:
  - Rotating the box to a new face triggers a quick channel click on the TV, and the screen briefly shows that section's name like a show title card (`NOW SHOWING: ABOUT`).
  - Commercial breaks play on the TV (see section 6).
- Tapping the TV changes the channel to the next cartoon loop.

### Opening sequence
On the first visit per session:
1. The view starts close on the TV screen: static and a soft hiss (only if sound is on).
2. Color bars with the text **"SATURDAY MORNING PROGRAMMING WILL BEGIN SHORTLY."**
3. A channel click, and the camera pulls back and racks focus from the TV to the desk, revealing the box and the half eaten bowl in morning light.

Total length under 3 seconds. Skippable with any tap. Skipped entirely with reduced motion.

---

## 5. Box Faces and Copy

The box is a 3D cube with six faces. Drag, swipe, or use the top flap tabs to rotate it.

### FRONT (Hero)

- **Logo:** `UPTIME O's`
- **Starburst (top right):** `NOW WITH 15 YEARS OF ARCHITECTURE!`
- **Tagline under logo:** `Part of a balanced enterprise breakfast.`
- **Hero art:** Ping mid bounce holding a giant spoon, with a bowl of glowing O's.
- **Corner badges:**
  - `FORTIFIED WITH APIs`
  - `ZERO SINGLE POINTS OF FAILURE`
  - `TEXAS MADE`
- **Bottom band:** `NET WT 15 YRS` on the left, `A Cameron Pavloske Production` on the right.
- **Tiny ribbon:** `FREE PRIZE INSIDE!`
- **Fine print:** `Serving suggestion. Actual results depend on your architecture.`

### LEFT SIDE (About: Nutrition Facts)

Render as a faithful nutrition label, black on cream.

```
NUTRITION FACTS
Serving Size        1 Deployment
Servings Per Career  Many
──────────────────────────────
Amount Per Serving
Experience               15 yrs
──────────────────────────────
                     % Daily Value*
AV Integration              100%
Enterprise Architecture     100%
Vendor Side Engineering     100%
API First Thinking          100%
Fortune 100 Campuses        100%
AI Curiosity                110%
Hype                          0g
Buzzwords                     0g
──────────────────────────────
*Percent Daily Values are based on
a 2,000 room enterprise.
```

**Ingredients:** AV integration, enterprise architecture, vendor side engineering, Fortune 100 campuses, airline infrastructure, API first thinking, early AI experiments, Texas sunshine, coffee.

**Allergen statement:** `CONTAINS: OPINIONS ABOUT AGENTS. MAY CONTAIN TRACES OF WEBHOOKS.`

Below the label, a short bio panel titled **"MEET THE MAKER"** using Cameron's existing bio copy from the current site, unchanged.

### RIGHT SIDE (Writing preview)

- **Heading:** `WHAT'S IN THE BOWL`
- A short list of the latest posts styled like a "Collect them all!" checklist with checkboxes.
- Button: `GRAB A SPOON` (zooms to the bowl, see section 7).

### BACK (Projects: The Activity Panel)

The classic back panel. Bright sky blue background, four game boxes in a grid, Ping hosting.

Header: `PING'S SATURDAY FUN ZONE!`

**Game 1: The Maze**
- Title: `HELP THE PACKET REACH THE SERVER!`
- A maze of switches, a firewall, and patch cables. The visitor drags a small packet through it.
- Completion reveals the **Neat Pulse MCP Server** project card.
- Fine print: `No packets were dropped in the making of this maze.`

**Game 2: Connect the Dots**
- Title: `CONNECT THE DOTS TO SEE WHAT PING BUILT!`
- Numbered dots draw the three tier agent pyramid: Domain Agents, Orchestration, Interface.
- Completion opens the Writing bowl. When an agent architecture post is published, link completion directly to it.

**Game 3: Word Search**
- Title: `FIND ALL 10 WORDS!`
- Words: `UPTIME`, `WEBHOOK`, `ZEROTOUCH`, `FIRMWARE`, `LATENCY`, `AGENT`, `MCP`, `API`, `SSO`, `ORCHESTRATION`
- Finding all 10 earns a Box Top (see section 8).

**Game 4: Spot the Difference**
- Title: `CAN YOU SPOT ALL 5 DIFFERENCES?`
- Two conference rooms side by side. The differences are real deployment mistakes:
  1. Camera mounted too high
  2. Cable running across the floor
  3. Display in front of a window with glare
  4. Missing room booking panel at the door
  5. Microphone hidden behind a plant
- Each found difference shows a one line tip in Ping's speech bubble.

Below the games, the **Neat Pad Clock** and any other projects appear as "ALSO AVAILABLE" mini boxes on a shelf.

### TOP FLAP (Navigation)

A fold out flap with tab labels:
`OPEN HERE` · `ABOUT` · `WRITING` · `PROJECTS` · `CONTACT`

Tapping a tab rotates the box to that face. On scroll, the box rotates through faces in order.

### BOTTOM (Contact)

- A UPC barcode with the number `CAMERON PAVLOSKE`.
- On mobile: the barcode is also a QR style link that opens contact options.
- On desktop: clicking the barcode plays a checkout beep and slides out a receipt with email, LinkedIn, and GitHub, printed like a grocery receipt.
- Receipt footer: `THANK YOU FOR SHOPPING. PLEASE COME AGAIN.`
- Fine print: `Best if read before 2036.`

---

## 6. Commercial Breaks

Commercial breaks play on the background TV, never as overlays on top of the content. When the visitor moves between major sections, the TV briefly shows a Saturday morning bumper:

- `WE'LL BE RIGHT BACK!` with Ping peeking from behind the text
- `AND NOW, BACK TO OUR PROGRAM`

They only play on the first pass through and never block reading. With reduced motion, the TV shows a still frame instead.

---

## 7. The Bowl (Writing)

The half eaten bowl on the desk is always there. Tapping it, or `GRAB A SPOON` on the box, zooms the view down into the bowl.

- The O's floating in the milk are blog posts. Newer posts float near the center and catch the light; older ones drift toward the edge.
- The O's drift and bob gently, and nudge each other when they touch.
- Hovering or tapping an O shows the post title on a little paper flag.
- Selecting an O: the spoon dips in, scoops it up with a little milk, and the scene transitions into the article page.
- Dragging a finger or cursor through the milk makes soft ripples that push the O's around.
- Ping occasionally swims through the milk.
- A `BACK TO THE DESK` button zooms back out.

The bowl is always backed by a plain, accessible list of posts directly underneath it.

### Article pages
Articles are reading first. The cereal theme appears only as a slim box edge header with the logo and a `BACK TO THE BOX` button, plus a progress bar shaped like a spoon filling with milk as you read. The body is clean serif type on cream with generous line height.

---

## 8. Box Tops (Easter Egg Collection)

A small counter in the corner tracks Box Tops collected this visit (stored in session memory only, never required).

Ways to earn:
1. Complete the word search
2. Wake Ping up after he falls asleep
3. Complete all four back panel games

Mail in panel on the side:

> **MAIL IN 3 BOX TOPS FOR A FREE CONSULTATION!**
> Send 3 Box Tops plus $0.00 shipping and handling.
> Allow 6 to 8 weeks for delivery.*
>
> *Actually it is instant.

Collecting all three triggers a celebration from Ping and reveals a personal thank you note with Cameron's LinkedIn.

---

## 9. Limited Edition Boxes (Archive)

Each blog post can get its own limited edition box flavor shown on a pantry shelf at the bottom of the Writing section:

- `cameras-on-your-network.html` → `NEW! CAMERA CRUNCH, Now With Extra Network Clusters`
- `why-i-work-at-neat.html` → `HOME TEAM HONEY O's, Made With Real Conviction`

Every future post gets its own flavor name in the same spirit.

Older posts become collectible boxes on the shelf. Selecting a box opens that article.

---

## 10. Plain View

A small link at the top of every page: `JUST THE INGREDIENTS`

Plain view shows a clean, fast, fully accessible version of all content (bio, posts, projects, contact) with no 3D, no physics, no games. Ping appears only as a tiny wave in the corner. This is the version for recruiters, customers, and readers in a hurry. Remember the preference for the session.

---

## 11. Sound

Off by default. A small `SOUND` toggle on the box.

When on: soft cereal rattle on rotate, a crunch when an O is scooped, a checkout beep on the barcode, a gentle TV hiss and channel clicks, faint cartoon audio from the TV, a soft spoon clink against the bowl, and a short happy jingle for Box Tops.

---

## 12. Technical Approach

- **Stack:** vanilla HTML, CSS, and JS. No build step. GitHub Pages compatible. Libraries from a CDN.
- **The scene:** layered composition. The desk and bowl are SVG and CSS with real lighting cues (shadows, highlights, milk sheen). The TV sits on a back layer with a CSS blur for depth of field, and its screen is a small canvas or video element playing the cartoon loops with a scanline and flicker overlay.
- **The box:** CSS 3D transforms, six faces, each face built in SVG and HTML, standing on the desk with a contact shadow that moves as it rotates.
- **Animation:** GSAP with ScrollTrigger, DrawSVG (connect the dots), and Flip.
- **Smooth scroll:** Lenis, synced to the GSAP ticker. All anchor links route through `lenis.scrollTo()`.
- **Physics:** Matter.js (or a lightweight custom float simulation) for O's drifting in the milk, bumping each other, and responding to ripples.
- **Shake:** DeviceMotion API with permission request on iOS, plus a button fallback.
- **Transitions:** cross document view transitions between the box and article pages.
- **Preserve:** all existing copy, URLs, and blog paths exactly. Blog posts stay at `/blog/[post-slug].html`.

---

## 13. Mobile

- The scene crops tighter: the box fills most of the screen, the bowl sits in the lower right corner, and the TV peeks in from behind at the top.
- The box rotates by horizontal swipe.
- The top flap becomes a sticky bottom tab bar.
- Back panel games stack one per screen.
- The bowl uses fewer O's and simplified physics.
- Shake works natively.
- Test at 375px, 768px, and 1440px wide.

---

## 14. Accessibility and Performance

- Every interaction works by keyboard and screen reader.
- Every game has a "skip to the answer" link.
- Physics, shake, and 3D all have clickable equivalents.
- `prefers-reduced-motion` turns off rotation animation, the opening sequence, TV animation, and physics. The TV shows a still frame, the O's sit still, and the box faces show as a simple scroll of panels.
- Color contrast passes WCAG AA on all text.
- Lighthouse 90+ on mobile. Matter.js and game assets load lazily.

---

## 15. Build Phases

One phase (or sub phase) per session. Stop after each one for review.

**Out of scope until Cameron decides:** the prize inside, the `FREE PRIZE INSIDE!` ribbon, and the shake mechanic. Do not build them. Leave a clean spot on the front of the box where the ribbon could go later.

### Phase 1: Audit and foundation
- Read the whole repo. Audit the current site against this document and list every gap.
- Create `tokens.css`, the plain view, a static fallback of the scene, and the test script (section 16).
- Pin all CDN library versions.
- **Done when:** the test script passes, plain view shows all existing content, every existing URL still loads.

### Phase 2: The scene and the box
- Desk, static half eaten bowl, background TV with depth of field, opening sequence.
- 3D box with front, both sides, top flap nav, and bottom barcode, all with full copy. Back panel shows a placeholder.
- Ping with idle, hover, and sleep behaviors.
- Save reference screenshots (section 16).
- **Done when:** the scene matches this document at all three widths, tests pass, reference screenshots are saved.

### Phase 3: The back panel
- All four games, Box Tops, mail in panel.
- **Done when:** every game is playable by touch, mouse, and keyboard, each has a skip link, tests pass, and it matches the reference screenshots' style.

### Phase 4a: The bowl
- Zoom into the bowl, `GRAB A SPOON` and `BACK TO THE DESK`, O's mapped to real blog posts with title flags.
- **Done when:** every post is reachable from the bowl and from the plain list under it.

### Phase 4b: Milk and O's
- Floating and bobbing O's, ripples, spoon scoop transition into articles, Ping swimming, article page header and spoon progress bar.
- **Done when:** physics runs smoothly on a phone, reduced motion shows still O's, and transitions work in both directions.

### Phase 4c: The TV
- Cartoon loops, channel change on section change, `NOW SHOWING` title cards, commercial breaks, tap to change channel, barcode receipt, limited edition shelf, sound.
- **Done when:** the TV never blocks or distracts from reading, sound is off by default, tests pass.

### Phase 5: Critique and hardening
- Three critique passes as a harsh Awwwards juror and a senior frontend engineer. List problems, then fix them.
- Lighthouse 90+ on mobile, WCAG AA contrast, full keyboard support.
- **Done when:** all of section 14 is met and the test script passes.

---

## 16. Guardrails

These rules apply to every session, no matter which model is running it.

### Branch and preview
- All work happens on the `redesign` branch. Never commit to `main`. The live site must keep working until Cameron merges.
- Preview locally with `python3 -m http.server 8000` from the repo root.

### Hosting
- The site is hosted free on GitHub Pages. It must stay a fully static site: no server code, no build step, no paid services, no environment secrets.
- Everything runs in the browser. Libraries load from public CDNs with pinned versions.
- Keep assets small. Compress images, keep audio clips short, and prefer SVG and code over large image or video files.
- The test script runs locally. Do not add hosting services or deployment pipelines.

### Files that must be preserved
- `CNAME` (custom domain), `google830d2e2b89d4ea3b.html` (Search Console verification), `robots.txt`, `site.webmanifest`, favicons and app icons, and all `og-*` images must stay exactly where they are.
- `sitemap.xml` must keep every existing URL. Add any new pages to it.
- `404.html` gets the new style: Ping looking around for a missing cable.
- `blog/_template.html` must be updated to the new article page style so future posts match.

### Analytics (Google Analytics)
- Keep the existing Google Analytics tag and measurement ID (`G-81Y5DN2PHQ`) exactly as they are. Record them in `BUILD_LOG.md` during the Phase 1 audit.
- The tag must be on every page, including the plain view and every blog post.
- Load it so it never slows the scene down (async, no blocking).
- Do not send analytics from local previews. Skip all tracking when the page is served from `localhost` or a local network IP, so testing does not pollute the real numbers.
- Page views on articles work normally. Interactions inside the scene are not page loads, so send them as custom events with `gtag('event', ...)`:

| Event name | When it fires | Parameters |
|---|---|---|
| `box_face_view` | The box rotates to a face | `face` (front, about, writing, projects, contact) |
| `bowl_open` | The visitor zooms into the bowl | none |
| `post_scoop` | An O is scooped to open a post | `post_title` |
| `game_complete` | A back panel game is finished | `game` (maze, dots, word_search, differences) |
| `box_top_earned` | A Box Top is collected | `count` |
| `plain_view_toggle` | Plain view is turned on or off | `state` (on, off) |
| `tv_channel_change` | The visitor taps the TV | none |
| `contact_click` | Email, LinkedIn, or GitHub is opened from the receipt | `link` |

- Put all tracking in one small `analytics.js` file so no other code calls `gtag` directly.
- The test script checks that the tag is present on every page and that no tracking fires on `localhost`.

### Commits and tags
- Commit after every sub step with a clear message, not just at the end of a phase.
- Tag each finished phase: `phase-1-done`, `phase-2-done`, `phase-3-done`, `phase-4a-done`, `phase-4b-done`, `phase-4c-done`, `phase-5-done`.
- If a session goes wrong, roll back to the last tag instead of patching on top of a mess.

### BUILD_LOG.md
- Update `BUILD_LOG.md` after every sub step, not just at the end of a phase. A session can be cut off by usage limits at any time.
- Each entry includes: date, model used, what was built, key decisions and why, exact visual techniques (colors used from tokens, easing curves, durations, lighting and shadow values), known issues, and the exact next step.
- Every session starts by reading `DESIGN.md` and `BUILD_LOG.md` before writing any code.

### Single source of style
- All colors, fonts, spacing, easing curves, and durations live in `tokens.css`.
- No new color, font, or timing value may appear anywhere else. If one is needed, add it to `tokens.css` and record why in `BUILD_LOG.md`.

### Reference screenshots
- At the end of Phase 2, use Playwright to capture the scene at 375px, 768px, and 1440px wide, and each box face, into `/design/reference/`.
- Every later session compares its work against these screenshots and keeps the established style exactly. New screenshots are added for each later phase.

### Test script
Phase 1 creates a test script (Playwright, run with one command documented in `BUILD_LOG.md`) that checks:
- Every existing page and blog post URL returns a page
- No console errors on any page
- Plain view shows all content
- `prefers-reduced-motion` turns off animation and physics
- Pages render at 375px, 768px, and 1440px without horizontal scrolling

Every session runs the tests before committing. A session is not done if tests fail.

### Fallback first
The plain view and a static version of the scene are built before any 3D, physics, or animation. The site must always work at every commit, even if a fancy layer is half finished.

### Libraries
Load every library from a CDN with an exact pinned version number.

### Final check
Before any merge to `main`, Cameron reviews the preview on his own phone.
