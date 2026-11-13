    /********************************************************************
     * MUSIC THEORY & GUITAR FRETBOARD ENGINE
     ********************************************************************/
    const MAX_FRET = 17;
    const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
    const SETTINGS_KEY = 'fretTrainer.settings.v2';

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
      blues:      { name: 'Blues',            parentOffset: -9,  intervals: [0, 3, 5, 6, 7, 10],    degrees: ['1', 'b3', '4', 'b5', '5', 'b7'],         chordIdx: [0, 1, 4, 5] }
    };

    // CAGED windows: fret offsets from the parent major root on the 6th string
    const CAGED_OFFSETS = {
      E: [-1, 3],
      D: [1, 5],
      C: [4, 7],
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
      // --- runtime only (not saved) ---
      isPlaying: false,
      currentStepIndex: -1,
      activeNoteObj: null,
      sequence: [],
      tapTimestamps: []
    };
    const PERSISTED_KEYS = ['keyRoot', 'scale', 'shape', 'pattern', 'tempo', 'subdivision', 'speedTrainer',
      'labelMode', 'orientation', 'showGhostNotes', 'toneType', 'volume', 'loop', 'metronome'];

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

    let audioCtx = null;
    let masterGain = null;
    const pluckCache = new Map();

    function ensureAudioContext() {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = state.volume;
        const limiter = audioCtx.createDynamicsCompressor();
        limiter.threshold.value = -14;
        limiter.knee.value = 10;
        limiter.ratio.value = 4;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.2;
        masterGain.connect(limiter);
        limiter.connect(audioCtx.destination);
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
    function playGuitarNote(midi, durationSec, isRoot, when) {
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
      filter.Q.value = 0.6;

      const gain = ctx.createGain();
      const releaseAt = startAt + Math.max(durationSec || 0.45, 0.3);
      gain.gain.setValueAtTime(isRoot ? 0.5 : 0.4, startAt);
      gain.gain.setTargetAtTime(0, releaseAt, 0.09);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      src.start(startAt);
      src.stop(releaseAt + 0.6);
      return src;
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
      gain.gain.linearRampToValueAtTime(isAccent ? 0.3 : 0.18, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      osc.connect(gain);
      gain.connect(masterGain);
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
      const cells = []; // { id, finger }
      for (let s = 0; s < 6; s++) {
        const strInfo = STRING_TUNING[5 - s];
        const frets = [0, 1, 2].map(k => pitches[s * 3 + k] - strInfo.midi);
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
        activeShapeNotes = [...neck.values()].filter(n => n.fret >= win.minFret && n.fret <= win.maxFret);
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

    // Up through the list, then back down without repeating the turnaround notes
    function pendulum(list) {
      if (list.length <= 2) return [...list];
      return [...list, ...list.slice(1, list.length - 1).reverse()];
    }

    // Build ordered practice sequence from sortedUniquePitch according to selected pattern
    function buildPracticeSequence(sortedNotes) {
      if (!sortedNotes || sortedNotes.length === 0) return [];
      const pat = state.pattern;
      const n = sortedNotes.length;
      const chordIdx = SCALES[state.scale].chordIdx;

      if (pat === 'ascending') return [...sortedNotes];
      if (pat === 'descending') return [...sortedNotes].reverse();
      if (pat === 'asc_desc') return pendulum(sortedNotes);
      if (pat === 'arpeggio_7') {
        return pendulum(sortedNotes.filter(item => chordIdx.includes(item.scaleDegreeIndex)));
      }
      if (pat === 'arpeggio_triad') {
        const triad = chordIdx.slice(0, 3);
        return pendulum(sortedNotes.filter(item => triad.includes(item.scaleDegreeIndex)));
      }
      if (pat === 'thirds' || pat === 'seq_3' || pat === 'seq_4') {
        // Each group is a list of offsets from the starting note
        const offsets = pat === 'thirds' ? [0, 2] : pat === 'seq_3' ? [0, 1, 2] : [0, 1, 2, 3];
        const reach = offsets[offsets.length - 1];
        if (n <= reach) return pendulum(sortedNotes);
        const seq = [];
        for (let i = 0; i + reach < n; i++) {
          offsets.forEach(o => seq.push(sortedNotes[i + o]));
        }
        for (let i = n - 1; i - reach >= 0; i--) {
          offsets.forEach(o => seq.push(sortedNotes[i - o]));
        }
        return seq;
      }
      if (pat === 'pedal_root') {
        const rootNote = sortedNotes.find(item => item.isRoot) || sortedNotes[0];
        const seq = [];
        for (const item of sortedNotes) {
          if (item.id !== rootNote.id) seq.push(rootNote, item);
        }
        return seq.length ? seq : [...sortedNotes];
      }
      return [...sortedNotes];
    }

    /********************************************************************
     * UI RENDERING
     ********************************************************************/
    const BTN_STYLES = {
      key: {
        base: 'py-1.5 px-1 rounded-lg text-xs font-bold transition border ',
        on: 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20',
        off: 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
      },
      shape: {
        base: 'py-1.5 px-2 rounded-lg text-xs font-bold transition border ',
        on: 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20',
        off: 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
      },
      pattern: {
        base: 'py-1 px-2 rounded-lg text-[11px] font-semibold transition border truncate ',
        on: 'bg-purple-500 text-slate-950 border-purple-400 font-bold',
        off: 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
      },
      segment: {
        base: 'px-2 py-1 rounded-md text-[11px] font-semibold ',
        on: 'bg-amber-500 text-slate-950',
        off: 'text-slate-400 hover:text-white'
      }
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
      loopBtn.className = state.loop
        ? 'px-2.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold transition'
        : 'px-2.5 py-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold transition';
      loopBtn.setAttribute('aria-pressed', String(state.loop));

      const clickBtn = document.getElementById('btnMetronomeToggle');
      clickBtn.textContent = state.metronome ? '⏱ Click: On' : '⏱ Click: Off';
      clickBtn.className = state.metronome
        ? 'px-2.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition'
        : 'px-2.5 py-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition';
      clickBtn.setAttribute('aria-pressed', String(state.metronome));

      const ghostBtn = document.getElementById('btnGhostNotes');
      ghostBtn.textContent = state.showGhostNotes ? '👻 Ghost Notes: On' : '👻 Ghost Notes: Off';
      ghostBtn.setAttribute('aria-pressed', String(state.showGhostNotes));
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
      document.querySelectorAll('.note-marker.is-playing').forEach(el => el.classList.remove('is-playing'));
      const note = state.activeNoteObj;
      if (!note) return;
      document.querySelectorAll(`[data-note-cell="${note.id}"]`).forEach(el => el.classList.add('is-playing'));
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

      if (!state.activeNoteObj) {
        nameEl.textContent = cachedScaleData ? cachedScaleData.degreeNames[0] : '--';
        degEl.textContent = 'Root';
        degEl.className = 'text-[10px] font-mono text-amber-400 mt-0.5';
        posEl.textContent = 'Tap any note marker or press Play';
        freqEl.textContent = 'Ready';
        circle.className = 'w-12 h-12 rounded-2xl bg-slate-800 border-2 border-slate-700 flex flex-col items-center justify-center transition-all';
        return;
      }

      const n = state.activeNoteObj;
      nameEl.textContent = n.noteName;
      degEl.textContent = `Deg ${n.degreeLabel}`;
      degEl.className = 'text-[10px] font-mono text-slate-950 font-bold mt-0.5';
      posEl.textContent = `String ${n.stringNumber} (${STRING_TUNING[n.stringNumber - 1].name}) • Fret ${n.fret}`;
      freqEl.textContent = `${midiToFreq(n.midi).toFixed(1)} Hz`;
      circle.className = n.isRoot
        ? 'w-12 h-12 rounded-2xl bg-rose-500 border-2 border-white flex flex-col items-center justify-center shadow-lg shadow-rose-500/30 text-slate-950 transition-all'
        : 'w-12 h-12 rounded-2xl bg-sky-500 border-2 border-white flex flex-col items-center justify-center shadow-lg shadow-sky-400/30 text-slate-950 transition-all';
      nameEl.className = 'text-base font-extrabold leading-none text-slate-950';
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
      const parentMajor = pcName[getParentMajorRoot(state.keyRoot, state.scale)];
      document.getElementById('headerSummaryBadge').textContent =
        `${degreeNames[0]} ${scaleObj.name} • ${SHAPE_LABELS[state.shape] || state.shape}`;
      document.getElementById('relativeMajorHint').textContent =
        scaleObj.parentOffset === 0 ? `Shapes of ${parentMajor} major` : `Parent Major: ${parentMajor}`;
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
      document.getElementById('scaleNotesSummary').textContent = `Scale Notes: ${degreeNames.join(' - ')}`;

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

    // Plays one step immediately (manual stepping / clicking a step)
    function triggerSequenceStep(index) {
      if (!state.sequence.length) return;
      const len = state.sequence.length;
      const idx = ((index % len) + len) % len;
      const noteObj = state.sequence[idx];
      playGuitarNote(noteObj.midi, 0.6, noteObj.isRoot);
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

        const src = playGuitarNote(noteObj.midi, Math.max(0.3, stepSec * 1.1), noteObj.isRoot, when);
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
      updateTransportButtonsUI();
    }

    function stopPlayback() {
      haltScheduler();
      state.currentStepIndex = -1;
      state.activeNoteObj = null;
      updateTransportButtonsUI();
      updateLiveNoteBanner();
      paintActiveNote();
      highlightSequenceTrackStep();
    }

    function resetSequenceStepOnConfigChange() {
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
      const playIcon = document.getElementById('playIcon');
      const playLabel = document.getElementById('playLabel');

      if (state.isPlaying) {
        playIcon.textContent = '⏸';
        playLabel.textContent = 'Pause';
        btnPlay.className = 'flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-lg shadow-sky-400/25 transition active:scale-95';
      } else {
        playIcon.textContent = '▶';
        playLabel.textContent = 'Play';
        btnPlay.className = 'flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95';
      }
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
      state.activeNoteObj = note;
      const stepIdx = state.sequence.findIndex(n => n.id === id);
      if (!state.isPlaying && stepIdx !== -1) state.currentStepIndex = stepIdx;
      playGuitarNote(note.midi, 0.7, note.isRoot);
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

      document.getElementById('btnGhostNotes').addEventListener('click', () => {
        state.showGhostNotes = !state.showGhostNotes;
        paintControls();
        renderFretboardsOnly();
        saveSettings();
      });

      // Sound
      document.getElementById('selectToneType').addEventListener('change', (e) => {
        state.toneType = e.target.value;
        pluckCache.clear();
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
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
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
