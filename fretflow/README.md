# FretFlow / McFretsky — guitar scale trainer

One source, two outputs:

| Output | File | Use |
| --- | --- | --- |
| Web (FretFlow) | `dist/web/index.html` | Paste the whole file into the Google Sites **Embed → Embed code** box |
| Android (McFretsky) | `android/app/src/main/assets/index.html` | Bundled by the WebView wrapper in `android/` (run `build_apk.bat`) |

Both are single self-contained files — the Tailwind CSS is compiled in, so nothing is
downloaded at runtime and the Android app works fully offline (it no longer needs the
INTERNET permission).

## Editing

Edit `src/index.html` (markup + styles) and `src/app.js` (logic), then:

```
npm install      # once
npm run build    # regenerates both output files
npm test         # build + headless-browser checks (needs Playwright + Chromium)
```

`__APP_NAME__` in the source is replaced with the product name for each output.

The Android wrapper calls the page's global `pausePlayback()` when the app is backgrounded —
keep that function name.
