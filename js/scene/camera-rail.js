// ============================================================
// camera-rail.js — one scroll axis, one path.
// Scroll drives `target` (0..1); `progress` eases toward it
// every frame; camera position + lookAt are read off two
// CatmullRom curves whose control points sit exactly at the
// stops (equally spaced t, so curve t == journey t).
// ============================================================

import * as THREE from "three";
import { STOPS } from "./board.js";

// camera waypoint for a stop: above and "behind" (negative z side),
// looking slightly past the component.
function waypointFor(stop) {
  if (stop.id === "overview") {
    return {
      pos: new THREE.Vector3(0, 40, -58),
      look: new THREE.Vector3(0, 0, -6),
    };
  }
  if (stop.id === "end") {
    return {
      pos: new THREE.Vector3(-3, 16, 44),
      look: new THREE.Vector3(0, 0, 10),
    };
  }
  return {
    pos: new THREE.Vector3(stop.x * 0.55 + 2.5, 6.8, stop.z - 8.5),
    look: new THREE.Vector3(stop.x, 0.6, stop.z + 1.5),
  };
}

export class CameraRail {
  constructor(camera, { reducedMotion = false } = {}) {
    this.camera = camera;
    this.target = 0;
    this.progress = 0;
    this.locked = false; // true during easter-egg detour
    this.reducedMotion = reducedMotion;

    const wps = STOPS.map(waypointFor);
    this.posCurve = new THREE.CatmullRomCurve3(wps.map((w) => w.pos), false, "catmullrom", 0.3);
    this.lookCurve = new THREE.CatmullRomCurve3(wps.map((w) => w.look), false, "catmullrom", 0.3);

    this._pos = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this.idleTime = 0;
  }

  addScroll(delta) {
    if (this.locked) return;
    this.target = THREE.MathUtils.clamp(this.target + delta, 0, 1);
    this.idleTime = 0;
  }

  jumpTo(t, instant = false) {
    if (this.locked) return;
    this.target = THREE.MathUtils.clamp(t, 0, 1);
    if (instant || this.reducedMotion) this.progress = this.target;
    this.idleTime = 0;
  }

  nearestStop() {
    let best = STOPS[0];
    for (const s of STOPS) {
      if (Math.abs(s.t - this.target) < Math.abs(best.t - this.target)) best = s;
    }
    return best;
  }

  // stop whose snap zone contains current progress (panel trigger)
  activeStop(threshold = 0.05) {
    for (const s of STOPS) {
      if (Math.abs(this.progress - s.t) < threshold) return s;
    }
    return null;
  }

  update(dt) {
    if (this.locked) return;

    // gentle snap: after a short idle, drift target to nearest stop
    this.idleTime += dt;
    if (this.idleTime > 0.65) {
      const s = this.nearestStop();
      this.target += (s.t - this.target) * Math.min(1, dt * 2.4);
    }

    // ease progress toward target
    if (this.reducedMotion) {
      this.progress = this.target;
    } else {
      const k = 1 - Math.pow(0.0025, dt); // frame-rate independent smoothing
      this.progress += (this.target - this.progress) * k;
    }

    const p = THREE.MathUtils.clamp(this.progress, 0, 1);
    this.posCurve.getPoint(p, this._pos);
    this.lookCurve.getPoint(p, this._look);
    this.camera.position.copy(this._pos);
    this.camera.lookAt(this._look);
  }

  // ---- easter-egg detour -------------------------------------
  detourTo(pos, look, gsap, onArrive) {
    this.locked = true;
    this._savedProgress = this.progress;
    const cam = this.camera;
    const lookProxy = this._look.clone();
    const tl = gsap.timeline({ onComplete: onArrive });
    tl.to(cam.position, { x: pos.x, y: pos.y, z: pos.z, duration: this.reducedMotion ? 0 : 1.4, ease: "power3.inOut" }, 0);
    tl.to(lookProxy, {
      x: look.x, y: look.y, z: look.z,
      duration: this.reducedMotion ? 0 : 1.4,
      ease: "power3.inOut",
      onUpdate: () => cam.lookAt(lookProxy),
    }, 0);
  }

  returnFromDetour(gsap, onDone) {
    const cam = this.camera;
    const p = this._savedProgress ?? this.progress;
    const pos = this.posCurve.getPoint(p, new THREE.Vector3());
    const look = this.lookCurve.getPoint(p, new THREE.Vector3());
    const lookProxy = new THREE.Vector3();
    cam.getWorldDirection(lookProxy).multiplyScalar(10).add(cam.position);
    const tl = gsap.timeline({
      onComplete: () => {
        this.locked = false;
        this.idleTime = 0;
        if (onDone) onDone();
      },
    });
    tl.to(cam.position, { x: pos.x, y: pos.y, z: pos.z, duration: this.reducedMotion ? 0 : 1.1, ease: "power3.inOut" }, 0);
    tl.to(lookProxy, {
      x: look.x, y: look.y, z: look.z,
      duration: this.reducedMotion ? 0 : 1.1,
      ease: "power3.inOut",
      onUpdate: () => cam.lookAt(lookProxy),
    }, 0);
  }
}
