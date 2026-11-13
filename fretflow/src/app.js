    /********************************************************************
     * MUSIC THEORY & GUITAR FRETBOARD ENGINE
     ********************************************************************/
    const MAX_FRET = 17;
    const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
    const SETTINGS_KEY = 'fretTrainer.settings.v2';
    const TAB_IDS = ['key', 'shape', 'pattern', 'tempo', 'tuner', 'view'];

    const KEY_DISPLAY = [
      { id: 0, label: 'C' },
      { id: 1, label: 'C#/Db' },
      { id: 2, label: 'D' },
      { id: 3, label: 'Eb' },
      { id: 4, label: 'E' },
      { id: 5, label: 'F' },
      { id: 6, label: 'F#/Gb' },
      { id: 7, label: 'G' },
      { id: 8, label: 'Ab' },
      { id: 9, label: 'A' },
      { id: 10, label: 'Bb' },
      { id: 11, label: 'B' }
    ];

    // Standard tuning. Index 0 = String 1 (high E4 = MIDI 64) ... Index 5 = String 6 (low E2 = MIDI 40)
    const STRING_TUNING = [
      { stringNumber: 1, name: 'e', midi: 64, thickness: 1.4 },
      { stringNumber: 2, name: 'B', midi: 59, thickness: 1.8 },
      { stringNumber: 3, name: 'G', midi: 55, thickness: 2.3 },
      { stringNumber: 4, name: 'D', midi: 50, thickness: 2.9 },
      { stringNumber: 5, name: 'A', midi: 45, thickness: 3.5 },
      { stringNumber: 6, name: 'E', midi: 40, thickness: 4.2 }
    ];

    // parentOffset: semitones from the scale root to the major scale whose CAGED shapes it uses.
    // chordIdx: which scale-degree indexes are chord tones (1, 3, 5, 7).
    const SCALES = {
      ionian:     { name: 'Ionian (Major)',   parentOffset: 0,   intervals: [0, 2, 4, 5, 7, 9, 11], degrees: ['1', '2', '3', '4', '5', '6', '7'],       chordIdx: [0, 2, 4, 6] },
      dorian:     { name: 'Dorian',           parentOffset: -2,  intervals: [0, 2, 3, 5, 7, 9, 10], degrees: ['1', '2', 'b3', '4', '5', '6', 'b7'],     chordIdx: [0, 2, 4, 6] },
      phrygian:   { name: 'Phrygian',         parentOffset: -4,  intervals: [0, 1, 3, 5, 7, 8, 10], degrees: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],   chordIdx: [0, 2, 4, 6] },
      lydian:     { name: 'Lydian',           parentOffset: -5,  intervals: [0, 2, 4, 6, 7, 9, 11], degrees: ['1', '2', '3', '#4', '5', '6', '7'],      chordIdx: [0, 2, 4, 6] },
      mixolydian: { name: 'Mixolydian',       parentOffset: -7,  intervals: [0, 2, 4, 5, 7, 9, 10], degrees: ['1', '2', '3', '4', '5', '6', 'b7'],      chordIdx: [0, 2, 4, 6] },
      aeolian:    { name: 'Aeolian (Minor)',  parentOffset: -9,  intervals: [0, 2, 3, 5, 7, 8, 10], degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],    chordIdx: [0, 2, 4, 6] },
      locrian:    { name: 'Locrian',          parentOffset: -11, intervals: [0, 1, 3, 5, 6, 8, 10], degrees: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],  chordIdx: [0, 2, 4, 6] },
      maj_pent:   { name: 'Major Pentatonic', parentOffset: 0,   intervals: [0, 2, 4, 7, 9],        degrees: ['1', '2', '3', '5', '6'],                 chordIdx: [0, 2, 3] },
      min_pent:   { name: 'Minor Pentatonic', parentOffset: -9,  intervals: [0, 3, 5, 7, 10],       degrees: ['1', 'b3', '4', '5', 'b7'],               chordIdx: [0, 1, 3, 4] },
      blues:      { name: 'Blues',            parentOffset: -9,  intervals: [0, 3, 5, 6, 7, 10],    degrees: ['1', 'b3', '4', 'b5', '5', 'b7'],         chordIdx: [0, 1, 4, 5] },
      // Minor variations and exotic colours. These are not modes of the major scale, so parentOffset
      // only decides which CAGED position name lines up with which stretch of the neck.
      harm_minor:   { name: 'Harmonic Minor',    parentOffset: -9, intervals: [0, 2, 3, 5, 7, 8, 11],     degrees: ['1', '2', 'b3', '4', '5', 'b6', '7'],        chordIdx: [0, 2, 4, 6] },
      mel_minor:    { name: 'Melodic Minor',     parentOffset: -9, intervals: [0, 2, 3, 5, 7, 9, 11],     degrees: ['1', '2', 'b3', '4', '5', '6', '7'],         chordIdx: [0, 2, 4, 6] },
      phryg_dom:    { name: 'Phrygian Dominant', parentOffset: -4, intervals: [0, 1, 4, 5, 7, 8, 10],     degrees: ['1', 'b2', '3', '4', '5', 'b6', 'b7'],       chordIdx: [0, 2, 4, 6] },
      lydian_dom:   { name: 'Lydian Dominant',   parentOffset: -5, intervals: [0, 2, 4, 6, 7, 9, 10],     degrees: ['1', '2', '3', '#4', '5', '6', 'b7'],        chordIdx: [0, 2, 4, 6] },
      dbl_harmonic: { name: 'Double Harmonic',   parentOffset: 0,  intervals: [0, 1, 4, 5, 7, 8, 11],     degrees: ['1', 'b2', '3', '4', '5', 'b6', '7'],        chordIdx: [0, 2, 4, 6] },
      hung_minor:   { name: 'Hungarian Minor',   parentOffset: -9, intervals: [0, 2, 3, 6, 7, 8, 11],     degrees: ['1', '2', 'b3', '#4', '5', 'b6', '7'],       chordIdx: [0, 2, 4, 6] },
      hirajoshi:    { name: 'Hirajoshi',         parentOffset: -9, intervals: [0, 2, 3, 7, 8],            degrees: ['1', '2', 'b3', '5', 'b6'],                  chordIdx: [0, 2, 3] },
      whole_tone:   { name: 'Whole Tone',        parentOffset: 0,  intervals: [0, 2, 4, 6, 8, 10],        degrees: ['1', '2', '3', '#4', '#5', 'b7'],            chordIdx: [0, 2, 4, 5] },
      diminished:   { name: 'Diminished (W-H)',  parentOffset: -9, intervals: [0, 2, 3, 5, 6, 8, 9, 11],  degrees: ['1', '2', 'b3', '4', 'b5', 'b6', '6', '7'],  chordIdx: [0, 2, 4, 6] }
    };
    const DIATONIC = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian', 'maj_pent', 'min_pent', 'blues'];
    const NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

    // CAGED windows: fret offsets from the parent major root on the 6th string
    const CAGED_OFFSETS = {
      E: [-1, 3],
      D: [1, 5],
      C: [4, 8],
      A: [6, 10],
      G: [8, 12]
    };
    // The five minor-pentatonic "boxes" are the same five positions under another name
    const MINOR_PENT_BOX = { G: 1, E: 2, D: 3, C: 4, A: 5 };

    const SHAPE_LABELS = {
      C: 'C-Shape', A: 'A-Shape', G: 'G-Shape', E: 'E-Shape', D: 'D-Shape', FULL: 'Full Neck',
      '3NPS_1': '3NPS 1', '3NPS_2': '3NPS 2', '3NPS_3': '3NPS 3', '3NPS_4': '3NPS 4',
      '3NPS_5': '3NPS 5', '3NPS_6': '3NPS 6', '3NPS_7': '3NPS 7'
    };

    const CAGED_QUICK_SHAPES = [
      { id: 'C', label: 'C Shape' },
      { id: 'A', label: 'A Shape' },
      { id: 'G', label: 'G Shape' },
      { id: 'E', label: 'E Shape' },
      { id: 'D', label: 'D Shape' },
      { id: 'FULL', label: 'Full Neck' }
    ];

    const QUICK_PATTERNS = [
      { id: 'asc_desc', label: 'Normal (Asc/Desc)' },
      { id: 'arpeggio_7', label: 'Arpeggio (1-3-5-7)' },
      { id: 'thirds', label: 'Broken 3rds' },
      { id: 'seq_3', label: 'Groups of 3' }
    ];

    // App State
    const state = {
      keyRoot: 0,           // 0 = C
      scale: 'ionian',
      shape: 'E',           // 'C','A','G','E','D','3NPS_1'..'3NPS_7','FULL'
      pattern: 'asc_desc',
      tempo: 100,
      subdivision: 2,       // 1 = quarter, 2 = eighth, 3 = triplet, 4 = sixteenth
      speedTrainer: 0,      // BPM added on every loop (0 = off)
      labelMode: 'note',    // 'note', 'interval', 'finger'
      orientation: 'auto',  // 'auto', 'horizontal', 'vertical'
      showGhostNotes: true,
      toneType: 'acoustic',
      volume: 0.8,
      loop: true,
      metronome: false,
      holdMode: false,      // tapped notes sustain until tapped again
      tunerOctave: false,   // tuning reference one octave up
      activeTab: 'key',     // settings tab shown on phones
      // --- runtime only (not saved) ---
      heldId: null,         // fretboard cell id or 'tuner-<string>' currently sustaining
      heldInfo: null,
      isPlaying: false,
      currentStepIndex: -1,
      activeNoteObj: null,
      sequence: [],
      tapTimestamps: []
    };
    const PERSISTED_KEYS = ['keyRoot', 'scale', 'shape', 'pattern', 'tempo', 'subdivision', 'speedTrainer',
      'labelMode', 'orientation', 'showGhostNotes', 'toneType', 'volume', 'loop', 'metronome',
      'holdMode', 'tunerOctave', 'activeTab'];

    function saveSettings() {
      try {
        const out = {};
        PERSISTED_KEYS.forEach(k => { out[k] = state[k]; });
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(out));
      } catch (err) { /* storage unavailable (private mode / sandboxed frame) — ignore */ }
    }

    function loadSettings() {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (!saved || typeof saved !== 'object') return;
        if (Number.isInteger(saved.keyRoot) && saved.keyRoot >= 0 && saved.keyRoot < 12) state.keyRoot = saved.keyRoot;
        if (SCALES[saved.scale]) state.scale = saved.scale;
        if (SHAPE_LABELS[saved.shape]) state.shape = saved.shape;
        if (typeof saved.pattern === 'string') state.pattern = saved.pattern;
        if (typeof saved.tempo === 'number') state.tempo = Math.max(40, Math.min(240, Math.round(saved.tempo)));
        if ([1, 2, 3, 4].includes(saved.subdivision)) state.subdivision = saved.subdivision;
        if ([0, 2, 5, 10].includes(saved.speedTrainer)) state.speedTrainer = saved.speedTrainer;
        if (['note', 'interval', 'finger'].includes(saved.labelMode)) state.labelMode = saved.labelMode;
        if (['auto', 'horizontal', 'vertical'].includes(saved.orientation)) state.orientation = saved.orientation;
        if (typeof saved.showGhostNotes === 'boolean') state.showGhostNotes = saved.showGhostNotes;
        if (TONES[saved.toneType]) state.toneType = saved.toneType;
        if (typeof saved.volume === 'number') state.volume = Math.max(0, Math.min(1, saved.volume));
        if (typeof saved.loop === 'boolean') state.loop = saved.loop;
        if (typeof saved.metronome === 'boolean') state.metronome = saved.metronome;
        if (typeof saved.holdMode === 'boolean') state.holdMode = saved.holdMode;
        if (typeof saved.tunerOctave === 'boolean') state.tunerOctave = saved.tunerOctave;
        if (TAB_IDS.includes(saved.activeTab)) state.activeTab = saved.activeTab;
      } catch (err) { /* ignore corrupt or unavailable storage */ }
    }

    /********************************************************************
     * NOTE SPELLING — picks sharps or flats so every key reads correctly
     * (Eb major = Eb F G Ab Bb C D, not D# F G G# A# C D)
     ********************************************************************/
    function signedSemis(x) {
      let v = ((x % 12) + 12) % 12;
      if (v > 6) v -= 12;
      return v;
    }

    function accidentalText(a) {
      return a === 0 ? '' : a > 0 ? '#'.repeat(a) : 'b'.repeat(-a);
    }

    // Returns one note name per scale degree
    function spellScale(rootPc, scaleObj) {
      let best = null;
      for (let L = 0; L < 7; L++) {
        const rootAcc = signedSemis(rootPc - LETTER_PC[L]);
        if (Math.abs(rootAcc) > 1) continue;
        let cost = rootAcc < 0 ? 0.5 : 0; // tie-break toward the sharp spelling (F# over Gb)
        const names = [];
        for (let i = 0; i < scaleObj.degrees.length; i++) {
          const degNum = parseInt(scaleObj.degrees[i].replace(/[b#]/g, ''), 10);
          const letter = (L + degNum - 1) % 7;
          const pc = (rootPc + scaleObj.intervals[i]) % 12;
          const acc = signedSemis(pc - LETTER_PC[letter]);
          cost += Math.abs(acc) + (Math.abs(acc) > 1 ? 20 : 0);
          names.push(LETTERS[letter] + accidentalText(acc));
        }
        if (!best || cost < best.cost) best = { cost, names };
      }
      if (best.cost >= 20) {
        // Would need a double sharp/flat (some exotic scales in remote keys): use plain names instead
        const table = [1, 3, 5, 8, 10].includes(rootPc) ? NAMES_FLAT : NAMES_SHARP;
        return scaleObj.intervals.map(semi => table[(rootPc + semi) % 12]);
      }
      return best.names;
    }

    /********************************************************************
     * WEB AUDIO — plucked-string (Karplus-Strong) guitar synthesizer
     ********************************************************************/
    const TONES = {
      acoustic: { smooth: 1, t60: 3.0, lowpass: 5200, pick: 0.18 },
      electric: { smooth: 4, t60: 4.2, lowpass: 2600, pick: 0.30 },
      bright:   { smooth: 0, t60: 2.0, lowpass: 9000, pick: 0.12 }
    };

    const TONE_BODY = {
      acoustic: { freq: 190, gain: 3.5 },
      electric: { freq: 420, gain: 2.5 },
      bright:   { freq: 260, gain: 2.5 }
    };

    let audioCtx = null;
    let masterGain = null;
    let noteBus = null;
    let bodyEq = null;
    const pluckCache = new Map();
    const stringVoices = {}; // last sounding note per string, so a new note on that string cuts it off

    // Small synthetic room so notes don't sound bone-dry
    function makeRoomImpulse(ctx) {
      const len = Math.floor(ctx.sampleRate * 1.1);
      const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
      let seed = 987654321;
      for (let ch = 0; ch < 2; ch++) {
        const d = impulse.getChannelData(ch);
        let lp = 0;
        let energy = 0;
        for (let i = 0; i < len; i++) {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          const white = seed / 2147483648 - 1;
          lp += 0.35 * (white - lp); // darken the tail
          const t = i / len;
          d[i] = lp * Math.pow(1 - t, 2) * Math.exp(-4.5 * t);
          energy += d[i] * d[i];
        }
        const norm = 1 / Math.sqrt(energy);
        for (let i = 0; i < len; i++) d[i] *= norm;
      }
      return impulse;
    }

    function applyToneToGraph() {
      if (!bodyEq) return;
      const body = TONE_BODY[state.toneType] || TONE_BODY.acoustic;
      bodyEq.frequency.value = body.freq;
      bodyEq.gain.value = body.gain;
    }

    // notes -> noteBus -> body EQ -> rumble filter -> (dry + room) -> volume -> limiter -> out
    function setupAudioGraph(ctx) {
      noteBus = ctx.createGain();
      bodyEq = ctx.createBiquadFilter();
      bodyEq.type = 'peaking';
      bodyEq.Q.value = 0.9;
      const rumble = ctx.createBiquadFilter();
      rumble.type = 'highpass';
      rumble.frequency.value = 55;
      const room = ctx.createConvolver();
      room.buffer = makeRoomImpulse(ctx);
      const roomLevel = ctx.createGain();
      roomLevel.gain.value = 0.16;
      masterGain = ctx.createGain();
      masterGain.gain.value = state.volume;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -9;
      limiter.knee.value = 6;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.15;

      noteBus.connect(bodyEq);
      bodyEq.connect(rumble);
      rumble.connect(masterGain);
      rumble.connect(room);
      room.connect(roomLevel);
      roomLevel.connect(masterGain);
      masterGain.connect(limiter);
      limiter.connect(ctx.destination);
      applyToneToGraph();
    }

    function ensureAudioContext() {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioCtx = new AudioContextClass();
        setupAudioGraph(audioCtx);
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    function midiToFreq(midi) {
      return 440 * Math.pow(2, (midi - 69) / 12);
    }

    // Pure function: renders one plucked note. Returns samples plus the playback-rate
    // correction needed because the delay line has a whole-sample length.
    function synthPluck(sampleRate, midi, toneKey) {
      const tone = TONES[toneKey] || TONES.acoustic;
      const freq = midiToFreq(midi);
      // Loop filter y = (1 - blend) * current + blend * next. It shortens the loop by `blend`
      // samples; higher notes get a lighter blend so they don't die away too quickly.
      const blend = Math.max(0.12, Math.min(0.5, 0.5 * Math.sqrt(110 / freq)));
      const N = Math.max(2, Math.round(sampleRate / freq + blend));
      const actualFreq = sampleRate / (N - blend);
      const len = Math.floor(sampleRate * 1.6);
      const data = new Float32Array(len);
      const ring = new Float32Array(N);

      // Deterministic noise burst so a given note always sounds the same
      let seed = (midi * 7919 + 104729) >>> 0;
      for (let i = 0; i < N; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        ring[i] = seed / 2147483648 - 1;
      }
      // Soften the pick attack
      for (let p = 0; p < tone.smooth; p++) {
        let prev = ring[N - 1];
        for (let i = 0; i < N; i++) {
          const cur = ring[i];
          ring[i] = 0.5 * (cur + prev);
          prev = cur;
        }
      }
      // Pick-position comb filter
      const pickDelay = Math.max(1, Math.round(N * tone.pick));
      const combed = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        combed[i] = ring[i] - ring[(i - pickDelay + N) % N];
      }
      // Remove DC and normalise
      let mean = 0;
      for (let i = 0; i < N; i++) mean += combed[i];
      mean /= N;
      let peak = 0;
      for (let i = 0; i < N; i++) {
        combed[i] -= mean;
        peak = Math.max(peak, Math.abs(combed[i]));
      }
      const norm = peak > 0 ? 0.9 / peak : 1;
      for (let i = 0; i < N; i++) ring[i] = combed[i] * norm;

      const loss = Math.min(0.9997, Math.pow(10, -3 / (actualFreq * tone.t60)));
      let idx = 0;
      for (let i = 0; i < len; i++) {
        const cur = ring[idx];
        const nextIdx = idx + 1 === N ? 0 : idx + 1;
        data[i] = cur;
        ring[idx] = loss * ((1 - blend) * cur + blend * ring[nextIdx]);
        idx = nextIdx;
      }
      // Even out loudness across the neck (low strings would otherwise dominate)
      const probe = Math.min(len, Math.floor(sampleRate * 0.15));
      let sumSq = 0;
      let peakOut = 0;
      for (let i = 0; i < probe; i++) {
        sumSq += data[i] * data[i];
        peakOut = Math.max(peakOut, Math.abs(data[i]));
      }
      const rms = Math.sqrt(sumSq / probe);
      const level = rms > 0 ? Math.min(0.22 / rms, 0.95 / peakOut) : 1;
      for (let i = 0; i < len; i++) data[i] *= level;
      // Short fade at the very end to avoid a click
      const fade = Math.min(len, Math.floor(sampleRate * 0.03));
      for (let i = 0; i < fade; i++) {
        data[len - 1 - i] *= i / fade;
      }
      return { data, rate: freq / actualFreq };
    }

    function getPluck(ctx, midi, toneKey) {
      const key = toneKey + ':' + midi;
      let entry = pluckCache.get(key);
      if (!entry) {
        const rendered = synthPluck(ctx.sampleRate, midi, toneKey);
        const buffer = ctx.createBuffer(1, rendered.data.length, ctx.sampleRate);
        buffer.getChannelData(0).set(rendered.data);
        entry = { buffer, rate: rendered.rate };
        pluckCache.set(key, entry);
      }
      return entry;
    }

    // when: AudioContext time to start (omit for "now"). Returns the source node.
    // stringNumber: the note cuts off whatever was ringing on that string, like a real guitar.
    function playGuitarNote(midi, durationSec, isRoot, when, stringNumber) {
      const ctx = ensureAudioContext();
      if (!ctx) return null;
      const startAt = Math.max(when || 0, ctx.currentTime);
      const tone = TONES[state.toneType] || TONES.acoustic;
      const pluck = getPluck(ctx, midi, state.toneType);

      const src = ctx.createBufferSource();
      src.buffer = pluck.buffer;
      src.playbackRate.value = pluck.rate;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = tone.lowpass;
      filter.Q.value = 0.5;

      const gain = ctx.createGain();
      const releaseAt = startAt + Math.max(durationSec || 0.45, 0.3);
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(isRoot ? 0.46 : 0.38, startAt + 0.002);
      gain.gain.setTargetAtTime(0, releaseAt, 0.1);

      if (stringNumber) {
        const prev = stringVoices[stringNumber];
        if (prev && prev.endsAt > startAt) {
          prev.gain.gain.cancelScheduledValues(startAt);
          prev.gain.gain.setTargetAtTime(0, startAt, 0.012);
        }
        stringVoices[stringNumber] = { gain, endsAt: releaseAt + 0.7 };
      }

      src.connect(filter);
      filter.connect(gain);
      gain.connect(noteBus);
      src.start(startAt);
      src.stop(releaseAt + 0.7);
      return src;
    }

    /* ---- Sustained "hold" tone (tuning reference / drone) ---- */
    let drone = null;
    let droneWave = null;

    function startDrone(midi) {
      const ctx = ensureAudioContext();
      stopDrone();
      if (!ctx) return;
      if (!droneWave || droneWave.ctx !== ctx) {
        // Rich but smooth harmonic series: clear on small speakers, steady enough to hear beating
        const count = 24;
        const real = new Float32Array(count + 1);
        const imag = new Float32Array(count + 1);
        for (let n = 1; n <= count; n++) imag[n] = 1 / Math.pow(n, 1.25);
        droneWave = { ctx, wave: ctx.createPeriodicWave(real, imag) };
      }
      const now = ctx.currentTime;
      const freq = midiToFreq(midi);
      const osc = ctx.createOscillator();
      osc.setPeriodicWave(droneWave.wave);
      osc.frequency.value = freq;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = Math.max(1800, Math.min(6000, freq * 14));
      filter.Q.value = 0.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.06);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(noteBus);
      osc.start(now);
      drone = { osc, gain, midi };
    }

    function stopDrone() {
      if (!drone || !audioCtx) { drone = null; return; }
      const now = audioCtx.currentTime;
      drone.gain.gain.cancelScheduledValues(now);
      drone.gain.gain.setTargetAtTime(0, now, 0.04);
      try { drone.osc.stop(now + 0.35); } catch (err) { /* already stopped */ }
      drone = null;
    }

    function playMetronomeClick(isAccent, when) {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const t = Math.max(when || 0, ctx.currentTime);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAccent ? 1500 : 1000, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(isAccent ? 0.26 : 0.15, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      osc.connect(gain);
      gain.connect(masterGain); // straight to the output: the click stays dry and crisp
      osc.start(t);
      osc.stop(t + 0.06);
    }

    /********************************************************************
     * SCALE SHAPE & POSITION CALCULATION
     ********************************************************************/
    function getParentMajorRoot(keyRoot, scaleKey) {
      return (keyRoot + SCALES[scaleKey].parentOffset + 12) % 12;
    }

    function isSevenNoteScale(scaleKey) {
      return SCALES[scaleKey].intervals.length === 7;
    }

    function cellId(stringNumber, fret) {
      return `s${stringNumber}-f${fret}`;
    }

    // CAGED: fret window for the chosen position, kept as low on the neck as possible
    function computeCagedWindow(keyRoot, scaleKey, shapeId) {
      const parentMajorRoot = getParentMajorRoot(keyRoot, scaleKey);
      const rootFret = (parentMajorRoot - 4 + 12) % 12; // on the 6th string (open E = pitch class 4)
      const offset = CAGED_OFFSETS[shapeId] || CAGED_OFFSETS.E;
      let minFret = rootFret + offset[0];
      let maxFret = rootFret + offset[1];
      while (minFret >= 12) { minFret -= 12; maxFret -= 12; }
      if (minFret < 0) { minFret += 12; maxFret += 12; }
      return { minFret, maxFret: Math.min(MAX_FRET, maxFret) };
    }

    // True 3-notes-per-string: walk up the scale from the chosen degree on the 6th string,
    // placing exactly three consecutive scale notes on each string.
    function compute3npsCells(keyRoot, scaleObj, startDegree) {
      const startPc = (keyRoot + scaleObj.intervals[startDegree]) % 12;
      const startFret = (startPc - 4 + 12) % 12;
      let midi = STRING_TUNING[5].midi + startFret;
      let deg = startDegree;
      const pitches = [];
      for (let i = 0; i < 18; i++) {
        pitches.push(midi);
        const next = (deg + 1) % 7;
        midi += (scaleObj.intervals[next] - scaleObj.intervals[deg] + 12) % 12;
        deg = next;
      }
      // Scales with wide steps can dip below the nut when started low: move the shape up an octave
      let lowest = Infinity;
      for (let s = 0; s < 6; s++) lowest = Math.min(lowest, pitches[s * 3] - STRING_TUNING[5 - s].midi);
      const octaveShift = lowest < 0 ? 12 : 0;
      const cells = []; // { id, finger }
      for (let s = 0; s < 6; s++) {
        const strInfo = STRING_TUNING[5 - s];
        const frets = [0, 1, 2].map(k => pitches[s * 3 + k] - strInfo.midi + octaveShift);
        const middleFinger = frets[1] - frets[0] === 1 ? 2 : (frets[2] - frets[1] === 1 ? 3 : 2);
        const fingers = [1, middleFinger, 4];
        frets.forEach((fret, k) => {
          cells.push({ id: cellId(strInfo.stringNumber, fret), finger: fret === 0 ? 'O' : String(fingers[k]) });
        });
      }
      return cells;
    }

    // Build every in-scale cell on the neck, then mark which belong to the active shape
    function getScaleData() {
      const scaleObj = SCALES[state.scale];
      if (state.shape.startsWith('3NPS_') && !isSevenNoteScale(state.scale)) {
        state.shape = 'E';
      }
      const scalePitchClasses = scaleObj.intervals.map(semi => (state.keyRoot + semi) % 12);
      const degreeNames = spellScale(state.keyRoot, scaleObj);
      const pcName = {};
      scalePitchClasses.forEach((pc, i) => { pcName[pc] = degreeNames[i]; });

      const neck = new Map();
      for (let sIdx = 5; sIdx >= 0; sIdx--) {
        const strInfo = STRING_TUNING[sIdx];
        for (let fret = 0; fret <= MAX_FRET; fret++) {
          const midi = strInfo.midi + fret;
          const pitchClass = midi % 12;
          const degIdx = scalePitchClasses.indexOf(pitchClass);
          if (degIdx === -1) continue;
          const id = cellId(strInfo.stringNumber, fret);
          neck.set(id, {
            id,
            stringNumber: strInfo.stringNumber,
            stringName: strInfo.name,
            fret,
            midi,
            pitchClass,
            noteName: pcName[pitchClass],
            scaleDegreeIndex: degIdx,
            degreeLabel: scaleObj.degrees[degIdx],
            finger: '',
            isRoot: degIdx === 0,
            isChordTone: scaleObj.chordIdx.includes(degIdx)
          });
        }
      }

      let activeShapeNotes = [];
      if (state.shape === 'FULL') {
        activeShapeNotes = [...neck.values()];
      } else if (state.shape.startsWith('3NPS_')) {
        const startDegree = parseInt(state.shape.split('_')[1], 10) - 1;
        compute3npsCells(state.keyRoot, scaleObj, startDegree).forEach(cell => {
          const note = neck.get(cell.id);
          if (note) {
            note.finger = cell.finger;
            activeShapeNotes.push(note);
          }
        });
      } else {
        const win = computeCagedWindow(state.keyRoot, state.scale, state.shape);
        // A five-fret window reaches every pitch in its range, so any scale fits. The only overlap is
        // one pitch shared by the G and B strings: keep the easier, lower-fret copy.
        const inWindow = [...neck.values()].filter(n => n.fret >= win.minFret && n.fret <= win.maxFret);
        const lowestFretForPitch = new Map();
        inWindow.forEach(n => {
          const seen = lowestFretForPitch.get(n.midi);
          if (seen === undefined || n.fret < seen) lowestFretForPitch.set(n.midi, n.fret);
        });
        activeShapeNotes = inWindow.filter(n => lowestFretForPitch.get(n.midi) === n.fret);
        // One finger per fret, anchored on the lowest fretted note of the shape
        const fretted = activeShapeNotes.filter(n => n.fret > 0).map(n => n.fret);
        const anchor = fretted.length ? Math.min(...fretted) : 1;
        const usesOpen = activeShapeNotes.some(n => n.fret === 0);
        activeShapeNotes.forEach(n => {
          if (n.fret === 0) n.finger = 'O';
          else n.finger = String(Math.max(1, Math.min(4, usesOpen ? n.fret : n.fret - anchor + 1)));
        });
      }

      const frets = activeShapeNotes.map(n => n.fret);
      const windowRange = frets.length
        ? { minFret: Math.min(...frets), maxFret: Math.max(...frets) }
        : { minFret: 0, maxFret: MAX_FRET };

      // Sort by pitch and drop same-pitch duplicates for the practice patterns
      const sortedUniquePitch = [];
      const seenMidi = new Set();
      const sortedByPitch = [...activeShapeNotes].sort((a, b) => a.midi - b.midi || b.stringNumber - a.stringNumber);
      for (const n of sortedByPitch) {
        if (!seenMidi.has(n.midi)) {
          seenMidi.add(n.midi);
          sortedUniquePitch.push(n);
        }
      }

      return {
        scaleObj,
        scalePitchClasses,
        degreeNames,
        pcName,
        neck,
        windowRange,
        activeIds: new Set(activeShapeNotes.map(n => n.id)),
        activeShapeNotes,
        sortedUniquePitch
      };
    }

    // Every pattern starts and ends on the root. From the lowest root in the shape it climbs to the
    // top note, comes down to the bottom note, and climbs back to the root it started from.
    function buildPracticeSequence(sortedNotes) {
      if (!sortedNotes || sortedNotes.length === 0) return [];
      const pat = state.pattern;
      const chordIdx = SCALES[state.scale].chordIdx;

      let pool = sortedNotes;
      if (pat === 'arpeggio_7') pool = sortedNotes.filter(item => chordIdx.includes(item.scaleDegreeIndex));
      if (pat === 'arpeggio_triad') {
        const triad = chordIdx.slice(0, 3);
        pool = sortedNotes.filter(item => triad.includes(item.scaleDegreeIndex));
      }
      const n = pool.length;
      if (n <= 1) return [...pool];

      let root = pool.findIndex(item => item.isRoot);
      if (root === -1) root = 0;
      let topRoot = root;
      for (let i = n - 1; i > root; i--) {
        if (pool[i].isRoot) { topRoot = i; break; }
      }
      const rootNote = pool[root];

      if (pat === 'ascending' || pat === 'descending') {
        // Root to root across the shape
        const run = topRoot > root ? pool.slice(root, topRoot + 1) : pool.slice(root);
        return pat === 'ascending' ? run : run.reverse();
      }

      if (pat === 'thirds' || pat === 'seq_3' || pat === 'seq_4') {
        // Each group is a list of offsets from its starting note
        const offsets = pat === 'thirds' ? [0, 2] : pat === 'seq_3' ? [0, 1, 2] : [0, 1, 2, 3];
        const reach = offsets[offsets.length - 1];
        if (n > reach) {
          const seq = [];
          for (let i = root; i + reach < n; i++) offsets.forEach(o => seq.push(pool[i + o]));      // root up to the top
          for (let i = n - 1; i - reach >= 0; i--) offsets.forEach(o => seq.push(pool[i - o]));    // top down to the bottom
          for (let i = 0; i < root && i + reach < n; i++) offsets.forEach(o => seq.push(pool[i + o])); // bottom back up
          if (seq[seq.length - 1] !== rootNote) seq.push(rootNote);
          if (seq[0] !== rootNote) seq.unshift(rootNote);
          return seq;
        }
      }

      if (pat === 'pedal_root') {
        const seq = [];
        for (const item of pool) {
          if (item.id !== rootNote.id) seq.push(rootNote, item);
        }
        seq.push(rootNote);
        return seq;
      }

      // Normal and arpeggio patterns: root -> top -> bottom -> root
      const seq = pool.slice(root);
      for (let i = n - 2; i >= 0; i--) seq.push(pool[i]);
      for (let i = 1; i <= root; i++) seq.push(pool[i]);
      return seq;
    }

    /********************************************************************
     * UI RENDERING
     ********************************************************************/
    const BTN_STYLES = {
      key: {
        base: 'h-11 rounded-xl text-sm font-bold transition ',
        on: 'bg-amber-500 text-slate-950',
        off: 'bg-slate-800 text-slate-200 active:bg-slate-700'
      },
      shape: {
        base: 'h-11 rounded-xl text-sm font-bold transition ',
        on: 'bg-emerald-500 text-slate-950',
        off: 'bg-slate-800 text-slate-200 active:bg-slate-700'
      },
      pattern: {
        base: 'h-11 px-2 rounded-xl text-xs font-semibold transition truncate ',
        on: 'bg-purple-500 text-slate-950',
        off: 'bg-slate-800 text-slate-200 active:bg-slate-700'
      },
      segment: {
        base: 'h-9 px-3.5 rounded-full text-xs font-semibold transition ',
        on: 'bg-amber-500 text-slate-950',
        off: 'text-slate-400'
      },
      tab: {
        base: 'shrink-0 h-10 px-4 rounded-full text-sm font-semibold transition ',
        on: 'bg-amber-500 text-slate-950',
        off: 'bg-slate-900 text-slate-300 active:bg-slate-800'
      },
      tuner: {
        base: 'h-14 rounded-xl flex flex-col items-center justify-center transition ',
        on: 'bg-sky-400 text-slate-950',
        off: 'bg-slate-800 text-slate-100 active:bg-slate-700'
      }
    };
    const ICON_TOGGLE = {
      base: 'w-11 h-11 rounded-full flex items-center justify-center transition ',
      on: 'bg-amber-500/20 text-amber-300',
      off: 'text-slate-500 hover:bg-slate-800'
    };

    // Highlights the button whose data attribute matches `value` (buttons are never re-created,
    // so keyboard focus is preserved).
    function paintButtonGroup(containerId, attr, value, style) {
      document.querySelectorAll(`#${containerId} button[${attr}]`).forEach(btn => {
        const active = btn.getAttribute(attr) === String(value);
        btn.className = style.base + (active ? style.on : style.off);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    function buildControlButtons() {
      document.getElementById('keyButtonsContainer').innerHTML = KEY_DISPLAY.map(k =>
        `<button type="button" data-key-id="${k.id}">${k.label}</button>`).join('');
      document.getElementById('shapeButtonsContainer').innerHTML = CAGED_QUICK_SHAPES.map(sh =>
        `<button type="button" data-shape-id="${sh.id}">${sh.label}</button>`).join('');
      document.getElementById('quickPatternButtons').innerHTML = QUICK_PATTERNS.map(p =>
        `<button type="button" data-pat-id="${p.id}">${p.label}</button>`).join('');
      // Tuning reference: low E on the left, like looking down at the neck
      document.getElementById('tunerButtons').innerHTML = [...STRING_TUNING].reverse().map(s =>
        `<button type="button" data-tuner-string="${s.stringNumber}" aria-label="Hold string ${s.stringNumber}, ${s.name.toUpperCase()}">
           <span class="text-lg font-extrabold leading-none">${s.name.toUpperCase()}</span>
           <span class="text-[10px] font-mono opacity-70 mt-1">${s.stringNumber}</span>
         </button>`).join('');
    }

    function paintControls() {
      paintButtonGroup('keyButtonsContainer', 'data-key-id', state.keyRoot, BTN_STYLES.key);
      paintButtonGroup('shapeButtonsContainer', 'data-shape-id', state.shape, BTN_STYLES.shape);
      paintButtonGroup('quickPatternButtons', 'data-pat-id', state.pattern, BTN_STYLES.pattern);
      paintButtonGroup('labelModeGroup', 'data-label-mode', state.labelMode, BTN_STYLES.segment);
      paintButtonGroup('orientationGroup', 'data-orient', state.orientation, BTN_STYLES.segment);

      document.getElementById('selectMode').value = state.scale;
      document.getElementById('selectPositionVariant').value = state.shape;
      document.getElementById('selectPattern').value = state.pattern;
      document.getElementById('optgroup3nps').disabled = !isSevenNoteScale(state.scale);

      const loopBtn = document.getElementById('btnLoopToggle');
      loopBtn.className = ICON_TOGGLE.base + (state.loop ? ICON_TOGGLE.on : ICON_TOGGLE.off);
      loopBtn.setAttribute('aria-pressed', String(state.loop));

      const clickBtn = document.getElementById('btnMetronomeToggle');
      clickBtn.className = ICON_TOGGLE.base + (state.metronome ? ICON_TOGGLE.on : ICON_TOGGLE.off);
      clickBtn.setAttribute('aria-pressed', String(state.metronome));

      const holdBtn = document.getElementById('btnHoldToggle');
      holdBtn.className = 'shrink-0 h-11 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-bold border transition '
        + (state.holdMode ? 'bg-sky-400 text-slate-950 border-sky-300' : 'border-slate-700 text-slate-300');
      holdBtn.setAttribute('aria-pressed', String(state.holdMode));

      document.getElementById('btnGhostNotes').checked = state.showGhostNotes;
      document.getElementById('chkTunerOctave').checked = state.tunerOctave;

      // Settings tabs (only one panel is visible at a time below the lg breakpoint)
      paintButtonGroup('tabBar', 'data-tab', state.activeTab, BTN_STYLES.tab);
      document.querySelectorAll('#tabBar [data-tab]').forEach(btn => {
        btn.setAttribute('aria-selected', btn.getAttribute('data-tab') === state.activeTab ? 'true' : 'false');
        btn.removeAttribute('aria-pressed');
      });
      document.querySelectorAll('#panelGrid [data-panel]').forEach(panel => {
        panel.classList.toggle('max-lg:hidden', panel.getAttribute('data-panel') !== state.activeTab);
      });
      paintTunerButtons();
    }

    function paintTunerButtons() {
      const heldString = state.heldId && state.heldId.startsWith('tuner-') ? state.heldId.slice(6) : '';
      paintButtonGroup('tunerButtons', 'data-tuner-string', heldString, BTN_STYLES.tuner);
    }

    function getMarkerText(noteInfo) {
      if (state.labelMode === 'interval') return noteInfo.degreeLabel;
      if (state.labelMode === 'finger' && noteInfo.finger) return noteInfo.finger;
      return noteInfo.noteName;
    }

    function markerAriaLabel(note) {
      return `${note.noteName}, degree ${note.degreeLabel}, string ${note.stringNumber} fret ${note.fret}`;
    }

    // Returns the <button> HTML for a cell (active shape note, ghost note, or nothing)
    function markerHtmlFor(note, isActive, activeSizeClasses) {
      if (!note) return '';
      if (isActive) {
        let colorClasses = 'bg-emerald-600 text-white border-emerald-300';
        if (note.isRoot) {
          colorClasses = 'bg-rose-600 text-white border-rose-200 font-extrabold ring-2 ring-rose-400/40';
        } else if (note.isChordTone) {
          colorClasses = 'bg-amber-500 text-slate-950 border-amber-200 font-bold';
        }
        return `
          <button type="button" data-note-cell="${note.id}" aria-label="${markerAriaLabel(note)}"
            class="note-marker relative z-20 ${activeSizeClasses} rounded-full border text-xs font-mono flex items-center justify-center shadow-md transition transform hover:scale-110 active:scale-95 ${colorClasses}">
            ${getMarkerText(note)}
          </button>`;
      }
      if (!state.showGhostNotes) return '';
      const ghostLabel = state.labelMode === 'interval' ? note.degreeLabel : note.noteName;
      return `
        <button type="button" data-note-cell="${note.id}" aria-label="${markerAriaLabel(note)} (outside shape)"
          class="note-marker relative z-20 w-6 h-6 rounded-full border text-[10px] font-mono flex items-center justify-center transition opacity-40 hover:opacity-90 ${
            note.isRoot ? 'bg-rose-900/80 text-rose-200 border-rose-400/60' : 'bg-slate-800/90 text-slate-300 border-slate-600'
          }">
          ${ghostLabel}
        </button>`;
    }

    const SINGLE_DOT_FRETS = [3, 5, 7, 9, 15, 17];

    function renderHorizontalFretboard(scaleData) {
      const container = document.getElementById('horizontalFretboard');
      const { neck, activeIds, windowRange } = scaleData;
      const gridStyle = `grid-template-columns: 46px repeat(${MAX_FRET}, minmax(40px, 1fr));`;
      const boxed = state.shape !== 'FULL';

      // Header row of fret numbers
      let html = `<div class="grid gap-0 mb-1.5 text-center" style="${gridStyle}">`;
      for (let f = 0; f <= MAX_FRET; f++) {
        const inBox = boxed && f >= windowRange.minFret && f <= windowRange.maxFret;
        html += `
          <div data-fret-head="${f}" class="text-[11px] font-mono py-1 rounded-t ${
            inBox ? 'text-amber-300 font-bold bg-amber-500/10' : 'text-slate-500'
          }">
            ${f === 0 ? 'Open' : f}
          </div>`;
      }
      html += `</div>`;

      // Fretboard wood body
      html += `<div class="relative rounded-xl overflow-hidden border-2 border-amber-900/60 shadow-inner" style="background: linear-gradient(180deg, #2a1b12 0%, #1e130c 100%);">`;

      for (let sIdx = 0; sIdx < STRING_TUNING.length; sIdx++) {
        const strInfo = STRING_TUNING[sIdx];
        html += `
          <div class="grid relative items-center h-11 sm:h-12" style="${gridStyle}">
            <div data-string-line="${strInfo.stringNumber}"
              class="string-line pointer-events-none absolute left-0 right-0 z-10 bg-gradient-to-r from-amber-200/80 via-slate-300/80 to-slate-400/80"
              style="height: ${strInfo.thickness}px; top: calc(50% - ${strInfo.thickness / 2}px);"></div>`;

        for (let fret = 0; fret <= MAX_FRET; fret++) {
          const id = cellId(strInfo.stringNumber, fret);
          const inWindow = boxed && fret >= windowRange.minFret && fret <= windowRange.maxFret;
          const fretBorderClass = fret === 0
            ? 'border-r-[6px] border-r-[#e6dcc8] bg-slate-950/70'
            : 'border-r-2 border-r-[#7c8594]/70';
          const boxHighlightClass = inWindow && fret > 0 ? 'bg-amber-500/[0.06]' : '';

          // Inlay dots sit on the line between two strings
          let inlayDotHtml = '';
          if (sIdx === 2 && SINGLE_DOT_FRETS.includes(fret)) {
            inlayDotHtml = `<div class="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-amber-100/20 z-0"></div>`;
          }
          if ((sIdx === 1 || sIdx === 3) && fret === 12) {
            inlayDotHtml = `<div class="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-amber-100/25 z-0"></div>`;
          }

          const markerHtml = markerHtmlFor(neck.get(id), activeIds.has(id), 'w-7 h-7 sm:w-8 sm:h-8');
          html += `
            <div class="relative h-full flex items-center justify-center ${fretBorderClass} ${boxHighlightClass}">
              ${inlayDotHtml}
              ${fret === 0 && !markerHtml ? `<span class="relative z-20 text-[11px] font-mono text-slate-400 bg-slate-950/90 px-1.5 py-0.5 rounded">${strInfo.name}</span>` : markerHtml}
            </div>`;
        }
        html += `</div>`;
      }

      html += `</div>`;
      container.innerHTML = html;
    }

    function renderVerticalFretboard(scaleData) {
      const container = document.getElementById('verticalFretboard');
      const { neck, activeIds, windowRange } = scaleData;
      const boxed = state.shape !== 'FULL';

      // Show the active fret window (padded by 1 fret), or the whole neck
      const startFret = boxed ? Math.max(0, windowRange.minFret - 1) : 0;
      const endFret = boxed ? Math.min(MAX_FRET, windowRange.maxFret + 1) : MAX_FRET;

      // Low E on the left, high e on the right (standard chord-diagram convention)
      const verticalStrings = [...STRING_TUNING].reverse();
      const gridStyle = 'grid-template-columns: 42px repeat(6, 1fr);';

      let html = `
        <div class="grid text-center mb-1.5 items-center" style="${gridStyle}">
          <div class="text-[10px] font-mono text-slate-500 uppercase">Fret</div>
          ${verticalStrings.map(s => `<div class="text-xs font-mono font-bold text-amber-400">${s.name}</div>`).join('')}
        </div>`;

      html += `<div class="rounded-xl overflow-hidden border-2 border-amber-900/60 shadow-inner" style="background: linear-gradient(90deg, #2a1b12 0%, #1e130c 100%);">`;

      for (let fret = startFret; fret <= endFret; fret++) {
        const inWindow = boxed && fret >= windowRange.minFret && fret <= windowRange.maxFret;
        const fretRowBorder = fret === 0
          ? 'border-b-[6px] border-b-[#e6dcc8] bg-slate-950/80'
          : 'border-b-2 border-b-[#7c8594]/70';

        html += `
          <div class="grid items-center h-12 relative ${fretRowBorder} ${inWindow && fret > 0 ? 'bg-amber-500/[0.07]' : ''}" style="${gridStyle}">
            <div class="h-full flex items-center justify-center border-r border-slate-800 bg-slate-950/80 text-xs font-mono ${
              inWindow ? 'text-amber-300 font-bold' : 'text-slate-500'
            }">
              ${fret === 0 ? 'Open' : fret}
            </div>`;

        if (SINGLE_DOT_FRETS.includes(fret)) {
          html += `<div class="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-100/15 z-0" style="left: calc(42px + (100% - 42px) / 2);"></div>`;
        }
        if (fret === 12) {
          html += `<div class="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-100/20 z-0" style="left: calc(42px + (100% - 42px) / 3);"></div>`;
          html += `<div class="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-100/20 z-0" style="left: calc(42px + (100% - 42px) * 2 / 3);"></div>`;
        }

        for (const strInfo of verticalStrings) {
          const id = cellId(strInfo.stringNumber, fret);
          html += `
            <div class="relative h-full flex items-center justify-center">
              <div data-string-line="${strInfo.stringNumber}"
                class="string-line pointer-events-none absolute top-0 bottom-0 bg-gradient-to-b from-amber-200/70 to-slate-400/70 z-10"
                style="width: ${strInfo.thickness}px; left: calc(50% - ${strInfo.thickness / 2}px);"></div>
              ${markerHtmlFor(neck.get(id), activeIds.has(id), 'w-8 h-8')}
            </div>`;
        }
        html += `</div>`;
      }

      html += `</div>`;
      container.innerHTML = html;
    }

    // Moves the "playing now" highlight without rebuilding the fretboard
    function paintActiveNote() {
      document.querySelectorAll('.note-marker.is-playing').forEach(el => el.classList.remove('is-playing', 'is-held'));
      const note = state.activeNoteObj;
      if (!note) return;
      const held = state.heldId === note.id;
      document.querySelectorAll(`[data-note-cell="${note.id}"]`).forEach(el => {
        el.classList.add('is-playing');
        el.classList.toggle('is-held', held);
      });
    }

    const vibrateTimers = {};
    function vibrateString(stringNumber) {
      document.querySelectorAll(`[data-string-line="${stringNumber}"]`).forEach(el => {
        el.classList.remove('string-vibrate');
        void el.offsetWidth; // restart the CSS animation
        el.classList.add('string-vibrate');
      });
      clearTimeout(vibrateTimers[stringNumber]);
      vibrateTimers[stringNumber] = setTimeout(() => {
        document.querySelectorAll(`[data-string-line="${stringNumber}"]`).forEach(el => el.classList.remove('string-vibrate'));
      }, 420);
    }

    function renderSequenceStepsTrack() {
      const track = document.getElementById('sequenceStepsTrack');
      if (!state.sequence.length) {
        track.innerHTML = `<span class="text-xs text-slate-500">No notes in sequence</span>`;
        return;
      }
      track.innerHTML = state.sequence.map((item, idx) => {
        const badgeStyle = item.isRoot
          ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600';
        return `
          <button type="button" data-step-idx="${idx}" aria-label="Step ${idx + 1}: ${item.noteName}, string ${item.stringNumber} fret ${item.fret}"
            class="step-btn shrink-0 px-2.5 py-1.5 rounded-xl border text-xs font-mono flex flex-col items-center min-w-[46px] transition ${badgeStyle}">
            <span class="text-[10px] opacity-75">S${item.stringNumber}:F${item.fret}</span>
            <span class="font-bold">${item.noteName}</span>
          </button>`;
      }).join('');
      highlightSequenceTrackStep();
    }

    function highlightSequenceTrackStep() {
      const track = document.getElementById('sequenceStepsTrack');
      track.querySelectorAll('.step-btn.is-current').forEach(el => el.classList.remove('is-current'));
      if (state.currentStepIndex < 0) return;
      const btn = track.querySelector(`button[data-step-idx="${state.currentStepIndex}"]`);
      if (!btn) return;
      btn.classList.add('is-current');
      // Keep the current step visible (scroll only the track, never the page)
      const left = btn.offsetLeft - track.offsetLeft;
      if (left < track.scrollLeft || left + btn.offsetWidth > track.scrollLeft + track.clientWidth) {
        track.scrollLeft = Math.max(0, left - track.clientWidth / 2 + btn.offsetWidth / 2);
      }
    }

    function updateLiveNoteBanner() {
      const circle = document.getElementById('liveNoteCircle');
      const nameEl = document.getElementById('liveNoteName');
      const degEl = document.getElementById('liveNoteDegree');
      const posEl = document.getElementById('liveStringFretText');
      const freqEl = document.getElementById('liveFreqBadge');
      const circleBase = 'w-12 h-12 shrink-0 rounded-2xl flex flex-col items-center justify-center transition-colors ';
      const lit = () => {
        nameEl.className = 'text-base font-extrabold leading-none text-slate-950';
        degEl.className = 'text-[10px] font-mono text-slate-950 font-bold mt-0.5';
      };

      // Tuning reference tone
      if (state.heldId && state.heldId.startsWith('tuner-') && state.heldInfo) {
        const h = state.heldInfo;
        nameEl.textContent = h.name;
        degEl.textContent = 'Tune';
        posEl.textContent = `Holding string ${h.stringNumber} • open${state.tunerOctave ? ' (+1 octave)' : ''}`;
        freqEl.textContent = `${midiToFreq(h.midi).toFixed(1)} Hz`;
        circle.className = circleBase + 'bg-sky-400';
        lit();
        return;
      }

      if (!state.activeNoteObj) {
        nameEl.textContent = cachedScaleData ? cachedScaleData.degreeNames[0] : '--';
        nameEl.className = 'text-base font-extrabold text-white leading-none';
        degEl.textContent = 'Root';
        degEl.className = 'text-[10px] font-mono text-amber-400 mt-0.5';
        posEl.textContent = state.holdMode ? 'Tap a note to hold it' : 'Tap a note or press Play';
        freqEl.textContent = 'Ready';
        circle.className = circleBase + 'bg-slate-800';
        return;
      }

      const n = state.activeNoteObj;
      nameEl.textContent = n.noteName;
      degEl.textContent = n.degreeLabel;
      posEl.textContent = `${state.heldId === n.id ? 'Holding • ' : ''}String ${n.stringNumber} • Fret ${n.fret === 0 ? 'open' : n.fret}`;
      freqEl.textContent = `${midiToFreq(n.midi).toFixed(1)} Hz`;
      circle.className = circleBase + (n.isRoot ? 'bg-rose-500' : 'bg-sky-400');
      lit();
    }

    function isVerticalLayout() {
      if (state.orientation === 'vertical') return true;
      if (state.orientation === 'horizontal') return false;
      return window.innerWidth < 640; // Auto: vertical on narrow phone viewports
    }

    function updateResponsiveOrientation() {
      const useVertical = isVerticalLayout();
      document.getElementById('horizontalFretboardWrapper').classList.toggle('hidden', useVertical);
      document.getElementById('verticalFretboardWrapper').classList.toggle('hidden', !useVertical);
    }

    // On small screens the horizontal neck scrolls sideways — bring the active shape into view
    function scrollShapeIntoView() {
      const wrap = document.getElementById('horizontalFretboardWrapper');
      if (!cachedScaleData || wrap.classList.contains('hidden') || wrap.scrollWidth <= wrap.clientWidth) return;
      if (state.shape === 'FULL') { wrap.scrollLeft = 0; return; }
      const first = wrap.querySelector(`[data-fret-head="${cachedScaleData.windowRange.minFret}"]`);
      const last = wrap.querySelector(`[data-fret-head="${cachedScaleData.windowRange.maxFret}"]`);
      if (!first || !last) return;
      const center = (first.offsetLeft + last.offsetLeft + last.offsetWidth) / 2;
      wrap.scrollLeft = Math.max(0, center - wrap.clientWidth / 2);
    }

    let cachedScaleData = null;

    function renderFretboardsOnly() {
      if (!cachedScaleData) cachedScaleData = getScaleData();
      renderHorizontalFretboard(cachedScaleData);
      renderVerticalFretboard(cachedScaleData);
      paintActiveNote();
    }

    function updateAllUI() {
      cachedScaleData = getScaleData();
      state.sequence = buildPracticeSequence(cachedScaleData.sortedUniquePitch);
      paintControls();

      const { scaleObj, degreeNames, pcName, windowRange } = cachedScaleData;
      const parentPc = getParentMajorRoot(state.keyRoot, state.scale);
      const parentMajor = pcName[parentPc] || (/b/.test(degreeNames[0]) ? NAMES_FLAT : NAMES_SHARP)[parentPc];
      document.getElementById('headerSummaryBadge').textContent =
        `${degreeNames[0]} ${scaleObj.name} • ${SHAPE_LABELS[state.shape] || state.shape}`;
      document.getElementById('relativeMajorHint').textContent =
        !DIATONIC.includes(state.scale) ? `Positions of ${parentMajor} major`
          : scaleObj.parentOffset === 0 ? `Shapes of ${parentMajor} major` : `Parent Major: ${parentMajor}`;
      document.getElementById('modeFormulaBadge').textContent = scaleObj.degrees.join(' ');

      let spanText = `Frets ${windowRange.minFret}–${windowRange.maxFret}`;
      if ((state.scale === 'min_pent' || state.scale === 'blues') && MINOR_PENT_BOX[state.shape]) {
        spanText += ` • Box ${MINOR_PENT_BOX[state.shape]}`;
      }
      document.getElementById('fretSpanBadge').textContent = spanText;
      document.getElementById('sequenceCountBadge').textContent = `${state.sequence.length} notes`;

      const patternSelect = document.getElementById('selectPattern');
      const selectedPatternText = (patternSelect.options[patternSelect.selectedIndex] || {}).text || 'Pattern';
      document.getElementById('patternNameLabel').textContent = selectedPatternText.replace(/^[^:]+:\s*/, '');
      document.getElementById('scaleNotesSummary').textContent = degreeNames.join(' - ');

      updateResponsiveOrientation();
      renderFretboardsOnly();
      renderSequenceStepsTrack();
      updateLiveNoteBanner();
      scrollShapeIntoView();
      saveSettings();
    }

    /********************************************************************
     * SEQUENCER & PLAYBACK ENGINE
     * Notes are scheduled slightly ahead on the audio clock, so the rhythm
     * stays tight even when the browser is busy drawing.
     ********************************************************************/
    const LOOKAHEAD_SEC = 0.12;
    const SCHEDULER_INTERVAL_MS = 25;
    let schedulerTimer = null;
    let nextNoteTime = 0;
    let nextStepToSchedule = 0;
    let beatStepCounter = 0;
    let pendingVisualTimers = [];
    let pendingSources = [];

    function getStepIntervalSec() {
      return 60 / state.tempo / state.subdivision;
    }

    function setTempoValue(val) {
      const clamped = Math.max(40, Math.min(240, Math.round(val)));
      state.tempo = clamped;
      document.getElementById('sliderTempo').value = String(clamped);
      document.getElementById('tempoReadout').textContent = String(clamped);
      saveSettings();
    }

    // Updates everything on screen for the note that is sounding
    function showStep(index, noteObj) {
      state.currentStepIndex = index;
      state.activeNoteObj = noteObj;
      updateLiveNoteBanner();
      paintActiveNote();
      vibrateString(noteObj.stringNumber);
      highlightSequenceTrackStep();
    }

    /* ---- Hold: keep a note ringing (for tuning or ear training) ---- */
    function releaseHold() {
      if (!state.heldId && !drone) return;
      stopDrone();
      state.heldId = null;
      state.heldInfo = null;
      paintActiveNote();
      paintTunerButtons();
      updateLiveNoteBanner();
    }

    // Pluck the note, then keep it sounding until released
    function holdPitch(id, midi, stringNumber, info) {
      playGuitarNote(midi, 1.2, false, 0, stringNumber);
      startDrone(midi);
      state.heldId = id;
      state.heldInfo = info || null;
    }

    function toggleTunerString(stringNumber) {
      const id = 'tuner-' + stringNumber;
      if (state.isPlaying) pausePlayback();
      if (state.heldId === id) { releaseHold(); return; }
      const strInfo = STRING_TUNING[stringNumber - 1];
      const midi = strInfo.midi + (state.tunerOctave ? 12 : 0);
      state.activeNoteObj = null;
      state.currentStepIndex = -1;
      holdPitch(id, midi, stringNumber, { stringNumber, midi, name: strInfo.name.toUpperCase() });
      paintActiveNote();
      highlightSequenceTrackStep();
      paintTunerButtons();
      updateLiveNoteBanner();
      vibrateString(stringNumber);
    }

    // Plays one step immediately (manual stepping / clicking a step)
    function triggerSequenceStep(index) {
      if (!state.sequence.length) return;
      const len = state.sequence.length;
      const idx = ((index % len) + len) % len;
      const noteObj = state.sequence[idx];
      if (state.holdMode) {
        holdPitch(noteObj.id, noteObj.midi, noteObj.stringNumber);
        paintTunerButtons();
      } else {
        playGuitarNote(noteObj.midi, 1.3, noteObj.isRoot, 0, noteObj.stringNumber);
      }
      showStep(idx, noteObj);
    }

    function clearPendingPlayback() {
      pendingVisualTimers.forEach(t => clearTimeout(t));
      pendingVisualTimers = [];
      if (audioCtx) {
        const now = audioCtx.currentTime;
        pendingSources.forEach(p => {
          if (p.when > now) {
            try { p.src.stop(); } catch (err) { /* already stopped */ }
          }
        });
      }
      pendingSources = [];
    }

    function schedulerTick() {
      if (!state.isPlaying || !audioCtx) return;
      // If the tab was in the background, don't try to catch up on missed notes
      if (nextNoteTime < audioCtx.currentTime - 0.2) {
        nextNoteTime = audioCtx.currentTime + 0.05;
      }
      while (state.isPlaying && nextNoteTime < audioCtx.currentTime + LOOKAHEAD_SEC) {
        const len = state.sequence.length;
        if (!len) { stopPlayback(); return; }

        if (nextStepToSchedule >= len) {
          if (!state.loop) {
            // Let the last note ring for one step, then stop
            const delayMs = Math.max(0, (nextNoteTime - audioCtx.currentTime) * 1000);
            pendingVisualTimers.push(setTimeout(stopPlayback, delayMs));
            clearInterval(schedulerTimer);
            schedulerTimer = null;
            return;
          }
          nextStepToSchedule = 0;
          if (state.speedTrainer > 0 && state.tempo < 240) {
            setTempoValue(state.tempo + state.speedTrainer);
          }
        }

        const idx = nextStepToSchedule;
        const noteObj = state.sequence[idx];
        const when = nextNoteTime;
        const stepSec = getStepIntervalSec();

        const src = playGuitarNote(noteObj.midi, Math.max(0.9, stepSec * 2.5), noteObj.isRoot, when, noteObj.stringNumber);
        if (src) pendingSources.push({ src, when });
        if (state.metronome && beatStepCounter % state.subdivision === 0) {
          playMetronomeClick((beatStepCounter / state.subdivision) % 4 === 0, when);
        }
        const delayMs = Math.max(0, (when - audioCtx.currentTime) * 1000);
        pendingVisualTimers.push(setTimeout(() => {
          if (state.isPlaying) showStep(idx, noteObj);
        }, delayMs));

        // Keep the bookkeeping lists short
        if (pendingSources.length > 16) pendingSources.splice(0, pendingSources.length - 16);
        if (pendingVisualTimers.length > 32) pendingVisualTimers.splice(0, pendingVisualTimers.length - 32);

        beatStepCounter++;
        nextStepToSchedule = idx + 1;
        nextNoteTime += stepSec;
      }
    }

    function startPlayback() {
      if (!state.sequence.length || state.isPlaying) return;
      releaseHold();
      const ctx = ensureAudioContext();
      state.isPlaying = true;
      updateTransportButtonsUI();

      nextStepToSchedule = state.currentStepIndex < 0 || state.currentStepIndex >= state.sequence.length
        ? 0
        : state.currentStepIndex;
      beatStepCounter = 0;

      if (!ctx) {
        // No Web Audio support: still animate the pattern silently
        let silentIdx = nextStepToSchedule;
        const tick = () => {
          if (!state.isPlaying) return;
          if (silentIdx >= state.sequence.length) {
            if (!state.loop) { stopPlayback(); return; }
            silentIdx = 0;
          }
          showStep(silentIdx, state.sequence[silentIdx]);
          silentIdx++;
          schedulerTimer = setTimeout(tick, getStepIntervalSec() * 1000);
        };
        tick();
        return;
      }

      nextNoteTime = ctx.currentTime + 0.06;
      schedulerTick();
      if (state.isPlaying && !schedulerTimer) {
        schedulerTimer = setInterval(schedulerTick, SCHEDULER_INTERVAL_MS);
      }
    }

    function haltScheduler() {
      state.isPlaying = false;
      if (schedulerTimer) {
        clearInterval(schedulerTimer);
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
      }
      clearPendingPlayback();
    }

    // NOTE: the Android wrapper calls pausePlayback() when the app goes to the background.
    function pausePlayback() {
      haltScheduler();
      releaseHold();
      updateTransportButtonsUI();
    }

    function stopPlayback() {
      haltScheduler();
      stopDrone();
      state.heldId = null;
      state.heldInfo = null;
      paintTunerButtons();
      state.currentStepIndex = -1;
      state.activeNoteObj = null;
      updateTransportButtonsUI();
      updateLiveNoteBanner();
      paintActiveNote();
      highlightSequenceTrackStep();
    }

    function resetSequenceStepOnConfigChange() {
      // A held fretboard note may not exist in the new scale/shape; a tuner string is unaffected
      if (state.heldId && !state.heldId.startsWith('tuner-')) {
        stopDrone();
        state.heldId = null;
      }
      state.currentStepIndex = -1;
      state.activeNoteObj = null;
      if (state.isPlaying) {
        // Restart the new pattern from its first note on the next step
        clearPendingPlayback();
        nextStepToSchedule = 0;
        beatStepCounter = 0;
        if (audioCtx) nextNoteTime = Math.max(nextNoteTime, audioCtx.currentTime + 0.05);
      }
    }

    function updateTransportButtonsUI() {
      const btnPlay = document.getElementById('btnPlayToggle');
      document.getElementById('iconPlay').classList.toggle('hidden', state.isPlaying);
      document.getElementById('iconPause').classList.toggle('hidden', !state.isPlaying);
      btnPlay.setAttribute('aria-label', state.isPlaying ? 'Pause' : 'Play');
      btnPlay.className = 'w-16 h-16 rounded-full flex items-center justify-center text-slate-950 shadow-lg active:scale-95 transition '
        + (state.isPlaying ? 'bg-sky-400 shadow-sky-400/25' : 'bg-amber-500 shadow-amber-500/25');
    }

    function stepBy(delta) {
      if (!state.sequence.length) return;
      pausePlayback();
      const len = state.sequence.length;
      const from = state.currentStepIndex < 0 ? (delta > 0 ? -1 : 0) : state.currentStepIndex;
      triggerSequenceStep(from + delta + len);
    }

    /********************************************************************
     * EVENT LISTENERS & INITIALIZATION
     ********************************************************************/
    function applyConfigChange() {
      resetSequenceStepOnConfigChange();
      updateAllUI();
    }

    // One click listener per container (event delegation) instead of one per button
    function onButtonClick(containerId, attr, handler) {
      document.getElementById(containerId).addEventListener('click', (e) => {
        const btn = e.target.closest(`button[${attr}]`);
        if (btn) handler(btn.getAttribute(attr), btn);
      });
    }

    function onFretboardNoteClick(id) {
      const note = cachedScaleData && cachedScaleData.neck.get(id);
      if (!note) return;
      const stepIdx = state.sequence.findIndex(n => n.id === id);

      if (state.holdMode) {
        if (state.isPlaying) pausePlayback();
        if (state.heldId === id) { releaseHold(); return; }
        state.activeNoteObj = note;
        if (stepIdx !== -1) state.currentStepIndex = stepIdx;
        holdPitch(id, note.midi, note.stringNumber);
        paintTunerButtons();
      } else {
        state.activeNoteObj = note;
        if (!state.isPlaying && stepIdx !== -1) state.currentStepIndex = stepIdx;
        playGuitarNote(note.midi, 1.3, note.isRoot, 0, note.stringNumber);
      }
      updateLiveNoteBanner();
      paintActiveNote();
      vibrateString(note.stringNumber);
      highlightSequenceTrackStep();
    }

    function initEventListeners() {
      // Transport
      document.getElementById('btnPlayToggle').addEventListener('click', () => {
        if (state.isPlaying) pausePlayback();
        else startPlayback();
      });
      document.getElementById('btnStop').addEventListener('click', stopPlayback);
      document.getElementById('btnStepPrev').addEventListener('click', () => stepBy(-1));
      document.getElementById('btnStepNext').addEventListener('click', () => stepBy(1));

      document.getElementById('btnLoopToggle').addEventListener('click', () => {
        state.loop = !state.loop;
        paintControls();
        saveSettings();
      });
      document.getElementById('btnMetronomeToggle').addEventListener('click', () => {
        state.metronome = !state.metronome;
        paintControls();
        saveSettings();
      });

      // Key / shape / pattern buttons
      onButtonClick('keyButtonsContainer', 'data-key-id', (val) => {
        state.keyRoot = parseInt(val, 10);
        applyConfigChange();
      });
      onButtonClick('shapeButtonsContainer', 'data-shape-id', (val) => {
        state.shape = val;
        applyConfigChange();
      });
      onButtonClick('quickPatternButtons', 'data-pat-id', (val) => {
        state.pattern = val;
        applyConfigChange();
      });

      // Selects
      document.getElementById('selectMode').addEventListener('change', (e) => {
        state.scale = e.target.value;
        applyConfigChange();
      });
      document.getElementById('selectPositionVariant').addEventListener('change', (e) => {
        state.shape = e.target.value;
        applyConfigChange();
      });
      document.getElementById('selectPattern').addEventListener('change', (e) => {
        state.pattern = e.target.value;
        applyConfigChange();
      });

      // Tempo
      document.getElementById('sliderTempo').addEventListener('input', (e) => {
        setTempoValue(parseInt(e.target.value, 10));
      });
      document.getElementById('btnTempoDown').addEventListener('click', () => setTempoValue(state.tempo - 5));
      document.getElementById('btnTempoUp').addEventListener('click', () => setTempoValue(state.tempo + 5));

      document.getElementById('btnTapTempo').addEventListener('click', () => {
        const now = performance.now();
        const last = state.tapTimestamps[state.tapTimestamps.length - 1];
        if (last && now - last > 2000) state.tapTimestamps = []; // a long gap starts a new count
        state.tapTimestamps.push(now);
        if (state.tapTimestamps.length > 6) state.tapTimestamps.shift();
        if (state.tapTimestamps.length >= 2) {
          const first = state.tapTimestamps[0];
          const avgMs = (now - first) / (state.tapTimestamps.length - 1);
          setTempoValue(60000 / avgMs);
        }
      });

      document.getElementById('selectSubdivision').addEventListener('change', (e) => {
        state.subdivision = parseInt(e.target.value, 10) || 2;
        beatStepCounter = 0;
        saveSettings();
      });
      document.getElementById('selectSpeedTrainer').addEventListener('change', (e) => {
        state.speedTrainer = parseInt(e.target.value, 10) || 0;
        saveSettings();
      });

      // Marker labels / layout
      onButtonClick('labelModeGroup', 'data-label-mode', (val) => {
        state.labelMode = val;
        paintControls();
        renderFretboardsOnly();
        saveSettings();
      });
      onButtonClick('orientationGroup', 'data-orient', (val) => {
        state.orientation = val;
        paintControls();
        updateResponsiveOrientation();
        scrollShapeIntoView();
        saveSettings();
      });

      document.getElementById('btnHoldToggle').addEventListener('click', () => {
        state.holdMode = !state.holdMode;
        if (!state.holdMode) releaseHold();
        paintControls();
        updateLiveNoteBanner();
        saveSettings();
      });
      onButtonClick('tunerButtons', 'data-tuner-string', (val) => toggleTunerString(parseInt(val, 10)));
      document.getElementById('chkTunerOctave').addEventListener('change', (e) => {
        state.tunerOctave = e.target.checked;
        if (state.heldId && state.heldId.startsWith('tuner-')) {
          const stringNumber = parseInt(state.heldId.slice(6), 10);
          releaseHold();
          toggleTunerString(stringNumber);
        }
        saveSettings();
      });
      onButtonClick('tabBar', 'data-tab', (val) => {
        state.activeTab = val;
        paintControls();
        saveSettings();
      });

      document.getElementById('btnGhostNotes').addEventListener('change', (e) => {
        state.showGhostNotes = e.target.checked;
        paintControls();
        renderFretboardsOnly();
        saveSettings();
      });

      // Sound
      document.getElementById('selectToneType').addEventListener('change', (e) => {
        state.toneType = e.target.value;
        pluckCache.clear();
        applyToneToGraph();
        saveSettings();
      });
      document.getElementById('sliderVolume').addEventListener('input', (e) => {
        state.volume = Math.max(0, Math.min(1, parseInt(e.target.value, 10) / 100));
        if (masterGain && audioCtx) masterGain.gain.setTargetAtTime(state.volume, audioCtx.currentTime, 0.02);
        saveSettings();
      });

      // Fretboards and step track
      onButtonClick('horizontalFretboard', 'data-note-cell', onFretboardNoteClick);
      onButtonClick('verticalFretboard', 'data-note-cell', onFretboardNoteClick);
      onButtonClick('sequenceStepsTrack', 'data-step-idx', (val) => {
        const idx = parseInt(val, 10);
        if (state.isPlaying) {
          clearPendingPlayback();
          nextStepToSchedule = idx;
          if (audioCtx) nextNoteTime = audioCtx.currentTime + 0.03;
        } else {
          triggerSequenceStep(idx);
        }
      });

      // Keyboard shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const tag = e.target && e.target.tagName;
        if ((tag === 'INPUT' && e.target.type !== 'checkbox') || tag === 'SELECT' || tag === 'TEXTAREA') return;
        if (e.code === 'Space') {
          if (tag === 'BUTTON') return; // let Space press the focused button
          e.preventDefault();
          if (state.isPlaying) pausePlayback();
          else startPlayback();
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          stepBy(1);
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          stepBy(-1);
        } else if (e.code === 'ArrowUp') {
          e.preventDefault();
          setTempoValue(state.tempo + 5);
        } else if (e.code === 'ArrowDown') {
          e.preventDefault();
          setTempoValue(state.tempo - 5);
        }
      });

      window.addEventListener('resize', () => {
        if (state.orientation === 'auto') updateResponsiveOrientation();
      });
    }

    function syncFormControlsFromState() {
      document.getElementById('sliderTempo').value = String(state.tempo);
      document.getElementById('tempoReadout').textContent = String(state.tempo);
      document.getElementById('selectSubdivision').value = String(state.subdivision);
      document.getElementById('selectSpeedTrainer').value = String(state.speedTrainer);
      document.getElementById('selectToneType').value = state.toneType;
      document.getElementById('sliderVolume').value = String(Math.round(state.volume * 100));
      const patternSelect = document.getElementById('selectPattern');
      if (![...patternSelect.options].some(o => o.value === state.pattern)) state.pattern = 'asc_desc';
    }

    window.addEventListener('DOMContentLoaded', () => {
      loadSettings();
      buildControlButtons();
      syncFormControlsFromState();
      initEventListeners();
      updateAllUI();
    });
