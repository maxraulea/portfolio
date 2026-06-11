// ============================================================
// effects.js — lighting, fog, and data pulses that travel
// along the trace curves. Pulse count scales down on mobile.
// ============================================================

import * as THREE from "three";
import { COLORS } from "./board.js";

export function initLighting(scene) {
  scene.fog = new THREE.FogExp2(0x05070c, 0.008);
  scene.add(new THREE.AmbientLight(0x55687c, 1.9));

  const key = new THREE.DirectionalLight(0xbfe3dc, 1.7);
  key.position.set(8, 24, -10);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x4a6a80, 0.8);
  fill.position.set(-12, 14, 20);
  scene.add(fill);

  // a faint warm light near the end of the board
  const warm = new THREE.PointLight(COLORS.accent, 14, 30);
  warm.position.set(4, 5, 26);
  scene.add(warm);
}

export function initPulses(scene, curves, { mobile = false, reducedMotion = false } = {}) {
  if (reducedMotion) return () => {};

  const perCurve = mobile ? 1 : 2;
  const pulses = [];
  const geo = new THREE.SphereGeometry(0.13, 8, 8);

  curves.forEach((curve, ci) => {
    const n = ci === 0 ? (mobile ? 3 : 5) : perCurve; // more on the main bus
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() < 0.85 ? COLORS.traceGlow : COLORS.accent,
        transparent: true,
        opacity: 0.9,
      });
      const m = new THREE.Mesh(geo, mat);
      scene.add(m);
      pulses.push({
        mesh: m,
        curve,
        t: Math.random(),
        speed: 0.04 + Math.random() * 0.08,
        dir: Math.random() < 0.5 ? 1 : -1,
      });
    }
  });

  const v = new THREE.Vector3();
  return function update(dt) {
    for (const p of pulses) {
      p.t += p.speed * p.dir * dt;
      if (p.t > 1) { p.t = 1; p.dir = -1; }
      if (p.t < 0) { p.t = 0; p.dir = 1; }
      p.curve.getPoint(p.t, v);
      p.mesh.position.copy(v);
      p.mesh.position.y += 0.08;
    }
  };
}
