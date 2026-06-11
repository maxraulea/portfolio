# PCB Portfolio — Max Răulea

A personal portfolio as an interactive circuit board. One scroll axis moves the
camera along a fixed rail across a stylized PCB; each component opens a section
of the portfolio in a terminal-style panel. Built with Three.js and GSAP,
loaded from CDN — **no npm, no build step**, just static files.

There is also a plain, printable CV at `plain.html` with a **Download as PDF**
button (uses the browser's print-to-PDF, so the result stays text-based and
ATS-friendly).

And yes — there is a flag hidden on the board. Mail it in if you find it.

---

## Editing content (the only thing you normally touch)

All content lives in **`js/content/`**. Code never needs to change when content
does — both the 3D terminals and the plain CV render from the same data files.

| File | What it holds | Shown at |
|---|---|---|
| `about.js` | profile text, languages, interests | U1 BIOS + top of plain CV |
| `experience.js` | jobs (newest first) | U2 RAM + plain CV |
| `education.js` | schools/degrees | inside experience panel + plain CV |
| `projects.js` | projects / open source | U3 CPU + plain CV |
| `security.js` | CTF / security work | U4 JTAG + plain CV |
| `contact.js` | email (obfuscated), location, links | U5 M.2 + plain CV |

To add a job/project: open the file, **copy an existing object, edit the
fields, save, refresh**. Each file has a comment header documenting its fields.

> **Before going live:** search the `js/content/` folder for `TODO` and
> `PLACEHOLDER` — the projects, security and contact-links entries ship as
> clearly marked placeholders.

### Other common edits
- **Photo** (plain CV only): replace `assets/photo.jpg`, keep the filename.
- **OG link-preview image**: replace `assets/og-image.png` (ideally a real
  screenshot of the site once live, 1200×630).
- **The flag** (easter egg): in `js/render/terminal.js`, `FLAG_CODES` — char
  codes, so the flag never appears as plain text in the source.
- **Prompt hostname** (`max@vu.nl`): top of `js/render/terminal.js`.

### Privacy rule baked into this repo
Phone number and date of birth appear **nowhere** — not on the site, not on the
plain page, not in the exported PDF. The email is split into parts in
`contact.js` and assembled at runtime so plain-text scrapers don't harvest it.
Keep it that way.

---

## Running locally

ES modules don't load over `file://` in most browsers, so serve the folder:

```bash
cd portfolio
python3 -m http.server 8000
# open http://localhost:8000
```

(Any static server works; VS Code's Live Server extension too.)

## Deploying (GitHub Pages)

```bash
git init && git add -A && git commit -m "initial"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from branch → main / root**.
The site appears at `https://YOUR-USERNAME.github.io/YOUR-REPO/`. Netlify or
Cloudflare Pages work just as well — it's all static files.

---

## Project structure

```
index.html        3D experience (WebGL check redirects to plain.html if needed)
plain.html        plain CV + PDF export
css/main.css      terminal/overlay + plain CV styles
css/print.css     A4 print stylesheet for the PDF
js/content/       ★ your data — the only folder you edit
js/render/        terminal.js (3D panels) + plain-cv.js (plain page)
js/scene/         board.js, camera-rail.js, effects.js
assets/           favicon, dummy photo, OG image
CLAUDE.md         project briefing for Claude Code sessions
```

Accessibility & robustness: no-WebGL auto-fallback to the plain page,
`prefers-reduced-motion` respected (no typing effect, no camera glides),
keyboard navigation (arrows/PgUp/PgDn/Home/End), skip link, capped pixel
ratio, render loop pauses in hidden tabs.

---

## Credits

- **Concept, direction, content & maintenance:** Max Răulea — the PCB-as-
  navigation idea, the scroll rail, the section mapping and every design
  decision.
- **Implementation:** fabricated with **Claude Fable 5** (Anthropic), directed
  through conversation.

## License

- **Code:** MIT — see `LICENSE`.
- **Personal content is excluded from the MIT license:** the CV texts, the
  name "Max Răulea", the photo and any personal data in `js/content/` remain
  the property of Max Răulea and may not be reused. If you fork this project,
  replace the contents of `js/content/` and `assets/photo.jpg` with your own.
- **Dependencies** load from CDN under their own licenses:
  [Three.js](https://github.com/mrdoob/three.js/blob/dev/LICENSE) (MIT) and
  [GSAP](https://gsap.com/community/standard-license/) (GSAP standard license,
  free to use).
