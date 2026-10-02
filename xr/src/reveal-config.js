// The reveal ladder (slice D): every pacing number in one place, so it can be
// tuned without reading the systems. Seconds unless named otherwise.
// Design intent (Leif): overlap the THEN with the NOW; start on something
// tangible; nothing is ever explained, the challenge is noticing.
export const REVEAL = {
  // Rung 1, tangible first: after Enter AR, pure passthrough. Nothing drawn, nothing heard.
  quietSeconds: 5,
  // The Frog is the first thing ever SEEN, and only after the first sounds.
  frogAppearSeconds: 14,
  frogFadeSeconds: 2.5,

  // Rung 2, sound before sight: quiet, ambiguous period sounds where the 1867 layer will be.
  masterGain: 0.5,
  soundGapNow: [4, 8], // random gap between sounds while still in Now
  soundGap1867: [3, 6], // and inside c.1867
  sightDelay1867: 1.5, // on stepping into c.1867 it is heard this long before it is seen

  // Rung 3, glimpses at the edge of vision.
  gazeConeDeg: 12, // head-forward within this of her torso = looking at her
  gazeFadeSeconds: 0.4,

  // Rung 5, she notices you.
  glimpsesToNotice: 3,
  turnRadPerSecond: 2.5,

  // Rung 6, contact.
  contactDistance: 1.5, // m, head to her, on the floor plane
  contactReleaseDistance: 2.2, // walk further than this and the cards go away
  contactFacingDeg: 35, // the player must be facing her
  thinkTurnRad: 1.1, // the 'thinking' beat: she turns this far toward the stove
  speechFadeInSeconds: 0.3,
  speechHoldSeconds: 3,
  speechHoldPerChar: 0.06,
  speechFadeOutSeconds: 1.2,
  shrugSeconds: 1.4,
  brainUrl: 'http://127.0.0.1:8177/ask',
  brainTimeoutMs: 300000, // a 'strong' answer can take minutes
  npcId: 'hattie_1867',
  // Said ONLY when the brain reports a remembered hit on THIS player's own learned note
  // (tier remembered AND remembered_from 'self'); a shared-list (seed) hit is spoken plainly.
  rememberedPrefix: 'You asked me that before — ',
  // Her first words on contact are not invented here: they are her authored seed lore, the
  // answer to 'What is your name?' in SEEDS.hattie_1867 of the bench brain
  // (~/.local/share/neoma/bench/npc-scope-20260928/npc_brain_scoped.py, seed _conf 1,
  // source seed:neoma-composite). The greeting probe checks this text against that file.
  greeting: 'Hattie. I run this kitchen, and the kitchen runs me.',
  greetingSource: { npc: 'hattie_1867', seedQuestion: 'What is your name?', conf: 1 },
  // The Volcano demo (?demo=volcano): the Guide's timing.
  guideAppearSeconds: 2,
  guideHoldSeconds: 2.6,
  guideHoldPerChar: 0.05,
  guideLookDeg: 10, // head-forward within this of a piece = looking at it
  guideLookSeconds: 0.7,
  guideHomeRadius: 0.4, // m: step further than this from where you began and the Guide fades
  cards: [
    { id: 'ordinary', text: 'What are you cooking?' },
    { id: 'remembered', text: 'Is your coffee strong?' },
    { id: 'new', text: 'Do you ever get a day off?' }, // novel to her shared memory (cosine 0.54): a strong answer, learned per player
  ],
};
