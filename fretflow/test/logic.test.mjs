// Headless-browser checks for the built page. Run with: npm test
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(join(root, 'dist/web/index.html')).href;
const shotDir = process.env.SHOT_DIR;

let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.log('FAIL', msg); } };

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto(url);

// 1. Note spelling
const spell = await page.evaluate(() => ({
  ebMajor: spellScale(3, SCALES.ionian).join(' '),
  fSharpMajor: spellScale(6, SCALES.ionian).join(' '),
  dbMajor: spellScale(1, SCALES.ionian).join(' '),
  cSharpMinor: spellScale(1, SCALES.aeolian).join(' '),
  bbDorian: spellScale(10, SCALES.dorian).join(' '),
  aBlues: spellScale(9, SCALES.blues).join(' '),
  fLydian: spellScale(5, SCALES.lydian).join(' ')
}));
check(spell.ebMajor === 'Eb F G Ab Bb C D', 'Eb major: ' + spell.ebMajor);
check(spell.fSharpMajor === 'F# G# A# B C# D# E#', 'F# major: ' + spell.fSharpMajor);
check(spell.dbMajor === 'Db Eb F Gb Ab Bb C', 'Db major: ' + spell.dbMajor);
check(spell.cSharpMinor === 'C# D# E F# G# A B', 'C# minor: ' + spell.cSharpMinor);
check(spell.bbDorian === 'Bb C Db Eb F G Ab', 'Bb dorian: ' + spell.bbDorian);
check(spell.aBlues === 'A C D Eb E G', 'A blues: ' + spell.aBlues);
check(spell.fLydian === 'F G A B C D E', 'F lydian: ' + spell.fLydian);

// 2. Every key x scale x shape x pattern produces a sane shape and sequence
const sweep = await page.evaluate(() => {
  const problems = [];
  let combos = 0;
  const shapes = Object.keys(SHAPE_LABELS);
  const patterns = [...document.getElementById('selectPattern').options].map(o => o.value);
  for (let key = 0; key < 12; key++) {
    for (const scale of Object.keys(SCALES)) {
      for (const shape of shapes) {
        const seven = SCALES[scale].intervals.length === 7;
        if (shape.startsWith('3NPS_') && !seven) continue;
        state.keyRoot = key; state.scale = scale; state.shape = shape;
        const d = getScaleData();
        const tag = `key ${key} ${scale} ${shape}`;
        combos++;
        const notes = d.activeShapeNotes;
        if (!notes.length) { problems.push(tag + ': empty'); continue; }
        if (notes.some(n => n.fret < 0 || n.fret > MAX_FRET)) problems.push(tag + ': fret out of range');
        if (notes.some(n => !d.scalePitchClasses.includes(n.midi % 12))) problems.push(tag + ': note outside scale');
        if (notes.some(n => /##|bb/.test(n.noteName))) problems.push(tag + ': double accidental');
        const perString = [1, 2, 3, 4, 5, 6].map(s => notes.filter(n => n.stringNumber === s).length);
        const pcs = new Set(notes.map(n => n.pitchClass));
        if (pcs.size !== d.scalePitchClasses.length) problems.push(tag + ': shape misses scale tones');
        if (shape.startsWith('3NPS_')) {
          if (perString.some(c => c !== 3)) problems.push(tag + ': not 3 per string ' + perString);
          if (new Set(notes.map(n => n.midi)).size !== 18) problems.push(tag + ': duplicate pitches');
          if (d.windowRange.maxFret - d.windowRange.minFret > (DIATONIC.includes(scale) ? 7 : 8)) problems.push(tag + ': span too wide');
          if (notes.some(n => !n.finger)) problems.push(tag + ': missing finger');
        } else if (shape !== 'FULL') {
          if (seven && DIATONIC.includes(scale) && perString.some(c => c < 2 || c > 3)) problems.push(tag + ': per-string ' + perString);
          if (new Set(notes.map(n => n.midi)).size !== notes.length) problems.push(tag + ': unison duplicate');
          if (d.windowRange.maxFret - d.windowRange.minFret > 4) problems.push(tag + ': span ' + JSON.stringify(d.windowRange));
          if (!notes.some(n => n.isRoot)) problems.push(tag + ': no root');
        }
        for (const pattern of patterns) {
          state.pattern = pattern;
          const seq = buildPracticeSequence(d.sortedUniquePitch);
          if (!seq.length || seq.some(n => !n)) problems.push(tag + ' ' + pattern + ': bad sequence');
          else if (!seq[0].isRoot || !seq[seq.length - 1].isRoot) problems.push(tag + ' ' + pattern + ': must start and end on the root');
          else if (pattern === 'asc_desc' && new Set(seq.map(n => n.id)).size !== d.sortedUniquePitch.length) problems.push(tag + ': pendulum must visit every note');
        }
      }
    }
  }
  state.keyRoot = 0; state.scale = 'ionian'; state.shape = 'E'; state.pattern = 'asc_desc';
  updateAllUI();
  return { combos, problems };
});
check(sweep.problems.length === 0, `${sweep.problems.length} shape problems, e.g. ${sweep.problems.slice(0, 8).join(' | ')}`);
console.log(`shape sweep: ${sweep.combos} combinations`);

// C major E-shape: starts on C (not the B below it), touches that B on the way back, ends on C
const cRun = await page.evaluate(() => state.sequence.map(n => n.noteName + n.midi).join(' '));
check(cRun.startsWith('C48 D50 E52') && cRun.endsWith('D50 C48 B47 C48'), 'C major run: ' + cRun);
const spellX = await page.evaluate(() => [spellScale(9, SCALES.harm_minor).join(' '), spellScale(4, SCALES.phryg_dom).join(' '), spellScale(0, SCALES.whole_tone).join(' ')]);
check(spellX[0] === 'A B C D E F G#' && spellX[1] === 'E F G# A B C D' && spellX[2] === 'C D E F# G# Bb', 'exotic spelling: ' + spellX.join(' | '));

// 3. Known shapes
const known = await page.evaluate(() => {
  const ids = (key, scale, shape) => {
    state.keyRoot = key; state.scale = scale; state.shape = shape;
    return getScaleData().activeShapeNotes.map(n => n.id).sort().join(' ');
  };
  const out = {
    cMajor3nps: ids(0, 'ionian', '3NPS_1'),
    aMinPentBox1: ids(9, 'min_pent', 'G'),
    cMajorE: ids(0, 'ionian', 'E')
  };
  state.keyRoot = 0; state.scale = 'ionian'; state.shape = 'E';
  updateAllUI();
  return out;
});
const sortIds = s => s.split(' ').sort().join(' ');
check(known.cMajor3nps === sortIds('s6-f8 s6-f10 s6-f12 s5-f8 s5-f10 s5-f12 s4-f9 s4-f10 s4-f12 s3-f9 s3-f10 s3-f12 s2-f10 s2-f12 s2-f13 s1-f10 s1-f12 s1-f13'), 'C major 3NPS: ' + known.cMajor3nps);
check(known.aMinPentBox1 === sortIds('s6-f5 s6-f8 s5-f5 s5-f7 s4-f5 s4-f7 s3-f5 s3-f7 s2-f5 s2-f8 s1-f5 s1-f8'), 'A minor pentatonic box 1: ' + known.aMinPentBox1);
check(known.cMajorE === sortIds('s6-f7 s6-f8 s6-f10 s5-f7 s5-f8 s5-f10 s4-f7 s4-f9 s4-f10 s3-f7 s3-f9 s3-f10 s2-f8 s2-f10 s1-f7 s1-f8 s1-f10'), 'C major E-shape: ' + known.cMajorE);

// 4. Synth is in tune and not silent (autocorrelation pitch estimate)
const tuning = await page.evaluate(() => {
  const worst = { cents: 0 };
  for (const tone of Object.keys(TONES)) {
    for (const midi of [40, 52, 64, 76, 81]) {
      const sr = 48000;
      const { data, rate } = synthPluck(sr, midi, tone);
      const target = midiToFreq(midi);
      const start = 2000, win = 8192;
      let best = 0, bestLag = 0;
      const lo = Math.floor(sr / (target / rate * 1.06)), hi = Math.ceil(sr / (target / rate * 0.94));
      const corr = lag => { let s = 0; for (let i = start; i < start + win; i++) s += data[i] * data[i + lag]; return s; };
      for (let lag = lo; lag <= hi; lag++) { const c = corr(lag); if (c > best) { best = c; bestLag = lag; } }
      // parabolic interpolation for sub-sample accuracy
      const a = corr(bestLag - 1), b = corr(bestLag), c = corr(bestLag + 1);
      const lag = bestLag + 0.5 * (a - c) / (a - 2 * b + c);
      const cents = 1200 * Math.log2((sr / lag) * rate / target);
      let peak = 0, rms = 0;
      for (let i = 0; i < data.length; i++) { peak = Math.max(peak, Math.abs(data[i])); }
      for (let i = 0; i < 4800; i++) rms += data[i] * data[i];
      rms = Math.sqrt(rms / 4800);
      if (Math.abs(cents) > Math.abs(worst.cents)) Object.assign(worst, { cents, tone, midi });
      if (!(peak > 0.3 && peak <= 1.0001) || !(rms > 0.05) || data.some(Number.isNaN)) worst.bad = `${tone} ${midi} peak ${peak} rms ${rms}`;
    }
  }
  return worst;
});
check(Math.abs(tuning.cents) < 3, 'tuning off by ' + JSON.stringify(tuning));
check(!tuning.bad, 'bad level: ' + tuning.bad);
console.log('worst tuning error (cents):', tuning.cents.toFixed(2));

// 5. Playback advances in time with the audio clock
await page.click('#btnMetronomeToggle');
await page.selectOption('#selectSubdivision', '2');
await page.click('#btnPlayToggle');
await page.waitForTimeout(3050); // 100 BPM eighths = 300 ms per step
const playing = await page.evaluate(() => ({
  idx: state.currentStepIndex, isPlaying: state.isPlaying, ctx: audioCtx && audioCtx.state,
  lit: document.querySelectorAll('#horizontalFretboard .note-marker.is-playing').length,
  current: document.querySelectorAll('.step-btn.is-current').length,
  label: document.getElementById('btnPlayToggle').getAttribute('aria-label')
}));
check(playing.isPlaying && playing.label === 'Pause', 'not playing ' + JSON.stringify(playing));
check(playing.idx >= 9 && playing.idx <= 10, 'step timing drifted: ' + JSON.stringify(playing));
check(playing.lit === 1 && playing.current === 1, 'highlight count ' + JSON.stringify(playing));
if (shotDir) await page.screenshot({ path: join(shotDir, 'desktop-playing.png'), fullPage: true });

// Changing key mid-playback restarts cleanly; pause/stop work
await page.click('[data-key-id="3"]');
await page.waitForTimeout(500);
check(await page.evaluate(() => state.isPlaying && state.currentStepIndex >= 0 && state.currentStepIndex <= 2), 'restart after key change');
check((await page.textContent('#headerSummaryBadge')).trim() === 'Eb Ionian (Major) • E-Shape', 'badge: ' + await page.textContent('#headerSummaryBadge'));
check((await page.textContent('#scaleNotesSummary')).includes('Eb - F - G - Ab - Bb - C - D'), 'scale summary');
await page.evaluate(() => pausePlayback()); // what the Android wrapper calls
check(await page.evaluate(() => !state.isPlaying), 'pausePlayback');
await page.keyboard.press('ArrowRight');
const afterStep = await page.evaluate(() => state.currentStepIndex);
await page.keyboard.press('ArrowLeft');
check(await page.evaluate(() => state.currentStepIndex) === afterStep - 1, 'arrow stepping');
await page.click('#btnStop');
check(await page.evaluate(() => state.currentStepIndex === -1 && !document.querySelector('.is-playing')), 'stop resets');

// Non-looping run ends by itself
await page.click('#btnLoopToggle');
await page.selectOption('#selectPattern', 'arpeggio_triad');
await page.evaluate(() => setTempoValue(240));
await page.selectOption('#selectSubdivision', '4');
await page.click('#btnPlayToggle');
await page.waitForTimeout(1800);
check(await page.evaluate(() => !state.isPlaying && state.currentStepIndex === -1), 'non-loop run should stop on its own');

// Speed trainer raises the tempo on each loop
await page.click('#btnLoopToggle');
await page.selectOption('#selectSpeedTrainer', '5');
await page.evaluate(() => setTempoValue(200));
await page.click('#btnPlayToggle');
await page.waitForTimeout(1500);
check(await page.evaluate(() => state.tempo > 200), 'speed trainer');
await page.click('#btnStop');

// Clicking a fretboard note, label modes, ghost toggle, pentatonic disables 3NPS
await page.click('#horizontalFretboard [data-note-cell]');
check(await page.evaluate(() => !!state.activeNoteObj && document.querySelectorAll('#horizontalFretboard .is-playing').length === 1), 'note click');
await page.click('[data-label-mode="finger"]');
check(/^[1-4O]$/.test((await page.textContent('#horizontalFretboard .note-marker.shadow-md')).trim()), 'finger labels');
const before = await page.locator('#horizontalFretboard .note-marker').count();
await page.click('#btnGhostNotes');
check(await page.locator('#horizontalFretboard .note-marker').count() < before, 'ghost toggle');
await page.selectOption('#selectPositionVariant', '3NPS_4');
await page.selectOption('#selectMode', 'min_pent');
check(await page.evaluate(() => state.shape === 'E' && document.getElementById('optgroup3nps').disabled), '3NPS fallback for pentatonic');

// Hold mode and tuning reference
await page.selectOption('#selectMode', 'ionian');
await page.click('#btnHoldToggle');
await page.click('#horizontalFretboard [data-note-cell="s6-f11"]');
check(await page.evaluate(() => state.heldId === 's6-f11' && !!drone && document.querySelectorAll('#horizontalFretboard .is-held').length === 1), 'hold a fretboard note');
check((await page.textContent('#liveStringFretText')).startsWith('Holding'), 'hold banner');
await page.keyboard.press('ArrowRight');
check(await page.evaluate(() => !!drone && state.heldId === state.activeNoteObj.id && state.heldId !== 's6-f11'), 'stepping moves the held note');
await page.click(`#horizontalFretboard [data-note-cell="${await page.evaluate(() => state.heldId)}"]`);
check(await page.evaluate(() => !drone && state.heldId === null), 'tapping the held note releases it');
await page.click('[data-tuner-string="5"]');
check(await page.evaluate(() => state.heldId === 'tuner-5' && drone && drone.midi === 45 && Math.abs(drone.osc.frequency.value - 110) < 0.01), 'tuner holds A = 110 Hz');
check(await page.evaluate(() => document.querySelector('[data-tuner-string="5"]').getAttribute('aria-pressed') === 'true'), 'tuner button lit');
await page.click('#chkTunerOctave');
check(await page.evaluate(() => drone && drone.midi === 57), 'tuner octave up');
await page.click('#chkTunerOctave');
if (shotDir) await page.screenshot({ path: join(shotDir, 'desktop-tuner.png'), fullPage: true });
await page.click('#btnPlayToggle');
check(await page.evaluate(() => state.isPlaying && !drone && state.heldId === null), 'play releases the hold');
await page.click('[data-tuner-string="6"]');
check(await page.evaluate(() => !state.isPlaying && state.heldId === 'tuner-6'), 'tuner pauses playback');
await page.evaluate(() => pausePlayback());
check(await page.evaluate(() => !drone), 'backgrounding the app silences the held note');
await page.click('#btnHoldToggle');

// Rendered audio: no clipping, no silence, steady reference tone
const audio = await page.evaluate(async () => {
  const sr = 48000;
  const stats = (buf, from, to) => {
    const d = buf.getChannelData(0);
    let peak = 0, sum = 0, bad = false;
    for (let i = Math.floor(from * sr); i < Math.floor(to * sr); i++) {
      const v = d[i];
      if (!Number.isFinite(v)) bad = true;
      peak = Math.max(peak, Math.abs(v)); sum += v * v;
    }
    return { peak, rms: Math.sqrt(sum / ((to - from) * sr)), bad };
  };
  const useOffline = (seconds) => {
    const off = new OfflineAudioContext(2, sr * seconds, sr);
    off.resume = async () => {};
    audioCtx = off; pluckCache.clear();
    setupAudioGraph(off);
    return off;
  };
  const out = {};
  for (const tone of Object.keys(TONES)) {
    state.toneType = tone; state.volume = 1;
    // Worst case: fastest sixteenth run over the whole neck with the click on
    let off = useOffline(6);
    state.shape = 'FULL'; state.pattern = 'asc_desc';
    const seq = buildPracticeSequence(getScaleData().sortedUniquePitch);
    const step = 60 / 240 / 4;
    let t = 0.05;
    for (let i = 0; t < 5; i++, t += step) {
      const n = seq[i % seq.length];
      playGuitarNote(n.midi, Math.max(0.9, step * 2.5), n.isRoot, t, n.stringNumber);
      if (i % 4 === 0) playMetronomeClick(i % 16 === 0, t);
    }
    out[tone + '_fast'] = stats(await off.startRendering(), 0.5, 5);
    // A single quiet-ish case: one high note and one low note
    off = useOffline(3);
    playGuitarNote(40, 1.3, false, 0.1, 6);
    playGuitarNote(81, 1.3, false, 1.5, 1);
    const single = await off.startRendering();
    out[tone + '_low'] = stats(single, 0.1, 0.6);
    out[tone + '_high'] = stats(single, 1.5, 2.0);
  }
  // Held reference tone: level must be steady and the pitch exact
  const off = useOffline(4);
  startDrone(45);
  const d = (await off.startRendering()).getChannelData(0);
  const windows = [];
  for (let w = 0; w < 6; w++) { let s2 = 0; for (let i = 0; i < sr / 2; i++) { const v = d[sr + w * sr / 2 + i]; s2 += v * v; } windows.push(Math.sqrt(s2 / (sr / 2))); }
  let best = 0, bestF = 0;
  for (let f = 109; f <= 111; f += 0.002) {
    let re = 0, im = 0; const wv = 2 * Math.PI * f / sr;
    for (let i = 0; i < sr * 2; i += 4) { const h = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (sr * 2)); re += h * d[sr + i] * Math.cos(wv * i); im += h * d[sr + i] * Math.sin(wv * i); }
    const m = re * re + im * im; if (m > best) { best = m; bestF = f; }
  }
  out.drone = { min: Math.min(...windows), max: Math.max(...windows), cents: 1200 * Math.log2(bestF / 110) };
  audioCtx = null; masterGain = null; noteBus = null; bodyEq = null; drone = null; pluckCache.clear();
  state.toneType = 'acoustic'; state.volume = 0.8; state.shape = 'E';
  updateAllUI();
  return out;
});
for (const [name, a] of Object.entries(audio)) {
  if (name === 'drone') continue;
  check(!a.bad && a.peak < 0.99, `${name}: clipping or bad samples ${JSON.stringify(a)}`);
  check(a.rms > 0.02 && a.peak > 0.12, `${name}: too quiet ${JSON.stringify(a)}`);
}
check(audio.drone.max / audio.drone.min < 1.02 && audio.drone.min > 0.03, 'drone level unsteady ' + JSON.stringify(audio.drone));
check(Math.abs(audio.drone.cents) < 0.5, 'drone pitch ' + audio.drone.cents);
console.log('audio levels:', Object.entries(audio).map(([k, a]) => k === 'drone' ? `drone rms ${a.min.toFixed(3)} (${a.cents.toFixed(2)} cents)` : `${k} peak ${a.peak.toFixed(2)} rms ${a.rms.toFixed(3)}`).join(' | '));

// 6. Settings persist across reloads
await page.reload();
await page.selectOption('#selectMode', 'min_pent');
await page.evaluate(() => { state.keyRoot = 3; state.showGhostNotes = false; state.labelMode = 'finger'; applyConfigChange(); });
await page.reload();
check(await page.evaluate(() => state.scale === 'min_pent' && state.keyRoot === 3 && state.labelMode === 'finger' && !state.showGhostNotes), 'settings persisted');
check(await page.evaluate(() => document.getElementById('btnGhostNotes').checked === false), 'ghost toggle restored');
await page.evaluate(() => { localStorage.clear(); });

// 7. Phone layout
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
phone.on('pageerror', e => errors.push('phone: ' + e.message));
await phone.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await phone.goto(url);
check(await phone.evaluate(() => !document.getElementById('verticalFretboardWrapper').classList.contains('hidden')), 'phone uses vertical neck');
check(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'phone: no sideways page scroll');
check(await phone.evaluate(() => getComputedStyle(document.querySelector('[data-panel="view"]')).display === 'none' && getComputedStyle(document.querySelector('[data-panel="key"]')).display !== 'none'), 'phone shows one settings panel');
await phone.tap('[data-tab="view"]');
await phone.tap('[data-orient="horizontal"]');
await phone.tap('[data-tab="shape"]');
await phone.selectOption('#selectPositionVariant', 'A');
await phone.evaluate(() => { state.keyRoot = 4; applyConfigChange(); });
check(await phone.evaluate(() => document.getElementById('horizontalFretboardWrapper').scrollLeft > 100), 'horizontal neck scrolls to the shape');
if (shotDir) {
  await phone.screenshot({ path: join(shotDir, 'phone-horizontal.png') });
  await phone.tap('[data-tab="view"]');
  await phone.tap('[data-orient="auto"]');
  await phone.tap('[data-tab="tuner"]');
  await phone.screenshot({ path: join(shotDir, 'phone-tuner.png') });
  await phone.tap('[data-tab="key"]');
  await phone.tap('#btnPlayToggle');
  await phone.waitForTimeout(700);
  await phone.screenshot({ path: join(shotDir, 'phone-vertical.png') });
}

check(errors.length === 0, 'page errors: ' + errors.join(' | '));
await browser.close();
console.log(failures ? `${failures} check(s) failed` : 'all checks passed');
process.exit(failures ? 1 : 0);
