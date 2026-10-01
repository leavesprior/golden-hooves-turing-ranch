// The Volcano demo (?demo=volcano): the red-coated Guide narrates, and two sourced Volcano
// pieces appear in the c.1867 layer. Every line the Guide says is short and either a sourced
// fact (source beside it) or plainly a game instruction. Built in the facade frame like
// line-layers.js: x along the wall, y up, z out toward the viewer.
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
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
};

// Narration, by beat. Each entry: one caption. `src` = the source key, or null for instructions.
export const NARRATION = {
  intro: [
    { text: 'Volcano, California. Main Street, as it stands today.', src: null },
    { text: 'Watch for the Golden Frog.', src: null },
  ],
  frog: [{ text: 'Pinch the Frog to step back along the line of time.', src: null }],
  c1867: [{ text: 'About 1867. Porches and board walks, simplified.', src: null }],
  playbill: [
    { text: "Volcano's first thespian society was formed in 1854.", src: 'thespians' },
    { text: 'Its first play was "The Golden Farmer."', src: 'thespians' },
  ],
  oldAbe: [
    { text: 'Old Abe: a six-pounder cannon, cast in 1837.', src: 'oldAbeCast' },
    { text: 'The landmark plaque says the Volcano Blues smuggled it in by hearse.', src: 'chl29' },
    { text: 'That night is told as 1862, or as 1863.', src: null },
  ],
  plaque: [{ text: 'The same plaque: a town of 17 hotels, a library, a theater.', src: 'chl29' }],
  slip1: [{ text: "Sideways: the Frog's side of things. Nothing here is history.", src: null }],
  now: [{ text: 'Back to now. The street stays; only the difference was added.', src: null }],
};

const mat = (color, extra = {}) => new MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, transparent: true, ...extra });

/** The Guide: the still cut-out on a plane that turns about its vertical axis to the viewer. */
export function buildGuide() {
  const g = new Group();
  const h = 1.68;
  const w = (h * 137) / 360; // the cut-out's aspect
  const tex = new TextureLoader().load('./guide/guide_concept_still.png');
  tex.colorSpace = SRGBColorSpace;
  const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.05, side: DoubleSide, depthWrite: false }));
  m.position.y = h / 2;
  m.raycast = () => {};
  g.add(m);
  g.userData.figure = m;
  return g;
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
  const m = canvasPlane(0.5, 0.72, 600, (ctx, W, H) => {
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

/** Old Abe: a bronze six-pounder on a wooden field carriage (shape simplified). */
export function buildOldAbe() {
  const g = new Group();
  const wood = mat(0x5a3b22);
  const iron = mat(0x2b2b2b);
  const bronze = mat(0x9a7a3a, { metalness: 0.6, roughness: 0.4 });
  for (const s of [-1, 1]) {
    const wheel = new Mesh(new TorusGeometry(0.55, 0.035, 8, 32), iron);
    wheel.position.set(0, 0.58, s * 0.42);
    const hub = new Mesh(new CylinderGeometry(0.09, 0.09, 0.16, 12), wood);
    hub.rotation.x = Math.PI / 2;
    hub.position.copy(wheel.position);
    g.add(wheel, hub);
    for (let k = 0; k < 7; k++) {
      const spoke = new Mesh(new BoxGeometry(0.04, 1.08, 0.04), wood);
      spoke.position.copy(wheel.position);
      spoke.rotation.z = (k * Math.PI) / 7;
      g.add(spoke);
    }
  }
  const axle = new Mesh(new BoxGeometry(0.12, 0.12, 0.96), wood);
  axle.position.set(0, 0.58, 0);
  const trail = new Mesh(new BoxGeometry(1.2, 0.14, 0.26), wood);
  trail.position.set(-0.6, 0.4, 0);
  trail.rotation.z = 0.33;
  const cheek = new Mesh(new BoxGeometry(0.7, 0.24, 0.3), wood);
  cheek.position.set(0, 0.74, 0);
  const barrel = new Mesh(new CylinderGeometry(0.075, 0.115, 1.5, 18), bronze);
  barrel.rotation.z = Math.PI / 2 + 0.02;
  barrel.position.set(0.32, 0.9, 0);
  const knob = new Mesh(new CylinderGeometry(0.05, 0.05, 0.08, 10), bronze);
  knob.rotation.z = Math.PI / 2;
  knob.position.set(-0.47, 0.9, 0);
  g.add(axle, trail, cheek, barrel, knob);
  return g;
}
