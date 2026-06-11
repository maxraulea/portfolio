# CLAUDE.md — project briefing

This file briefs Claude Code (or any AI assistant) working in this repo.
Read it before changing anything.

## What this is

Personal portfolio of **Max Răulea** (MSc Computer Security, VU Amsterdam),
presented as an interactive stylized PCB. One scroll axis drives a camera
along a fixed rail (`js/scene/camera-rail.js`); each stop is a component that
opens a terminal-style HTML panel. A plain printable CV lives at `plain.html`.

**Stack:** Three.js (ES module via import map) + GSAP (classic script), both
from CDN. **No npm, no bundler, no build step — keep it that way.** Static
files only; deployable to GitHub Pages as-is.

## Architecture rules (do not break)

1. **Content and code are separated.** All portfolio content lives in
   `js/content/*.js` as plain exported data. Both renderers —
   `js/render/terminal.js` (3D panels) and `js/render/plain-cv.js` (plain
   page) — consume the same data. A content change must never require touching
   scene or render code; a visual change must never require touching content.

2. **Privacy:** Max's **phone number and date of birth must never appear**
   anywhere — site, plain page, PDF, source, commit messages. The email is
   split into `emailUser`/`emailDomain` in `contact.js` and assembled at
   runtime; never write it out whole in any file.

3. **Attribution stays.** The silkscreen corner line in `index.html`
   ("DESIGNED & DIRECTED BY MAX RĂULEA · FABRICATED WITH CLAUDE FABLE 5") and
   the plain-page footer are intentional and must not be removed. The footer
   is `.no-print` on purpose — the exported PDF stays free of it.

4. **The easter egg stays subtle.** `U7` is a deliberately dim, unlabeled chip
   off the rail (`js/scene/board.js`, `buildU7`). It is absent from the
   progress nav. The flag is stored as char codes (`FLAG_CODES` in
   `terminal.js`) so it is not greppable — never inline it as a string.

5. **Robustness invariants:** no-WebGL → redirect to `plain.html` (inline
   script in `index.html`); `prefers-reduced-motion` → instant typing, no
   eased camera; pixel ratio capped at 2; render loop pauses when
   `document.hidden`; resize updates camera aspect + renderer size.

## How the rail works (for changes)

- `STOPS` in `board.js` defines the journey. The `t` values are **equally
  spaced on purpose**: the camera path is a CatmullRom curve through one
  waypoint per stop, and equal spacing makes curve-t coincide with journey-t.
  **If you add or remove a stop, re-space all `t` values evenly** (k/N for
  N segments) — do not hand-pick uneven values.
- Adding a section = (a) add a stop in `STOPS` + a component builder in
  `board.js`, (b) a content file in `js/content/`, (c) a builder in
  `terminal.js` `BUILDERS`, (d) a section in `plain-cv.js`. Follow the
  existing patterns exactly.
- Panels open when `|progress − stop.t| < 0.05` (`rail.activeStop`).

## Conventions

- Plain JS (ES2020+), no TypeScript, no frameworks. 2-space indent,
  double quotes.
- Colors come from `COLORS` in `board.js` and CSS variables in
  `css/main.css` (`--cyan #3fe0c5`, `--amber #ffb454`, `--bg #05070c`).
  Don't introduce new hardcoded colors.
- System monospace font stack only — no webfonts.
- Escape all content through the local `esc()` helpers before inserting
  into HTML (content files are data, not trusted markup).
- Test locally with `python3 -m http.server` — ES modules don't run over
  `file://`.

## Known TODOs (owner action, not yours unless asked)

- `js/content/projects.js`, `security.js`: placeholder entries marked
  `PLACEHOLDER`/`TODO`.
- `js/content/contact.js`: GitHub/LinkedIn URLs are placeholders.
- `assets/photo.jpg` is a generated dummy; `assets/og-image.png` should
  become a real screenshot once the site is live.
