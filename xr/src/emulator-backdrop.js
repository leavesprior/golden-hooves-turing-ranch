// Emulator only (IWER synthetic environment module, SEM): replace the synthetic living room
// with one straight-on wall carrying a photo of Volcano's Main Street, a floor, and a thin
// depth box behind the wall. The SEM is IWER's stand-in for the real world (it draws the
// "passthrough" canvas and answers plane detection, hit tests and depth), so the app's own
// layers stay purely additive: nothing here is part of the app's scene.
import { CanvasTexture, Color, Mesh, MeshBasicMaterial, MirroredRepeatWrapping, PlaneGeometry, SRGBColorSpace, Vector3 } from 'three';
import { BACKDROP } from './backdrop-config.js';

const WALL_Q = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }; // plane +Y into the wall, as IWER's own walls
const FLOOR_Q = { x: 1, y: 0, z: 0, w: 0 }; // plane +Y points down, as the captured floors

function environment(d) {
  return {
    type: 'SpatialEntities',
    version: 1,
    spatialEntities: [
      {
        uuid: 'volcano-wall',
        semanticLabel_META: 'WALL_FACE',
        locatable_META: { orientation: WALL_Q, position: { x: 0, y: 2.5, z: -d } },
        bounded2D_META: { offset: { x: -6, y: -2.5 }, extent: { width: 12, height: 5 } },
      },
      {
        uuid: 'volcano-floor',
        semanticLabel_META: 'FLOOR',
        locatable_META: { orientation: FLOOR_Q, position: { x: 0, y: 0, z: -d / 2 } },
        bounded2D_META: { offset: { x: -6, y: -4 }, extent: { width: 12, height: 8 } },
      },
      {
        // Depth for occlusion: a slab just behind the photographed wall.
        uuid: 'volcano-depth',
        semanticLabel_META: 'OTHER',
        locatable_META: { orientation: { x: 0, y: 0, z: 0, w: 1 }, position: { x: 0, y: 0, z: -d - 0.05 } },
        bounded3D_META: { offset: { x: -10, y: -2, z: -0.1 }, extent: { width: 20, height: 10, depth: 0.1 } },
      },
    ],
  };
}

const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

// The photo, sharp, and behind it a blurred copy that continues past its edges, so the
// emulator's wide field of view never meets a hard edge or an empty room.
function textures(img) {
  const photo = new CanvasTexture((() => {
    const c = document.createElement('canvas');
    const k = Math.min(1, 4096 / img.width);
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  })());
  photo.colorSpace = SRGBColorSpace;
  const b = document.createElement('canvas');
  b.width = 768;
  b.height = Math.round((768 * img.height) / img.width);
  const ctx = b.getContext('2d');
  ctx.filter = 'blur(10px) brightness(0.85)';
  ctx.drawImage(img, -20, -20, b.width + 40, b.height + 40);
  const blur = new CanvasTexture(b);
  blur.colorSpace = SRGBColorSpace;
  blur.wrapS = blur.wrapT = MirroredRepeatWrapping;
  // Mean colour of the photo's top strip, for the SEM background beyond everything.
  const s = ctx.getImageData(0, 0, b.width, Math.max(1, Math.round(b.height * 0.05))).data;
  let r = 0; let g = 0; let bl = 0; const n = s.length / 4;
  for (let i = 0; i < s.length; i += 4) { r += s[i]; g += s[i + 1]; bl += s[i + 2]; }
  return { photo, blur, sky: [r / n / 255, g / n / 255, bl / n / 255] };
}

export async function installBackdrop() {
  const sem = window.IWER_DEVICE?.sem;
  if (!sem) return { ok: false, why: 'no IWER synthetic environment (real headset or no emulator)' };
  // The default room arrives asynchronously from the CDN; replace it only after it landed,
  // or it would land afterwards and wipe this one.
  const t0 = performance.now();
  while (sem.objectMap.size === 0 && performance.now() - t0 < 20000) await new Promise((r) => setTimeout(r, 100));
  const d = BACKDROP.wallDistance;
  sem.loadEnvironment(environment(d));
  for (const c of sem.scene.children) if (c.type === 'GridHelper') c.visible = false;
  const img = await loadImage(BACKDROP.src);
  const { photo, blur, sky } = textures(img);
  const pw = BACKDROP.photoWidth;
  const ph = (pw * img.height) / img.width;
  const cy = BACKDROP.photoBottom + ph / 2;
  const mesh = new Mesh(new PlaneGeometry(pw, ph), new MeshBasicMaterial({ map: photo }));
  mesh.position.set(0, cy, -d - 0.01);
  mesh.name = 'volcano-backdrop';
  // As wide and tall as the SEM camera's far plane (40 m) allows, so even a sideways glance meets it.
  // Its UVs keep the photo's own scale; past the photo the blurred copy repeats mirrored, so the
  // edges continue softly instead of ending.
  const sg = new PlaneGeometry(76, 70);
  const uv = sg.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + ((uv.getX(i) - 0.5) * 76) / pw, 0.5 + ((uv.getY(i) - 0.5) * 70) / ph);
  const surround = new Mesh(sg, new MeshBasicMaterial({ map: blur }));
  surround.position.set(0, cy, -d - 0.03);
  surround.name = 'volcano-backdrop-surround';
  sem.scene.add(surround, mesh);
  sem.scene.background = new Color(...sky);
  // Verification: does the emulator's view ray through each screen corner and edge-middle land
  // on the sharp photo (not the blurred fill)? Margin = metres inside the photo's nearest edge.
  const half = [pw / 2, ph / 2];
  window.__backdropCoverage = () => {
    const cam = sem.camera;
    const o = new Vector3().setFromMatrixPosition(cam.matrixWorld);
    let margin = Infinity;
    for (const [nx, ny] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const p = new Vector3(nx, ny, 0.5).applyMatrix4(cam.projectionMatrixInverse).applyMatrix4(cam.matrixWorld);
      const d = p.sub(o);
      const t = (mesh.position.z - o.z) / d.z;
      if (!(t > 0)) return { covered: false, margin: -Infinity };
      const x = o.x + d.x * t - mesh.position.x;
      const y = o.y + d.y * t - mesh.position.y;
      margin = Math.min(margin, half[0] - Math.abs(x), half[1] - Math.abs(y));
    }
    return { covered: margin > 0, margin: +margin.toFixed(2) };
  };
  return { ok: true, entities: sem.objectMap.size, photo: [img.width, img.height], meters: [+pw.toFixed(2), +ph.toFixed(2)], wallDistance: d };
}
