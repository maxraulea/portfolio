// ============================================================
// plain-cv.js — renders the SAME content data as a clean,
// semantic, printable CV page (plain.html).
// ============================================================

import { about } from "../content/about.js";
import { experience } from "../content/experience.js";
import { education } from "../content/education.js";
import { projects } from "../content/projects.js";
import { security } from "../content/security.js";
import { contact, emailAddress } from "../content/contact.js";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content;
}

export function renderCV(root) {
  const mail = emailAddress();

  root.appendChild(
    el(`
    <header class="cv-header">
      <img class="cv-photo" src="assets/photo.jpg" alt="Portrait of ${esc(about.name)}" width="110" height="110">
      <div>
        <h1>${esc(about.name)}</h1>
        <p class="cv-title">${esc(about.title)}</p>
        <p class="cv-meta">
          <a href="mailto:${mail}">${mail}</a> · ${esc(contact.location)}
          ${contact.links.map((l) => ` · <a href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a>`).join("")}
        </p>
      </div>
    </header>

    <section>
      <h2>Profile</h2>
      <p>${esc(about.profile)}</p>
    </section>`)
  );

  // experience
  const exp = el(`<section><h2>Experience</h2><div class="cv-entries"></div></section>`);
  const expWrap = exp.querySelector(".cv-entries");
  for (const job of experience) {
    expWrap.appendChild(
      el(`
      <article class="cv-entry">
        <div class="cv-entry-head">
          <h3>${esc(job.role)} — ${esc(job.company)}</h3>
          <span class="cv-period">${esc(job.period)}</span>
        </div>
        <p class="cv-meta">${esc(job.location)}${job.note ? " · " + esc(job.note) : ""}</p>
        <ul>${job.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      </article>`)
    );
  }
  root.appendChild(exp);

  // education
  const edu = el(`<section><h2>Education</h2><div class="cv-entries"></div></section>`);
  const eduWrap = edu.querySelector(".cv-entries");
  for (const e of education) {
    eduWrap.appendChild(
      el(`
      <article class="cv-entry">
        <div class="cv-entry-head">
          <h3>${esc(e.degree)} — ${esc(e.school)}</h3>
          <span class="cv-period">${esc(e.period)}</span>
        </div>
        <p class="cv-meta">${esc(e.place)} · ${esc(e.status)}</p>
      </article>`)
    );
  }
  root.appendChild(edu);

  // projects
  const prj = el(`<section><h2>Projects & open source</h2><div class="cv-entries"></div></section>`);
  const prjWrap = prj.querySelector(".cv-entries");
  for (const p of projects) {
    prjWrap.appendChild(
      el(`
      <article class="cv-entry">
        <div class="cv-entry-head">
          <h3>${esc(p.name)}</h3>
          <span class="cv-period">${p.tech.map(esc).join(", ")}</span>
        </div>
        <p>${esc(p.description)}${p.link ? ` — <a href="${esc(p.link)}" rel="noopener">${esc(p.link.replace(/^https?:\/\//, ""))}</a>` : ""}</p>
      </article>`)
    );
  }
  root.appendChild(prj);

  // security
  const sec = el(`<section><h2>Security & CTF</h2><div class="cv-entries"></div></section>`);
  const secWrap = sec.querySelector(".cv-entries");
  for (const s of security) {
    secWrap.appendChild(
      el(`
      <article class="cv-entry">
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.description)}${s.link ? ` — <a href="${esc(s.link)}" rel="noopener">link</a>` : ""}</p>
      </article>`)
    );
  }
  root.appendChild(sec);

  // languages + interests
  root.appendChild(
    el(`
    <section class="cv-two-col">
      <div>
        <h2>Languages</h2>
        <ul>${about.languages.map((l) => `<li>${esc(l.name)} — ${esc(l.level)}</li>`).join("")}</ul>
      </div>
      <div>
        <h2>Interests</h2>
        <p>${about.interests.map(esc).join(" · ")}</p>
      </div>
    </section>`)
  );
}
