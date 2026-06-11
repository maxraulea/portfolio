// ============================================================
// main.js — wires everything together: renderer, scroll input,
// boot sequence, raycaster (component jumps + U7), progress
// indicator, panels, resize/visibility handling.
// ============================================================

import * as THREE from "three";
import { buildBoard, STOPS, U7_POS } from "./scene/board.js";
import { CameraRail } from "./scene/camera-rail.js";
import { initLighting, initPulses, initPostFX } from "./scene/effects.js";
import { showPanel, hidePanel, isOpenFor, showEasterEgg } from "./render/terminal.js";

const gsap = window.gsap;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 720;

// ---- renderer / scene ------------------------------------------
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070c);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);

const { group: board, traceCurves, u7 } = buildBoard({ mobile: isMobile });
scene.add(board);
initLighting(scene);
const updatePulses = initPulses(scene, traceCurves, { mobile: isMobile, reducedMotion });
const composer = initPostFX(renderer, scene, camera, { mobile: isMobile });

const rail = new CameraRail(camera, { reducedMotion });

// ---- scroll input ----------------------------------------------
const SCROLL_SENS = 0.00022;

window.addEventListener(
  "wheel",
  (e) => {
    if (!booted) return;
    if (e.target.closest && e.target.closest(".panel")) return; // let the panel scroll
    rail.addScroll(e.deltaY * SCROLL_SENS);
    dismissHint();
  },
  { passive: true }
);

let touchY = null;
window.addEventListener(
  "touchstart",
  (e) => {
    touchY = e.target.closest && e.target.closest(".panel") ? null : e.touches[0].clientY;
  },
  { passive: true }
);
window.addEventListener(
  "touchmove",
  (e) => {
    if (!booted || touchY === null) return;
    const y = e.touches[0].clientY;
    rail.addScroll((touchY - y) * SCROLL_SENS * 5.5);
    touchY = y;
    dismissHint();
    e.preventDefault();
  },
  { passive: false }
);
window.addEventListener("touchend", () => (touchY = null), { passive: true });

window.addEventListener("keydown", (e) => {
  if (!booted) return;
  const step = 1 / 6;
  if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
    rail.jumpTo(rail.nearestStop().t + step);
    dismissHint();
    e.preventDefault();
  } else if (e.key === "ArrowUp" || e.key === "PageUp") {
    rail.jumpTo(rail.nearestStop().t - step);
    e.preventDefault();
  } else if (e.key === "Home") rail.jumpTo(0);
  else if (e.key === "End") rail.jumpTo(1);
});

// ---- raycaster: click a component to jump, click U7 to fall in --
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt = null;

canvas.addEventListener("pointerdown", (e) => (downAt = { x: e.clientX, y: e.clientY }));
canvas.addEventListener("pointerup", (e) => {
  if (!booted || rail.locked || !downAt) return;
  if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) return; // it was a drag
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.ray; // ensure init
  raycaster.setFromCamera(pointer, camera);
  // generous hit area on mobile
  raycaster.params.Line = { threshold: 0.4 };
  const hits = raycaster.intersectObjects(board.children, true);
  for (const h of hits) {
    const id = h.object.userData.stopId;
    if (!id) continue;
    if (id === "u7") return enterU7();
    const stop = STOPS.find((s) => s.id === id);
    if (stop) {
      rail.jumpTo(stop.t);
      dismissHint();
    }
    return;
  }
});

// ---- U7 easter egg ----------------------------------------------
function enterU7() {
  hidePanel();
  setHalt(false);
  const pos = new THREE.Vector3(U7_POS.x + 1.6, 3.2, U7_POS.z - 3.6);
  const look = new THREE.Vector3(U7_POS.x, 0.4, U7_POS.z);
  rail.detourTo(pos, look, gsap, () => {
    showEasterEgg({
      instant: reducedMotion,
      onClose: () => rail.returnFromDetour(gsap),
    });
  });
}

// ---- progress indicator -----------------------------------------
const nav = document.getElementById("rail-nav");
const navStops = STOPS.filter((s) => s.id !== "overview" && s.id !== "end");
for (const s of navStops) {
  const btn = document.createElement("button");
  btn.className = "rail-nav-item";
  btn.dataset.stop = s.id;
  btn.innerHTML = `<span class="rail-dot"></span><span class="rail-label">${s.label}</span>`;
  btn.setAttribute("aria-label", s.label);
  btn.addEventListener("click", () => {
    rail.jumpTo(s.t);
    dismissHint();
  });
  nav.appendChild(btn);
}

function updateNav(activeId) {
  for (const el of nav.children) el.classList.toggle("active", el.dataset.stop === activeId);
}

// ---- scroll hint / halt screen ----------------------------------
const hint = document.getElementById("scroll-hint");
let hintDismissed = false;
function dismissHint() {
  if (hintDismissed) return;
  hintDismissed = true;
  hint.classList.add("gone");
}

const halt = document.getElementById("halt");
document.getElementById("reboot").addEventListener("click", () => {
  setHalt(false);
  rail.jumpTo(0);
});
function setHalt(on) {
  halt.classList.toggle("visible", on);
}

// ---- boot sequence ----------------------------------------------
const bootEl = document.getElementById("boot");
const bootLog = document.getElementById("boot-log");
let booted = false;

const BOOT_LINES = [
  "MAXBIOS v2.6 — (C) 2026 Max Răulea",
  "CPU : curiosity @ 3.7 THz ............ OK",
  "MEM : 6 yrs programming detected ..... OK",
  "SEC : MSc Computer Security .......... ARMED",
  "GPU : three.js r160 / gsap 3 ......... OK",
  "U7  : <no response> .................. SKIP",
  "boot: mounting /dev/portfolio ........ done",
  "",
  "Press any key — or just scroll.",
];

function runBoot() {
  if (reducedMotion) {
    bootLog.textContent = BOOT_LINES.join("\n");
    setTimeout(finishBoot, 350);
    return;
  }
  let i = 0;
  (function next() {
    if (i < BOOT_LINES.length) {
      bootLog.textContent += BOOT_LINES[i++] + "\n";
      setTimeout(next, 110 + Math.random() * 120);
    } else setTimeout(finishBoot, 500);
  })();
}

function finishBoot() {
  if (booted) return;
  booted = true;
  bootEl.classList.add("gone");
  setTimeout(() => bootEl.remove(), 900);
}
bootEl.addEventListener("click", finishBoot);
window.addEventListener("keydown", () => { if (!booted) finishBoot(); }, { once: false });
runBoot();

// ---- resize / visibility ----------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
});

let hidden = false;
document.addEventListener("visibilitychange", () => {
  hidden = document.hidden;
  if (!hidden) { clock.getDelta(); loop(); }
});

// ---- main loop ---------------------------------------------------
const clock = new THREE.Clock();

function loop() {
  if (hidden) return; // resumes on visibilitychange
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);

  rail.update(dt);
  updatePulses(dt);

  if (booted && !rail.locked) {
    const active = rail.activeStop();
    if (active && active.id !== "overview") {
      if (active.id === "end") {
        hidePanel();
        setHalt(true);
        updateNav(null);
      } else {
        setHalt(false);
        if (!isOpenFor(active.id)) showPanel(active.id, { instant: reducedMotion });
        updateNav(active.id);
      }
    } else {
      hidePanel();
      setHalt(false);
      updateNav(null);
    }
  }

  if (composer) composer.render();
  else renderer.render(scene, camera);
}
loop();
