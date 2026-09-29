// Procedural blockout of the line of time. Everything is built in the facade
// frame: x along the wall (0 = centre), y up from the ground, z out of the wall
// toward the viewer. Nothing here is full-frame: law 1 of the redesign.
import {
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  SpriteMaterial,
  Sprite,
  SRGBColorSpace,
  AdditiveBlending,
} from 'three';

export const FACADE_W = 3.0;

const box = (w, h, d, mat) => new Mesh(new BoxGeometry(w, h, d), mat);

function mat(color, extra = {}) {
  return new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, transparent: true, ...extra });
}

let glowTexture = null;
function glow() {
  if (glowTexture) return glowTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  glowTexture = new CanvasTexture(c);
  glowTexture.colorSpace = SRGBColorSpace;
  return glowTexture;
}

function glowSprite(color, size, opacity = 0.8) {
  const s = new Sprite(new SpriteMaterial({ map: glow(), color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(size);
  // Decorative only: never a ray target (Sprite.raycast needs a camera the XR
  // pointer raycaster does not set, and throws every frame).
  s.raycast = () => {};
  return s;
}

// A glow the real world can hide. IWSDK's DepthOccludable only rewrites the shaders of
// Meshes (a Sprite is skipped, so a Sprite halo painted over real tables), so layer glows
// are small camera-facing planes (userData.billboard: turned to the camera each frame).
// Additive, no depth write, not a ray target. Kept small enough for the laws (no sheet).
function glowMesh(color, size, opacity = 0.8, billboard = true) {
  const m = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: glow(), color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false }));
  m.scale.setScalar(size);
  m.raycast = () => {};
  m.userData.glow = true;
  m.userData.billboard = billboard;
  return m;
}

// Inside the facade volume (laws.js frame x +-2.2, z 0..2.6) including half the glow and its drift.
const within = (half, amp, lo, hi) => lo + half + amp + Math.random() * (hi - lo - 2 * (half + amp));

/** About 1867: shed-roof porch on posts, board walk, lanterns, sign board, hitching rail. */
export function build1867() {
  const g = new Group();
  const wood = mat(0x6b4a2f);
  const plank = mat(0x8a6a48);
  const dark = mat(0x3b2a1c);
  const depth = 1.6;

  for (let i = 0; i < 12; i++) {
    const p = box(FACADE_W + 0.2, 0.03, 0.125, i % 2 ? plank : wood);
    p.position.set(0, 0.015, 0.07 + i * (depth / 12));
    g.add(p);
  }
  for (const x of [-1.45, -0.48, 0.48, 1.45]) {
    const post = box(0.09, 2.3, 0.09, wood);
    post.position.set(x, 1.15, depth - 0.05);
    g.add(post);
  }
  const beam = box(FACADE_W + 0.2, 0.12, 0.1, dark);
  beam.position.set(0, 2.3, depth - 0.05);
  g.add(beam);
  // Shed roof: from 2.55 m at the wall down to 2.34 m over the posts.
  const roof = box(FACADE_W + 0.3, 0.04, depth + 0.15, dark);
  roof.position.set(0, 2.45, depth / 2 + 0.08); // tilted: keep its back edge out of the wall
  roof.rotation.x = Math.atan2(0.21, depth);
  g.add(roof);

  const sign = box(1.5, 0.34, 0.04, dark);
  sign.position.set(0, 2.02, 0.03);
  g.add(sign);
  const trim = box(1.4, 0.24, 0.045, mat(0xb08a3e, { metalness: 0.4, roughness: 0.5 }));
  trim.position.set(0, 2.02, 0.035);
  trim.scale.z = 0.5;
  g.add(trim);

  for (const x of [-0.48, 0.48]) {
    const lamp = box(0.1, 0.16, 0.1, mat(0xffc46b, { emissive: 0xffa53a, emissiveIntensity: 1.4 }));
    lamp.position.set(x, 2.08, depth - 0.12);
    const halo = glowMesh(0xffb05a, 0.55, 0.7);
    halo.position.copy(lamp.position);
    halo.userData.flicker = Math.random() * 10;
    g.add(lamp, halo);
  }

  for (const x of [-1.0, 1.0]) {
    const hp = box(0.08, 0.9, 0.08, wood);
    hp.position.set(x, 0.45, depth + 0.55);
    g.add(hp);
  }
  const rail = box(2.1, 0.06, 0.06, wood);
  rail.position.set(0, 0.85, depth + 0.55);
  g.add(rail);
  return g;
}

/** Slip 1, sideways: drifting motes, low fog, a door standing in the air. No veil. */
export function buildSlip1() {
  const g = new Group();
  for (let i = 0; i < 60; i++) {
    const size = 0.05 + Math.random() * 0.05;
    const amp = 0.05 + Math.random() * 0.12;
    const m = glowMesh(i % 3 ? 0x8fffe0 : 0xffe28a, size, 0.9);
    m.position.set(within(size / 2, amp, -2.2, 2.2), 0.2 + Math.random() * 2.2, within(size / 2, amp, 0.2, 2.6));
    m.userData.drift = { base: m.position.clone(), phase: Math.random() * 6.28, amp };
    g.add(m);
  }
  for (let i = 0; i < 18; i++) {
    const size = 0.9 + Math.random() * 0.3; // <= 1.2 x 0.48 m: low fog, never a sheet
    const f = glowMesh(0x9fb8ff, size, 0.12);
    f.scale.y = size * 0.4;
    f.position.set(within(size / 2, 0.25, -2.2, 2.2), size * 0.2 + 0.15 + Math.random() * 0.15, within(size / 2, 0.25, 0, 2.6));
    f.userData.drift = { base: f.position.clone(), phase: Math.random() * 6.28, amp: 0.25 };
    g.add(f);
  }
  const door = new Group();
  const edge = mat(0x6fffd8, { emissive: 0x3fffc0, emissiveIntensity: 1.2 });
  const parts = [[0.05, 2.0, 0, 0.45, 1.0], [0.05, 2.0, 0, -0.45, 1.0], [0.95, 0.05, 0, 0, 2.0]];
  for (const [w, h, , x, y] of parts) {
    const p = box(w, h, 0.05, edge);
    p.position.set(x, y, 0);
    door.add(p);
  }
  const inside = glowMesh(0x6fffd8, 1.2, 0.18, false); // flat in the doorway
  inside.position.set(0, 1.0, 0);
  door.add(inside);
  door.position.set(0.9, 0.15, 1.4);
  door.userData.bob = true;
  g.add(door);
  return g;
}

/** The Golden Frog: curious, multidimensional; touching it steps along the line. */
export function buildFrog() {
  const g = new Group();
  const gold = mat(0xd4a017, { metalness: 0.7, roughness: 0.3, emissive: 0x4a3200, emissiveIntensity: 0.6 });
  const body = new Mesh(new SphereGeometry(0.09, 20, 14), gold);
  body.scale.set(1.0, 0.7, 1.25);
  body.position.y = 0.07;
  const head = new Mesh(new SphereGeometry(0.065, 18, 12), gold);
  head.position.set(0, 0.11, 0.08);
  g.add(body, head);
  const eyeWhite = mat(0xfff6d8);
  const pupil = mat(0x101010);
  for (const s of [-1, 1]) {
    const e = new Mesh(new SphereGeometry(0.026, 12, 10), eyeWhite);
    e.position.set(s * 0.04, 0.165, 0.09);
    const p = new Mesh(new SphereGeometry(0.013, 10, 8), pupil);
    p.position.set(s * 0.045, 0.172, 0.112);
    const leg = new Mesh(new CapsuleGeometry(0.022, 0.08, 4, 8), gold);
    leg.rotation.z = s * 1.2;
    leg.position.set(s * 0.1, 0.03, -0.04);
    g.add(e, p, leg);
  }
  const aura = glowSprite(0xffd65a, 0.5, 0.35);
  aura.position.y = 0.1;
  g.add(aura);
  return g;
}

/** Schroedinger's cat, escaped. Walks the board walk; sideways it is and is not. */
export function buildCat() {
  const g = new Group();
  const fur = mat(0x2d2a2e);
  const body = new Mesh(new CapsuleGeometry(0.065, 0.22, 4, 10), fur);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.2;
  const head = new Mesh(new SphereGeometry(0.06, 14, 10), fur);
  head.position.set(0.19, 0.27, 0);
  g.add(body, head);
  for (const s of [-1, 1]) {
    const ear = new Mesh(new ConeGeometry(0.022, 0.05, 6), fur);
    ear.position.set(0.2, 0.33, s * 0.03);
    const eye = new Mesh(new SphereGeometry(0.01, 8, 6), mat(0x9dff6a, { emissive: 0x5aff2a, emissiveIntensity: 1 }));
    eye.position.set(0.245, 0.285, s * 0.022);
    g.add(ear, eye);
  }
  const tail = new Mesh(new CylinderGeometry(0.012, 0.018, 0.26, 6), fur);
  tail.position.set(-0.22, 0.3, 0);
  tail.rotation.z = -0.6;
  g.add(tail);
  g.userData.legs = [];
  for (const [x, z] of [[0.12, 0.04], [0.12, -0.04], [-0.1, 0.04], [-0.1, -0.04]]) {
    const leg = new Mesh(new CylinderGeometry(0.014, 0.014, 0.14, 6), fur);
    leg.position.set(x, 0.08, z);
    g.add(leg);
    g.userData.legs.push(leg);
  }
  g.userData.tail = tail;
  return g;
}

/** Set every material under `root` to `opacity`, hiding the group at 0. */
export function setOpacity(root, opacity) {
  root.visible = opacity > 0.001;
  root.traverse((o) => {
    const m = o.material;
    if (!m) return;
    if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity;
    m.opacity = m.userData.baseOpacity * opacity;
    // Only a fully shown solid writes depth, so a fading layer never hides the incoming one.
    if (!m.blending || m.blending === 1) m.depthWrite = opacity >= 0.999;
  });
}

/**
 * Hattie, a hotel cook about 1867. A fictional composite (no real person): long
 * dark skirt, apron, shawl, kerchief. Front faces +z; legs swing from the hip.
 */
export function buildHattie() {
  const g = new Group();
  const body = new Group(); // everything above the feet bobs with the step
  g.add(body);
  const skirtMat = mat(0x2b2433);
  const skin = mat(0xc49a78);
  const skirt = new Mesh(new CylinderGeometry(0.13, 0.3, 0.86, 14), skirtMat);
  skirt.position.y = 0.47;
  const apron = box(0.3, 0.58, 0.02, mat(0xe9e1cd));
  apron.position.set(0, 0.6, 0.215);
  apron.rotation.x = -0.17;
  const bodice = new Mesh(new CylinderGeometry(0.12, 0.14, 0.44, 12), mat(0x3d3242));
  bodice.position.y = 1.11;
  const shawl = new Mesh(new CylinderGeometry(0.1, 0.23, 0.2, 12), mat(0x8c2f24));
  shawl.position.y = 1.26;
  const neck = new Mesh(new CylinderGeometry(0.04, 0.045, 0.08, 8), skin);
  neck.position.y = 1.38;
  const head = new Mesh(new SphereGeometry(0.095, 14, 10), skin);
  head.position.y = 1.47;
  const kerchief = new Mesh(new SphereGeometry(0.105, 14, 8, 0, Math.PI * 2, 0, Math.PI / 1.8), mat(0xd9ceb4));
  kerchief.position.set(0, 1.49, -0.01);
  const knot = new Mesh(new SphereGeometry(0.035, 8, 6), mat(0xd9ceb4));
  knot.position.set(0, 1.44, -0.1);
  body.add(skirt, apron, bodice, shawl, neck, head, kerchief, knot);
  g.userData.arms = [];
  for (const s of [-1, 1]) {
    const shoulder = new Group();
    shoulder.position.set(s * 0.17, 1.3, 0);
    const arm = new Mesh(new CapsuleGeometry(0.035, 0.38, 4, 8), mat(0x3d3242));
    arm.position.y = -0.22;
    const hand = new Mesh(new SphereGeometry(0.035, 8, 6), skin);
    hand.position.y = -0.45;
    shoulder.add(arm, hand);
    body.add(shoulder);
    g.userData.arms.push(shoulder);
  }
  g.userData.legs = [];
  for (const s of [-1, 1]) {
    const hip = new Group();
    hip.position.set(s * 0.07, 0.62, 0);
    const leg = new Mesh(new CylinderGeometry(0.04, 0.035, 0.56, 8), skirtMat);
    leg.position.y = -0.3;
    const boot = box(0.08, 0.07, 0.16, mat(0x1c1410));
    boot.position.set(0, -0.585, 0.04);
    hip.add(leg, boot);
    g.add(hip);
    g.userData.legs.push(hip);
  }
  g.userData.body = body;
  g.userData.skirt = skirt;
  return g;
}
