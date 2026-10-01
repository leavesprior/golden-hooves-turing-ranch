// Procedural blockout of the line of time. Everything is built in the facade
// frame: x along the wall (0 = centre), y up from the ground, z out of the wall
// toward the viewer. Nothing here is full-frame: law 1 of the redesign.
import {
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
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
  sign.name = 'signboard';
  g.add(sign);
  const trim = box(1.4, 0.24, 0.045, mat(0xb08a3e, { metalness: 0.4, roughness: 0.5 }));
  trim.position.set(0, 2.02, 0.035);
  trim.scale.z = 0.5;
  trim.name = 'signtrim';
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

/**
 * The Golden Frog: curious, multidimensional; touching it steps along the line. Sits facing +z:
 * a wide flat head with two bulging eyes on top, a mouth line, splayed front legs, and the
 * folded hind legs with long webbed feet that make a frog read as a frog at a glance.
 */
export function buildFrog() {
  const g = new Group();
  const gold = mat(0xe2b33c, { metalness: 1, roughness: 0.28, emissive: 0x3a2600, emissiveIntensity: 0.35 });
  const deep = mat(0xb07d1c, { metalness: 1, roughness: 0.4, emissive: 0x241600, emissiveIntensity: 0.3 });
  const dark = mat(0x140c02, { roughness: 0.6 });
  const part = (geo, m, [x, y, z], [sx, sy, sz] = [1, 1, 1], [rx, ry, rz] = [0, 0, 0]) => {
    const o = new Mesh(geo, m);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    o.rotation.set(rx, ry, rz);
    g.add(o);
    return o;
  };
  // Body: a pear, high in front, low at the back (a sitting frog).
  part(new SphereGeometry(0.1, 32, 20), gold, [0, 0.085, -0.01], [1.05, 0.62, 1.2], [-0.3, 0, 0]);
  // Head: wide and flat, the snout rounded.
  part(new SphereGeometry(0.075, 32, 20), gold, [0, 0.135, 0.085], [1.3, 0.62, 1.0]);
  // Mouth line along the front of the snout.
  part(new TorusGeometry(0.083, 0.0035, 6, 32, Math.PI * 0.8), dark, [0, 0.122, 0.09], [1.16, 1, 0.9], [Math.PI / 2 - 0.15, 0, Math.PI * 0.1]);
  for (const s of [-1, 1]) {
    // Bulging eyes on top of the head, gold lids, dark eyes with a horizontal pupil.
    part(new SphereGeometry(0.032, 24, 16), gold, [s * 0.052, 0.17, 0.1]);
    part(new SphereGeometry(0.027, 24, 16), mat(0x2a1a05, { metalness: 0.2, roughness: 0.15 }), [s * 0.056, 0.176, 0.112]);
    part(new SphereGeometry(0.012, 12, 8), dark, [s * 0.06, 0.18, 0.136], [1.4, 0.55, 0.5]);
    part(new SphereGeometry(0.005, 8, 6), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 }), [s * 0.066, 0.19, 0.136]);
    // Front legs: straight, splayed, three-toed hands on the ground.
    part(new CapsuleGeometry(0.014, 0.075, 4, 10), gold, [s * 0.075, 0.045, 0.1], [1, 1, 1], [0.35, 0, s * 0.35]);
    for (const k of [-1, 0, 1]) part(new CapsuleGeometry(0.006, 0.03, 3, 6), deep, [s * (0.09 + k * 0.012), 0.006, 0.135 + Math.abs(k) * -0.004], [1, 1, 1], [Math.PI / 2, 0, -k * 0.5 - s * 0.2]);
    // Hind legs, folded: a big thigh along the flank, the shin folded under it, a long foot forward.
    part(new SphereGeometry(0.05, 20, 14), gold, [s * 0.1, 0.06, -0.06], [0.75, 0.75, 1.5], [0.25, s * 0.35, 0]);
    part(new CapsuleGeometry(0.018, 0.1, 4, 10), gold, [s * 0.135, 0.03, -0.02], [1, 1, 1], [Math.PI / 2 - 0.25, 0, s * 0.2]);
    part(new CapsuleGeometry(0.012, 0.09, 4, 8), deep, [s * 0.15, 0.008, 0.05], [1, 1, 1], [Math.PI / 2, s * 0.25, 0]);
    for (const k of [-1.5, -0.5, 0.5, 1.5]) part(new CapsuleGeometry(0.005, 0.045, 3, 6), deep, [s * (0.15 + k * 0.014), 0.005, 0.115], [1, 1, 1], [Math.PI / 2, 0, k * 0.22]);
    // Webbing between the hind toes.
    part(new SphereGeometry(0.03, 16, 8), deep, [s * 0.15, 0.004, 0.11], [1.1, 0.12, 0.9]);
  }
  const aura = glowSprite(0xffd65a, 0.55, 0.3);
  aura.position.y = 0.12;
  g.add(aura);
  // Scaled inside an outer group: the breathing animation sets the outer group's scale.
  g.scale.setScalar(1.5);
  const outer = new Group();
  outer.add(g);
  return outer;
}

/**
 * Schroedinger's cat, escaped. Walks the board walk; sideways it is and is not. A black cat,
 * facing +x: pointed ears, green eyes, whiskers and an upright tail with a hook at the tip,
 * the silhouette people know. Legs are pivots at the shoulder and hip (swing about z).
 */
export function buildCat() {
  const g = new Group();
  const fur = mat(0x16161b, { roughness: 0.5, metalness: 0.15 });
  const pink = mat(0x8a4a55, { roughness: 0.7 });
  const part = (parent, geo, m, [x, y, z], [sx, sy, sz] = [1, 1, 1], [rx, ry, rz] = [0, 0, 0]) => {
    const o = new Mesh(geo, m);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    o.rotation.set(rx, ry, rz);
    parent.add(o);
    return o;
  };
  part(g, new SphereGeometry(0.1, 28, 18), fur, [0, 0.25, 0], [1.9, 0.82, 0.85]); // body
  part(g, new SphereGeometry(0.08, 24, 16), fur, [0.13, 0.27, 0]); // chest
  part(g, new SphereGeometry(0.085, 24, 16), fur, [-0.13, 0.26, 0]); // haunch
  part(g, new CapsuleGeometry(0.045, 0.06, 6, 12), fur, [0.2, 0.33, 0], [1, 1, 1], [0, 0, -0.9]); // neck
  const head = new Group();
  head.position.set(0.26, 0.38, 0);
  g.add(head);
  part(head, new SphereGeometry(0.068, 28, 18), fur, [0, 0, 0], [1.0, 0.9, 1.08]);
  part(head, new SphereGeometry(0.036, 18, 12), fur, [0.05, -0.022, 0], [1, 0.75, 1.2]); // muzzle
  part(head, new SphereGeometry(0.008, 10, 8), pink, [0.083, -0.012, 0]); // nose
  for (const s of [-1, 1]) {
    part(head, new ConeGeometry(0.032, 0.07, 4), fur, [-0.005, 0.068, s * 0.04], [1, 1, 0.55], [s * 0.25, Math.PI / 4, 0]);
    part(head, new ConeGeometry(0.02, 0.045, 4), pink, [0.004, 0.062, s * 0.04], [1, 1, 0.3], [s * 0.25, Math.PI / 4, 0]);
    part(head, new SphereGeometry(0.0145, 14, 10), mat(0xb8e04a, { emissive: 0x6a9a10, emissiveIntensity: 0.9, roughness: 0.1 }), [0.055, 0.016, s * 0.03]);
    part(head, new BoxGeometry(0.004, 0.02, 0.005), mat(0x050505), [0.0685, 0.016, s * 0.03]); // slit pupil
    for (const k of [-1, 0, 1]) {
      const w = part(head, new CylinderGeometry(0.0012, 0.0012, 0.11, 4), mat(0xd8d8d0, { roughness: 0.4 }), [0.075, -0.02 + k * 0.006, s * 0.055], [1, 1, 1], [s * (Math.PI / 2 - 0.15 * k), 0, 0.1 * k]);
      w.raycast = () => {};
    }
  }
  g.userData.legs = [];
  for (const [x, z, front] of [[0.13, 0.05, 1], [0.13, -0.05, 1], [-0.14, 0.055, 0], [-0.14, -0.055, 0]]) {
    const pivot = new Group();
    pivot.position.set(x, 0.24, z);
    g.add(pivot);
    part(pivot, new CapsuleGeometry(front ? 0.022 : 0.03, 0.1, 4, 10), fur, [0, -0.07, 0]);
    part(pivot, new CapsuleGeometry(0.017, 0.1, 4, 10), fur, [front ? 0.0 : -0.01, -0.16, 0]);
    part(pivot, new SphereGeometry(0.022, 14, 10), fur, [0.012, -0.225, 0], [1.3, 0.6, 1]); // paw
    g.userData.legs.push(pivot);
  }
  // The tail: up from the rump, curving, the tip hooked over.
  const tail = new Group();
  tail.position.set(-0.27, 0.29, 0);
  g.add(tail);
  const curve = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(-0.07, 0.1, 0), new Vector3(-0.08, 0.24, 0), new Vector3(-0.03, 0.33, 0), new Vector3(0.03, 0.33, 0)]);
  part(tail, new TubeGeometry(curve, 40, 0.017, 10, false), fur, [0, 0, 0]);
  part(tail, new SphereGeometry(0.017, 10, 8), fur, [0.03, 0.33, 0]);
  g.userData.tail = tail;
  g.scale.setScalar(1.25);
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
