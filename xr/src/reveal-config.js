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
  rememberedPrefix: 'You asked me that before — ',
  // Authored (not the brain, not an answer): what she says when you first come close.
  greeting: 'So you can see me. Most folk look straight through.',
  cards: [
    { id: 'ordinary', text: 'What are you cooking?' },
    { id: 'remembered', text: 'Is your coffee strong?' },
    { id: 'new', text: 'Does the theatre company pay for its suppers in gold dust?' },
  ],
};
