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
          if (d.windowRange.maxFret - d.windowRange.minFret > 7) problems.push(tag + ': span too wide');
          if (notes.some(n => !n.finger)) problems.push(tag + ': missing finger');
        } else if (shape !== 'FULL') {
          if (seven && perString.some(c => c < 2 || c > 3)) problems.push(tag + ': per-string ' + perString);
          if (seven && new Set(notes.map(n => n.midi)).size !== notes.length) problems.push(tag + ': unison duplicate');
          if (d.windowRange.maxFret - d.windowRange.minFret > 4) problems.push(tag + ': span ' + JSON.stringify(d.windowRange));
          if (!notes.some(n => n.isRoot)) problems.push(tag + ': no root');
        }
        for (const pattern of patterns) {
          state.pattern = pattern;
          const seq = buildPracticeSequence(d.sortedUniquePitch);
          if (!seq.length || seq.some(n => !n)) problems.push(tag + ' ' + pattern + ': bad sequence');
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
  label: document.getElementById('playLabel').textContent
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

// 6. Settings persist across reloads
await page.reload();
check(await page.evaluate(() => state.scale === 'min_pent' && state.keyRoot === 3 && state.labelMode === 'finger' && !state.showGhostNotes), 'settings persisted');
check((await page.textContent('#btnGhostNotes')).includes('Off'), 'ghost label restored');
await page.evaluate(() => { localStorage.clear(); });

// 7. Phone layout
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
phone.on('pageerror', e => errors.push('phone: ' + e.message));
await phone.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await phone.goto(url);
check(await phone.evaluate(() => !document.getElementById('verticalFretboardWrapper').classList.contains('hidden')), 'phone uses vertical neck');
check(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'phone: no sideways page scroll');
await phone.tap('[data-orient="horizontal"]');
await phone.selectOption('#selectPositionVariant', 'A');
await phone.evaluate(() => { state.keyRoot = 4; applyConfigChange(); });
check(await phone.evaluate(() => document.getElementById('horizontalFretboardWrapper').scrollLeft > 100), 'horizontal neck scrolls to the shape');
if (shotDir) {
  await phone.screenshot({ path: join(shotDir, 'phone-horizontal.png'), fullPage: true });
  await phone.tap('[data-orient="auto"]');
  await phone.tap('#btnPlayToggle');
  await phone.waitForTimeout(700);
  await phone.screenshot({ path: join(shotDir, 'phone-vertical.png'), fullPage: true });
}

check(errors.length === 0, 'page errors: ' + errors.join(' | '));
await browser.close();
console.log(failures ? `${failures} check(s) failed` : 'all checks passed');
process.exit(failures ? 1 : 0);
