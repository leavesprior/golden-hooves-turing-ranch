// Rung 2, sound before sight: quiet, ambiguous c.1867 sounds synthesized with
// WebAudio (filtered noise and a few decaying partials). No recorded or
// downloaded audio. Each kind plays from a positional (HRTF) emitter placed in
// the facade frame where the 1867 layer will be.
import { REVEAL } from './reveal-config.js';

// Emitter positions in the facade frame (x along the wall, y up, z out of it).
export const EMITTERS = {
  hoofbeats: [-4.5, 0.4, 1.4], // down the street along the wall, far
  stoveLid: [0.9, 1.0, 0.2], // inside, at the wall
  murmur: [-0.6, 1.5, 0.3], // a voice through the wall
};

export function createPeriodAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = REVEAL.masterGain;
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  master.connect(analyser);
  analyser.connect(ctx.destination);

  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const panners = {};
  for (const kind of Object.keys(EMITTERS)) {
    const p = ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = 1;
    p.rolloffFactor = 1;
    p.connect(master);
    panners[kind] = p;
  }
  const log = []; // what was scheduled: kind, start, voices

  const burst = (at, dur, dest) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.connect(dest);
    src.start(at, Math.random() * 1.5, dur);
    return src;
  };
  const env = (at, peak, attack, decay, dest) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    g.connect(dest);
    return g;
  };

  const kinds = {
    // A horse at a canter, passing far off: muffled low thumps in threes.
    hoofbeats(at, out) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 320;
      lp.connect(out);
      let n = 0;
      const groups = 7;
      for (let k = 0; k < groups; k++) {
        const swell = Math.sin(((k + 0.5) / groups) * Math.PI); // approaches, then recedes
        for (const off of [0, 0.09, 0.17]) {
          const t = at + k * 0.36 + off + Math.random() * 0.015;
          burst(t, 0.07, env(t, 0.9 * swell + 0.05, 0.003, 0.07, lp));
          n++;
        }
      }
      return n;
    },
    // An iron stove lid set down: a short noisy clank with inharmonic ring.
    stoveLid(at, out) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2400;
      bp.Q.value = 6;
      bp.connect(out);
      burst(at, 0.03, env(at, 0.8, 0.002, 0.05, bp));
      for (const [f, a] of [[870, 0.18], [1413, 0.1], [2260, 0.05]]) {
        const o = ctx.createOscillator();
        o.frequency.value = f * (0.98 + Math.random() * 0.04);
        o.connect(env(at, a, 0.003, 0.55, out));
        o.start(at);
        o.stop(at + 0.7);
      }
      const t2 = at + 0.14; // it settles
      burst(t2, 0.02, env(t2, 0.35, 0.002, 0.04, bp));
      return 5;
    },
    // A far-off voice through a wall: formant-filtered noise in syllables. No words.
    murmur(at, out) {
      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.value = 480;
      f1.Q.value = 3;
      const f2 = ctx.createBiquadFilter();
      f2.type = 'bandpass';
      f2.frequency.value = 1150;
      f2.Q.value = 4;
      const mix = ctx.createGain();
      mix.gain.value = 1;
      f1.connect(mix);
      f2.connect(mix);
      mix.connect(out);
      let t = at;
      let n = 0;
      const syllables = 8 + Math.floor(Math.random() * 6);
      for (let k = 0; k < syllables; k++) {
        const len = 0.1 + Math.random() * 0.15;
        const g = env(t, 0.5 + Math.random() * 0.4, 0.03, len, f1);
        g.connect(f2);
        burst(t, len + 0.05, g);
        t += len + 0.04 + (Math.random() < 0.2 ? 0.25 : 0);
        n++;
      }
      return n;
    },
  };

  let last = null;
  return {
    ctx,
    resume: () => (ctx.state === 'suspended' ? ctx.resume() : Promise.resolve()),
    setEmitter(kind, v) {
      const p = panners[kind];
      if (p.positionX) {
        p.positionX.value = v.x;
        p.positionY.value = v.y;
        p.positionZ.value = v.z;
      } else p.setPosition(v.x, v.y, v.z);
    },
    setListener(pos, fwd, up) {
      const l = ctx.listener;
      if (l.positionX) {
        l.positionX.value = pos.x;
        l.positionY.value = pos.y;
        l.positionZ.value = pos.z;
        l.forwardX.value = fwd.x;
        l.forwardY.value = fwd.y;
        l.forwardZ.value = fwd.z;
        l.upX.value = up.x;
        l.upY.value = up.y;
        l.upZ.value = up.z;
      } else {
        l.setPosition(pos.x, pos.y, pos.z);
        l.setOrientation(fwd.x, fwd.y, fwd.z, up.x, up.y, up.z);
      }
    },
    /** Play one sound of `kind` (or a random kind, never the same twice running). */
    play(kind) {
      if (!kind) {
        const pool = Object.keys(kinds).filter((k) => k !== last);
        kind = pool[Math.floor(Math.random() * pool.length)];
      }
      last = kind;
      const at = ctx.currentTime + 0.05;
      const voices = kinds[kind](at, panners[kind]);
      log.push({ kind, at: +at.toFixed(3), voices });
      return kind;
    },
    /** Peak absolute sample on the master bus right now (0 = silence). */
    peak() {
      const buf = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buf);
      let m = 0;
      for (const s of buf) m = Math.max(m, Math.abs(s));
      return m;
    },
    graph() {
      const pos = (p) => (p.positionX ? [p.positionX.value, p.positionY.value, p.positionZ.value].map((n) => +n.toFixed(2)) : null);
      return {
        state: ctx.state,
        currentTime: +ctx.currentTime.toFixed(3),
        masterGain: master.gain.value,
        emitters: Object.fromEntries(Object.entries(panners).map(([k, p]) => [k, { model: p.panningModel, world: pos(p) }])),
        scheduled: log.slice(),
      };
    },
  };
}
