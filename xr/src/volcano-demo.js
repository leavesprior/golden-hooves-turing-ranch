// The Volcano demo (?demo=volcano): the red-coated Guide narrates, and two sourced Volcano
// pieces appear in the c.1867 layer. Every line the Guide says is short and either a sourced
// fact (source beside it) or plainly a game instruction. Built in the facade frame like
// line-layers.js: x along the wall, y up, z out toward the viewer.
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  LatheGeometry,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  Vector2,
  TextureLoader,
  TorusGeometry,
} from 'three';

// The narrator. A still of Grok concept art (01_out_of_time_volcano_concept.png), cut out; never
// animated video. A fictional figure, no real person (law 4); carries era + source + conf (law 5).
export const GUIDE_CAST = {
  id: 'guide',
  name: 'The Guide',
  kind: 'narrator',
  fictional: true,
  era: 'any',
  role: 'narrator (red coat)',
  source: 'Concept-art figure (Grok concept art, still image); no real person.',
  conf: -1,
};

// Sources for every fact on screen (also in CREDITS.md of the demo take).
export const SOURCES = {
  thespians: 'Deborah Coleen Cook, "Vestiges of Amador: Olde Time Entertainments, Part III", Amador Ledger-Dispatch, 2018-09-30',
  chl29: 'California Historical Landmark No. 29, Volcano (OHP, ohp.parks.ca.gov/ListedResources/Detail/29)',
  oldAbeCast: 'Wikipedia, "Volcano, California" (cast by Cyrus Alger & Co., Boston, 1837; six-pounder)',
  vtc: 'Volcano Theatre Company, "About", volcanotheatre.net/about (read 2026-10-01)',
};

// Narration, by beat. Each entry: one caption. `src` = the source key, or null for instructions.
export const NARRATION = {
  intro: [
    { text: 'Volcano, California. Main Street, as it stands today.', src: null },
    { text: 'Mind my watch.', src: null },
  ],
  frog: [{ text: 'Pinch the watch to step back along the line of time.', src: null }],
  c1867: [{ text: 'About 1867. Porches and board walks, simplified.', src: null }],
  playbill: [
    { text: "Volcano's first thespian society was formed in 1854.", src: 'thespians', at: 'playbill' },
    { text: 'Its first play was "The Golden Farmer."', src: 'thespians', at: 'playbill' },
  ],
  oldAbe: [
    { text: 'Old Abe: a six-pounder cannon, cast in 1837.', src: 'oldAbeCast' },
    { text: 'The landmark plaque says the Volcano Blues smuggled it in by hearse.', src: 'chl29' },
    { text: 'That night is told as 1862, or as 1863.', src: null },
  ],
  plaque: [{ text: 'The same plaque: a town of 17 hotels, a library, a theater.', src: 'chl29' }],
  now: [{ text: 'Back to now. The street stays; only the difference was added.', src: null }],
  walk: [{ text: 'Come. Down the street, the town still keeps a theatre.', src: null }],
  theatre: [
    { text: 'The Volcano Theatre Company plays here in summer, behind a restored Gold Rush stone front.', src: 'vtc' },
    { text: 'Across the street stands its Cobblestone Theatre, built in 1856 as a tobacco and cigar shop.', src: 'vtc' },
    { text: "The town's love of the stage is older: its Thespian Society was formed in 1854.", src: 'thespians' },
    { text: 'Their first play was "The Golden Farmer." The bill you saw on the board walk.', src: 'thespians', at: 'bill2' },
  ],
};

const mat = (color, extra = {}) => new MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, transparent: true, ...extra });

/**
 * The Guide: a walk-cycle sprite on a plane that turns about its vertical axis to the viewer, standing
 * on a soft contact shadow so she sits on the street instead of floating over it. The atlas is 31 frames
 * of one stride cut from a Grok Imagine clip (post bbde479b, frames 181-211), an in-game asset inside
 * real gameplay — the end card says so. `animate(delta, moving)` steps the stride while she walks and
 * holds the closed-legs frame while she stands.
 */
const WALK = { frames: 31, cols: 8, rows: 4, cellW: 337, cellH: 600, fps: 24, stand: 14 };
// Each frame's opaque left/right edge as a fraction of the cell (alpha > 128, measured on the atlas),
// so a screen check can test her figure rather than the plane's transparent margin.
const WALK_EXTENT = [[.178,.834],[.199,.917],[.202,.964],[.157,.979],[.119,.967],[.086,.941],[.062,.905],[.047,.866],[.042,.828],[.033,.789],[.033,.751],[.042,.715],[.062,.691],[.086,.706],[.113,.718],[.145,.766],[.175,.858],[.187,.929],[.157,.961],[.128,.961],[.098,.938],[.074,.908],[.053,.869],[.033,.831],[.024,.798],[.021,.777],[.027,.754],[.042,.733],[.068,.709],[.098,.706],[.131,.724]];
export function buildGuide() {
  const g = new Group();
  const h = 1.68;
  const w = (h * WALK.cellW) / WALK.cellH;
  const tex = new TextureLoader().load('./guide/guide_walk_atlas.png');
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  tex.repeat.set(1 / WALK.cols, 1 / WALK.rows);
  let cur = WALK.stand;
  g.userData.extent = () => WALK_EXTENT[cur];
  const show = (f) => {
    cur = f;
    tex.offset.set((f % WALK.cols) / WALK.cols, 1 - (Math.floor(f / WALK.cols) + 1) / WALK.rows);
  };
  show(WALK.stand);
  let t = 0;
  g.userData.animate = (delta, moving) => {
    if (!moving) return show(WALK.stand);
    t += delta;
    show(Math.floor(t * WALK.fps) % WALK.frames);
  };
  // A touch warmer and dimmer than white, to sit in the photo's late-afternoon light.
  const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ map: tex, color: 0xf2e9dc, transparent: true, alphaTest: 0.02, side: DoubleSide, depthWrite: false }));
  m.position.y = h / 2 - 0.01;
  m.raycast = () => {};
  const shadow = canvasShadow(0.75, 0.3);
  shadow.position.set(0, 0.006, 0.02);
  g.add(shadow, m);
  g.userData.figure = m;
  return g;
}

function canvasShadow(w, d) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  const gr = ctx.createRadialGradient(128, 64, 4, 128, 64, 128);
  gr.addColorStop(0, 'rgba(0,0,0,0.75)');
  gr.addColorStop(0.45, 'rgba(0,0,0,0.35)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 256, 128);
  const t = new CanvasTexture(c);
  const m = new Mesh(new PlaneGeometry(w, d), new MeshBasicMaterial({ map: t, transparent: true, opacity: 0.6, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.raycast = () => {};
  return m;
}

function canvasPlane(w, h, px, draw) {
  const c = document.createElement('canvas');
  c.width = px;
  c.height = Math.round((px * h) / w);
  draw(c.getContext('2d'), c.width, c.height);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  const m = new Mesh(new PlaneGeometry(w, h), new MeshStandardMaterial({ map: t, roughness: 0.95, transparent: true }));
  m.raycast = () => {};
  return m;
}

/** A pasted playbill for the Thespian Society's first play (1854; Ledger-Dispatch 2018). */
export function buildPlaybill() {
  const m = canvasPlane(0.6, 0.864, 720, (ctx, W, H) => {
    ctx.fillStyle = '#e8dcb8';
    ctx.fillRect(0, 0, W, H);
    // age: uneven tone
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(120, 90, 40, ${Math.random() * 0.06})`;
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, 8 + Math.random() * 40, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#3a2a18';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, W - 36, H - 36);
    ctx.fillStyle = '#2a1c10';
    ctx.textAlign = 'center';
    const line = (t, y, font) => { ctx.font = font; ctx.fillText(t, W / 2, y); };
    line('VOLCANO', 120, 'bold 70px Georgia, serif');
    line('THESPIAN SOCIETY', 190, 'bold 46px Georgia, serif');
    line('presents', 270, 'italic 36px Georgia, serif');
    line('THE', 360, 'bold 54px Georgia, serif');
    line('GOLDEN', 440, 'bold 84px Georgia, serif');
    line('FARMER', 530, 'bold 84px Georgia, serif');
    ctx.fillRect(W / 2 - 150, 580, 300, 4);
    line('1854', 680, 'bold 64px Georgia, serif');
    line('the Society’s first play', 750, 'italic 32px Georgia, serif');
  });
  return m;
}

// Weathered wood: a grain texture drawn once (grey-brown, as the carriage in the photos of Old Abe).
let grainTex = null;
function grain() {
  if (grainTex) return grainTex;
  // 1024x2048 (was 256x512): on screen a carriage plank spans several hundred pixels, and the old
  // texture was magnified 3-4x there, which read as pixelated (Leif, 10-01). Finer, layered strokes.
  const W = 1024;
  const H = 2048;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, W, 0);
  base.addColorStop(0, '#87745c');
  base.addColorStop(0.5, '#917e65');
  base.addColorStop(1, '#85725a');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.lineCap = 'round';
  for (let i = 0; i < 560; i++) {
    const x = rnd() * W;
    const dark = rnd() < 0.55;
    ctx.strokeStyle = dark ? `rgba(58,45,32,${0.08 + rnd() * 0.22})` : `rgba(196,180,152,${0.05 + rnd() * 0.14})`;
    ctx.lineWidth = 0.8 + rnd() * (dark ? 3.2 : 2.2);
    const amp = 3 + rnd() * 8;
    const ph = rnd() * 6.28;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= H; y += 16) ctx.lineTo(x + Math.sin(y * 0.006 + ph) * amp, y);
    ctx.stroke();
  }
  for (let i = 0; i < 10; i++) { // knots, with rings around them
    const kx = rnd() * W;
    const ky = rnd() * H;
    for (let r = 4; r >= 1; r--) {
      ctx.strokeStyle = `rgba(55,40,28,${0.12 * r})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(kx, ky, 6 + r * 5, 20 + r * 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(50,36,24,0.55)';
    ctx.beginPath();
    ctx.ellipse(kx, ky, 6, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  grainTex = new CanvasTexture(c);
  grainTex.colorSpace = SRGBColorSpace;
  grainTex.wrapS = grainTex.wrapT = RepeatWrapping;
  grainTex.anisotropy = 16;
  return grainTex;
}

const ring = (rIn, rOut, depth, m, segs = 64) => {
  const sh = new Shape();
  sh.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole = new Shape();
  hole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  sh.holes.push(hole);
  const geo = new ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: segs });
  geo.translate(0, 0, -depth / 2);
  return new Mesh(geo, m);
};

/**
 * Old Abe: a bronze six-pounder (cast by Cyrus Alger & Co., Boston, 1837) on a wooden field
 * carriage. Proportions follow the US six-pounder of the period and the photos of the cannon in
 * Volcano: a turned bronze tube with base ring, reinforce, chase, muzzle astragal and swell,
 * cascabel knob; two cheeks, a stock trail, an iron-shod axle and two 14-spoke wheels about 1.45 m
 * across. Built with the barrel along +x (muzzle), y up, wheels at +-z. Shape simplified, scale real.
 */
export function buildOldAbe() {
  const g = new Group();
  // Grain only on the big planks; thin parts (spokes, felloes, hub) get a plain oiled-wood colour, since a
  // striped texture on a 2 cm spoke shimmers into noise at street distance (read as 'pixelated', 10-01).
  const wood = new MeshStandardMaterial({ map: grain(), color: 0xa9825c, roughness: 0.8, metalness: 0, transparent: true });
  const woodPlain = new MeshStandardMaterial({ color: 0x5a4330, roughness: 0.72, metalness: 0, transparent: true });
  const iron = new MeshStandardMaterial({ color: 0x2c2b2a, roughness: 0.55, metalness: 0.75, transparent: true });
  const bronze = new MeshStandardMaterial({ color: 0x76593a, roughness: 0.45, metalness: 1, transparent: true }); // weathered bronze, as in the photos
  g.userData.metal = [iron, bronze];
  const add = (o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o; };

  // The tube, turned about its axis (lathe profile: radius, distance from the base ring, metres).
  const P = [[0, -0.135], [0.028, -0.132], [0.044, -0.112], [0.046, -0.095], [0.036, -0.072], [0.024, -0.06], [0.026, -0.045],
    [0.09, -0.03], [0.118, -0.012], [0.128, 0], [0.128, 0.035], [0.12, 0.045], [0.118, 0.56], [0.124, 0.57], [0.124, 0.585],
    [0.108, 0.595], [0.104, 0.61], [0.081, 1.3], [0.079, 1.33], [0.087, 1.345], [0.087, 1.36], [0.08, 1.375], [0.084, 1.42],
    [0.095, 1.49], [0.097, 1.525], [0.092, 1.535], [0.047, 1.535], [0.047, 1.2], [0, 1.2]];
  const tube = new Mesh(new LatheGeometry(P.map(([r, y]) => new Vector2(r, y)), 64), bronze);
  const trunnionX = 0.0;
  const axleY = 0.72;
  const boreY = axleY + 0.24;
  const base = -0.62; // base ring, relative to the trunnions
  add(tube, trunnionX + base, boreY, 0, 0, 0, -Math.PI / 2);
  for (const s of [-1, 1]) {
    add(new Mesh(new CylinderGeometry(0.042, 0.042, 0.11, 24), bronze), trunnionX, boreY, s * 0.165, Math.PI / 2);
    add(new Mesh(new CylinderGeometry(0.062, 0.062, 0.02, 24), bronze), trunnionX, boreY, s * 0.12, Math.PI / 2); // rimbase
    add(new Mesh(new BoxGeometry(0.11, 0.025, 0.08), iron), trunnionX, boreY + 0.045, s * 0.175); // cap square
  }

  // Cheeks: two planks, high at the trunnions, stepping down to the trail.
  const cheekShape = new Shape();
  cheekShape.moveTo(0.22, -0.12);
  cheekShape.lineTo(0.22, 0.16);
  cheekShape.quadraticCurveTo(0.12, 0.25, 0.0, 0.2);
  cheekShape.lineTo(-0.2, 0.16);
  cheekShape.lineTo(-0.35, 0.1);
  cheekShape.lineTo(-0.95, -0.05);
  cheekShape.lineTo(-0.98, -0.22);
  cheekShape.lineTo(-0.4, -0.2);
  cheekShape.quadraticCurveTo(0.0, -0.22, 0.22, -0.12);
  const cheekGeo = new ExtrudeGeometry(cheekShape, { depth: 0.065, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 32 });
  cheekGeo.translate(0, 0, -0.0325);
  for (const s of [-1, 1]) add(new Mesh(cheekGeo, wood), 0, axleY, s * 0.155);
  // Transoms between the cheeks, and the elevating screw under the breech.
  add(new Mesh(new BoxGeometry(0.12, 0.1, 0.25), wood), -0.42, axleY + 0.02, 0);
  add(new Mesh(new BoxGeometry(0.12, 0.1, 0.25), wood), -0.85, axleY - 0.1, 0);
  add(new Mesh(new CylinderGeometry(0.014, 0.014, 0.16, 12), iron), -0.55, axleY + 0.13, 0);
  add(new Mesh(new CylinderGeometry(0.05, 0.05, 0.015, 16), iron), -0.55, axleY + 0.21, 0);
  // The stock trail, down to the ground, iron trail plate and lunette at its end.
  const trailLen = 1.15;
  const trailAng = Math.atan2(axleY - 0.12 - 0.1, trailLen);
  add(new Mesh(new BoxGeometry(trailLen, 0.16, 0.2), wood), -0.9 - (trailLen / 2) * Math.cos(trailAng), (axleY - 0.1 + 0.08) / 2 + 0.05, 0, 0, 0, trailAng);
  add(new Mesh(new BoxGeometry(0.18, 0.02, 0.22), iron), -0.9 - trailLen * Math.cos(trailAng) + 0.05, 0.085, 0, 0, 0, trailAng);
  add(new Mesh(new TorusGeometry(0.045, 0.012, 8, 20), iron), -0.9 - trailLen * Math.cos(trailAng) - 0.02, 0.06, 0, Math.PI / 2);
  // Axle-tree with iron arms, and the wheels.
  add(new Mesh(new BoxGeometry(0.15, 0.14, 1.12), wood), 0, axleY, 0);
  add(new Mesh(new CylinderGeometry(0.035, 0.035, 1.5, 16), iron), 0, axleY, 0, Math.PI / 2);
  const R = 0.725;
  for (const s of [-1, 1]) {
    const wheel = new Group();
    wheel.position.set(0, axleY, s * 0.66);
    g.add(wheel);
    const hub = new Mesh(new CylinderGeometry(0.085, 0.1, 0.28, 24), woodPlain);
    hub.rotation.x = Math.PI / 2;
    wheel.add(hub);
    for (const z of [-0.12, 0.12]) {
      const band = new Mesh(new CylinderGeometry(0.1, 0.1, 0.02, 24), iron);
      band.rotation.x = Math.PI / 2;
      band.position.z = z;
      wheel.add(band);
    }
    const cap = new Mesh(new CylinderGeometry(0.045, 0.06, 0.05, 20), iron);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = s * 0.16;
    wheel.add(cap);
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const spoke = new Mesh(new CylinderGeometry(0.02, 0.028, R - 0.15, 16), woodPlain);
      spoke.position.set(Math.cos(a) * (R / 2 + 0.02), Math.sin(a) * (R / 2 + 0.02), s * 0.02);
      spoke.rotation.z = a - Math.PI / 2;
      wheel.add(spoke);
    }
    const felloe = ring(R - 0.085, R - 0.012, 0.075, woodPlain);
    wheel.add(felloe);
    wheel.add(ring(R - 0.012, R + 0.004, 0.08, iron));
  }
  g.traverse((o) => { if (o.isMesh) o.raycast = () => {}; });
  return g;
}

/**
 * The Guide's pocket watch (Leif, 10-01: it replaces the Golden Frog in the demo). Gold hunter case
 * on a short chain, swinging gently from a point at her hand's height; pinch it to step in time.
 * Shown larger than life (about 2.5x) so it reads at street distance. The group's origin is on the
 * ground (the app's hop/fade code treats it like the Frog); `userData.pivot` swings, `userData.target`
 * is the watch face (the pinch point).
 */
export function buildWatch() {
  const g = new Group();
  const gold = new MeshStandardMaterial({ color: 0xd9ab45, metalness: 1, roughness: 0.22, transparent: true });
  const pivot = new Group();
  pivot.position.y = 1.42;
  g.add(pivot);
  const chainLen = 0.26;
  for (let i = 0; i < 9; i++) {
    const link = new Mesh(new TorusGeometry(0.012, 0.0035, 6, 12), gold);
    link.position.y = -i * (chainLen / 9);
    link.rotation.y = i % 2 ? Math.PI / 2 : 0;
    pivot.add(link);
  }
  const watch = new Group();
  watch.position.y = -chainLen - 0.11;
  pivot.add(watch);
  const R = 0.1;
  const P = [[0, -0.022], [R * 0.9, -0.022], [R, -0.012], [R * 1.02, 0], [R, 0.012], [R * 0.9, 0.02], [0, 0.02]];
  const kase = new Mesh(new LatheGeometry(P.map(([r, y]) => new Vector2(r, y)), 64), gold);
  kase.rotation.x = Math.PI / 2;
  watch.add(kase);
  const face = canvasPlane(R * 1.7, R * 1.7, 512, (ctx, W, H) => {
    ctx.fillStyle = '#f3ead6';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a1c10';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W / 2 - 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#2a1c10';
    ctx.font = 'bold 54px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nums = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    nums.forEach((n, i) => {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.fillText(n, W / 2 + Math.cos(a) * W * 0.36, H / 2 + Math.sin(a) * H * 0.36);
    });
    const hand = (a, len, w) => {
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(W / 2, H / 2);
      ctx.lineTo(W / 2 + Math.cos(a) * len, H / 2 + Math.sin(a) * len);
      ctx.stroke();
    };
    hand(-Math.PI / 2 + (10 / 12) * Math.PI * 2, W * 0.2, 10); // about ten to two: no particular hour
    hand(-Math.PI / 2 + (50 / 60) * Math.PI * 2, W * 0.32, 6);
  });
  face.material.transparent = true;
  face.position.z = 0.021;
  watch.add(face);
  const crown = new Mesh(new CylinderGeometry(0.013, 0.013, 0.022, 16), gold);
  crown.position.y = R + 0.012;
  watch.add(crown);
  const bow = new Mesh(new TorusGeometry(0.022, 0.004, 8, 20), gold);
  bow.position.y = R + 0.035;
  watch.add(bow);
  g.userData.pivot = pivot;
  g.userData.target = watch;
  return g;
}
