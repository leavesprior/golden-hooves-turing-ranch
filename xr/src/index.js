import {
  DepthOccludable,
  DepthSensingSystem,
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
  Box3,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  PMREMGenerator,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import projectOptions from 'virtual:iwsdk-project';
import { BACKDROP } from './backdrop-config.js';
import { CAST, LINE, PLACE } from './line-data.js';
import { checkLaws, lawCoverage } from './laws.js';
import { FACADE_W, build1867, buildCat, buildFrog, buildHattie, buildSlip1, setOpacity } from './line-layers.js';
import { REVEAL } from './reveal-config.js';
import { EMITTERS, createPeriodAudio } from './period-audio.js';
import { buildCard, buildWords } from './speech.js';
import { GUIDE_CAST, NARRATION, buildGuide, buildOldAbe, buildPlaybill } from './volcano-demo.js';

const FADE_SECONDS = 0.8;
const WALL_WAIT_SECONDS = 3;
const FALLBACK_DISTANCE = 2.5;
const EYE_TO_FLOOR = 1.6;
const FROG_HOME = new Vector3(1.05, 0, 0.9);

const params = new URLSearchParams(location.search);
// Verification hooks exist only with ?probe=1; a normal page exposes nothing.
const PROBE = params.get('probe') === '1';
// Rung 1: the caption cards break the spell, so they exist only with ?captions=1.
const CAPTIONS = params.get('captions') === '1';
// The Volcano demo: the red-coated Guide narrates; the playbill and Old Abe join c.1867; Hattie rests.
const DEMO = params.get('demo') === 'volcano';
// Emulator only (probe-gated): IWER's synthetic room becomes a photo of Volcano's Main Street.
const BACKDROP_VOLCANO = PROBE && params.get('backdrop') === 'volcano';
// Probe-only: point Hattie at another loopback port (a stub, or a dead port).
const BRAIN_URL = PROBE && /^\d+$/.test(params.get('brain') || '') ? `http://127.0.0.1:${params.get('brain')}/ask` : REVEAL.brainUrl;
// Words the brain uses to mark 'no mind answered': never shown as speech.
const SPOKEN_TIERS = ['remembered', 'local', 'strong'];

// Per-player memory: a random id per browser, so 'You asked me that before' is only ever
// said to the player who asked. Storage can be blocked: then it lives for this page only.
const PLAYER_KEY = 'outOfTime.playerId';
const PLAYER_ID = (() => {
  const make = () => 'p_' + Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
  try {
    let id = localStorage.getItem(PLAYER_KEY);
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id || '')) {
      id = make();
      localStorage.setItem(PLAYER_KEY, id);
    }
    return id;
  } catch {
    return make();
  }
})();

// A model often wraps its whole answer in quote marks; she does not speak in quote marks.
// Only a matching pair around the WHOLE answer is removed, and only if that mark does not
// occur inside ('"Beans," she says. "Coffee."' is left as it is).
const QUOTE_PAIRS = [['"', '"'], ['\u201c', '\u201d'], ["'", "'"], ['\u2018', '\u2019']];
function stripWrappingQuotes(text) {
  for (const [a, z] of QUOTE_PAIRS) {
    const inner = text.slice(1, -1);
    if (text.length > 2 && text.startsWith(a) && text.endsWith(z) && !inner.includes(a) && !inner.includes(z)) return inner.trim();
  }
  return text;
}

const scan = { planes: [], placedBy: null, steps: [], lastSelect: null };
const tableRefs = []; // detected real tables (verification only)
const state = { hattieHold: null, index: 0, fades: LINE.map((_, i) => (i === 0 ? 1 : 0)), hop: -1, stepAtMs: 0 };
// The reveal ladder's live state (rungs 1-6); every pacing number is in REVEAL.
const freshReveal = () => ({
  t0: null, elapsed: 0, frog: 0, nextSound: null,
  gazeFade: 1, gazed: false, gazeDeg: null, glimpses: 0, noticed: false, holdX: null, yaw: 0,
  contact: false, busy: false, thinking: false, think: 0, speech: null, shrug: -1,
});
const reveal = { ...freshReveal(), asks: [] };
// Hattie's walk in the facade frame: idle, walk across, pause, walk back.
const HATTIE_Z = 1.25;
const HATTIE_X = 1.3;
const HATTIE_IDLE = 2;
const HATTIE_WALK = 7;
const HATTIE_PAUSE = 2.5;

function hattiePose(time) {
  const period = HATTIE_IDLE + HATTIE_WALK + HATTIE_PAUSE + HATTIE_WALK;
  let t = time % period;
  if (t < HATTIE_IDLE) return { x: -HATTIE_X, dir: 0, walking: false };
  t -= HATTIE_IDLE;
  if (t < HATTIE_WALK) return { x: -HATTIE_X + (2 * HATTIE_X * t) / HATTIE_WALK, dir: 1, walking: true };
  t -= HATTIE_WALK;
  if (t < HATTIE_PAUSE) return { x: HATTIE_X, dir: 0, walking: false };
  t -= HATTIE_PAUSE;
  return { x: HATTIE_X - (2 * HATTIE_X * t) / HATTIE_WALK, dir: -1, walking: true };
}

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
const DEG = Math.PI / 180;
const rand = ([a, b]) => a + Math.random() * (b - a);

World.create(document.getElementById('scene-container'), projectOptions).then((world) => {
  const root = new Group();
  const rootEntity = world.createTransformEntity(root, { persistent: true });
  // Reflections for the metal pieces only (the Frog's gold, Old Abe's bronze and iron): a neutral
  // studio environment, so metal reads as metal instead of flat colour.
  const envMap = new PMREMGenerator(world.renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const giveEnv = (o, k = 1) => o.traverse((m) => { if (m.material && m.material.metalness > 0) { m.material.envMap = envMap; m.material.envMapIntensity = k; } });

  // Rung 4: the WHOLE c.1867 and Sideways layers sit behind real objects, not only Hattie.
  const layers = { c1867: build1867(), slip1: buildSlip1() };
  const layerEntities = {};
  for (const [id, g] of Object.entries(layers)) {
    setOpacity(g, 0);
    layerEntities[id] = world.createTransformEntity(g, { parent: rootEntity, persistent: true });
    layerEntities[id].addComponent(DepthOccludable);
  }
  const cat = buildCat();
  layerEntities.cat = world.createTransformEntity(cat, { parent: rootEntity, persistent: true });
  cat.position.set(0, 0.03, DEMO ? 1.75 : 0.8); // demo: the board walk's front edge, in front of all
  giveEnv(cat, 0.7);
  setOpacity(cat, 0);
  layerEntities.cat.addComponent(DepthOccludable);

  const hattie = buildHattie();
  const hattieEntity = world.createTransformEntity(hattie, { parent: rootEntity, persistent: true });
  hattie.position.set(-HATTIE_X, 0, HATTIE_Z);
  setOpacity(hattie, 0);
  // Real-world occlusion: the headset's depth map hides her behind real tables.
  hattieEntity.addComponent(DepthOccludable);
  layerEntities.hattie = hattieEntity;

  // Her words: in the facade frame beside her, never parented to an occluded group.
  const words = buildWords();
  words.mesh.position.set(0, 1.86, HATTIE_Z);
  root.add(words.mesh);

  // The Volcano demo pieces. The playbill and Old Abe belong to c.1867 (they fade with it and
  // real depth can hide them); the Guide stands in every layer, a still figure, and narrates.
  const demo = { guide: null, guideWords: null, elements: {}, queue: [], cur: null, said: new Set(), look: {}, fade: 0 };
  if (DEMO) {
    const playbill = buildPlaybill();
    playbill.position.set(-1.0, 1.45, 0.04);
    const oldAbe = buildOldAbe();
    // Three-quarter view from the street: the muzzle turned a little toward the viewer, the whole
    // gun (tube, carriage, both wheels, trail) inside the facade volume and clear of the Guide.
    oldAbe.position.set(-0.25, 0, 1.25);
    oldAbe.rotation.y = -0.55;
    giveEnv(oldAbe);
    layers.c1867.add(playbill, oldAbe);
    // v2 showed the porch sign board as an empty dark panel (its trim sits behind its face); the
    // demo has no sourced name to paint on it, so the demo leaves it out.
    for (const n of ['signboard', 'signtrim']) layers.c1867.remove(layers.c1867.getObjectByName(n));
    setOpacity(layers.c1867, 0);
    // `near`: the piece is told only from within this distance (m), so it is close enough to read.
    demo.elements = { playbill: { obj: playbill, center: [-1.0, 1.45, 0.04], near: 2.0 }, oldAbe: { obj: oldAbe, center: [-0.2, 1.1, 1.3], near: Infinity } };
    demo.guide = buildGuide();
    demo.guide.position.set(1.2, 0, 1.35); // on the board walk, right of Old Abe's muzzle
    setOpacity(demo.guide, 0);
    root.add(demo.guide);
    // The theatre stop: the same 1854 bill, shown again on the stone front between two doors.
    demo.bill2 = buildPlaybill();
    demo.bill2.position.set(0.0, 1.5, 0.04);
    demo.bill2.scale.setScalar(1.4);
    setOpacity(demo.bill2, 0);
    root.add(demo.bill2);
    demo.guideWords = buildWords({ backing: true });
    demo.guideWords.mesh.scale.setScalar(2.0);
    demo.guideWords.mesh.position.set(0.35, 2.3, 1.9);
    root.add(demo.guideWords.mesh);
  }
  const narrate = (key) => {
    if (!DEMO || demo.said.has(key)) return;
    demo.said.add(key);
    demo.queue.push(...NARRATION[key].map((l) => ({ ...l, key })));
  };

  const caption = CAPTIONS ? captionCard() : null;
  if (caption) {
    caption.mesh.position.set(-1.05, 1.3, 1.1);
    caption.mesh.rotation.y = 0.25;
    root.add(caption.mesh);
    caption.draw(LINE[0]);
  }

  const frog = buildFrog();
  const frogEntity = world.createTransformEntity(frog, { parent: rootEntity, persistent: true });
  frog.position.copy(FROG_HOME);
  if (DEMO) frog.position.set(-1.4, 0, 1.75); // on the board walk, in front of Old Abe's near wheel
  giveEnv(frog, 1.2);
  frog.rotation.y = -0.5;
  setOpacity(frog, 0); // Rung 1: not even the Frog, at first.
  frogEntity.addComponent(RayInteractable);
  frogEntity.addComponent(PokeInteractable);

  // Rung 6: three question cards by the player's left hand (player space, not the facade).
  const cards = REVEAL.cards.map((c) => {
    const mesh = buildCard(c.text);
    mesh.visible = false;
    const entity = world.createTransformEntity(mesh, { persistent: true });
    entity.addComponent(RayInteractable);
    entity.addComponent(PokeInteractable);
    return { ...c, mesh, entity };
  });

  let audio = null;

  const step = () => {
    if (state.hop >= 0) return;
    state.hop = 0;
    state.index = (state.index + 1) % LINE.length;
    // The demo skips Sideways: after the cannon the Guide walks to the theatre instead.
    if (DEMO && LINE[state.index].id === 'slip1') state.index = (state.index + 1) % LINE.length;
    state.stepAtMs = performance.now();
    if (caption) caption.draw(LINE[state.index]);
    // Sound before sight: c.1867 is heard at once, seen REVEAL.sightDelay1867 later.
    if (LINE[state.index].id === 'c1867' && reveal.t0 !== null) reveal.nextSound = reveal.elapsed;
    const src = scan.lastSelect;
    scan.steps.push({ to: LINE[state.index].id, by: src ? (src.hand ? 'hand-pinch' : 'controller') : 'screen' });
  };

  // Which input pressed: a tracked hand's select is a pinch (thumb + index).
  // Recorded on selectstart; the Frog steps on release, after this.
  const onSelectStart = (ev) => {
    scan.lastSelect = { hand: !!ev.inputSource.hand, handedness: ev.inputSource.handedness };
  };

  const placeInBrowser = () => {
    // Flat-screen preview only: stand back far enough to see the ground and the Frog.
    root.position.set(0, 0.25, -4.8);
    root.rotation.set(0, 0, 0);
    Object.assign(reveal, freshReveal());
  };
  placeInBrowser();

  // Place the facade frame: origin on the wall at ground level, +z toward the viewer.
  const placeFrame = (pos, normal) => {
    root.position.copy(pos);
    root.lookAt(pos.clone().add(normal));
  };

  const say = (text, tier) => {
    words.draw(text);
    reveal.speech = { text, tier, age: 0, dur: REVEAL.speechHoldSeconds + REVEAL.speechHoldPerChar * text.length, opacity: 0 };
  };

  // Ask the brain. Only an answer a mind actually gave is ever spoken; anything else is a shrug.
  const ask = async (card) => {
    if (reveal.busy) return;
    reveal.busy = true;
    reveal.thinking = true; // the thinking beat: she turns to the stove
    reveal.speech = null;
    const rec = { card: card.id, question: card.text, at: new Date().toISOString() };
    reveal.asks.push(rec);
    const t0 = performance.now();
    let r = null;
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), REVEAL.brainTimeoutMs);
      const res = await fetch(BRAIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npc_id: REVEAL.npcId, question: card.text, player_id: PLAYER_ID }),
        signal: ctl.signal,
      });
      clearTimeout(timer);
      r = res.ok ? await res.json() : null;
      rec.http = res.status;
    } catch (e) {
      rec.error = String(e && e.message);
    }
    rec.ms = Math.round(performance.now() - t0);
    rec.tier = r ? r.tier : 'unreachable';
    rec.learned = !!(r && r.learned);
    rec.brain = r ? { tier: r.tier, answer: r.answer, _conf: r._conf, why: r.why, source: r.source, best: r.best, learned: r.learned, remembered_from: r.remembered_from ?? null } : null;
    reveal.busy = false;
    reveal.thinking = false;
    const answer = r && SPOKEN_TIERS.includes(r.tier) && typeof r.answer === 'string' ? stripWrappingQuotes(r.answer.trim()) : '';
    if (!answer) {
      reveal.shrug = 0; // no mind answered: she shrugs, and says nothing
      rec.shown = null;
      return;
    }
    // 'You asked me that before' only for THIS player's own earlier question, never a seed hit.
    const text = (r.tier === 'remembered' && r.remembered_from === 'self' ? REVEAL.rememberedPrefix : '') + answer;
    rec.shown = text;
    say(text, r.tier);
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
      let labelledFloor = false;
      scan.planes = [];
      tableRefs.length = 0;
      for (const entity of this.queries.planes.entities) {
        const plane = entity.getValue(XRPlane, '_plane');
        const obj = entity.object3D;
        if (!plane || !obj) continue;
        const origin = obj.getWorldPosition(new Vector3());
        const label = plane.semanticLabel;
        scan.planes.push({ o: plane.orientation, label: label ?? null, y: +origin.y.toFixed(2), d: +head.distanceTo(origin).toFixed(2) });
        if (label === 'table') tableRefs.push({ obj, plane });
        if (plane.orientation === 'horizontal') {
          // A labelled floor wins; otherwise the HIGHEST unlabelled plane >= 1 m
          // below the eyes (a street below the kerb must not sink the facade).
          if (label === 'floor' && head.y - origin.y > 1) {
            floorY = labelledFloor ? Math.max(floorY, origin.y) : origin.y;
            labelledFloor = true;
          } else if (!label && !labelledFloor && head.y - origin.y > 1) {
            floorY = floorY === null ? origin.y : Math.max(floorY, origin.y);
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
      // Only the Frog steps the line; a question card is RayInteractable too.
      this.queries.pressed.subscribe('disqualify', (entity) => {
        if (entity === frogEntity && reveal.frog > 0.5) step();
        const card = cards.find((c) => c.entity === entity);
        if (card && reveal.contact && card.mesh.visible) ask(card);
      });
    }

    update() {
      scan.frogHovered = [...this.queries.hovered.entities].includes(frogEntity);
      if (scan.frogHovered) scan.everHovered = true;
    }
  }

  const faceCam = new Quaternion();
  const camQ = new Quaternion();
  class LineSystem extends createSystem({}) {
    update(delta, time) {
      const current = LINE[state.index].id;
      const heard = performance.now() - state.stepAtMs < REVEAL.sightDelay1867 * 1000;
      LINE.forEach((layer, i) => {
        // Sound before sight: c.1867 stays unseen for its first beat.
        const target = i === state.index && !(layer.id === 'c1867' && heard) ? 1 : 0;
        const s = delta / FADE_SECONDS;
        state.fades[i] += Math.max(-s, Math.min(s, target - state.fades[i]));
        if (layers[layer.id] && layers[layer.id].userData.fade !== state.fades[i]) {
          layers[layer.id].userData.fade = state.fades[i];
          setOpacity(layers[layer.id], state.fades[i]);
        }
      });

      // Layer glows are planes (so real depth can hide them): turn them to the camera.
      root.getWorldQuaternion(faceCam).invert().multiply(this.world.camera.getWorldQuaternion(camQ));
      // Lantern flicker, drifting motes and fog, the door in the air.
      layers.c1867.traverse((o) => {
        if (o.userData.billboard) o.quaternion.copy(faceCam);
        if (o.userData.flicker !== undefined) o.material.opacity = o.material.userData.baseOpacity * state.fades[1] * (0.8 + 0.2 * Math.sin(time * 9 + o.userData.flicker));
      });
      layers.slip1.traverse((o) => {
        if (o.userData.billboard) o.quaternion.copy(faceCam);
        const d = o.userData.drift;
        if (d) o.position.set(d.base.x + Math.sin(time * 0.4 + d.phase) * d.amp, d.base.y + Math.sin(time * 0.7 + d.phase) * d.amp * 0.6, d.base.z + Math.cos(time * 0.3 + d.phase) * d.amp);
        if (o.userData.bob) {
          o.position.y = 0.15 + Math.sin(time * 0.8) * 0.05;
          o.rotation.y = Math.sin(time * 0.3) * 0.4;
        }
      });

      // The cat walks the board walk in 1867; sideways it is and is not.
      // Demo: a slower, wider walk along the shop fronts, so the cat is seen whole and walking.
      // Demo: along the front edge, right of Old Abe's muzzle (behind the gun or the Guide it was hidden in the first v3 cuts).
      const catW = DEMO ? 0.2 : 0.18;
      const walkX = DEMO ? 1.45 + Math.sin(time * catW) * 0.7 : Math.sin(time * catW) * 1.2;
      const dir = Math.cos(time * catW) >= 0 ? 1 : -1;
      cat.position.x = walkX;
      cat.rotation.y = dir > 0 ? 0 : Math.PI;
      cat.userData.legs.forEach((leg, i) => { leg.rotation.z = Math.sin(time * 8 + (i % 2) * Math.PI) * 0.35; });
      cat.userData.tail.rotation.x = Math.sin(time * 2) * 0.4;
      let catOpacity = current === 'c1867' ? state.fades[1] : 0;
      if (current === 'slip1') catOpacity = Math.sin(time * 3.1) * Math.sin(time * 1.7) > 0.15 ? state.fades[2] : 0;
      if (cat.userData.fade !== catOpacity) {
        cat.userData.fade = catOpacity;
        setOpacity(cat, catOpacity);
      }

      // Hattie walks the board walk in 1867 (until she notices you); sideways she flickers like the cat.
      const holdX = state.hattieHold ?? reveal.holdX;
      const pose = holdX === null ? hattiePose(time) : { x: holdX, dir: 0, walking: false };
      hattie.position.x = pose.x;
      hattie.rotation.y = reveal.noticed ? reveal.yaw : pose.dir === 0 ? 0 : (pose.dir * Math.PI) / 2;
      const swing = pose.walking ? Math.sin(time * 5.5) : 0;
      hattie.userData.legs.forEach((leg, i) => { leg.rotation.x = swing * 0.4 * (i ? -1 : 1); });
      hattie.userData.arms.forEach((arm, i) => { arm.rotation.x = swing * 0.3 * (i ? 1 : -1); });
      hattie.userData.body.position.y = pose.walking ? Math.abs(Math.sin(time * 5.5)) * 0.025 : Math.sin(time * 1.5) * 0.004;
      hattie.userData.skirt.rotation.z = swing * 0.04;
      // Rung 3: in c.1867 she is seen at the edge of vision; looked at, she is gone (until she notices you).
      let hattieOpacity = current === 'c1867' ? state.fades[1] * (reveal.noticed ? 1 : reveal.gazeFade) : 0;
      if (current === 'slip1') hattieOpacity = Math.sin(time * 2.3) * Math.sin(time * 1.1) > 0.3 ? state.fades[2] * 0.6 : 0;
      if (DEMO) hattieOpacity = 0; // the demo is the Guide's; Hattie rests
      if (hattie.userData.fade !== hattieOpacity) {
        hattie.userData.fade = hattieOpacity;
        setOpacity(hattie, hattieOpacity);
      }

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

  // The reveal ladder, rungs 1-6. Runs after LineSystem each frame.
  const head = new Vector3();
  const fwd = new Vector3();
  const camUp = new Vector3();
  const tmp = new Vector3();
  const torso = new Vector3();
  class RevealSystem extends createSystem({}) {
    update(delta, time) {
      if (!this.world.session) {
        // Flat-screen preview: the Frog is there to click.
        if (reveal.frog < 1) setOpacity(frog, (reveal.frog = 1));
        return;
      }
      const cam = this.world.camera;
      cam.getWorldPosition(head);
      cam.getWorldDirection(fwd);
      camUp.set(0, 1, 0).applyQuaternion(cam.getWorldQuaternion(cam.quaternion.clone()));
      if (reveal.t0 === null) {
        reveal.t0 = time;
        setOpacity(frog, (reveal.frog = 0));
      }
      reveal.elapsed = time - reveal.t0;
      const current = LINE[state.index].id;

      // Rung 1: the Frog, the first thing seen, only after the quiet and the first sounds.
      if (reveal.elapsed >= REVEAL.frogAppearSeconds && reveal.frog < 1) {
        reveal.frog = Math.min(1, reveal.frog + delta / REVEAL.frogFadeSeconds);
        setOpacity(frog, reveal.frog);
      }

      // Rung 2: sound before sight, from where the 1867 layer is (or will be).
      if (audio) {
        audio.setListener(head, fwd, camUp);
        for (const [kind, p] of Object.entries(EMITTERS)) audio.setEmitter(kind, root.localToWorld(tmp.set(...p)));
        if (reveal.elapsed >= REVEAL.quietSeconds && (current === 'now' || current === 'c1867')) {
          if (reveal.nextSound === null) reveal.nextSound = reveal.elapsed;
          if (reveal.elapsed >= reveal.nextSound) {
            audio.play();
            reveal.nextSound = reveal.elapsed + rand(current === 'c1867' ? REVEAL.soundGap1867 : REVEAL.soundGapNow);
          }
        }
      }

      // Rung 3: gaze. Head forward within the cone of her torso = looking at her.
      torso.copy(hattie.position).setY(1.1);
      root.localToWorld(torso);
      tmp.copy(torso).sub(head).normalize();
      reveal.gazeDeg = Math.acos(Math.max(-1, Math.min(1, fwd.dot(tmp)))) / DEG;
      const inC1867 = current === 'c1867' && state.fades[1] > 0.5;
      const gazed = inC1867 && reveal.gazeDeg < REVEAL.gazeConeDeg;
      if (gazed && !reveal.gazed && !reveal.noticed && hattie.userData.fade >= 0.5) {
        reveal.glimpses++; // she was seen at the edge of vision, and looked at
        // Rung 5: after N glimpses she stops fading, stops walking and turns to you.
        if (reveal.glimpses >= REVEAL.glimpsesToNotice) {
          reveal.noticed = true;
          reveal.holdX = hattie.position.x;
          reveal.yaw = hattie.rotation.y;
        }
      }
      reveal.gazed = gazed;
      const g = delta / REVEAL.gazeFadeSeconds;
      reveal.gazeFade += Math.max(-g, Math.min(g, (gazed ? 0 : 1) - reveal.gazeFade));

      // She faces you (or, while thinking, turns toward the stove).
      reveal.think += Math.max(-delta * 2, Math.min(delta * 2, (reveal.thinking ? 1 : 0) - reveal.think));
      if (reveal.noticed) {
        const local = root.worldToLocal(tmp.copy(head));
        let target = Math.atan2(local.x - hattie.position.x, local.z - hattie.position.z) + reveal.think * REVEAL.thinkTurnRad;
        let d = target - reveal.yaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        reveal.yaw += Math.max(-REVEAL.turnRadPerSecond * delta, Math.min(REVEAL.turnRadPerSecond * delta, d));
        hattie.rotation.y = reveal.yaw;
        if (reveal.think > 0.01) hattie.userData.arms[1].rotation.x = -0.9 * reveal.think; // stirring the pot
      }

      // Rung 6: contact. Near her and facing her, she speaks; the cards appear by your left hand.
      const flat = tmp.copy(torso).sub(head).setY(0);
      const dist = flat.length();
      const facingDeg = Math.acos(Math.max(-1, Math.min(1, flat.normalize().dot(fwd.clone().setY(0).normalize())))) / DEG;
      if (!reveal.contact && reveal.noticed && current === 'c1867' && dist < REVEAL.contactDistance && facingDeg < REVEAL.contactFacingDeg) {
        reveal.contact = true;
        say(REVEAL.greeting, 'authored');
      } else if (reveal.contact && (current !== 'c1867' || dist > REVEAL.contactReleaseDistance)) {
        reveal.contact = false;
      }
      reveal.dist = +dist.toFixed(2);
      reveal.facingDeg = +facingDeg.toFixed(1);

      // Cards follow the left hand; if it is not tracked near the head, low and to the left.
      const grip = this.world.playerSpaceEntities?.gripSpaces?.left?.object3D;
      const anchor = new Vector3();
      if (grip) grip.getWorldPosition(anchor);
      if (!grip || anchor.distanceTo(head) > 0.9 || anchor.lengthSq() < 1e-6) {
        const right = new Vector3().crossVectors(fwd, camUp).normalize();
        anchor.copy(head).addScaledVector(fwd, 0.4).addScaledVector(right, -0.18).addScaledVector(camUp, -0.3);
        reveal.cardsOn = 'head-fallback';
      } else reveal.cardsOn = 'left-hand';
      cards.forEach((c, i) => {
        c.mesh.visible = reveal.contact;
        c.mesh.position.copy(anchor).addScaledVector(up, 0.1 + (cards.length - 1 - i) * 0.062);
        c.mesh.lookAt(head);
        c.mesh.material.opacity = reveal.busy ? 0.45 : 1;
      });

      // Her words by her mouth: fade in, hold, fade out. Nothing left on screen.
      const sp = reveal.speech;
      if (sp) {
        sp.age += delta;
        const fin = Math.min(1, sp.age / REVEAL.speechFadeInSeconds);
        const fout = Math.max(0, 1 - Math.max(0, sp.age - REVEAL.speechFadeInSeconds - sp.dur) / REVEAL.speechFadeOutSeconds);
        sp.opacity = Math.min(fin, fout);
        words.mesh.material.opacity = sp.opacity;
        words.mesh.visible = sp.opacity > 0.001 && hattie.userData.fade > 0.1;
        // Just above her mouth, a little toward the listener, so the words come FROM her.
        const toward = root.worldToLocal(tmp.copy(head)).sub(hattie.position).setY(0).normalize();
        words.mesh.position.copy(hattie.position).addScaledVector(toward, 0.3).setY(1.68);
        words.mesh.lookAt(head);
        if (sp.opacity <= 0 && sp.age > 1) reveal.speech = null;
      } else words.mesh.visible = false;

      // No mind answered: a shrug, and no words.
      if (reveal.shrug >= 0) {
        reveal.shrug += delta / REVEAL.shrugSeconds;
        const k = Math.sin(Math.min(1, reveal.shrug) * Math.PI);
        hattie.userData.arms.forEach((arm, i) => { arm.rotation.z = (i ? 1 : -1) * 0.55 * k; });
        hattie.userData.body.position.y += 0.03 * k;
        if (reveal.shrug >= 1) {
          reveal.shrug = -1;
          hattie.userData.arms.forEach((arm) => { arm.rotation.z = 0; });
        }
      }
    }
  }

  // The Volcano demo: the Guide fades in, narrates by beat, and tells what the player looks at.
  const gHead = new Vector3();
  const gFwd = new Vector3();
  const gTmp = new Vector3();
  class GuideSystem extends createSystem({}) {
    update(delta) {
      if (!DEMO) return;
      if (!this.world.session || reveal.t0 === null) {
        if (demo.fade !== 0) setOpacity(demo.guide, (demo.fade = 0));
        demo.guideWords.mesh.visible = false;
        return;
      }
      const cam = this.world.camera;
      cam.getWorldPosition(gHead);
      cam.getWorldDirection(gFwd);
      const current = LINE[state.index].id;
      // The Guide: a still figure, faded in (never animated); turned about her vertical axis to you.
      // She keeps her place on the street: walk away from where you stood and she fades; come back and she is there.
      // Home = where the head is once the session has settled (the first XR frames can still carry the flat-preview camera).
      if (!demo.home && reveal.elapsed >= 0.5) demo.home = gHead.clone();
      const atHome = !!demo.home && gHead.distanceTo(demo.home) < REVEAL.guideHomeRadius;
      const want = reveal.elapsed >= REVEAL.guideAppearSeconds && atHome ? 1 : 0;
      if (demo.fade !== want) setOpacity(demo.guide, (demo.fade = want > demo.fade ? Math.min(1, demo.fade + delta / 1.0) : Math.max(0, demo.fade - delta / 0.3)));
      const local = root.worldToLocal(gTmp.copy(gHead));
      demo.guide.rotation.y = Math.atan2(local.x - demo.guide.position.x, local.z - demo.guide.position.z);
      // Beats.
      if (demo.fade >= 1) narrate('intro');
      if (reveal.frog >= 1) narrate('frog');
      const seen1867 = current === 'c1867' && state.fades[1] > 0.9;
      if (seen1867) narrate('c1867');
      if (current === 'now' && demo.said.has('plaque') && state.fades[0] > 0.9) narrate('now');
      const silent = !demo.cur && !demo.queue.length;
      if (demo.said.has('now') && silent) narrate('walk');
      // The walk: once she has said so, the Guide (still a still) moves down the board walk with a
      // small step bob, and out of view. The take then cross-fades the street to the theatre (the
      // emulator's stand-in for walking there; on a headset the player walks), and she walks in.
      const fig = demo.guide.userData.figure;
      demo.moving = false;
      const bob = () => { fig.position.y = 0.83 + Math.abs(Math.sin(demo.stride * 6)) * 0.018; };
      if (demo.said.has('walk') && silent && !demo.place && demo.guide.position.x < 7.5) {
        demo.stride = (demo.stride || 0) + delta;
        demo.guide.position.x += delta * 1.3;
        demo.moving = true;
        bob();
      }
      if (demo.place === 'theatre' && demo.guide.position.x < 1.2) {
        demo.stride = (demo.stride || 0) + delta;
        demo.guide.position.x = Math.min(1.2, demo.guide.position.x + delta * 1.3);
        demo.moving = true;
        bob();
        if (demo.guide.position.x >= 1.2) fig.position.y = 0.83;
      }
      if (demo.place === 'theatre' && demo.guide.position.x >= 1.2) narrate('theatre');
      // The bill again, on the theatre's stone front, while she names the play.
      if (demo.bill2) {
        const want2 = demo.cur && demo.cur.at === 'bill2' ? 1 : demo.bill2.userData.fade || 0;
        const f2 = Math.min(1, (demo.bill2.userData.fade || 0) + delta / 1.2);
        if (want2 > 0 && demo.bill2.userData.fade !== f2) setOpacity(demo.bill2, (demo.bill2.userData.fade = f2));
      }
      // Look at a piece for a moment, and the Guide tells it.
      for (const [id, el] of Object.entries(demo.elements)) {
        const c = root.localToWorld(gTmp.set(...el.center)).sub(gHead).normalize();
        const deg = Math.acos(Math.max(-1, Math.min(1, gFwd.dot(c)))) / DEG;
        // Only while she is silent (she does not interrupt herself), so a glance in passing does not count.
        const idle = demo.said.has('c1867') && !demo.cur && !demo.queue.length;
        const near = gTmp.copy(root.localToWorld(new Vector3(...el.center))).distanceTo(gHead) <= el.near;
        demo.look[id] = seen1867 && idle && near && deg < REVEAL.guideLookDeg ? (demo.look[id] || 0) + delta : 0;
        if (demo.look[id] >= REVEAL.guideLookSeconds) narrate(id);
      }
      if (demo.said.has('oldAbe') && !demo.queue.length && !demo.cur) narrate('plaque');
      // One caption at a time: fade in, hold, fade out.
      if (!demo.cur && demo.queue.length) {
        const line = demo.queue.shift();
        demo.cur = { ...line, age: 0, dur: REVEAL.guideHoldSeconds + REVEAL.guideHoldPerChar * line.text.length };
        demo.guideWords.draw(line.text);
        // A caption about a piece seen up close stands by that piece; the rest stand above the Guide.
        const a = line.at === 'playbill' ? { p: [-1.0, 2.05, 0.35], k: 1.0 } : line.at === 'bill2' ? { p: [0.1, 2.35, 1.0], k: 2.0 } : { p: [0.35, 2.3, 1.9], k: 2.0 };
        demo.guideWords.mesh.position.set(...a.p);
        demo.guideWords.mesh.scale.setScalar(a.k);
        demo.log = demo.log || [];
        demo.log.push({ key: line.key, text: line.text, src: line.src, at: +reveal.elapsed.toFixed(1) });
      }
      const w = demo.guideWords.mesh;
      if (demo.cur) {
        const sp = demo.cur;
        sp.age += delta;
        const o = Math.min(Math.min(1, sp.age / 0.3), Math.max(0, 1 - Math.max(0, sp.age - 0.3 - sp.dur) / 0.6));
        w.material.opacity = o;
        w.visible = o > 0.001;
        w.lookAt(gHead);
        if (sp.age > 0.3 + sp.dur + 0.6) demo.cur = null;
      } else w.visible = false;
    }
  }

  world.renderer.xr.addEventListener('sessionstart', () => {
    world.renderer.xr.getSession().addEventListener('selectstart', onSelectStart);
  });
  world.registerSystem(DepthSensingSystem);
  world.registerSystem(PlacementSystem);
  world.registerSystem(FrogSystem);
  world.registerSystem(LineSystem);
  world.registerSystem(RevealSystem);
  world.registerSystem(GuideSystem);

  if (PROBE) {
    // Everything this app adds to the world, for 'is anything drawn?' checks.
    const visibleOwned = () => {
      let n = 0;
      const names = [];
      const visit = (o, shown) => {
        const on = shown && o.visible;
        if (on && (o.isMesh || o.isSprite) && (o.material?.opacity ?? 1) > 0.01) {
          n++;
          if (names.length < 8) names.push(o.geometry?.type ?? o.type);
        }
        o.children.forEach((c) => visit(c, on));
      };
      visit(root, true);
      cards.forEach((c) => visit(c.mesh, true));
      return { n, names };
    };
    const screen = (v) => {
      const p = v.clone().project(world.camera);
      return [Math.round(((p.x + 1) / 2) * window.innerWidth), Math.round(((1 - p.y) / 2) * window.innerHeight), +p.z.toFixed(3)];
    };
    window.__outOfTime = {
      config: () => JSON.parse(JSON.stringify(REVEAL)),
      layer: () => LINE[state.index].id,
      session: () => !!world.session,
      laws: () => {
        root.updateMatrixWorld(true);
        const extra = DEMO ? { guide: demo.guide, guideWords: demo.guideWords.mesh } : {};
        return checkLaws({ scene: world.scene, root, layers: { ...layers, hattie, words: words.mesh, ...extra }, line: LINE, cast: DEMO ? [...CAST, GUIDE_CAST] : CAST });
      },
      lawCoverage: () => lawCoverage({ ...layers, hattie, words: words.mesh }),
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
      steps: () => scan.steps.slice(),
      inputSources: () => (world.session ? [...world.session.inputSources].map((s) => ({ hand: !!s.hand, handedness: s.handedness, profiles: s.profiles })) : []),
      reveal: () => {
        const { speech, ...rest } = reveal;
        return JSON.parse(JSON.stringify({
          ...rest,
          speech: speech && { text: speech.text, tier: speech.tier, opacity: +speech.opacity.toFixed(2), visible: words.mesh.visible },
          visibleOwned: visibleOwned(),
          captions: !!caption && caption.mesh.parent !== null,
          hattieOpacity: hattie.userData.fade ?? 0,
          yaw: +hattie.rotation.y.toFixed(3),
        }));
      },
      audio: () => (audio ? { ...audio.graph(), peak: +audio.peak().toFixed(5) } : null),
      catBox: () => {
        const b = new Box3().setFromObject(cat);
        const pts = [];
        for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(screen(new Vector3(x, y, z)));
        return cat.visible ? [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1]))] : null;
      },
      // World point the head should look at to put her torso `deg` off the head's forward (yaw).
      lookOffHattie: (deg) => {
        const headW = world.camera.getWorldPosition(new Vector3());
        const t = root.localToWorld(hattie.position.clone().setY(1.1)).sub(headW);
        t.applyAxisAngle(up, deg * DEG);
        return headW.add(t).toArray();
      },
      headLocal: () => root.worldToLocal(world.camera.getWorldPosition(new Vector3())).toArray().map((v) => +v.toFixed(2)),
      hattie: () => {
        hattie.updateMatrixWorld(true);
        const box = new Box3().setFromObject(hattie);
        let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
        for (const cx of [box.min.x, box.max.x]) for (const cy of [box.min.y, box.max.y]) for (const cz of [box.min.z, box.max.z]) {
          const p = new Vector3(cx, cy, cz).project(world.camera);
          const sx = ((p.x + 1) / 2) * window.innerWidth;
          const sy = ((1 - p.y) / 2) * window.innerHeight;
          x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
        }
        // Angle between her facing (+z) and the direction to the player, on the floor.
        const toCam = root.worldToLocal(world.camera.getWorldPosition(new Vector3())).sub(hattie.position).setY(0).normalize();
        const facing = new Vector3(Math.sin(hattie.rotation.y), 0, Math.cos(hattie.rotation.y));
        return {
          opacity: hattie.userData.fade ?? 0,
          visible: hattie.visible,
          local: hattie.position.toArray().map((v) => +v.toFixed(3)),
          world: hattie.getWorldPosition(new Vector3()).toArray().map((v) => +v.toFixed(3)),
          head: root.localToWorld(hattie.position.clone().setY(1.47)).toArray(),
          screenBox: [x0, y0, x1, y1].map(Math.round),
          occludable: hattieEntity.hasComponent(DepthOccludable),
          facingPlayerDeg: +(Math.acos(Math.max(-1, Math.min(1, facing.dot(toCam)))) / DEG).toFixed(1),
        };
      },
      layerOcclusion: () => Object.fromEntries(Object.entries(layerEntities).map(([k, e]) => [k, e.hasComponent(DepthOccludable)])),
      setLayerOcclusion: (on) => {
        for (const e of Object.values(layerEntities)) {
          if (on && !e.hasComponent(DepthOccludable)) e.addComponent(DepthOccludable);
          if (!on && e.hasComponent(DepthOccludable)) e.removeComponent(DepthOccludable);
        }
        return window.__outOfTime.layerOcclusion();
      },
      setOcclusion: (on) => {
        if (on && !hattieEntity.hasComponent(DepthOccludable)) hattieEntity.addComponent(DepthOccludable);
        if (!on && hattieEntity.hasComponent(DepthOccludable)) hattieEntity.removeComponent(DepthOccludable);
        return hattieEntity.hasComponent(DepthOccludable);
      },
      depth: () => {
        const sys = world.getSystem(DepthSensingSystem);
        return { cpu: sys?.cpuDepthData?.length ?? -1, gpu: sys?.gpuDepthData?.length ?? -1, enabled: world.session?.enabledFeatures ?? null };
      },
      playerId: () => PLAYER_ID,
      backdrop: () => window.__backdrop ?? null,
      // Emulator take only: the second stop. Cross-fade the backdrop to the theatre, and the Guide walks in.
      arrive: async () => {
        demo.guide.position.x = -6.5; // out of the emulator's wide view, left: she walks in
        const r = await window.__swapBackdrop(BACKDROP.theatre.src);
        demo.place = 'theatre';
        return r;
      },
      demo: () => (DEMO ? { guide: +demo.fade.toFixed(2), queue: demo.queue.length, cur: demo.cur && demo.cur.text, said: [...demo.said], log: demo.log || [], look: demo.look } : null),
      // Verification: screen rectangles (px) of the Guide and her caption, the playbill's height on screen.
      frameCheck: () => {
        const rect = (o) => {
          // The plane's own corners (not a world box around it, which grows when the plane turns).
          o.updateMatrixWorld(true);
          const pos = o.geometry.attributes.position;
          const pts = [];
          for (let i = 0; i < pos.count; i++) pts.push(screen(new Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld)));
          const r = [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1]))];
          return { r, behind: pts.some((q) => q[2] > 1 || q[2] < -1) };
        };
        const W = window.innerWidth; const H = window.innerHeight;
        const st = (x) => {
          const on = !x.behind && x.r[2] > 0 && x.r[0] < W && x.r[3] > 0 && x.r[1] < H;
          const inside = !x.behind && x.r[0] >= 0 && x.r[1] >= 0 && x.r[2] <= W && x.r[3] <= H;
          return { on, inside, r: x.r };
        };
        const g = rect(demo.guide.userData.figure);
        const w = rect(demo.guideWords.mesh);
        const pb = rect(demo.elements.playbill.obj);
        return {
          guide: { opacity: +demo.fade.toFixed(2), moving: !!demo.moving, ...st(g) },
          words: { shown: demo.guideWords.mesh.visible && demo.guideWords.mesh.material.opacity > 0.01, text: demo.cur && demo.cur.text, ...st(w) },
          playbillPx: LINE[state.index].id === 'c1867' && st(pb).inside ? pb.r[3] - pb.r[1] : 0,
          coverage: window.__backdropCoverage ? window.__backdropCoverage() : null,
        };
      },
      demoWorld: (id) => (id === 'guide' ? demo.guide.getWorldPosition(new Vector3()).add(new Vector3(0, 1.5, 0)).toArray() : root.localToWorld(new Vector3(...demo.elements[id].center)).toArray()),
      // Verification only: pin every drifting Sideways glow (motes, fog) at one point of the
      // facade frame, still, at one size, so an occlusion pixel-diff is repeatable.
      pinGlows: (x, y, z, size) => {
        let n = 0;
        layers.slip1.traverse((o) => {
          if (!o.userData.drift) return;
          o.userData.drift.base.set(x, y, z);
          o.userData.drift.amp = 0;
          o.scale.setScalar(size);
          n++;
        });
        return n;
      },
      glowKinds: () => {
        const k = { mesh: 0, sprite: 0 };
        for (const g of [layers.c1867, layers.slip1]) g.traverse((o) => { if (o.isSprite) k.sprite++; else if (o.userData.glow) k.mesh++; });
        return k;
      },
      // Verification only: pin Hattie at x (facade frame) for like-for-like screenshots; null resumes the walk.
      holdHattie: (x) => { state.hattieHold = x; },
      // Real table planes in the facade frame: x/z extent and top height.
      tablesLocal: () => tableRefs.map(({ obj, plane }) => {
        const pts = (plane.polygon || []).map((q) => root.worldToLocal(obj.localToWorld(new Vector3(q.x, q.y, q.z))));
        const r = (f) => +f.toFixed(2);
        return { x: [r(Math.min(...pts.map((q) => q.x))), r(Math.max(...pts.map((q) => q.x)))], z: [r(Math.min(...pts.map((q) => q.z))), r(Math.max(...pts.map((q) => q.z)))], top: r(pts.reduce((a, q) => a + q.y, 0) / Math.max(pts.length, 1)) };
      }),
      toWorld: (x, y, z) => root.localToWorld(new Vector3(x, y, z)).toArray(),
      toScreen: (x, y, z) => screen(root.localToWorld(new Vector3(x, y, z))),
      frogWorld: () => frog.getWorldPosition(new Vector3()).toArray(),
      frogScreen: () => {
        const p = frog.getWorldPosition(new Vector3()).add(new Vector3(0, 0.1, 0)).project(world.camera);
        return [(p.x + 1) / 2 * window.innerWidth, (1 - p.y) / 2 * window.innerHeight];
      },
      cards: () => cards.map((c) => ({ id: c.id, text: c.text, visible: c.mesh.visible, world: c.mesh.getWorldPosition(new Vector3()).toArray(), screen: screen(c.mesh.getWorldPosition(new Vector3())) })),
      wordsScreen: () => {
        const b = new Box3().setFromObject(words.mesh);
        const a = screen(b.min); const z = screen(b.max);
        return [Math.min(a[0], z[0]), Math.min(a[1], z[1]), Math.max(a[0], z[0]), Math.max(a[1], z[1])];
      },
      head: () => world.camera.getWorldPosition(new Vector3()).toArray(),
    };
  }

  if (BACKDROP_VOLCANO) {
    window.__backdrop = { pending: true };
    import('./emulator-backdrop.js')
      .then((m) => m.installBackdrop())
      .then((r) => { window.__backdrop = r; })
      .catch((e) => { window.__backdrop = { ok: false, why: String(e && e.message) }; });
  }

  const button = document.getElementById('enter-ar');
  const note = document.getElementById('enter-note');
  button.addEventListener('click', () => {
    // The click is the user gesture that lets the period sounds play.
    try {
      audio = audio || createPeriodAudio();
      audio.resume();
    } catch {
      audio = null; // no WebAudio: the ladder goes on without its sounds
    }
    setOpacity(frog, (reveal.frog = 0)); // Rung 1 starts on pure passthrough
    world.launchXR();
  });
  const supported = navigator.xr?.isSessionSupported?.('immersive-ar') ?? Promise.resolve(false);
  supported
    .catch(() => false)
    .then((ok) => {
      button.disabled = !ok;
      note.textContent = ok
        ? 'Put on the headset. Stand still a moment, and listen.'
        : 'Enter AR needs a WebXR headset (Meta Quest 3 / 3S browser). Click the Golden Frog to step along the line here.';
    });
});
