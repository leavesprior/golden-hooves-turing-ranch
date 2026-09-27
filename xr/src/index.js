import {
  AssetManager,
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
  CircleGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';
import projectOptions from 'virtual:iwsdk-project';
import { PLACE_LINE, PLATES } from './plate-data.js';

// Life-size plate: 2.4 m x 1.35 m (16:9, same as the 1600x900 source).
const PANEL_W = 2.4;
const PANEL_H = 1.35;
const FADE_SECONDS = 0.35;
const WALL_WAIT_SECONDS = 3;
const FALLBACK_DISTANCE = 1.5;

const state = { showThen: false, fade: 0 };

function textCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { canvas, texture };
}

function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCaption(caption, plate) {
  const { canvas, texture } = caption;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(20, 14, 8, 0.82)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f3e6c8';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(`Out of Time · ${plate.year}`, 32, 64);
  ctx.fillStyle = '#c9b48a';
  ctx.font = '26px Georgia, serif';
  ctx.fillText(PLACE_LINE, 32, 104);
  ctx.fillStyle = '#efe4cc';
  ctx.font = '26px Georgia, serif';
  wrap(ctx, plate.line, canvas.width - 64).forEach((l, i) => {
    ctx.fillText(l, 32, 150 + i * 34);
  });
  texture.needsUpdate = true;
}

function drawToggle(toggle, label) {
  const { canvas, texture } = toggle;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#7a1f1a';
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8c872';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.fillStyle = '#fff4dc';
  ctx.font = 'bold 60px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, 128);
  texture.needsUpdate = true;
}

function plateTexture(key) {
  const texture = AssetManager.getTexture(key);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function buildPanel(world) {
  const root = new Group();
  const panel = world.createTransformEntity(root, { persistent: true });

  const geometry = new PlaneGeometry(PANEL_W, PANEL_H);
  root.add(
    new Mesh(geometry, new MeshBasicMaterial({ map: plateTexture(PLATES.today.asset) })),
  );
  // The 1885 plate sits 2 mm in front and fades in/out over the Today plate.
  const thenMaterial = new MeshBasicMaterial({
    map: plateTexture(PLATES.then.asset),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const thenMesh = new Mesh(geometry, thenMaterial);
  thenMesh.position.z = 0.002;
  root.add(thenMesh);

  const caption = textCanvas(1024, 320);
  const captionMesh = new Mesh(
    new PlaneGeometry(1.2, 0.375),
    new MeshBasicMaterial({ map: caption.texture, transparent: true }),
  );
  captionMesh.position.set(-PANEL_W / 2 + 0.6, -PANEL_H / 2 - 0.21, 0.004);
  root.add(captionMesh);

  // Floating control: a 12 cm disc, 15 cm off the plate toward the viewer.
  // Pinch (hand ray), poke (fingertip), controller trigger or mouse click.
  const toggle = textCanvas(256, 256);
  const toggleMesh = new Mesh(
    new CircleGeometry(0.06, 32),
    new MeshBasicMaterial({ map: toggle.texture, transparent: true }),
  );
  const toggleEntity = world.createTransformEntity(toggleMesh, { parent: panel, persistent: true });
  toggleMesh.position.set(PANEL_W / 2 - 0.12, -PANEL_H / 2 - 0.12, 0.15);
  toggleEntity.addComponent(RayInteractable);
  toggleEntity.addComponent(PokeInteractable);

  const refresh = () => {
    const plate = state.showThen ? PLATES.then : PLATES.today;
    drawCaption(caption, plate);
    drawToggle(toggle, state.showThen ? 'Today' : '1885');
  };
  refresh();

  return { root, thenMaterial, toggleMesh, refresh };
}

const up = new Vector3(0, 1, 0);
const tmpA = new Vector3();
const tmpB = new Vector3();

World.create(document.getElementById('scene-container'), projectOptions).then((world) => {
  const view = buildPanel(world);

  const placeInBrowser = () => {
    view.root.position.set(0, 1.5, -2.2);
    view.root.rotation.set(0, 0, 0);
  };
  placeInBrowser();

  const faceHead = (position, head) => {
    view.root.position.copy(position);
    tmpA.set(head.x, position.y, head.z);
    view.root.lookAt(tmpA);
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

      let wall = null;
      let floorY = null;
      for (const entity of this.queries.planes.entities) {
        const plane = entity.getValue(XRPlane, '_plane');
        const obj = entity.object3D;
        if (!plane || !obj) continue;
        const origin = obj.getWorldPosition(new Vector3());
        const label = plane.semanticLabel;
        if (plane.orientation === 'horizontal') {
          if ((!label || label === 'floor') && head.y - origin.y > 1) {
            floorY = floorY === null ? origin.y : Math.min(floorY, origin.y);
          }
          continue;
        }
        if (plane.orientation !== 'vertical' || (label && label !== 'wall')) continue;
        const normal = up.clone().applyQuaternion(obj.getWorldQuaternion(obj.quaternion.clone()));
        const dist = tmpB.copy(head).sub(origin).dot(normal);
        if (dist < 0.6 || dist > 5) continue; // behind the wall, or too near/far
        if (!wall || dist < wall.dist) wall = { obj, plane, normal, dist };
      }

      if (wall) {
        // Foot of the perpendicular from the head onto the wall, clamped to the
        // detected wall's width, 2 cm off the surface, centred at eye height.
        const pos = head.clone().addScaledVector(wall.normal, -wall.dist);
        // Plane space: +Y is the normal; the wall's horizontal axis is local X
        // or local Z depending on the runtime, so pick whichever is level.
        const local = wall.obj.worldToLocal(pos.clone());
        const xWorld = new Vector3(1, 0, 0).applyQuaternion(wall.obj.getWorldQuaternion(wall.obj.quaternion.clone()));
        const axis = Math.abs(xWorld.y) < 0.7 ? 'x' : 'z';
        const polygon = wall.plane.polygon || [];
        if (polygon.length > 0) {
          let min = Infinity;
          let max = -Infinity;
          for (const p of polygon) {
            min = Math.min(min, p[axis]);
            max = Math.max(max, p[axis]);
          }
          const lo = min + PANEL_W / 2;
          const hi = max - PANEL_W / 2;
          local[axis] = lo <= hi ? Math.min(Math.max(local[axis], lo), hi) : (min + max) / 2;
        }
        pos.copy(wall.obj.localToWorld(local));
        pos.y = head.y;
        pos.addScaledVector(wall.normal, 0.02);
        view.root.position.copy(pos);
        view.root.lookAt(tmpA.copy(pos).add(wall.normal));
        this.placed = true;
        return;
      }

      if (time - this.sessionStart < WALL_WAIT_SECONDS) return;

      // No wall: stand the plate 1.5 m ahead. On a detected floor its lower
      // edge sits 30 cm above the floor; otherwise it floats at eye height.
      const forward = this.world.camera.getWorldDirection(new Vector3());
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
      forward.normalize();
      const pos = head.clone().addScaledVector(forward, FALLBACK_DISTANCE);
      pos.y = floorY === null ? head.y : floorY + 0.3 + PANEL_H / 2;
      faceHead(pos, head);
      this.placed = true;
    }
  }

  class ToggleSystem extends createSystem({
    pressed: { required: [RayInteractable, Pressed] },
    hovered: { required: [RayInteractable, Hovered] },
  }) {
    init() {
      this.queries.pressed.subscribe('qualify', () => {
        state.showThen = !state.showThen;
        view.refresh();
      });
    }

    update(delta) {
      const target = state.showThen ? 1 : 0;
      const step = delta / FADE_SECONDS;
      state.fade += Math.max(-step, Math.min(step, target - state.fade));
      view.thenMaterial.opacity = state.fade;
      view.toggleMesh.scale.setScalar(this.queries.hovered.entities.size > 0 ? 1.15 : 1);
    }
  }

  world.registerSystem(PlacementSystem);
  world.registerSystem(ToggleSystem);

  const button = document.getElementById('enter-ar');
  const note = document.getElementById('enter-note');
  button.addEventListener('click', () => world.launchXR());
  const supported = navigator.xr?.isSessionSupported?.('immersive-ar') ?? Promise.resolve(false);
  supported
    .catch(() => false)
    .then((ok) => {
      button.disabled = !ok;
      note.textContent = ok
        ? 'Put on the headset and pinch, poke or click the round button to change the year.'
        : 'Enter AR needs a WebXR headset (Meta Quest 3 / 3S browser). Click the round button to change the year here.';
    });
});
