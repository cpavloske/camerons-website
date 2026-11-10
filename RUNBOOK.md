# Uptime O's Runbook

Step by step plan for building the redesign with Fable and Opus. Keep this file next to `DESIGN.md` in the repo.

---

## One time setup (about 5 minutes)

The `redesign` branch already exists on GitHub with `DESIGN.md` and `RUNBOOK.md` in it. Your live site on `main` is untouched.

1. Get the branch on your Mac. If the repo is not cloned yet:
   ```
   cd ~/Documents
   git clone https://github.com/cpavloske/camerons-website.git
   cd camerons-website
   git checkout redesign
   ```
   If it is already cloned:
   ```
   cd path/to/camerons-website
   git fetch
   git checkout redesign
   ```
2. Check your tools: `node -v` and `python3 --version`. If either says "command not found," install Node from nodejs.org, and install Python with `xcode-select --install`.
3. Free previews on your phone. GitHub Pages only publishes `main`, so preview the `redesign` branch from your Mac:
   ```
   python3 -m http.server 8000
   ```
   - On your Mac, open `http://localhost:8000`
   - On your phone (same Wi-Fi), open `http://YOUR-MAC-IP:8000`. Find your IP with `ipconfig getifaddr en0`.
   - Stop the server with Ctrl+C.
4. Start Claude Code from the repo folder with `claude`. Optionally install the GSAP skill and the frontend design plugin with `/plugin`.

---

## Schedule

| When | Session | Model |
|---|---|---|
| Mon or Tue | Phase 1: Audit and foundation | Opus |
| Mon or Tue | Phase 2: Scene and box | **Fable** |
| Wed (after 1:00 AM refresh) | Finish Phase 2 if needed, then Phase 4a | **Fable** |
| Wed or Thu | Phase 3: Back panel | Opus |
| Thu to Sun | Phase 4b: Milk and O's | **Fable** (use your reset here if needed) |
| Thu to Sun | Phase 4c: TV | **Fable** if usage remains, otherwise Opus |
| Any time | Phase 5: Critique and hardening | Opus, plus one Fable critique pass if usage remains |

Fable promo ends **Sunday, November 16**. Your Fable reset expires **November 17**. After the 16th, Opus finishes anything left.

---

## Before every session

1. Make sure you are on the right branch: `git checkout redesign`
2. Start a fresh Claude Code session (`/clear`).
3. Run `/usage`. If you are planning a Fable session and the Fable bar is close to full, either use your reset or switch that session to Opus.
4. Select the model from the schedule with `/model`.
5. Paste the prompt for that phase below.

## After every session

1. Read the summary and check `BUILD_LOG.md` was updated.
2. Start the local server and open the preview on your phone and on desktop (see setup step 4).
3. If it looks right, reply "Approved." If not, tell it what to fix before moving on.
4. Confirm the phase tag exists: `git tag`
5. Push: `git push && git push --tags`

---

## Session prompts

### Phase 1 (Opus)
```
Read DESIGN.md in the repo root, especially sections 15 and 16. We are on the redesign branch. Never commit to main.

Run Phase 1: Audit and foundation.
1. Read the entire repo.
2. Audit the current site against DESIGN.md and list every gap before changing any code.
3. Create tokens.css, the plain view, a static fallback of the scene, and the Playwright test script described in section 16. Pin every CDN library version.
4. Create BUILD_LOG.md and update it after every sub step, following section 16.
5. Commit after every sub step. Run the tests before each commit.
6. When the phase's "Done when" criteria are met, tag phase-1-done.

Then stop and summarize what you built, what you tested, and anything you were unsure about.
```

### Phase 2 (Fable)
```
Read DESIGN.md and BUILD_LOG.md before writing any code. We are on the redesign branch. Never commit to main.

Run Phase 2: The scene and the box, as described in section 15. This phase sets the visual style for the whole site, so take the time to make it beautiful. Follow every guardrail in section 16.

Update BUILD_LOG.md after every sub step with the exact visual techniques you used, so a different model can match your style later. Commit after every sub step and run the tests before each commit.

At the end, save the reference screenshots to /design/reference/ as described in section 16, then tag phase-2-done.

Then stop and summarize what you built, what you tested, and anything you were unsure about.
```

### Phase 3 (Opus)
```
Read DESIGN.md and BUILD_LOG.md before writing any code. Look at every image in /design/reference/ and match that visual style exactly. We are on the redesign branch. Never commit to main.

Run Phase 3: The back panel, as described in section 15. Use only values from tokens.css. Follow every guardrail in section 16.

Update BUILD_LOG.md after every sub step. Commit after every sub step and run the tests before each commit. Add new reference screenshots of the back panel when done, then tag phase-3-done.

Then stop and summarize what you built, what you tested, and anything you were unsure about.
```

### Phase 4a, 4b, 4c (Fable, one sub phase per session)
Replace `4a` with `4b` or `4c` for each session.
```
Read DESIGN.md and BUILD_LOG.md before writing any code. Look at every image in /design/reference/ and match that visual style exactly. We are on the redesign branch. Never commit to main.

Run Phase 4a only, as described in section 15. Use only values from tokens.css. Follow every guardrail in section 16.

Update BUILD_LOG.md after every sub step. Commit after every sub step and run the tests before each commit. Add new reference screenshots when done, then tag phase-4a-done.

Then stop and summarize what you built, what you tested, and anything you were unsure about.
```

### Phase 5 (Opus, optional Fable critique)
```
Read DESIGN.md and BUILD_LOG.md before writing any code. Look at every image in /design/reference/. We are on the redesign branch. Never commit to main.

Run Phase 5: Critique and hardening, as described in section 15. Do three critique passes, one at a time. In each, act as a harsh Awwwards juror and a senior frontend engineer, list every problem, then fix them. Do not change the established visual style; refine it.

Then meet every requirement in section 14 and make the test script pass. Update BUILD_LOG.md after every sub step and commit after every fix. Tag phase-5-done.

Then stop and give me a final summary and a checklist of anything I should test by hand on my phone.
```

---

## If a session gets cut off

If you hit a usage limit mid session, start a new session (switch to Opus if needed) and paste:
```
The last session was cut off mid phase. Read DESIGN.md and BUILD_LOG.md, then run git status and git log to see exactly where the work stopped. Look at /design/reference/ and match that style exactly.

If there are uncommitted changes, check whether they work and pass the tests. Commit them if they do; discard them if they do not. Then continue the current phase from the next step listed in BUILD_LOG.md. Follow every guardrail in section 16.
```

## If a session goes wrong

Roll back to the last good phase:
```
git reset --hard phase-2-done
```
Replace `phase-2-done` with the last tag that looked right. Then rerun that phase's prompt.

---

## Going live

When everything is done and you have checked it on your phone:
```
git checkout main
git merge redesign
git push
```
GitHub Pages will publish the new site within a few minutes.
