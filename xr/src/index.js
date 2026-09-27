import {
  Hovered,
  PokeInteractable,
  Pressed,
  RayInteractable,
  VisibilityState,
  World,
  XRPlane,
  createSystem,
} from '@iwsdk/core';
import {
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';
import projectOptions from 'virtual:iwsdk-project';
import { LINE, PLACE } from './line-data.js';
import { checkLaws, lawCoverage } from './laws.js';
import { FACADE_W, build1867, buildCat, buildFrog, buildSlip1, setOpacity } from './line-layers.js';

const FADE_SECONDS = 0.8;
const WALL_WAIT_SECONDS = 3;
const FALLBACK_DISTANCE = 2.5;
const EYE_TO_FLOOR = 1.6;
const FROG_HOME = new Vector3(1.05, 0, 0.9);

const scan = { planes: [], placedBy: null };
const state = { index: 0, fades: LINE.map((_, i) => (i === 0 ? 1 : 0)), hop: -1 };
const CONF_WORD = { 1: 'documented', 0: 'described from a source', '-1': 'imagined' };

function captionCard() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 300;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const mesh = new Mesh(new PlaneGeometry(0.9, 0.264), new MeshBasicMaterial({ map: texture, transparent: true }));
  const draw = (layer) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1024, 300);
    ctx.fillStyle = 'rgba(16, 12, 8, 0.8)';
    ctx.fillRect(0, 0, 1024, 300);
    ctx.fillStyle = '#f3e6c8';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText(`Out of Time · ${layer.label}`, 28, 60);
    ctx.fillStyle = '#c9b48a';
    ctx.font = '24px Georgia, serif';
    ctx.fillText(`${PLACE} — Honest Record: ${CONF_WORD[layer.conf]}`, 28, 98);
    ctx.fillStyle = '#efe4cc';
    ctx.font = '25px Georgia, serif';
    const words = layer.record.split(' ');
    let line = '';
    let y = 142;
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width > 968 && line) {
        ctx.fillText(line, 28, y);
        y += 33;
        line = w;
      } else line = next;
    }
    if (line) ctx.fillText(line, 28, y);
    texture.needsUpdate = true;
  };
  return { mesh, draw };
}

const up = new Vector3(0, 1, 0);

World.create(document.getElementById('scene-container'), projectOptions).then((world) => {
  const root = new Group();
  const rootEntity = world.createTransformEntity(root, { persistent: true });

  const layers = { c1867: build1867(), slip1: buildSlip1() };
  for (const g of Object.values(layers)) {
    setOpacity(g, 0);
    root.add(g);
  }
  const cat = buildCat();
  cat.position.set(0, 0.03, 0.8);
  setOpacity(cat, 0);
  root.add(cat);

  const caption = captionCard();
  caption.mesh.position.set(-1.05, 1.3, 1.1);
  caption.mesh.rotation.y = 0.25;
  root.add(caption.mesh);
  caption.draw(LINE[0]);

  const frog = buildFrog();
  const frogEntity = world.createTransformEntity(frog, { parent: rootEntity, persistent: true });
  frog.position.copy(FROG_HOME);
  frog.rotation.y = -0.5;
  frogEntity.addComponent(RayInteractable);
  frogEntity.addComponent(PokeInteractable);

  const step = () => {
    if (state.hop >= 0) return;
    state.hop = 0;
    state.index = (state.index + 1) % LINE.length;
    caption.draw(LINE[state.index]);
  };

  const placeInBrowser = () => {
    // Flat-screen preview only: stand back far enough to see the ground and the Frog.
    root.position.set(0, 0.25, -4.8);
    root.rotation.set(0, 0, 0);
  };
  placeInBrowser();

  // Place the facade frame: origin on the wall at ground level, +z toward the viewer.
  const placeFrame = (pos, normal) => {
    root.position.copy(pos);
    root.lookAt(pos.clone().add(normal));
  };

  class PlacementSystem extends createSystem({ planes: { required: [XRPlane] } }) {
    init() {
      this.placed = false;
      this.sessionStart = null;
      this.cleanupFuncs.push(
        this.world.visibilityState.subscribe((v) => {
          if (v === VisibilityState.NonImmersive) {
            this.placed = false;
            this.sessionStart = null;
            placeInBrowser();
          }
        }),
      );
    }

    update(_delta, time) {
      if (!this.world.session || this.placed) return;
      if (this.sessionStart === null) this.sessionStart = time;
      const head = this.world.camera.getWorldPosition(new Vector3());
      const facing = this.world.camera.getWorldDirection(new Vector3()).setY(0).normalize();
      let wall = null;
      let floorY = null;
      scan.planes = [];
      for (const entity of this.queries.planes.entities) {
        const plane = entity.getValue(XRPlane, '_plane');
        const obj = entity.object3D;
        if (!plane || !obj) continue;
        const origin = obj.getWorldPosition(new Vector3());
        const label = plane.semanticLabel;
        scan.planes.push({ o: plane.orientation, label: label ?? null, y: +origin.y.toFixed(2), d: +head.distanceTo(origin).toFixed(2) });
        if (plane.orientation === 'horizontal') {
          if ((!label || label === 'floor') && head.y - origin.y > 1) {
            floorY = floorY === null ? origin.y : Math.min(floorY, origin.y);
          }
          continue;
        }
        if (plane.orientation !== 'vertical' || (label && label !== 'wall')) continue;
        const q = obj.getWorldQuaternion(obj.quaternion.clone());
        const normal = up.clone().applyQuaternion(q);
        let dist = head.clone().sub(origin).dot(normal);
        // Plane +Y may point into the wall (it does in IWER): face it toward the viewer.
        if (dist < 0) {
          normal.negate();
          dist = -dist;
        }
        scan.planes[scan.planes.length - 1].signed = +dist.toFixed(2);
        if (dist < 1.2 || dist > 8) continue;
        // Only a wall the viewer is facing (within ~60 degrees): the facade goes in front, not behind.
        const square = facing.dot(normal.clone().setY(0).normalize().negate());
        if (square < 0.5) continue;
        // Prefer the wall most squarely ahead; distance only breaks near-ties.
        const score = square - 0.05 * dist;
        if (!wall || score > wall.score) wall = { obj, plane, normal, dist, q, score };
      }
      if (wall && (floorY !== null || time - this.sessionStart > WALL_WAIT_SECONDS)) {
        // Centre the facade where the viewer is looking: gaze ray meets the wall plane.
        const flatNormal = wall.normal.clone().setY(0).normalize();
        const along = facing.dot(flatNormal.clone().negate());
        const pos = head.clone().addScaledVector(facing, wall.dist / Math.max(along, 0.5));
        // Keep the facade inside the detected wall's width (plane-local x or z).
        const local = wall.obj.worldToLocal(pos.clone());
        const xWorld = new Vector3(1, 0, 0).applyQuaternion(wall.q);
        const axis = Math.abs(xWorld.y) < 0.7 ? 'x' : 'z';
        const polygon = wall.plane.polygon || [];
        if (polygon.length > 0) {
          let min = Infinity;
          let max = -Infinity;
          for (const p of polygon) {
            min = Math.min(min, p[axis]);
            max = Math.max(max, p[axis]);
          }
          scan.wallWidth = +(max - min).toFixed(2);
          const lo = min + FACADE_W / 2;
          const hi = max - FACADE_W / 2;
          local[axis] = lo <= hi ? Math.min(Math.max(local[axis], lo), hi) : (min + max) / 2;
        }
        pos.copy(wall.obj.localToWorld(local));
        pos.y = floorY ?? head.y - EYE_TO_FLOOR;
        placeFrame(pos, wall.normal.clone().setY(0).normalize());
        scan.placedBy = { by: 'wall', dist: +wall.dist.toFixed(2), label: wall.plane.semanticLabel ?? null, floorY, facingDot: +facing.dot(pos.clone().sub(head).setY(0).normalize()).toFixed(2) };
        this.placed = true;
        return;
      }
      if (time - this.sessionStart < WALL_WAIT_SECONDS) return;
      // No wall: stand the facade frame 2.5 m ahead, facing the viewer.
      const forward = this.world.camera.getWorldDirection(new Vector3());
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
      forward.normalize();
      const pos = head.clone().addScaledVector(forward, FALLBACK_DISTANCE);
      pos.y = floorY ?? head.y - EYE_TO_FLOOR;
      placeFrame(pos, forward.clone().negate());
      scan.placedBy = { by: 'fallback', floorY };
      this.placed = true;
    }
  }

  class FrogSystem extends createSystem({
    pressed: { required: [RayInteractable, Pressed] },
    hovered: { required: [RayInteractable, Hovered] },
  }) {
    init() {
      // Act on release, like a button: the Frog hops away from under the ray,
      // so stepping on press-start left the press hanging (seen in IWER).
      this.queries.pressed.subscribe('disqualify', step);
    }

    update() {
      scan.frogHovered = this.queries.hovered.entities.size > 0;
      if (scan.frogHovered) scan.everHovered = true;
    }
  }

  class LineSystem extends createSystem({}) {
    update(delta, time) {
      const current = LINE[state.index].id;
      LINE.forEach((layer, i) => {
        const target = i === state.index ? 1 : 0;
        const s = delta / FADE_SECONDS;
        state.fades[i] += Math.max(-s, Math.min(s, target - state.fades[i]));
        if (layers[layer.id]) setOpacity(layers[layer.id], state.fades[i]);
      });

      // Lantern flicker, drifting motes and fog, the door in the air.
      layers.c1867.traverse((o) => {
        if (o.userData.flicker !== undefined) o.material.opacity = o.material.userData.baseOpacity * state.fades[1] * (0.8 + 0.2 * Math.sin(time * 9 + o.userData.flicker));
      });
      layers.slip1.traverse((o) => {
        const d = o.userData.drift;
        if (d) o.position.set(d.base.x + Math.sin(time * 0.4 + d.phase) * d.amp, d.base.y + Math.sin(time * 0.7 + d.phase) * d.amp * 0.6, d.base.z + Math.cos(time * 0.3 + d.phase) * d.amp);
        if (o.userData.bob) {
          o.position.y = 0.15 + Math.sin(time * 0.8) * 0.05;
          o.rotation.y = Math.sin(time * 0.3) * 0.4;
        }
      });

      // The cat walks the board walk in 1867; sideways it is and is not.
      const walkX = Math.sin(time * 0.18) * 1.2;
      const dir = Math.cos(time * 0.18) >= 0 ? 1 : -1;
      cat.position.x = walkX;
      cat.rotation.y = dir > 0 ? 0 : Math.PI;
      cat.userData.legs.forEach((leg, i) => { leg.rotation.z = Math.sin(time * 8 + (i % 2) * Math.PI) * 0.35; });
      cat.userData.tail.rotation.x = Math.sin(time * 2) * 0.4;
      let catOpacity = current === 'c1867' ? state.fades[1] : 0;
      if (current === 'slip1') catOpacity = Math.sin(time * 3.1) * Math.sin(time * 1.7) > 0.15 ? state.fades[2] : 0;
      setOpacity(cat, catOpacity);

      // The Frog breathes, and hops when touched.
      if (state.hop >= 0) {
        state.hop += delta / 0.6;
        const t = Math.min(state.hop, 1);
        frog.position.y = Math.sin(t * Math.PI) * 0.35;
        frog.rotation.y = -0.5 + t * Math.PI * 2;
        if (state.hop >= 1) {
          state.hop = -1;
          frog.position.y = 0;
          frog.rotation.y = -0.5;
        }
      } else {
        frog.scale.setScalar(1 + Math.sin(time * 2.2) * 0.03);
      }
    }
  }

  world.registerSystem(PlacementSystem);
  world.registerSystem(FrogSystem);
  world.registerSystem(LineSystem);

  // Headless verification hook (no effect on play).
  window.__outOfTime = {
    layer: () => LINE[state.index].id,
    session: () => !!world.session,
    laws: () => {
      root.updateMatrixWorld(true);
      return checkLaws({ scene: world.scene, root, layers, line: LINE });
    },
    lawCoverage: () => lawCoverage(layers),
    // Mutation seed for testing the law machine itself: adds a full-frame sheet.
    seedVeil: () => {
      const veil = new Mesh(new PlaneGeometry(3, 2), new MeshBasicMaterial({ transparent: true, opacity: 0.2 }));
      veil.position.set(0, 1.2, 1.5);
      layers.slip1.add(veil);
      return () => layers.slip1.remove(veil);
    },
    scan: () => JSON.parse(JSON.stringify(scan)),
    placedAt: () => root.getWorldPosition(new Vector3()).toArray().map((v) => +v.toFixed(2)),
    step,
    frogWorld: () => frog.getWorldPosition(new Vector3()).toArray(),
    frogScreen: () => {
      const p = frog.getWorldPosition(new Vector3()).add(new Vector3(0, 0.1, 0)).project(world.camera);
      return [(p.x + 1) / 2 * window.innerWidth, (1 - p.y) / 2 * window.innerHeight];
    },
  };

  const button = document.getElementById('enter-ar');
  const note = document.getElementById('enter-note');
  button.addEventListener('click', () => world.launchXR());
  const supported = navigator.xr?.isSessionSupported?.('immersive-ar') ?? Promise.resolve(false);
  supported
    .catch(() => false)
    .then((ok) => {
      button.disabled = !ok;
      note.textContent = ok
        ? 'Put on the headset. Touch the Golden Frog to step along the line.'
        : 'Enter AR needs a WebXR headset (Meta Quest 3 / 3S browser). Click the Golden Frog to step along the line here.';
    });
});
