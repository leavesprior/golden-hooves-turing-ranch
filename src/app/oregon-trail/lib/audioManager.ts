'use client'

/**
 * Golden Hooves Audio Manager - Electro Swing Edition
 *
 * Procedural Web Audio API music generation - 12 electro swing / steampunk
 * dance tracks inspired by Parov Stelar. Vintage western swing fused with
 * electronic dance beats, all synthesized in real-time.
 */

export type MusicStyle =
  | 'saloon_swing'
  | 'frontier_shuffle'
  | 'dusty_groove'
  | 'steamtrain_bounce'
  | 'midnight_saloon'
  | 'canyon_echo'
  | 'gold_rush_rave'
  | 'tumbleweed_trance'
  | 'coyote_techno'
  | 'riverboat_shuffle'
  | 'wanted_poster'
  | 'golden_sunset'
  | 'spaghetti_standoff'
  | 'phantom_riders'
  | 'silent'

const ALL_TRACKS: Exclude<MusicStyle, 'silent'>[] = [
  'spaghetti_standoff', 'phantom_riders',
  'saloon_swing', 'frontier_shuffle', 'dusty_groove', 'steamtrain_bounce',
  'midnight_saloon', 'canyon_echo', 'gold_rush_rave', 'tumbleweed_trance',
  'coyote_techno', 'riverboat_shuffle', 'wanted_poster', 'golden_sunset',
]

interface AudioState {
  context: AudioContext | null
  masterGain: GainNode | null
  musicGain: GainNode | null
  sfxGain: GainNode | null
  currentStyle: MusicStyle
  isPlaying: boolean
  oscillators: OscillatorNode[]
  intervalIds: NodeJS.Timeout[]
  trackQueue: Exclude<MusicStyle, 'silent'>[]
  currentTrackIndex: number
  trackTimer: NodeJS.Timeout | null
  playlistActive: boolean
}

const state: AudioState = {
  context: null,
  masterGain: null,
  musicGain: null,
  sfxGain: null,
  currentStyle: 'silent',
  isPlaying: false,
  oscillators: [],
  intervalIds: [],
  trackQueue: [],
  currentTrackIndex: 0,
  trackTimer: null,
  playlistActive: false,
}

// ─── Initialization & Volume ───

export function initAudio(): boolean {
  if (state.context) return true
  try {
    state.context = new (window.AudioContext || (window as any).webkitAudioContext)()
    state.masterGain = state.context.createGain()
    state.masterGain.gain.value = 1.0
    state.masterGain.connect(state.context.destination)

    state.musicGain = state.context.createGain()
    state.musicGain.gain.value = 0.5
    state.musicGain.connect(state.masterGain)

    state.sfxGain = state.context.createGain()
    state.sfxGain.gain.value = 0.7
    state.sfxGain.connect(state.masterGain)

    console.log('AudioManager: Initialized (Electro Swing Edition)')
    return true
  } catch (e) {
    console.error('AudioManager: Failed to initialize', e)
    return false
  }
}

export function setVolume(type: 'master' | 'music' | 'sfx', value: number): void {
  const v = Math.max(0, Math.min(1, value))
  if (type === 'master' && state.masterGain) state.masterGain.gain.value = v
  else if (type === 'music' && state.musicGain) state.musicGain.gain.value = v
  else if (type === 'sfx' && state.sfxGain) state.sfxGain.gain.value = v
}

// ─── Transport ───

export function stopMusic(): void {
  state.oscillators.forEach(osc => { try { osc.stop() } catch {} })
  state.oscillators = []
  state.intervalIds.forEach(id => clearInterval(id))
  state.intervalIds = []
  if (state.trackTimer) { clearTimeout(state.trackTimer); state.trackTimer = null }
  state.isPlaying = false
  state.playlistActive = false
  state.currentStyle = 'silent'
}

export function playMusic(style: MusicStyle): void {
  if (!state.context || !state.musicGain) { if (!initAudio()) return }
  if (state.context?.state === 'suspended') state.context.resume()

  // Stop intervals/oscillators but preserve playlist state
  state.oscillators.forEach(osc => { try { osc.stop() } catch {} })
  state.oscillators = []
  state.intervalIds.forEach(id => clearInterval(id))
  state.intervalIds = []

  if (style === 'silent') { state.isPlaying = false; state.currentStyle = 'silent'; return }

  state.currentStyle = style
  state.isPlaying = true

  const generators: Record<Exclude<MusicStyle, 'silent'>, () => void> = {
    saloon_swing: startSaloonSwing,
    frontier_shuffle: startFrontierShuffle,
    dusty_groove: startDustyGroove,
    steamtrain_bounce: startSteamtrainBounce,
    midnight_saloon: startMidnightSaloon,
    canyon_echo: startCanyonEcho,
    gold_rush_rave: startGoldRushRave,
    tumbleweed_trance: startTumbleweedTrance,
    coyote_techno: startCoyoteTechno,
    riverboat_shuffle: startRiverboatShuffle,
    wanted_poster: startWantedPoster,
    golden_sunset: startGoldenSunset,
    spaghetti_standoff: startSpaghettiStandoff,
    phantom_riders: startPhantomRiders,
  }

  generators[style]()
}

// ─── Playlist System ───

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function playPlaylist(): void {
  if (!state.context || !state.musicGain) { if (!initAudio()) return }
  if (state.context?.state === 'suspended') state.context.resume()

  state.trackQueue = shuffleArray(ALL_TRACKS)
  state.currentTrackIndex = 0
  state.playlistActive = true

  playCurrentTrack()
}

function playCurrentTrack(): void {
  if (!state.playlistActive) return

  const track = state.trackQueue[state.currentTrackIndex]
  console.log(`AudioManager: Playing track ${state.currentTrackIndex + 1}/12 - ${track}`)

  // Crossfade: fade out over 2s, start new track
  if (state.musicGain && state.isPlaying) {
    const g = state.musicGain.gain
    const target = g.value
    g.setValueAtTime(target, state.context!.currentTime)
    g.linearRampToValueAtTime(0.05, state.context!.currentTime + 1.5)
    setTimeout(() => {
      playMusic(track)
      if (state.musicGain) {
        const g2 = state.musicGain.gain
        g2.setValueAtTime(0.05, state.context!.currentTime)
        g2.linearRampToValueAtTime(0.5, state.context!.currentTime + 1.5)
      }
    }, 1500)
  } else {
    playMusic(track)
  }

  // Schedule next track (90-120s)
  const duration = 90000 + Math.random() * 30000
  state.trackTimer = setTimeout(() => advanceTrack(), duration)
}

function advanceTrack(): void {
  if (!state.playlistActive) return
  state.currentTrackIndex++
  if (state.currentTrackIndex >= state.trackQueue.length) {
    state.trackQueue = shuffleArray(ALL_TRACKS)
    state.currentTrackIndex = 0
  }
  playCurrentTrack()
}

// ─── Shared Instrument Utilities ───

function playSwingKick(ctx: AudioContext, dest: AudioNode, vol: number): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(160, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12)
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
  osc.connect(gain); gain.connect(dest)
  osc.start(); osc.stop(ctx.currentTime + 0.3)
}

function playSwingSnare(ctx: AudioContext, dest: AudioNode, vol: number): void {
  const bufLen = ctx.sampleRate * 0.08
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  const gain = ctx.createGain()
  const filt = ctx.createBiquadFilter()
  src.buffer = buf
  filt.type = 'bandpass'; filt.frequency.value = 3500; filt.Q.value = 1.2
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
  src.connect(filt); filt.connect(gain); gain.connect(dest)
  src.start()
  // Tonal body
  const t = ctx.createOscillator()
  const tg = ctx.createGain()
  t.type = 'triangle'; t.frequency.value = 200
  tg.gain.setValueAtTime(vol * 0.4, ctx.currentTime)
  tg.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
  t.connect(tg); tg.connect(dest); t.start(); t.stop(ctx.currentTime + 0.06)
}

function playClosedHat(ctx: AudioContext, dest: AudioNode, vol: number): void {
  const bufLen = ctx.sampleRate * 0.025
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  const gain = ctx.createGain()
  const filt = ctx.createBiquadFilter()
  src.buffer = buf
  filt.type = 'highpass'; filt.frequency.value = 7000
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.025)
  src.connect(filt); filt.connect(gain); gain.connect(dest); src.start()
}

function playOpenHat(ctx: AudioContext, dest: AudioNode, vol: number): void {
  const bufLen = ctx.sampleRate * 0.12
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  const gain = ctx.createGain()
  const filt = ctx.createBiquadFilter()
  src.buffer = buf
  filt.type = 'highpass'; filt.frequency.value = 6000
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
  src.connect(filt); filt.connect(gain); gain.connect(dest); src.start()
}

function playBrassStab(ctx: AudioContext, dest: AudioNode, freqs: number[], vol: number, dur = 0.3): void {
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()
    const filt = ctx.createBiquadFilter()
    osc.type = 'sawtooth'; osc.frequency.value = freq
    osc2.type = 'sawtooth'; osc2.frequency.value = freq * 1.003 // detune for richness
    filt.type = 'lowpass'; filt.frequency.value = 2500; filt.Q.value = 2
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.02)
    gain.gain.setValueAtTime(vol * 0.8, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur)
    osc.connect(filt); osc2.connect(filt); filt.connect(gain); gain.connect(dest)
    osc.start(ctx.currentTime + i * 0.008)
    osc2.start(ctx.currentTime + i * 0.008)
    osc.stop(ctx.currentTime + dur + 0.05)
    osc2.stop(ctx.currentTime + dur + 0.05)
  })
}

function playPianoChord(ctx: AudioContext, dest: AudioNode, freqs: number[], vol: number, dur = 0.25): void {
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filt = ctx.createBiquadFilter()
    osc.type = 'square'
    osc.frequency.value = freq
    filt.type = 'lowpass'; filt.frequency.value = 1800
    gain.gain.setValueAtTime(vol, ctx.currentTime + i * 0.01)
    gain.gain.exponentialRampToValueAtTime(vol * 0.4, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur)
    osc.connect(filt); filt.connect(gain); gain.connect(dest)
    osc.start(ctx.currentTime + i * 0.01)
    osc.stop(ctx.currentTime + dur + 0.05)
  })
}

function playWalkingBass(ctx: AudioContext, dest: AudioNode, freq: number, vol: number, dur = 0.2): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filt = ctx.createBiquadFilter()
  osc.type = 'sawtooth'; osc.frequency.value = freq
  filt.type = 'lowpass'
  filt.frequency.setValueAtTime(800, ctx.currentTime)
  filt.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + dur)
  filt.Q.value = 3
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur)
  osc.connect(filt); filt.connect(gain); gain.connect(dest)
  osc.start(); osc.stop(ctx.currentTime + dur + 0.05)
}

function playSynthLead(ctx: AudioContext, dest: AudioNode, freq: number, vol: number, dur: number): void {
  const osc = ctx.createOscillator()
  const vib = ctx.createOscillator()
  const vibGain = ctx.createGain()
  const gain = ctx.createGain()
  const filt = ctx.createBiquadFilter()
  osc.type = 'sawtooth'; osc.frequency.value = freq
  vib.frequency.value = 5.5; vibGain.gain.value = 6
  vib.connect(vibGain); vibGain.connect(osc.frequency)
  filt.type = 'lowpass'
  filt.frequency.setValueAtTime(600, ctx.currentTime)
  filt.frequency.linearRampToValueAtTime(3000, ctx.currentTime + dur * 0.3)
  filt.frequency.linearRampToValueAtTime(1200, ctx.currentTime + dur)
  filt.Q.value = 4
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.03)
  gain.gain.setValueAtTime(vol * 0.7, ctx.currentTime + dur * 0.8)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur)
  osc.connect(filt); filt.connect(gain); gain.connect(dest)
  vib.start(); osc.start()
  osc.stop(ctx.currentTime + dur + 0.05)
  vib.stop(ctx.currentTime + dur + 0.05)
}

function playVinylCrackle(ctx: AudioContext, dest: AudioNode): OscillatorNode | null {
  // Continuous low-level noise for vintage texture
  const bufLen = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) {
    d[i] = (Math.random() * 2 - 1) * (Math.random() > 0.97 ? 1 : 0.05)
  }
  const src = ctx.createBufferSource()
  const gain = ctx.createGain()
  const filt = ctx.createBiquadFilter()
  src.buffer = buf; src.loop = true
  filt.type = 'bandpass'; filt.frequency.value = 4000; filt.Q.value = 0.5
  gain.gain.value = 0.03
  src.connect(filt); filt.connect(gain); gain.connect(dest)
  src.start()
  // Return null - we can't track BufferSourceNode as OscillatorNode, but the loop
  // will stop when we clear context. Use a dummy oscillator to track.
  const dummy = ctx.createOscillator()
  dummy.frequency.value = 0
  const dg = ctx.createGain(); dg.gain.value = 0
  dummy.connect(dg); dg.connect(dest)
  dummy.start()
  state.oscillators.push(dummy)
  // Stop the buffer source when dummy stops (hacky but works)
  dummy.onended = () => { try { src.stop() } catch {} }
  return dummy
}

// Swing timing helper: returns ms per beat at given BPM
function beatMs(bpm: number): number { return 60000 / bpm }

// Common note frequencies
const N = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, B2: 123.47,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Db4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Gb4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, Bb5: 932.33,
}

// ─── Track Generators ───

/** Track 1: Saloon Swing (128 BPM) - Honky-tonk piano + 4-on-floor kick */
function startSaloonSwing(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bpm = 128; const bt = beatMs(bpm)

  playVinylCrackle(ctx, dest)

  // 4-on-floor kick
  let beat = 0
  const kickId = setInterval(() => {
    if (!state.isPlaying) return
    playSwingKick(ctx, dest, 0.35)
    if (beat % 2 === 1) playSwingSnare(ctx, dest, 0.2)
    beat++
  }, bt)
  state.intervalIds.push(kickId)

  // Shuffled hats
  const hatId = setInterval(() => {
    if (!state.isPlaying) return
    playClosedHat(ctx, dest, 0.06 + Math.random() * 0.04)
  }, bt / 2)
  state.intervalIds.push(hatId)

  // Open hat on upbeats
  const ohId = setInterval(() => {
    if (!state.isPlaying) return
    playOpenHat(ctx, dest, 0.05)
  }, bt * 2)
  setTimeout(() => { if (state.isPlaying) state.intervalIds.push(ohId) }, bt)

  // Honky-tonk piano chords (swing rhythm)
  const chords = [
    [N.C4, N.E4, N.Bb4],    // C7
    [N.C4, N.E4, N.Bb4],
    [N.F4, N.A4, N.Eb5],    // F7
    [N.F4, N.A4, N.Eb5],
    [N.G4, N.B4, N.F5],     // G7
    [N.G4, N.B4, N.F5],
    [N.C4, N.E4, N.Bb4],
    [N.G4, N.B4, N.F5],
  ]
  let ci = 0
  const chordId = setInterval(() => {
    if (!state.isPlaying) return
    playPianoChord(ctx, dest, chords[ci], 0.12, 0.2)
    ci = (ci + 1) % chords.length
  }, bt)
  state.intervalIds.push(chordId)

  // Walking bass
  const bassNotes = [N.C2, N.E2, N.G2, N.Bb2, N.F2, N.A2, N.C3, N.B2]
  let bi = 0
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    playWalkingBass(ctx, dest, bassNotes[bi], 0.25, bt / 1000 * 0.8)
    bi = (bi + 1) % bassNotes.length
  }, bt)
  state.intervalIds.push(bassId)

  // Brass stab every 4 beats
  const brassId = setInterval(() => {
    if (!state.isPlaying) return
    playBrassStab(ctx, dest, [N.C4, N.E4, N.G4, N.Bb4], 0.1, 0.25)
  }, bt * 4)
  state.intervalIds.push(brassId)
}

/** Track 2: Frontier Shuffle (125 BPM) - Shuffled hats + walking bass + brass */
function startFrontierShuffle(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(125)

  playVinylCrackle(ctx, dest)

  // Shuffle kick pattern (boom-bap swing)
  let beat = 0
  const kickId = setInterval(() => {
    if (!state.isPlaying) return
    if (beat % 3 === 0) playSwingKick(ctx, dest, 0.3)
    if (beat % 3 === 2) playSwingSnare(ctx, dest, 0.18)
    playClosedHat(ctx, dest, beat % 3 === 0 ? 0.08 : 0.04)
    beat++
  }, bt / 1.5) // triplet feel
  state.intervalIds.push(kickId)

  // Walking bass line (jazz walk)
  const bassNotes = [N.G2, N.A2, N.B2, N.C3, N.D3, N.E3, N.D3, N.B2]
  let bi = 0
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    playWalkingBass(ctx, dest, bassNotes[bi], 0.22, 0.25)
    bi = (bi + 1) % bassNotes.length
  }, bt)
  state.intervalIds.push(bassId)

  // Brass melody
  const melody = [N.D4, N.G4, N.A4, N.B4, N.A4, N.G4, N.E4, N.D4]
  let mi = 0
  const melId = setInterval(() => {
    if (!state.isPlaying) return
    playBrassStab(ctx, dest, [melody[mi], melody[mi] * 1.5], 0.08, 0.35)
    mi = (mi + 1) % melody.length
  }, bt * 2)
  state.intervalIds.push(melId)

  // Piano comping
  const compChords = [[N.G3, N.B3, N.D4], [N.C4, N.E4, N.G4], [N.D4, N.Gb4, N.A4], [N.G3, N.B3, N.D4]]
  let cci = 0
  const compId = setInterval(() => {
    if (!state.isPlaying) return
    playPianoChord(ctx, dest, compChords[cci], 0.08, 0.15)
    cci = (cci + 1) % compChords.length
  }, bt * 2)
  setTimeout(() => { if (state.isPlaying) state.intervalIds.push(compId) }, bt)
}

/** Track 3: Dusty Groove (130 BPM) - Dirty Harry funk + electro swing */
function startDustyGroove(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(130)

  // Funky kick pattern
  let beat = 0
  const drumId = setInterval(() => {
    if (!state.isPlaying) return
    const pos = beat % 8
    if (pos === 0 || pos === 3 || pos === 6) playSwingKick(ctx, dest, 0.35)
    if (pos === 2 || pos === 6) playSwingSnare(ctx, dest, 0.2)
    playClosedHat(ctx, dest, 0.05 + Math.random() * 0.03)
    beat++
  }, bt / 2)
  state.intervalIds.push(drumId)

  // Wah bass (funk)
  const bassNotes = [N.D2, N.D2, N.F2, N.G2, N.D2, N.D2, N.A2, N.G2]
  let bi = 0
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filt = ctx.createBiquadFilter()
    osc.type = 'sawtooth'; osc.frequency.value = bassNotes[bi]
    filt.type = 'lowpass'; filt.frequency.value = 300
    filt.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.08)
    filt.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.18)
    filt.Q.value = 10
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
    osc.connect(filt); filt.connect(gain); gain.connect(dest)
    osc.start(); osc.stop(ctx.currentTime + 0.3)
    bi = (bi + 1) % bassNotes.length
  }, bt)
  state.intervalIds.push(bassId)

  // Brass stabs (tense minor 7)
  const brassId = setInterval(() => {
    if (!state.isPlaying) return
    playBrassStab(ctx, dest, [N.D3, N.F3, N.A3, N.C4], 0.1, 0.2)
  }, bt * 4)
  state.intervalIds.push(brassId)

  // Synth lead riff
  const leadNotes = [N.D4, N.F4, N.A4, N.C5, N.A4, 0, N.G4, N.F4]
  let li = 0
  const leadId = setInterval(() => {
    if (!state.isPlaying) return
    if (leadNotes[li] > 0) playSynthLead(ctx, dest, leadNotes[li], 0.08, 0.3)
    li = (li + 1) % leadNotes.length
  }, bt)
  state.intervalIds.push(leadId)
}

/** Track 4: Steamtrain Bounce (135 BPM) - Train-chug rhythm + swing melody */
function startSteamtrainBounce(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(135)

  // Train chug: alternating kick + noise in rapid 16ths
  let chug = 0
  const chugId = setInterval(() => {
    if (!state.isPlaying) return
    if (chug % 2 === 0) {
      playSwingKick(ctx, dest, 0.2)
    } else {
      playClosedHat(ctx, dest, 0.07)
    }
    // Accent snare on 2 and 4
    if (chug % 8 === 4) playSwingSnare(ctx, dest, 0.22)
    chug++
  }, bt / 4)
  state.intervalIds.push(chugId)

  // Steam whistle (periodic sine sweep)
  const whistleId = setInterval(() => {
    if (!state.isPlaying) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.3)
    osc.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.6)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7)
    osc.connect(gain); gain.connect(dest)
    osc.start(); osc.stop(ctx.currentTime + 0.75)
  }, bt * 16) // every 4 bars
  state.intervalIds.push(whistleId)

  // Bouncy bass
  const bassNotes = [N.A2, N.C3, N.D3, N.E3, N.D3, N.C3, N.A2, N.G2]
  let bi = 0
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    playWalkingBass(ctx, dest, bassNotes[bi], 0.22, 0.18)
    bi = (bi + 1) % bassNotes.length
  }, bt)
  state.intervalIds.push(bassId)

  // Swing piano chords
  const chords = [[N.A3, N.C4, N.E4], [N.D4, N.F4, N.A4], [N.E3, N.Ab3, N.B3], [N.A3, N.C4, N.E4]]
  let ci = 0
  const pianoId = setInterval(() => {
    if (!state.isPlaying) return
    playPianoChord(ctx, dest, chords[ci], 0.09, 0.18)
    ci = (ci + 1) % chords.length
  }, bt * 2)
  state.intervalIds.push(pianoId)
}

/** Track 5: Midnight Saloon (120 BPM) - Dark minor swing, noir detective */
function startMidnightSaloon(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(120)

  playVinylCrackle(ctx, dest)

  // Slow kick + brush snare
  let beat = 0
  const drumId = setInterval(() => {
    if (!state.isPlaying) return
    if (beat % 4 === 0) playSwingKick(ctx, dest, 0.25)
    if (beat % 4 === 2) {
      // Brush-like soft snare
      const bufLen = ctx.sampleRate * 0.15
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.5
      const src = ctx.createBufferSource()
      const g = ctx.createGain(); const f = ctx.createBiquadFilter()
      src.buffer = buf; f.type = 'bandpass'; f.frequency.value = 2000; f.Q.value = 0.8
      g.gain.setValueAtTime(0.12, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      src.connect(f); f.connect(g); g.connect(dest); src.start()
    }
    if (beat % 2 === 0) playClosedHat(ctx, dest, 0.03)
    beat++
  }, bt / 2)
  state.intervalIds.push(drumId)

  // Dark minor bass
  const bassNotes = [N.A2, N.C3, N.E2, N.A2, N.G2, N.F2, N.E2, N.A2]
  let bi = 0
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    playWalkingBass(ctx, dest, bassNotes[bi], 0.2, 0.35)
    bi = (bi + 1) % bassNotes.length
  }, bt)
  state.intervalIds.push(bassId)

  // Noir piano melody (Am - Dm - E7 - Am)
  const melody = [N.A4, N.C5, N.E5, 0, N.D5, N.F4, N.A4, 0, N.E4, N.Ab4, N.B4, 0, N.A4, 0, 0, 0]
  let mi = 0
  const melId = setInterval(() => {
    if (!state.isPlaying) return
    if (melody[mi] > 0) playSynthLead(ctx, dest, melody[mi], 0.07, 0.4)
    mi = (mi + 1) % melody.length
  }, bt)
  state.intervalIds.push(melId)

  // Dark pad drone
  const pad = ctx.createOscillator()
  const pad2 = ctx.createOscillator()
  const pg = ctx.createGain(); const pf = ctx.createBiquadFilter()
  pad.type = 'sawtooth'; pad.frequency.value = N.A2
  pad2.type = 'sawtooth'; pad2.frequency.value = N.E3
  pf.type = 'lowpass'; pf.frequency.value = 400; pg.gain.value = 0.04
  pad.connect(pf); pad2.connect(pf); pf.connect(pg); pg.connect(dest)
  pad.start(); pad2.start()
  state.oscillators.push(pad, pad2)
}

/** Track 6: Canyon Echo (122 BPM) - Reverb-heavy ambient swing */
function startCanyonEcho(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(122)

  // Sparse kick
  let beat = 0
  const drumId = setInterval(() => {
    if (!state.isPlaying) return
    if (beat % 4 === 0) playSwingKick(ctx, dest, 0.2)
    if (beat % 4 === 2) playSwingSnare(ctx, dest, 0.1)
    if (beat % 2 === 0) playClosedHat(ctx, dest, 0.03)
    beat++
  }, bt)
  state.intervalIds.push(drumId)

  // Ambient pad (Em9 - wide and lush)
  const padFreqs = [N.E3, N.G3, N.B3, N.D4, N.Gb4]
  padFreqs.forEach(freq => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain(); const f = ctx.createBiquadFilter()
    osc.type = 'sine'; osc.frequency.value = freq
    f.type = 'lowpass'; f.frequency.value = 600
    g.gain.value = 0.04
    osc.connect(f); f.connect(g); g.connect(dest); osc.start()
    state.oscillators.push(osc)
  })

  // Echo melody - sparse notes with simulated delay
  const notes = [N.E5, 0, 0, N.B4, 0, N.G4, 0, 0, N.D5, 0, 0, N.A4, 0, N.E4, 0, 0]
  let ni = 0
  const melId = setInterval(() => {
    if (!state.isPlaying) return
    const note = notes[ni]
    if (note > 0) {
      playSynthLead(ctx, dest, note, 0.06, 0.5)
      // Simulated echo (delayed quieter repeat)
      setTimeout(() => { if (state.isPlaying) playSynthLead(ctx, dest, note, 0.03, 0.4) }, bt * 0.75)
      setTimeout(() => { if (state.isPlaying) playSynthLead(ctx, dest, note, 0.015, 0.3) }, bt * 1.5)
    }
    ni = (ni + 1) % notes.length
  }, bt)
  state.intervalIds.push(melId)

  // Slow walking bass
  const bassNotes = [N.E2, N.G2, N.B2, N.D3, N.C3, N.A2, N.B2, N.E2]
  let bi = 0
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    playWalkingBass(ctx, dest, bassNotes[bi], 0.15, 0.4)
    bi = (bi + 1) % bassNotes.length
  }, bt * 2)
  state.intervalIds.push(bassId)
}

/** Track 7: Gold Rush Rave (140 BPM) - High energy trance-swing with buildups */
function startGoldRushRave(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(140)

  // Hard 4-on-floor
  let beat = 0
  const drumId = setInterval(() => {
    if (!state.isPlaying) return
    playSwingKick(ctx, dest, 0.4)
    if (beat % 2 === 1) playSwingSnare(ctx, dest, 0.25)
    playClosedHat(ctx, dest, 0.07)
    if (beat % 4 === 3) playOpenHat(ctx, dest, 0.08)
    beat++
  }, bt)
  state.intervalIds.push(drumId)

  // off-beat hats
  const hatId = setInterval(() => {
    if (!state.isPlaying) return
    playClosedHat(ctx, dest, 0.05)
  }, bt)
  setTimeout(() => { if (state.isPlaying) state.intervalIds.push(hatId) }, bt / 2)

  // Driving bass (E minor)
  const bassNotes = [N.E2, N.E2, N.G2, N.E2, N.A2, N.G2, N.E2, N.B2]
  let bi = 0
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    playWalkingBass(ctx, dest, bassNotes[bi], 0.3, 0.15)
    bi = (bi + 1) % bassNotes.length
  }, bt)
  state.intervalIds.push(bassId)

  // Trance lead (arpeggiated)
  const arp = [N.E4, N.G4, N.B4, N.E5, N.B4, N.G4, N.E4, N.D4]
  let ai = 0
  const arpId = setInterval(() => {
    if (!state.isPlaying) return
    playSynthLead(ctx, dest, arp[ai], 0.09, 0.12)
    ai = (ai + 1) % arp.length
  }, bt / 2)
  state.intervalIds.push(arpId)

  // Brass stab buildup every 8 bars
  let barCount = 0
  const buildId = setInterval(() => {
    if (!state.isPlaying) return
    barCount++
    if (barCount % 32 === 0) {
      // Big brass hit
      playBrassStab(ctx, dest, [N.E3, N.G3, N.B3, N.E4], 0.15, 0.5)
    } else if (barCount % 8 >= 6) {
      // Build: snare roll
      playSwingSnare(ctx, dest, 0.15)
    }
  }, bt)
  state.intervalIds.push(buildId)
}

/** Track 8: Tumbleweed Trance (132 BPM) - Progressive trance + western whistle */
function startTumbleweedTrance(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(132)

  // Kick and hats
  let beat = 0
  const drumId = setInterval(() => {
    if (!state.isPlaying) return
    playSwingKick(ctx, dest, 0.3)
    if (beat % 2 === 1) playSwingSnare(ctx, dest, 0.15)
    playClosedHat(ctx, dest, 0.05)
    beat++
  }, bt)
  state.intervalIds.push(drumId)

  // Western whistle melody (sine, pentatonic)
  const whistle = [N.A4, 0, N.C5, N.D5, 0, N.E5, 0, N.D5, N.C5, 0, N.A4, 0, N.G4, N.A4, 0, 0]
  let wi = 0
  const whistleId = setInterval(() => {
    if (!state.isPlaying) return
    const f = whistle[wi]
    if (f > 0) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = f
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04)
      gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.2)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.connect(gain); gain.connect(dest)
      osc.start(); osc.stop(ctx.currentTime + 0.45)
    }
    wi = (wi + 1) % whistle.length
  }, bt)
  state.intervalIds.push(whistleId)

  // Trance bass (pulsing filter)
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filt = ctx.createBiquadFilter()
    osc.type = 'sawtooth'; osc.frequency.value = N.A2
    filt.type = 'lowpass'
    filt.frequency.setValueAtTime(200, ctx.currentTime)
    filt.frequency.linearRampToValueAtTime(1200, ctx.currentTime + bt / 1000 * 0.3)
    filt.frequency.linearRampToValueAtTime(200, ctx.currentTime + bt / 1000 * 0.8)
    filt.Q.value = 8
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + bt / 1000 * 0.9)
    osc.connect(filt); filt.connect(gain); gain.connect(dest)
    osc.start(); osc.stop(ctx.currentTime + bt / 1000)
  }, bt)
  state.intervalIds.push(bassId)

  // Pad
  const padNotes = [N.A3, N.C4, N.E4]
  padNotes.forEach(f => {
    const o = ctx.createOscillator(); const g = ctx.createGain(); const fi = ctx.createBiquadFilter()
    o.type = 'sawtooth'; o.frequency.value = f
    fi.type = 'lowpass'; fi.frequency.value = 500; g.gain.value = 0.03
    o.connect(fi); fi.connect(g); g.connect(dest); o.start()
    state.oscillators.push(o)
  })
}

/** Track 9: Coyote Techno (138 BPM) - Driving techno + howl synth leads */
function startCoyoteTechno(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(138)

  // Hard kick
  let beat = 0
  const drumId = setInterval(() => {
    if (!state.isPlaying) return
    playSwingKick(ctx, dest, 0.4)
    if (beat % 2 === 1) playSwingSnare(ctx, dest, 0.22)
    playClosedHat(ctx, dest, 0.06)
    beat++
  }, bt)
  state.intervalIds.push(drumId)

  // Off-beat hat
  const hatId = setInterval(() => {
    if (!state.isPlaying) return
    playClosedHat(ctx, dest, 0.08)
  }, bt)
  setTimeout(() => { if (state.isPlaying) state.intervalIds.push(hatId) }, bt / 2)

  // Howl synth lead (pitch bend up like a coyote)
  const howlId = setInterval(() => {
    if (!state.isPlaying) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filt = ctx.createBiquadFilter()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(N.E4, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(N.E5, ctx.currentTime + 0.4)
    osc.frequency.exponentialRampToValueAtTime(N.A4, ctx.currentTime + 0.8)
    filt.type = 'lowpass'; filt.frequency.value = 3000; filt.Q.value = 5
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9)
    osc.connect(filt); filt.connect(gain); gain.connect(dest)
    osc.start(); osc.stop(ctx.currentTime + 1.0)
  }, bt * 8)
  state.intervalIds.push(howlId)

  // Driving bass (E minor, relentless)
  const bassNotes = [N.E2, N.E2, N.E2, N.G2, N.E2, N.E2, N.A2, N.B2]
  let bi = 0
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    playWalkingBass(ctx, dest, bassNotes[bi], 0.28, 0.12)
    bi = (bi + 1) % bassNotes.length
  }, bt)
  state.intervalIds.push(bassId)

  // Acid-style arp
  const arp = [N.E4, N.G4, N.A4, N.B4, N.E5, N.B4, N.A4, N.G4]
  let ai = 0
  const arpId = setInterval(() => {
    if (!state.isPlaying) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filt = ctx.createBiquadFilter()
    osc.type = 'sawtooth'; osc.frequency.value = arp[ai]
    filt.type = 'lowpass'
    filt.frequency.setValueAtTime(400, ctx.currentTime)
    filt.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.05)
    filt.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.12)
    filt.Q.value = 12
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14)
    osc.connect(filt); filt.connect(gain); gain.connect(dest)
    osc.start(); osc.stop(ctx.currentTime + 0.15)
    ai = (ai + 1) % arp.length
  }, bt / 2)
  state.intervalIds.push(arpId)
}

/** Track 10: Riverboat Shuffle (126 BPM) - Jazzy river music, paddle rhythm */
function startRiverboatShuffle(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(126)

  playVinylCrackle(ctx, dest)

  // Paddle rhythm: soft kick on 1&3, rimshot on 2&4
  let beat = 0
  const drumId = setInterval(() => {
    if (!state.isPlaying) return
    if (beat % 2 === 0) playSwingKick(ctx, dest, 0.2)
    if (beat % 2 === 1) playSwingSnare(ctx, dest, 0.12)
    // Shuffle hat triplet feel
    playClosedHat(ctx, dest, 0.04)
    setTimeout(() => { if (state.isPlaying) playClosedHat(ctx, dest, 0.025) }, bt * 0.66)
    beat++
  }, bt)
  state.intervalIds.push(drumId)

  // Jazz walking bass (Bb major)
  const bassNotes = [N.Bb2, N.D3, N.F2, N.Bb2, N.C3, N.Eb3, N.F2, N.Bb2]
  let bi = 0
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    playWalkingBass(ctx, dest, bassNotes[bi], 0.2, 0.3)
    bi = (bi + 1) % bassNotes.length
  }, bt)
  state.intervalIds.push(bassId)

  // Jazz piano comp (Bb7 - Eb7 - F7 - Bb7)
  const chords = [
    [N.Bb3, N.D4, N.F4, N.Ab4],
    [N.Eb4, N.G4, N.Bb4, N.Db4],
    [N.F3, N.A3, N.C4, N.Eb4],
    [N.Bb3, N.D4, N.F4, N.Ab4],
  ]
  let ci = 0
  const compId = setInterval(() => {
    if (!state.isPlaying) return
    playPianoChord(ctx, dest, chords[ci], 0.08, 0.2)
    ci = (ci + 1) % chords.length
  }, bt * 2)
  state.intervalIds.push(compId)

  // Brass melody
  const melody = [N.Bb4, N.D5, N.F5, 0, N.Eb5, N.D5, N.Bb4, 0, N.C5, N.Eb5, N.F5, 0, N.D5, N.Bb4, 0, 0]
  let mi = 0
  const melId = setInterval(() => {
    if (!state.isPlaying) return
    if (melody[mi] > 0) playBrassStab(ctx, dest, [melody[mi]], 0.07, 0.3)
    mi = (mi + 1) % melody.length
  }, bt)
  state.intervalIds.push(melId)
}

/** Track 11: Wanted Poster (136 BPM) - Intense chase breakbeat + brass */
function startWantedPoster(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(136)

  // Breakbeat pattern (think-break)
  let beat = 0
  const drumId = setInterval(() => {
    if (!state.isPlaying) return
    const pos = beat % 16
    // Classic breakbeat: kick snare patterns
    if (pos === 0 || pos === 5 || pos === 8 || pos === 13) playSwingKick(ctx, dest, 0.35)
    if (pos === 4 || pos === 12) playSwingSnare(ctx, dest, 0.25)
    if (pos % 2 === 0) playClosedHat(ctx, dest, 0.06)
    else playClosedHat(ctx, dest, 0.03)
    if (pos === 14) playOpenHat(ctx, dest, 0.07)
    beat++
  }, bt / 4)
  state.intervalIds.push(drumId)

  // Aggressive bass
  const bassNotes = [N.E2, N.E2, N.G2, N.A2, N.E2, N.B2, N.A2, N.G2]
  let bi = 0
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    playWalkingBass(ctx, dest, bassNotes[bi], 0.28, 0.15)
    bi = (bi + 1) % bassNotes.length
  }, bt)
  state.intervalIds.push(bassId)

  // Brass chase melody (urgent)
  const melody = [N.E4, N.G4, N.A4, N.B4, N.E5, N.D5, N.B4, N.A4]
  let mi = 0
  const brassId = setInterval(() => {
    if (!state.isPlaying) return
    playBrassStab(ctx, dest, [melody[mi], melody[mi] * 1.5], 0.1, 0.18)
    mi = (mi + 1) % melody.length
  }, bt)
  state.intervalIds.push(brassId)

  // Tension riser every 4 bars
  let bar = 0
  const riserId = setInterval(() => {
    if (!state.isPlaying) return
    bar++
    if (bar % 4 === 0) {
      // Rising noise sweep
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 1.5)
      g.gain.setValueAtTime(0.05, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5)
      osc.connect(g); g.connect(dest); osc.start(); osc.stop(ctx.currentTime + 1.6)
    }
  }, bt * 4)
  state.intervalIds.push(riserId)
}

/** Track 12: Golden Sunset (118 BPM) - Chill downtempo electro swing */
function startGoldenSunset(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(118)

  playVinylCrackle(ctx, dest)

  // Gentle kick and brushes
  let beat = 0
  const drumId = setInterval(() => {
    if (!state.isPlaying) return
    if (beat % 4 === 0) playSwingKick(ctx, dest, 0.18)
    if (beat % 4 === 2) playSwingSnare(ctx, dest, 0.08)
    if (beat % 2 === 0) playClosedHat(ctx, dest, 0.025)
    beat++
  }, bt)
  state.intervalIds.push(drumId)

  // Warm pad (C major 9)
  const padFreqs = [N.C3, N.E3, N.G3, N.B3, N.D4]
  padFreqs.forEach(f => {
    const o = ctx.createOscillator(); const g = ctx.createGain(); const fi = ctx.createBiquadFilter()
    o.type = 'sine'; o.frequency.value = f
    fi.type = 'lowpass'; fi.frequency.value = 500; g.gain.value = 0.04
    o.connect(fi); fi.connect(g); g.connect(dest); o.start()
    state.oscillators.push(o)
  })

  // Gentle walking bass
  const bassNotes = [N.C2, N.E2, N.G2, N.A2, N.F2, N.E2, N.D2, N.G2]
  let bi = 0
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    playWalkingBass(ctx, dest, bassNotes[bi], 0.15, 0.4)
    bi = (bi + 1) % bassNotes.length
  }, bt)
  state.intervalIds.push(bassId)

  // Soft piano melody
  const melody = [N.E5, 0, N.D5, N.C5, 0, N.G4, 0, N.A4, N.C5, 0, N.B4, 0, N.G4, 0, 0, 0]
  let mi = 0
  const melId = setInterval(() => {
    if (!state.isPlaying) return
    if (melody[mi] > 0) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filt = ctx.createBiquadFilter()
      osc.type = 'sine'; osc.frequency.value = melody[mi]
      filt.type = 'lowpass'; filt.frequency.value = 2000
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
      osc.connect(filt); filt.connect(gain); gain.connect(dest)
      osc.start(); osc.stop(ctx.currentTime + 0.65)
    }
    mi = (mi + 1) % melody.length
  }, bt)
  state.intervalIds.push(melId)

  // Soft brass pad
  const brassId = setInterval(() => {
    if (!state.isPlaying) return
    playBrassStab(ctx, dest, [N.C4, N.E4, N.G4], 0.04, 0.8)
  }, bt * 8)
  state.intervalIds.push(brassId)
}

/** Track 13: Spaghetti Standoff (108 BPM) - Sparse, tense, dramatic western duel atmosphere
 *  Original composition inspired by the *mood* of spaghetti western scores:
 *  lone whistle over silence, tension drones, sudden brass crescendos, ticking clock rhythm */
function startSpaghettiStandoff(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(108)

  // Ticking clock percussion - sparse, menacing
  let tick = 0
  const tickId = setInterval(() => {
    if (!state.isPlaying) return
    // Woodblock-like tick: high pitched short blip
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'; osc.frequency.value = tick % 2 === 0 ? 1800 : 1400
    g.gain.setValueAtTime(0.08, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03)
    osc.connect(g); g.connect(dest); osc.start(); osc.stop(ctx.currentTime + 0.04)
    tick++
  }, bt)
  state.intervalIds.push(tickId)

  // Sparse kick on 1 only
  const kickId = setInterval(() => {
    if (!state.isPlaying) return
    playSwingKick(ctx, dest, 0.2)
  }, bt * 4)
  state.intervalIds.push(kickId)

  // Tension drone - low dissonant cluster (Am + tritone)
  const droneFreqs = [N.A2, N.Eb3]
  droneFreqs.forEach(f => {
    const o = ctx.createOscillator(); const g = ctx.createGain(); const fi = ctx.createBiquadFilter()
    o.type = 'sawtooth'; o.frequency.value = f
    fi.type = 'lowpass'; fi.frequency.value = 250; g.gain.value = 0.06
    o.connect(fi); fi.connect(g); g.connect(dest); o.start()
    state.oscillators.push(o)
  })

  // Lone whistle melody - sparse, haunting, pentatonic (original)
  // Lots of rests create tension; melody uses Am pentatonic with chromatic tension notes
  const whistle = [
    N.A4, 0, 0, 0, N.E5, 0, N.D5, 0, 0, 0, 0, 0,
    N.C5, 0, 0, N.A4, 0, 0, 0, 0, N.G4, 0, N.A4, 0,
    0, 0, 0, 0, N.E5, 0, 0, N.F5, N.E5, 0, N.D5, 0,
    N.C5, 0, N.A4, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]
  let wi = 0
  const whistleId = setInterval(() => {
    if (!state.isPlaying) return
    const f = whistle[wi]
    if (f > 0) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = f
      // Slow attack, gentle sustain - lonely whistle feel
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.11, ctx.currentTime + 0.3)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7)
      osc.connect(gain); gain.connect(dest)
      osc.start(); osc.stop(ctx.currentTime + 0.75)
    }
    wi = (wi + 1) % whistle.length
  }, bt)
  state.intervalIds.push(whistleId)

  // Dramatic brass stab - sudden, rare, powerful (every 12 bars)
  let barCount = 0
  const brassId = setInterval(() => {
    if (!state.isPlaying) return
    barCount++
    if (barCount % 48 === 24) {
      // Crescendo hit: dissonant minor chord
      playBrassStab(ctx, dest, [N.A3, N.C4, N.Eb4, N.G4], 0.14, 0.6)
    } else if (barCount % 48 === 36) {
      // Second hit: resolving chord
      playBrassStab(ctx, dest, [N.A3, N.C4, N.E4], 0.12, 0.8)
    }
  }, bt)
  state.intervalIds.push(brassId)

  // Electric guitar twang (filtered sawtooth pluck, sporadic)
  const twangId = setInterval(() => {
    if (!state.isPlaying) return
    const notes = [N.E4, N.A4, N.D5, N.E5]
    const f = notes[Math.floor(Math.random() * notes.length)]
    const osc = ctx.createOscillator()
    const g = ctx.createGain(); const fi = ctx.createBiquadFilter()
    osc.type = 'sawtooth'; osc.frequency.value = f
    fi.type = 'bandpass'; fi.frequency.value = 1500; fi.Q.value = 3
    g.gain.setValueAtTime(0.1, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.connect(fi); fi.connect(g); g.connect(dest)
    osc.start(); osc.stop(ctx.currentTime + 0.55)
  }, bt * 8)
  state.intervalIds.push(twangId)

  // Snare roll buildup before brass hits
  let buildBeat = 0
  const buildId = setInterval(() => {
    if (!state.isPlaying) return
    buildBeat++
    const pos = buildBeat % 48
    if (pos >= 20 && pos < 24) {
      // Accelerating snare taps before the brass hit
      playSwingSnare(ctx, dest, 0.06 + (pos - 20) * 0.03)
    }
  }, bt)
  state.intervalIds.push(buildId)
}

/** Track 14: Phantom Riders (134 BPM) - Dark galloping minor-key electro swing
 *  Original composition inspired by the *mood* of ghostly cowboy ride music:
 *  galloping rhythm, dark minor key, eerie synth leads, thunderous bass */
function startPhantomRiders(): void {
  const ctx = state.context!; const dest = state.musicGain!
  const bt = beatMs(134)

  // Galloping rhythm: kick pattern mimics horse hooves (da-da-DUM da-da-DUM)
  let gallop = 0
  const gallopId = setInterval(() => {
    if (!state.isPlaying) return
    const pos = gallop % 6
    if (pos === 0) playSwingKick(ctx, dest, 0.35) // DUM
    if (pos === 3) playSwingKick(ctx, dest, 0.25) // dum
    if (pos === 1 || pos === 2 || pos === 4 || pos === 5) {
      playClosedHat(ctx, dest, pos % 3 === 0 ? 0.06 : 0.04) // da-da
    }
    if (pos === 0) playSwingSnare(ctx, dest, 0.18) // accent
    gallop++
  }, bt / 3) // triplet subdivision for gallop
  state.intervalIds.push(gallopId)

  // Open hat on every other strong beat
  const ohId = setInterval(() => {
    if (!state.isPlaying) return
    playOpenHat(ctx, dest, 0.06)
  }, bt * 4)
  state.intervalIds.push(ohId)

  // Dark thunderous bass - Am driving pattern
  const bassNotes = [N.A2, N.A2, N.C3, N.A2, N.E2, N.E2, N.G2, N.A2,
                     N.A2, N.A2, N.D3, N.C3, N.E2, N.E2, N.F2, N.E2]
  let bi = 0
  const bassId = setInterval(() => {
    if (!state.isPlaying) return
    playWalkingBass(ctx, dest, bassNotes[bi], 0.28, 0.18)
    bi = (bi + 1) % bassNotes.length
  }, bt)
  state.intervalIds.push(bassId)

  // Eerie synth lead - minor key melody (original, Am natural minor with chromaticism)
  const melody = [
    N.A4, N.C5, N.E5, 0, N.E5, N.D5, N.C5, N.A4,
    0, N.G4, N.A4, N.Bb4, N.A4, 0, 0, 0,
    N.E5, N.F5, N.E5, N.D5, N.C5, 0, N.A4, 0,
    N.G4, 0, N.F4, N.E4, 0, 0, N.A4, 0,
  ]
  let mi = 0
  const melId = setInterval(() => {
    if (!state.isPlaying) return
    if (melody[mi] > 0) playSynthLead(ctx, dest, melody[mi], 0.09, 0.3)
    mi = (mi + 1) % melody.length
  }, bt)
  state.intervalIds.push(melId)

  // Ghost choir pad - eerie fifths
  const padFreqs = [N.A3, N.E4, N.A4]
  padFreqs.forEach(f => {
    const o = ctx.createOscillator(); const o2 = ctx.createOscillator()
    const g = ctx.createGain(); const fi = ctx.createBiquadFilter()
    o.type = 'sine'; o.frequency.value = f
    o2.type = 'sine'; o2.frequency.value = f * 1.002 // slight detune = ghostly chorus
    fi.type = 'lowpass'; fi.frequency.value = 600; g.gain.value = 0.035
    o.connect(fi); o2.connect(fi); fi.connect(g); g.connect(dest)
    o.start(); o2.start()
    state.oscillators.push(o, o2)
  })

  // Brass stab - dark power chords on accents
  let brassBar = 0
  const brassId = setInterval(() => {
    if (!state.isPlaying) return
    brassBar++
    if (brassBar % 8 === 4) {
      playBrassStab(ctx, dest, [N.A3, N.C4, N.E4, N.A4], 0.12, 0.3)
    } else if (brassBar % 8 === 6) {
      playBrassStab(ctx, dest, [N.F3, N.A3, N.C4, N.F4], 0.1, 0.25)
    }
  }, bt * 2)
  state.intervalIds.push(brassId)

  // Thunder rumble effect (periodic low noise burst)
  const thunderId = setInterval(() => {
    if (!state.isPlaying) return
    const bufLen = ctx.sampleRate * 0.8
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.3))
    const src = ctx.createBufferSource()
    const g = ctx.createGain(); const f = ctx.createBiquadFilter()
    src.buffer = buf; f.type = 'lowpass'; f.frequency.value = 300; f.Q.value = 1
    g.gain.setValueAtTime(0.12, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)
    src.connect(f); f.connect(g); g.connect(dest); src.start()
  }, bt * 32) // every 8 bars
  state.intervalIds.push(thunderId)
}

// ─── Sound Effects ───

export function playSFX(type: 'click' | 'success' | 'fail' | 'wagon' | 'shot' | 'coin'): void {
  if (!state.context || !state.sfxGain) { if (!initAudio()) return }
  const ctx = state.context!
  const dest = state.sfxGain!

  switch (type) {
    case 'click':
      playTone(ctx, dest, 800, 0.1, 0.05, 'square')
      break
    case 'success':
      playTone(ctx, dest, 523.25, 0.2, 0.1, 'sine')
      setTimeout(() => playTone(ctx, dest, 659.25, 0.2, 0.1, 'sine'), 100)
      setTimeout(() => playTone(ctx, dest, 783.99, 0.3, 0.15, 'sine'), 200)
      break
    case 'fail':
      playTone(ctx, dest, 200, 0.3, 0.2, 'sawtooth')
      break
    case 'wagon':
      playNoise(ctx, dest, 0.1, 0.3)
      break
    case 'shot':
      playNoise(ctx, dest, 0.4, 0.1)
      playTone(ctx, dest, 100, 0.3, 0.15, 'triangle')
      break
    case 'coin':
      playTone(ctx, dest, 1318.51, 0.15, 0.08, 'sine')
      setTimeout(() => playTone(ctx, dest, 1567.98, 0.2, 0.1, 'sine'), 80)
      break
  }
}

function playNoise(ctx: AudioContext, dest: AudioNode, volume: number, duration: number): void {
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  source.buffer = buffer
  filter.type = 'highpass'; filter.frequency.value = 5000
  gain.gain.value = volume
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
  source.connect(filter); filter.connect(gain); gain.connect(dest); source.start()
}

function playTone(ctx: AudioContext, dest: AudioNode, freq: number, volume: number, duration: number, type: OscillatorType): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type; osc.frequency.value = freq
  gain.gain.value = volume
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
  osc.connect(gain); gain.connect(dest)
  osc.start(); osc.stop(ctx.currentTime + duration + 0.05)
}

// ─── State Queries ───

export function getCurrentStyle(): MusicStyle { return state.currentStyle }
export function isInitialized(): boolean { return state.context !== null }

// ═══════════════════════════════════════════════════════════════════════════════
// FALLOUT 2 SOUNDTRACK - File-based MP3 playback
// ═══════════════════════════════════════════════════════════════════════════════
// 19 tracks from the Fallout 2 OST, mapped to game contexts.
// Uses HTML Audio elements for MP3 playback with crossfading.

export interface FalloutTrack {
  id: string
  title: string
  file: string           // URL path under /rpg/sounds/fallout/
  context: FalloutTrackContext[]  // When this track fits best
}

export type FalloutTrackContext =
  | 'title'       // Title screen / menu
  | 'town'        // In town, shopping, talking to NPCs
  | 'travel'      // On the trail between locations
  | 'wilderness'  // Wilderness, hunting, exploration
  | 'danger'      // Combat, outlaw encounters, dangerous areas
  | 'mystery'     // Investigation, clue gathering, dossier
  | 'saloon'      // Saloon, gambling, social
  | 'settlement'  // Ranch, settlement building
  | 'ambient'     // General ambient, any context

export const FALLOUT_TRACKS: FalloutTrack[] = [
  {
    id: 'kiss_to_build_a_dream_on',
    title: 'A Kiss To Build A Dream On',
    file: '/rpg/sounds/fallout/00__A_Kiss_To_Build_A_Dream_On.mp3',
    context: ['title', 'saloon'],
  },
  {
    id: 'traders_life',
    title: "Trader's Life",
    file: '/rpg/sounds/fallout/01_Traders_Life.mp3',
    context: ['town', 'settlement'],
  },
  {
    id: 'moribund_world',
    title: 'Moribund World',
    file: '/rpg/sounds/fallout/02_Moribund_World.mp3',
    context: ['wilderness', 'travel', 'ambient'],
  },
  {
    id: 'khans_of_new_california',
    title: 'Khans of New California',
    file: '/rpg/sounds/fallout/03__Khans_of_New_California.mp3',
    context: ['danger', 'wilderness'],
  },
  {
    id: 'desert_wind',
    title: 'Desert Wind',
    file: '/rpg/sounds/fallout/04_Desert_Wind.mp3',
    context: ['travel', 'wilderness', 'ambient'],
  },
  {
    id: 'vats_of_goo',
    title: 'Vats of Goo',
    file: '/rpg/sounds/fallout/05__Vats_of_Goo.mp3',
    context: ['danger', 'mystery'],
  },
  {
    id: 'city_of_lost_angels',
    title: 'City of Lost Angels',
    file: '/rpg/sounds/fallout/06_City_of_Lost_Angels.mp3',
    context: ['town', 'mystery', 'ambient'],
  },
  {
    id: 'industrial_junk',
    title: 'Industrial Junk',
    file: '/rpg/sounds/fallout/07_Industrial_Junk.mp3',
    context: ['danger', 'settlement'],
  },
  {
    id: 'underground_troubles',
    title: 'Underground Troubles',
    file: '/rpg/sounds/fallout/08_Underground_Troubles.mp3',
    context: ['mystery', 'danger'],
  },
  {
    id: 'city_of_the_dead',
    title: 'City of the Dead',
    file: '/rpg/sounds/fallout/09_City_of_the_Dead.mp3',
    context: ['danger', 'wilderness'],
  },
  {
    id: 'followers_credo',
    title: "Follower's Credo",
    file: '/rpg/sounds/fallout/10_Followers_Credo.mp3',
    context: ['town', 'ambient', 'settlement'],
  },
  {
    id: 'beyond_the_canyon',
    title: 'Beyond the Canyon',
    file: '/rpg/sounds/fallout/11_Beyond_the_Canyon.mp3',
    context: ['travel', 'wilderness', 'ambient'],
  },
  {
    id: 'dream_town',
    title: 'Dream Town',
    file: '/rpg/sounds/fallout/12_Dream_Town.mp3',
    context: ['town', 'saloon', 'settlement'],
  },
  {
    id: 'biggest_little_city',
    title: 'Biggest Little City in the World',
    file: '/rpg/sounds/fallout/13_Biggest_Little_City_in_the_World.mp3',
    context: ['town', 'saloon'],
  },
  {
    id: 'my_chrysalis_highwayman',
    title: 'My Chrysalis Highwayman',
    file: '/rpg/sounds/fallout/14_My_Chrysalis_Highwayman.mp3',
    context: ['travel', 'ambient'],
  },
  {
    id: 'many_contrasts',
    title: 'Many Contrasts',
    file: '/rpg/sounds/fallout/15_Many_Contrasts.mp3',
    context: ['mystery', 'ambient', 'town'],
  },
  {
    id: 'all_clear_signal',
    title: 'All-Clear Signal',
    file: '/rpg/sounds/fallout/16_All-Clear_Signal.mp3',
    context: ['settlement', 'ambient'],
  },
  {
    id: 'california_revisited',
    title: 'California Revisited',
    file: '/rpg/sounds/fallout/17_California_Revisited.mp3',
    context: ['travel', 'wilderness'],
  },
  {
    id: 'gold_slouch',
    title: 'Gold Slouch',
    file: '/rpg/sounds/fallout/18_Gold_Slouch.mp3',
    context: ['settlement', 'ambient', 'town'],
  },
]

// Fallout playback state
interface FalloutState {
  mode: 'synth' | 'fallout'  // Which soundtrack is active
  audioElement: HTMLAudioElement | null
  nextAudioElement: HTMLAudioElement | null  // For crossfading
  currentTrackId: string | null
  trackQueue: FalloutTrack[]
  queueIndex: number
  isPlaying: boolean
  currentContext: FalloutTrackContext
}

const falloutState: FalloutState = {
  mode: 'synth',
  audioElement: null,
  nextAudioElement: null,
  currentTrackId: null,
  trackQueue: [],
  queueIndex: 0,
  isPlaying: false,
  currentContext: 'ambient',
}

// Get the active soundtrack mode
export function getSoundtrackMode(): 'synth' | 'fallout' {
  return falloutState.mode
}

// Get current Fallout track info
export function getCurrentFalloutTrack(): FalloutTrack | null {
  if (falloutState.mode !== 'fallout' || !falloutState.currentTrackId) return null
  return FALLOUT_TRACKS.find(t => t.id === falloutState.currentTrackId) || null
}

// Switch soundtrack mode
export function setSoundtrackMode(mode: 'synth' | 'fallout'): void {
  if (falloutState.mode === mode) return

  // Stop whatever is playing
  if (falloutState.mode === 'synth') {
    stopMusic()
  } else {
    stopFalloutMusic()
  }

  falloutState.mode = mode

  // Start the new mode
  if (mode === 'synth') {
    playPlaylist()
  } else {
    playFalloutPlaylist()
  }

  // Persist preference
  try {
    localStorage.setItem('golden-hooves-soundtrack-mode', mode)
  } catch {}
}

// Load saved soundtrack preference
export function loadSoundtrackPreference(): 'synth' | 'fallout' {
  try {
    const saved = localStorage.getItem('golden-hooves-soundtrack-mode')
    if (saved === 'fallout' || saved === 'synth') return saved
  } catch {}
  return 'synth'
}

// Build a context-aware shuffled queue
function buildFalloutQueue(context: FalloutTrackContext): FalloutTrack[] {
  // Prioritize tracks matching context, then fill with others
  const contextTracks = FALLOUT_TRACKS.filter(t => t.context.includes(context))
  const otherTracks = FALLOUT_TRACKS.filter(t => !t.context.includes(context))

  const shuffled = [
    ...shuffleArray([...contextTracks]),
    ...shuffleArray([...otherTracks]),
  ]

  return shuffled
}

// Play the Fallout 2 soundtrack as a shuffled playlist
export function playFalloutPlaylist(context: FalloutTrackContext = 'ambient'): void {
  if (!initAudio()) return
  falloutState.mode = 'fallout'
  falloutState.currentContext = context
  falloutState.trackQueue = buildFalloutQueue(context)
  falloutState.queueIndex = 0
  falloutState.isPlaying = true

  playFalloutTrack(falloutState.trackQueue[0])
}

// Play a specific Fallout track
function playFalloutTrack(track: FalloutTrack): void {
  if (!state.context || !state.musicGain) return

  const crossfadeDuration = 2000 // 2 seconds crossfade

  // Create new audio element
  const audio = new Audio(track.file)
  audio.volume = 0 // Start silent for fade-in

  // Connect to Web Audio for volume control via musicGain
  // Use a MediaElementSource so master/music volume sliders work
  try {
    const source = state.context.createMediaElementSource(audio)
    source.connect(state.musicGain!)
  } catch {
    // If context already has this element, just set volume directly
    audio.volume = state.musicGain.gain.value * (state.masterGain?.gain.value ?? 1)
  }

  // Crossfade: fade out old, fade in new
  if (falloutState.audioElement) {
    const oldAudio = falloutState.audioElement
    const startVol = oldAudio.volume
    const fadeSteps = 20
    const fadeInterval = crossfadeDuration / fadeSteps
    let step = 0

    const fadeOut = setInterval(() => {
      step++
      oldAudio.volume = Math.max(0, startVol * (1 - step / fadeSteps))
      if (step >= fadeSteps) {
        clearInterval(fadeOut)
        oldAudio.pause()
        oldAudio.src = ''
      }
    }, fadeInterval)
  }

  // Fade in new track
  audio.play().then(() => {
    const targetVol = 0.8
    const fadeSteps = 20
    const fadeInterval = crossfadeDuration / fadeSteps
    let step = 0

    const fadeIn = setInterval(() => {
      step++
      audio.volume = Math.min(targetVol, targetVol * (step / fadeSteps))
      if (step >= fadeSteps) {
        clearInterval(fadeIn)
      }
    }, fadeInterval)
  }).catch(err => {
    console.warn('AudioManager: Fallout track play failed (user interaction required?):', err.message)
  })

  // When track ends, advance to next
  audio.addEventListener('ended', () => {
    if (falloutState.isPlaying) {
      advanceFalloutTrack()
    }
  })

  falloutState.audioElement = audio
  falloutState.currentTrackId = track.id
  state.currentStyle = 'silent' // Clear synth style indicator
  state.isPlaying = true

  console.log(`AudioManager: Fallout 2 - Now playing: ${track.title}`)
}

function advanceFalloutTrack(): void {
  if (!falloutState.isPlaying) return

  falloutState.queueIndex++
  if (falloutState.queueIndex >= falloutState.trackQueue.length) {
    // Reshuffle and restart
    falloutState.trackQueue = buildFalloutQueue(falloutState.currentContext)
    falloutState.queueIndex = 0
  }

  playFalloutTrack(falloutState.trackQueue[falloutState.queueIndex])
}

// Stop Fallout music
export function stopFalloutMusic(): void {
  if (falloutState.audioElement) {
    falloutState.audioElement.pause()
    falloutState.audioElement.src = ''
    falloutState.audioElement = null
  }
  if (falloutState.nextAudioElement) {
    falloutState.nextAudioElement.pause()
    falloutState.nextAudioElement.src = ''
    falloutState.nextAudioElement = null
  }
  falloutState.isPlaying = false
  falloutState.currentTrackId = null
}

// Change Fallout context (e.g., entering a town vs traveling)
export function setFalloutContext(context: FalloutTrackContext): void {
  if (falloutState.mode !== 'fallout') return
  if (falloutState.currentContext === context) return

  falloutState.currentContext = context

  // Rebuild queue with new context priority, but finish current track
  // Queue will use new context on next advance
  const remaining = falloutState.trackQueue.slice(falloutState.queueIndex + 1)
  const newQueue = buildFalloutQueue(context).filter(
    t => !remaining.some(r => r.id === t.id)
  )
  falloutState.trackQueue = [
    ...falloutState.trackQueue.slice(0, falloutState.queueIndex + 1),
    ...shuffleArray([...newQueue]),
  ]
}

// Get tracks for a specific context (for UI display)
export function getFalloutTracksForContext(context: FalloutTrackContext): FalloutTrack[] {
  return FALLOUT_TRACKS.filter(t => t.context.includes(context))
}
