// ============================================================
// effects.js — lighting, fog, and data pulses that travel
// along the trace curves. Pulse count scales down on mobile.
// ============================================================

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { COLORS } from "./board.js";

// subtle bloom so the emissive traces, pads and pulses get the glow
// halos of a real lit board. Desktop only — mobile keeps the plain
// renderer for performance.
export function initPostFX(renderer, scene, camera, { mobile = false } = {}) {
  if (mobile) return null;
  const rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    samples: 4,
    type: THREE.HalfFloatType,
  });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.45, 0.6)
  );
  composer.addPass(new OutputPass());
  return composer;
}

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
      // main bus pulses stay cyan (the journey line); branch pulses run warm
      const cyanChance = ci === 0 ? 0.85 : 0.35;
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() < cyanChance ? COLORS.traceGlow : COLORS.accent,
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
