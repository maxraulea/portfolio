// ============================================================
// terminal.js — renders content data as typed terminal panels.
// Content lives in js/content/* — this file only renders it.
// ============================================================

import { about } from "../content/about.js";
import { experience } from "../content/experience.js";
import { education } from "../content/education.js";
import { projects } from "../content/projects.js";
import { security } from "../content/security.js";
import { contact, emailAddress } from "../content/contact.js";

const PROMPT = `<span class="t-user">max</span><span class="t-dim">@</span><span class="t-host">vu.nl</span><span class="t-dim">:~$</span>`;
const ROOT_PROMPT = `<span class="t-root">root</span><span class="t-dim">@</span><span class="t-host">vu.nl</span><span class="t-dim">:~#</span>`;

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function link(url, label) {
  return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label || url)}</a>`;
}

// ---- per-stop content builders --------------------------------
function buildAbout() {
  const lines = [];
  lines.push(`<span class="t-head">${esc(about.name)}</span>`);
  lines.push(`<span class="t-sub">${esc(about.title)}</span>`);
  lines.push(`<span class="t-dim">${esc(about.location)}</span>`);
  lines.push("");
  for (const sentence of about.profile.split(/(?<=\. )/)) lines.push(esc(sentence.trim()));
  lines.push("");
  lines.push(`<span class="t-key">languages</span>  ${about.languages.map((l) => `${esc(l.name)} <span class="t-dim">(${esc(l.level)})</span>`).join(" · ")}`);
  lines.push(`<span class="t-key">interests</span>  ${about.interests.map(esc).join(" · ")}`);
  return { cmd: "cat about.txt", lines };
}

function buildExperience() {
  const lines = [];
  for (const job of experience) {
    lines.push(
      `<span class="t-accent">${esc(job.period)}</span>  <span class="t-head">${esc(job.company)}</span> <span class="t-dim">· ${esc(job.location)}${job.note ? " · " + esc(job.note) : ""}</span>`
    );
    lines.push(`<span class="t-sub">${esc(job.role)}</span>`);
    for (const b of job.bullets) lines.push(`<span class="t-dim">▸</span> ${esc(b)}`);
    lines.push("");
  }
  lines.push(`<span class="t-key">education</span>`);
  for (const e of education) {
    lines.push(
      `<span class="t-accent">${esc(e.period)}</span>  ${esc(e.degree)} <span class="t-dim">— ${esc(e.school)}, ${esc(e.place)} (${esc(e.status)})</span>`
    );
  }
  return { cmd: "cat experience.log", lines };
}

function buildProjects() {
  const lines = [];
  lines.push(`<span class="t-dim">total ${projects.length}</span>`);
  for (const p of projects) {
    lines.push(`<span class="t-head">${esc(p.name)}</span>  <span class="t-dim">[${p.tech.map(esc).join(", ")}]</span>`);
    lines.push(esc(p.description));
    if (p.link) lines.push(link(p.link));
    lines.push("");
  }
  return { cmd: "ls ~/projects && cat README", lines };
}

function buildSecurity() {
  const lines = [];
  lines.push(`<span class="t-dim">scanning chain… 1 device found: max (IDCODE 0x1337)</span>`);
  lines.push("");
  for (const s of security) {
    lines.push(`<span class="t-head">${esc(s.title)}</span>`);
    lines.push(esc(s.description));
    if (s.link) lines.push(link(s.link));
    lines.push("");
  }
  return { cmd: "./jtag-probe --scan", lines };
}

function buildContact() {
  const mail = emailAddress();
  const lines = [];
  lines.push(`<span class="t-key">email</span>     <a href="mailto:${mail}">${mail}</a>`);
  lines.push(`<span class="t-key">location</span>  ${esc(contact.location)}`);
  for (const l of contact.links) {
    lines.push(`<span class="t-key">${esc(l.label.toLowerCase()).padEnd(9, " ")}</span> ${link(l.url, l.url.replace(/^https?:\/\/(www\.)?/, ""))}`);
  }
  lines.push("");
  lines.push(`<span class="t-dim">end of rail. system will halt.</span>`);
  return { cmd: "cat contact.vcf", lines };
}

const BUILDERS = {
  about: buildAbout,
  experience: buildExperience,
  projects: buildProjects,
  security: buildSecurity,
  contact: buildContact,
};

// ---- typing engine --------------------------------------------
let typeToken = 0;

function renderTyped(panel, cmd, lines, { prompt = PROMPT, instant = false, onDone } = {}) {
  const my = ++typeToken;
  const body = panel.querySelector(".panel-body");
  body.innerHTML = "";

  const cmdLine = document.createElement("div");
  cmdLine.className = "t-line";
  cmdLine.innerHTML = `${prompt} <span class="t-cmd"></span><span class="cursor"></span>`;
  body.appendChild(cmdLine);
  const cmdSpan = cmdLine.querySelector(".t-cmd");
  const cursor = cmdLine.querySelector(".cursor");

  let finished = false;
  const finish = () => {
    if (finished || my !== typeToken) return;
    finished = true;
    cmdSpan.textContent = cmd;
    for (const el of body.querySelectorAll(".t-out")) el.remove();
    appendAll();
    cursor.remove();
    addFinalCursor();
    if (onDone) onDone();
  };

  function appendAll() {
    for (const l of lines) appendLine(l);
  }
  function appendLine(html) {
    const div = document.createElement("div");
    div.className = "t-line t-out";
    div.innerHTML = html === "" ? "&nbsp;" : html;
    body.appendChild(div);
  }
  function addFinalCursor() {
    const div = document.createElement("div");
    div.className = "t-line";
    div.innerHTML = `${prompt} <span class="cursor"></span>`;
    body.appendChild(div);
  }

  if (instant) { finish(); return finish; }

  let ci = 0;
  let li = 0;
  let done = false;

  function typeCmd() {
    if (my !== typeToken || done) return;
    if (ci < cmd.length) {
      cmdSpan.textContent = cmd.slice(0, ++ci);
      setTimeout(typeCmd, 16 + Math.random() * 24);
    } else {
      cursor.remove();
      setTimeout(typeLines, 90);
    }
  }
  function typeLines() {
    if (my !== typeToken || done) return;
    // burst: 2 lines per tick
    for (let k = 0; k < 2 && li < lines.length; k++) appendLine(lines[li++]);
    body.scrollTop = body.scrollHeight;
    if (li < lines.length) setTimeout(typeLines, 26);
    else {
      done = true;
      finished = true;
      addFinalCursor();
      if (onDone) onDone();
    }
  }
  typeCmd();
  return () => { done = true; finish(); };
}

// ---- public API ------------------------------------------------
let panelEl = null;
let skipFn = null;
let currentStop = null;
let closeHandler = null;

function ensurePanel() {
  if (panelEl) return panelEl;
  panelEl = document.createElement("section");
  panelEl.className = "panel";
  panelEl.setAttribute("role", "dialog");
  panelEl.setAttribute("aria-live", "polite");
  panelEl.innerHTML = `
    <div class="panel-bar">
      <span class="panel-title"></span>
      <span class="panel-hint">click to skip typing · scroll to continue</span>
    </div>
    <div class="panel-body" tabindex="0"></div>`;
  panelEl.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) {
      panelEl.classList.remove("panel--root");
      hidePanel();
      if (closeHandler) {
        const h = closeHandler;
        closeHandler = null;
        h();
      }
      return;
    }
    if (e.target.closest("a")) return;
    if (skipFn) skipFn();
  });
  document.body.appendChild(panelEl);
  return panelEl;
}

export function showPanel(stopId, { instant = false } = {}) {
  if (currentStop === stopId) return;
  currentStop = stopId;
  const build = BUILDERS[stopId];
  if (!build) return;
  const { cmd, lines } = build();
  const panel = ensurePanel();
  panel.querySelector(".panel-title").textContent = `/dev/${stopId}`;
  panel.classList.add("panel--open");
  skipFn = renderTyped(panel, cmd, lines, { instant });
}

export function hidePanel() {
  if (currentStop === null) return;
  currentStop = null;
  typeToken++;
  if (panelEl) panelEl.classList.remove("panel--open", "panel--root");
}

export function isOpenFor(stopId) {
  return currentStop === stopId;
}

// ---- U7 easter egg shell ---------------------------------------
// The flag is assembled from char codes at runtime, so a plain
// Ctrl+F through the source won't find it. Change it here.
const FLAG_CODES = [102, 108, 97, 103, 123, 115, 49, 108, 107, 115, 99, 114, 51, 51, 110, 95, 110, 51, 118, 51, 114, 95, 108, 49, 51, 115, 125];
const theFlag = () => String.fromCharCode(...FLAG_CODES);

export function showEasterEgg({ instant = false, onClose } = {}) {
  hidePanel();
  currentStop = "u7";
  const panel = ensurePanel();
  panel.querySelector(".panel-title").textContent = "/dev/u7 — UNDOCUMENTED";
  panel.classList.add("panel--open", "panel--root");

  const mail = emailAddress();
  const lines = [
    `<span class="t-warn">[!] undocumented test point detected</span>`,
    `<span class="t-dim">dumping OTP region…</span>`,
    `<span class="t-dim">0x0000  64 65 61 64 62 65 65 66  ....deadbeef....</span>`,
    "",
    `you read the silkscreen. nicely done.`,
    `<span class="t-flag">${theFlag()}</span>`,
    "",
    `found it? mail the flag to <a href="mailto:${mail}?subject=${encodeURIComponent("I found U7")}">${mail}</a> — first solvers get bragging rights.`,
    "",
    `<button class="t-btn" data-close>detach probe ⏎</button>`,
  ];
  skipFn = renderTyped(panel, "./u7 --dump", lines, { prompt: ROOT_PROMPT, instant });
  closeHandler = onClose || null;
}
