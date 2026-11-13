// Builds self-contained single-file pages (no CDN needed at runtime):
//   dist/web/index.html                      -> "FretFlow", paste into the Google Sites embed
//   android/app/src/main/assets/index.html   -> "Fretsky", bundled in the Android app (fully offline)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, 'src/index.html'), 'utf8');
const js = readFileSync(join(root, 'src/app.js'), 'utf8');

const cssIn = join(root, 'node_modules/.tailwind-input.css');
writeFileSync(cssIn, '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
const bin = join(root, 'node_modules/.bin/tailwindcss');
const css = execFileSync(bin, ['-c', join(root, 'tailwind.config.js'), '-i', cssIn, '--minify'], {
  cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']
});

// Fonts load without blocking the first paint; the page falls back to system fonts.
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap';
const webFonts = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  `<link rel="stylesheet" href="${FONT_URL}" media="print" onload="this.media='all'">`
].join('\n  ');

function render(appName, fonts) {
  if (js.includes('</script')) throw new Error('app.js must not contain a closing script tag');
  return html
    .replace('<!--FONTS-->', () => fonts)
    .replace('<!--TAILWIND-->', () => `<style>${css.trim()}</style>`)
    .replace('<!--APP_JS-->', () => `<script>\n${js}  </script>`)
    .replaceAll('__APP_NAME__', appName);
}

const targets = [
  ['dist/web/index.html', render('FretFlow', webFonts)],
  // The Android build makes no network requests at all (no INTERNET permission needed)
  ['android/app/src/main/assets/index.html', render('Fretsky', '')]
];
for (const [rel, out] of targets) {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, out);
  console.log(`${rel}  ${(out.length / 1024).toFixed(1)} KB`);
}
