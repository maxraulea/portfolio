// ============================================================
// board.js — builds the stylized PCB procedurally.
// No external 3D models. Everything is boxes, cylinders and
// canvas-texture "silkscreen" text.
//
// You normally never need to edit this file to change content.
// ============================================================

import * as THREE from "three";

// ---- palette --------------------------------------------------
export const COLORS = {
  substrate: 0x0e1626, // dark blue-grey, like the reference board
  substrateEdge: 0x060a12,
  trace: 0xc9a86a, // gold — exposed copper/ENIG look on a dark board
  traceBus: 0x123c3a, // dark base under the glowing main-bus trace
  traceHidden: 0x6e5a33, // dim gold for the U7 hint branch
  traceGlow: 0x3fe0c5, // cyan/teal
  accent: 0xffb454, // warm amber
  pad: 0xc9a86a, // gold-ish
  component: 0x10182a,
  componentEdge: 0x2a3a52,
  silkscreen: 0xbfe9e0,
  hidden: 0x0d1320, // U7, deliberately dim
};

// ---- the journey: stop definitions ---------------------------
// t values are equally spaced so the CatmullRom camera curve
// passes exactly through each stop's waypoint.
export const STOPS = [
  { id: "overview", t: 0 / 6, label: "BOOT", silk: "", x: 0, z: -34 },
  { id: "about", t: 1 / 6, label: "U1 · BIOS — about", silk: "U1 BIOS", x: -5, z: -20 },
  { id: "experience", t: 2 / 6, label: "U2 · RAM — experience", silk: "U2 RAM", x: 4, z: -8 },
  { id: "projects", t: 3 / 6, label: "U3 · CPU — projects", silk: "U3 CPU", x: 0, z: 4 },
  { id: "security", t: 4 / 6, label: "U4 · JTAG — security", silk: "U4 JTAG", x: -6, z: 16 },
  { id: "contact", t: 5 / 6, label: "U5 · M.2 — contact", silk: "U5 M.2", x: 4, z: 26 },
  { id: "end", t: 6 / 6, label: "HALT", silk: "", x: 0, z: 34 },
];

export const U7_POS = { x: -10.5, z: 30.5 };

// silkscreen title sits beside the main bus so no trace crosses the text
const TITLE_POS = { x: 6, z: -29 };

const BOARD = { w: 26, l: 70, h: 0.8, top: 0.4 };

// ---------------------------------------------------------------
// helpers
// ---------------------------------------------------------------
function silkscreenTexture(text, w = 512, h = 128, size = 68, color = "#bfe9e0") {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const font = (px) => `bold ${px}px ui-monospace, Menlo, Consolas, monospace`;
  // shrink long labels to fit instead of clipping at the canvas edge
  ctx.font = font(size);
  const tw = ctx.measureText(text).width;
  if (tw > w - 24) size = Math.floor((size * (w - 24)) / tw);
  ctx.font = font(size);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function silkLabel(text, width = 3.2, opacity = 0.85) {
  const tex = silkscreenTexture(text);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const geo = new THREE.PlaneGeometry(width, width / 4);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = Math.PI; // text top points +z, upright for the rail cameras
  mesh.position.y = BOARD.top + 0.015;
  return mesh;
}

function box(w, h, d, color, emissive = 0x000000, ei = 0) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.35,
    emissive,
    emissiveIntensity: ei,
  });
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

function edgeGlow(mesh, color = COLORS.traceGlow, opacity = 0.6) {
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  mesh.add(line);
  return line;
}

// ---------------------------------------------------------------
// component builders — each returns a THREE.Group at origin
// ---------------------------------------------------------------
function buildBIOS() {
  const g = new THREE.Group();
  const body = box(2.2, 0.5, 2.2, COLORS.component, COLORS.traceGlow, 0.06);
  body.position.y = BOARD.top + 0.25;
  edgeGlow(body);
  g.add(body);
  // pins on two sides
  for (let i = 0; i < 4; i++) {
    for (const s of [-1, 1]) {
      const pin = box(0.18, 0.12, 0.4, COLORS.pad);
      pin.position.set(-0.85 + i * 0.56, BOARD.top + 0.06, s * 1.3);
      g.add(pin);
    }
  }
  // dot marker (pin 1)
  const dot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16),
    new THREE.MeshBasicMaterial({ color: COLORS.accent })
  );
  dot.position.set(-0.75, BOARD.top + 0.53, -0.75);
  g.add(dot);
  return g;
}

function buildRAM() {
  const g = new THREE.Group();
  for (const dx of [-0.8, 0.8]) {
    const stick = box(0.9, 1.6, 5.4, COLORS.component, COLORS.traceGlow, 0.05);
    stick.position.set(dx, BOARD.top + 0.8, 0);
    edgeGlow(stick, COLORS.traceGlow, 0.45);
    g.add(stick);
    // memory chips on the stick
    for (let i = 0; i < 4; i++) {
      const chip = box(0.95, 0.7, 0.9, 0x16223a, COLORS.traceGlow, 0.12);
      chip.position.set(dx, BOARD.top + 0.95, -1.9 + i * 1.25);
      g.add(chip);
    }
    // gold edge connector
    const conn = box(0.92, 0.18, 5.2, COLORS.pad);
    conn.position.set(dx, BOARD.top + 0.09, 0);
    g.add(conn);
  }
  return g;
}

function buildCPU() {
  const g = new THREE.Group();
  // socket
  const socket = box(4.6, 0.25, 4.6, 0x101a2e);
  socket.position.y = BOARD.top + 0.125;
  g.add(socket);
  // pin grid
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (i > 0 && i < 7 && j > 0 && j < 7) continue;
      const pin = box(0.16, 0.1, 0.16, COLORS.pad);
      pin.position.set(-1.85 + i * 0.53, BOARD.top + 0.3, -1.85 + j * 0.53);
      g.add(pin);
    }
  }
  // heatspreader
  const hs = box(3.4, 0.5, 3.4, 0x1a2640, COLORS.traceGlow, 0.1);
  hs.position.y = BOARD.top + 0.55;
  edgeGlow(hs, COLORS.traceGlow, 0.7);
  g.add(hs);
  // engraving glow line
  const ring = box(2.4, 0.04, 2.4, COLORS.traceGlow, COLORS.traceGlow, 0.9);
  ring.position.y = BOARD.top + 0.82;
  g.add(ring);
  const core = box(1.7, 0.05, 1.7, 0x0a0f1c);
  core.position.y = BOARD.top + 0.84;
  g.add(core);
  return g;
}

function buildJTAG() {
  const g = new THREE.Group();
  const base = box(3.0, 0.3, 1.1, COLORS.component);
  base.position.y = BOARD.top + 0.15;
  g.add(base);
  for (let i = 0; i < 5; i++) {
    for (const dz of [-0.28, 0.28]) {
      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.9, 8),
        new THREE.MeshStandardMaterial({
          color: COLORS.pad,
          metalness: 0.8,
          roughness: 0.3,
          emissive: COLORS.accent,
          emissiveIntensity: 0.15,
        })
      );
      pin.position.set(-1.1 + i * 0.55, BOARD.top + 0.75, dz);
      g.add(pin);
    }
  }
  return g;
}

function buildM2() {
  const g = new THREE.Group();
  const stick = box(1.6, 0.22, 6.0, 0x101a2e, COLORS.traceGlow, 0.05);
  stick.position.y = BOARD.top + 0.21;
  edgeGlow(stick, COLORS.traceGlow, 0.4);
  g.add(stick);
  // NAND chips
  for (let i = 0; i < 3; i++) {
    const chip = box(1.1, 0.18, 1.3, COLORS.component, COLORS.traceGlow, 0.14);
    chip.position.set(0, BOARD.top + 0.4, -1.7 + i * 1.7);
    g.add(chip);
  }
  // gold connector + screw
  const conn = box(1.4, 0.1, 0.5, COLORS.pad);
  conn.position.set(0, BOARD.top + 0.2, -3.0);
  g.add(conn);
  const screw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.15, 12),
    new THREE.MeshStandardMaterial({ color: 0x8a8f9a, metalness: 0.9, roughness: 0.4 })
  );
  screw.position.set(0, BOARD.top + 0.4, 2.9);
  g.add(screw);
  return g;
}

function buildU7() {
  const g = new THREE.Group();
  const body = box(0.9, 0.28, 0.9, COLORS.hidden);
  body.position.y = BOARD.top + 0.14;
  g.add(body);
  for (let i = 0; i < 3; i++) {
    for (const s of [-1, 1]) {
      const pin = box(0.1, 0.06, 0.18, 0x3a3f4a);
      pin.position.set(-0.25 + i * 0.25, BOARD.top + 0.03, s * 0.52);
      g.add(pin);
    }
  }
  const lbl = silkLabel("U7", 0.8, 0.16); // barely visible — that's the point
  lbl.position.set(0, BOARD.top + 0.016, 0.85);
  g.add(lbl);
  return g;
}

function buildDecorations(group, lite) {
  const rng = mulberry32(1337);
  // shared materials for the warm "powered-on" details
  const litPadMat = new THREE.MeshStandardMaterial({
    color: COLORS.pad,
    emissive: COLORS.accent,
    emissiveIntensity: 1.1,
    metalness: 0.6,
    roughness: 0.4,
  });
  const darkPadMat = new THREE.MeshStandardMaterial({ color: COLORS.pad, metalness: 0.8, roughness: 0.35 });

  // capacitors
  for (let i = 0; i < 26; i++) {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.7 + rng() * 0.5, 12),
      new THREE.MeshStandardMaterial({
        color: 0x141d30,
        roughness: 0.5,
        metalness: 0.4,
        emissive: COLORS.traceGlow,
        emissiveIntensity: 0.04,
      })
    );
    const x = -11.5 + rng() * 23;
    const z = -31 + rng() * 62;
    if (nearStop(x, z, 4.2)) continue;
    cap.position.set(x, BOARD.top + 0.35, z);
    group.add(cap);
  }

  // small resistors / chips, most with glowing solder caps at the ends
  const capGeo = new THREE.BoxGeometry(0.13, 0.13, 0.26);
  for (let i = 0; i < 60; i++) {
    const r = box(0.5, 0.12, 0.24, rng() > 0.5 ? 0x1a2236 : 0x222a3e);
    const x = -12 + rng() * 24;
    const z = -32 + rng() * 64;
    const rotated = rng() > 0.5;
    const lit = rng() < 0.6;
    if (nearStop(x, z, 3.6)) continue;
    r.position.set(x, BOARD.top + 0.06, z);
    r.rotation.y = rotated ? Math.PI / 2 : 0;
    group.add(r);
    for (const s of [-1, 1]) {
      const cap = new THREE.Mesh(capGeo, lit ? litPadMat : darkPadMat);
      cap.rotation.y = rotated ? 0 : Math.PI / 2;
      cap.position.set(x + (rotated ? 0 : s * 0.3), BOARD.top + 0.065, z + (rotated ? s * 0.3 : 0));
      group.add(cap);
    }
  }

  // medium QFP-style chips with rows of glowing pins on two sides
  const pinGeo = new THREE.BoxGeometry(0.1, 0.06, 0.22);
  for (let i = 0, want = lite ? 4 : 8; i < 20 && want > 0; i++) {
    const w = 1.2 + rng() * 1.2;
    const x = -11 + rng() * 22;
    const z = -31 + rng() * 62;
    if (nearStop(x, z, 4.0)) continue;
    want--;
    const chip = box(w, 0.3, w, COLORS.component, COLORS.traceGlow, 0.04);
    chip.position.set(x, BOARD.top + 0.15, z);
    edgeGlow(chip, COLORS.traceGlow, 0.2);
    group.add(chip);
    const n = Math.max(3, Math.floor(w / 0.3));
    const lit = rng() < 0.7;
    for (let k = 0; k < n; k++) {
      const off = -((n - 1) * 0.28) / 2 + k * 0.28;
      for (const s of [-1, 1]) {
        const pin = new THREE.Mesh(pinGeo, lit && rng() < 0.8 ? litPadMat : darkPadMat);
        pin.position.set(x + off, BOARD.top + 0.05, z + s * (w / 2 + 0.13));
        group.add(pin);
      }
    }
  }

  // scattered glowing micro-vias — the "stars" all over the reference board
  const viaGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 8);
  const viaLit = new THREE.MeshBasicMaterial({ color: COLORS.accent });
  for (let i = 0, want = lite ? 22 : 45; i < 120 && want > 0; i++) {
    const x = -12 + rng() * 24;
    const z = -32 + rng() * 64;
    if (nearStop(x, z, 2.8)) continue;
    want--;
    const v = new THREE.Mesh(viaGeo, rng() < 0.45 ? viaLit : darkPadMat);
    v.position.set(x, BOARD.top + 0.03, z);
    group.add(v);
  }
}

function nearStop(x, z, d) {
  for (const s of STOPS) {
    if (Math.hypot(s.x - x, s.z - z) < d) return true;
  }
  if (Math.hypot(U7_POS.x - x, U7_POS.z - z) < 2.5) return true;
  if (Math.hypot(TITLE_POS.x - x, TITLE_POS.z - z) < 5.6) return true;
  return false;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------
// traces — one main bus connecting the stops + branches
// ---------------------------------------------------------------
function buildTraces(group) {
  const curves = [];
  const pts = STOPS.slice(1, 6).map((s) => new THREE.Vector3(s.x, BOARD.top + 0.03, s.z));
  // main bus through the five component stops
  const main = new THREE.CatmullRomCurve3(
    [new THREE.Vector3(0, BOARD.top + 0.03, -30), ...pts, new THREE.Vector3(0, BOARD.top + 0.03, 31)],
    false,
    "catmullrom",
    0.2
  );
  curves.push(main);

  // decorative branches
  const rng = mulberry32(42);
  for (let i = 0; i < 14; i++) {
    const a = pts[Math.floor(rng() * pts.length)];
    const end = new THREE.Vector3(
      THREE.MathUtils.clamp(a.x + (rng() - 0.5) * 16, -12, 12),
      BOARD.top + 0.03,
      THREE.MathUtils.clamp(a.z + (rng() - 0.5) * 20, -31, 31)
    );
    const mid = new THREE.Vector3(end.x, BOARD.top + 0.03, a.z); // 90° style bend
    curves.push(new THREE.CatmullRomCurve3([a.clone(), mid, end], false, "catmullrom", 0.05));
  }
  // one faint branch sneaks toward U7 — the only hint it exists
  curves.push(
    new THREE.CatmullRomCurve3(
      [
        pts[4].clone(),
        new THREE.Vector3(U7_POS.x, BOARD.top + 0.03, pts[4].z),
        new THREE.Vector3(U7_POS.x, BOARD.top + 0.03, U7_POS.z),
      ],
      false,
      "catmullrom",
      0.05
    )
  );

  for (let i = 0; i < curves.length; i++) {
    const isMain = i === 0;
    const isU7 = i === curves.length - 1;
    const tube = new THREE.TubeGeometry(curves[i], isMain ? 200 : 40, isMain ? 0.09 : isU7 ? 0.05 : 0.075, 6, false);
    // main bus keeps the cyan journey glow; branches are gold metal,
    // the U7 branch stays deliberately dim
    const mat = isMain
      ? new THREE.MeshStandardMaterial({
          color: COLORS.traceBus,
          emissive: COLORS.traceGlow,
          emissiveIntensity: 0.5,
          roughness: 0.4,
          metalness: 0.2,
        })
      : new THREE.MeshStandardMaterial({
          color: isU7 ? COLORS.traceHidden : COLORS.trace,
          emissive: COLORS.accent,
          emissiveIntensity: isU7 ? 0.03 : 0.18,
          roughness: 0.35,
          metalness: 0.75,
        });
    group.add(new THREE.Mesh(tube, mat));
  }

  // gold vias where branches start and end — sells the hand-routed look
  // (main bus and the U7 hint branch deliberately get none)
  const viaGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.05, 10);
  const viaMat = new THREE.MeshStandardMaterial({ color: COLORS.pad, metalness: 0.8, roughness: 0.35 });
  for (let i = 1; i < curves.length - 1; i++) {
    for (const t of [0, 1]) {
      const p = curves[i].getPoint(t);
      const via = new THREE.Mesh(viaGeo, viaMat);
      via.position.set(p.x, BOARD.top + 0.03, p.z);
      group.add(via);
    }
  }
  return curves;
}

// ---------------------------------------------------------------
// scatter traces — dense decorative copper routing with 45° bends,
// like real PCB autorouting. Static (no pulses), gold, glowing
// solder dots at the endpoints.
// ---------------------------------------------------------------
function rot45(dir, turn) {
  const c = Math.SQRT1_2;
  return [dir[0] * c - turn * dir[1] * c, turn * dir[0] * c + dir[1] * c];
}

// walk 2–4 segments from a random start, turning ±45° between them
function routedPath(rng) {
  let x = -12 + rng() * 24;
  let z = -32 + rng() * 64;
  if (nearStop(x, z, 3.2)) return null;
  let dir = [[1, 0], [-1, 0], [0, 1], [0, -1]][(rng() * 4) | 0];
  const pts = [[x, z]];
  const nseg = 2 + ((rng() * 3) | 0);
  for (let s = 0; s < nseg; s++) {
    const len = 1.4 + rng() * 3.8;
    x += dir[0] * len;
    z += dir[1] * len;
    if (x < -12.4 || x > 12.4 || z < -32.4 || z > 32.4 || nearStop(x, z, 3.2)) break;
    pts.push([x, z]);
    dir = rot45(dir, rng() < 0.5 ? 1 : -1);
  }
  return pts.length >= 3 ? pts : null;
}

// offset a polyline sideways (xz plane) — used for parallel bus bundles
function offsetPath(pts, d) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const tx = next[0] - prev[0];
    const tz = next[1] - prev[1];
    const len = Math.hypot(tx, tz) || 1;
    out.push([pts[i][0] - (tz / len) * d, pts[i][1] + (tx / len) * d]);
  }
  return out;
}

function buildScatterTraces(group, lite) {
  const rng = mulberry32(7);
  const traceMat = new THREE.MeshStandardMaterial({
    color: COLORS.trace,
    emissive: COLORS.accent,
    emissiveIntensity: 0.22,
    roughness: 0.35,
    metalness: 0.75,
  });
  const dotGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 8);
  const dotBright = new THREE.MeshBasicMaterial({ color: COLORS.accent });
  const dotDim = new THREE.MeshStandardMaterial({ color: COLORS.pad, metalness: 0.8, roughness: 0.35 });

  const addTube = (pts2d, radius) => {
    const v = pts2d.map(([x, z]) => new THREE.Vector3(x, BOARD.top + 0.03, z));
    const curve = new THREE.CatmullRomCurve3(v, false, "catmullrom", 0.02);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, v.length * 8, radius, 5, false), traceMat));
  };
  const addDot = ([x, z], bright) => {
    const m = new THREE.Mesh(dotGeo, bright ? dotBright : dotDim);
    m.position.set(x, BOARD.top + 0.04, z);
    group.add(m);
  };

  const maxSingle = lite ? 26 : 52;
  const maxBundles = lite ? 3 : 6;
  let single = 0;
  let bundles = 0;
  for (let tries = 0; tries < 400 && (single < maxSingle || bundles < maxBundles); tries++) {
    const path = routedPath(rng);
    if (!path) continue;
    if (bundles < maxBundles && rng() < 0.18) {
      // bus bundle: a few parallel lanes
      for (const lane of [-0.2, 0, 0.2]) addTube(lane ? offsetPath(path, lane) : path, 0.035);
      bundles++;
    } else if (single < maxSingle) {
      addTube(path, 0.04);
      single++;
    } else continue;
    addDot(path[0], rng() < 0.45);
    addDot(path[path.length - 1], rng() < 0.45);
  }
}

// ---------------------------------------------------------------
// main entry
// ---------------------------------------------------------------
export function buildBoard({ mobile = false } = {}) {
  const group = new THREE.Group();

  // substrate
  const sub = new THREE.Mesh(
    new THREE.BoxGeometry(BOARD.w, BOARD.h, BOARD.l),
    new THREE.MeshStandardMaterial({ color: COLORS.substrate, roughness: 0.85, metalness: 0.15 })
  );
  group.add(sub);
  edgeGlow(sub, COLORS.traceGlow, 0.25);

  // faint grid on top — warm gold-grey, like unplated copper hatching
  const grid = new THREE.GridHelper(64, 64, 0x4a3d26, 0x2a2316);
  grid.position.y = BOARD.top + 0.005;
  grid.material.transparent = true;
  grid.material.opacity = 0.3;
  group.add(grid);

  // mounting holes
  for (const [hx, hz] of [[-11.8, -33], [11.8, -33], [-11.8, 33], [11.8, 33]]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.12, 8, 24),
      new THREE.MeshStandardMaterial({ color: COLORS.pad, metalness: 0.8, roughness: 0.35 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(hx, BOARD.top + 0.02, hz * (BOARD.l / 70));
    group.add(ring);
  }

  const traceCurves = buildTraces(group);
  buildScatterTraces(group, mobile);

  // components at stops
  const builders = {
    about: buildBIOS,
    experience: buildRAM,
    projects: buildCPU,
    security: buildJTAG,
    contact: buildM2,
  };
  const componentGroups = {};
  for (const stop of STOPS) {
    const build = builders[stop.id];
    if (!build) continue;
    const comp = build();
    comp.position.set(stop.x, 0, stop.z);
    comp.userData.stopId = stop.id;
    comp.traverse((o) => (o.userData.stopId = stop.id));
    group.add(comp);
    componentGroups[stop.id] = comp;

    const lbl = silkLabel(stop.silk);
    lbl.position.set(stop.x, BOARD.top + 0.02, stop.z + 3.6);
    group.add(lbl);
  }

  // hidden U7
  const u7 = buildU7();
  u7.position.set(U7_POS.x, 0, U7_POS.z);
  u7.userData.stopId = "u7";
  u7.traverse((o) => (o.userData.stopId = "u7"));
  group.add(u7);

  // board silkscreen title
  const title = silkLabel("PORTFOLIO · MAX RAULEA", 10, 0.6);
  title.position.set(TITLE_POS.x, BOARD.top + 0.02, TITLE_POS.z);
  group.add(title);

  buildDecorations(group, mobile);

  return { group, traceCurves, componentGroups, u7 };
}
