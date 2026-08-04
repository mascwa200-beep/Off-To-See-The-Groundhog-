# T-Rex Runner

A rebuild of the dinosaur game Chrome shows when you have no internet. Endless,
offline, and pre-built — there is nothing to compile, install, or download at
runtime.

The whole game is **one file**: `index.html`. Open it and play.

---

## Download a built app

| Platform | Download | How to run it |
|---|---|---|
| **Android** | [`dist/TRexRunner.apk`](dist/TRexRunner.apk) — in this repo, ~38 KB | Copy to the phone and tap it. Allow "install unknown apps" when prompted. |
| **Windows** | `TRexRunner-windows-x64.zip` on the [Releases page](../../releases) | Unzip anywhere, run `TRexRunner.exe`. Portable — no installer, no admin rights. |
| **Linux** | `TRexRunner-linux-x64.zip` on the [Releases page](../../releases) | Unzip, run `./TRexRunner`. |

None of them need an internet connection, an account, or a runtime installed
first. The Android app requests **no permissions at all**.

Windows will likely show a SmartScreen warning the first time, because the
binary isn't signed with a paid code-signing certificate — *More info → Run
anyway*. The APK is signed, but with a throwaway key committed to this repo
(`android/keystore/`), so Android will also ask you to confirm the install.
That key is deliberately not a secret: it exists so anyone can rebuild an APK
that installs cleanly over the released one.

## Or just open the file

No download needed. `index.html` **is** the game — double-click it and it runs
in any browser, online or offline. The apps above are that same file in a
window of its own.

## Play it on a PC

Download the repo and double-click `index.html`. That's the entire process — no
web server, no Node, no internet connection. Every sprite, sound and line of
logic is inside that one file.

| Key | Action |
|---|---|
| `Space` / `↑` | Jump — hold for a higher jump, tap for a short hop |
| `↓` | Duck (and drop faster if you're mid-jump) |
| `Space` / `Enter` | Restart after a crash |
| `M` | Mute |
| `F11` | Fullscreen (desktop app only) |

## Play it on Android

**The APK** is the easiest route — see the table above.

**As a web app instead.** Publish it once with the included GitHub Pages
workflow — enable it under *Settings → Pages → Source: GitHub Actions*, and
every push to `main` deploys the game. Open the resulting URL in Chrome on your
phone, then *menu → Add to Home screen*. It launches full-screen from the icon
and the service worker keeps it playable in airplane mode.

**Without any hosting.** Copy `index.html` to the phone and open it with Chrome
from a file manager.

| Gesture | Action |
|---|---|
| Tap the upper part of the strip | Jump — hold for a higher jump |
| Hold low on the strip | Duck |
| Tap after a crash | Restart |

## What's faithful about it

The physics and rules are Chromium's `runner.js` numbers, not approximations:
gravity `0.6`, initial jump velocity `-10`, starting speed `6` accelerating by
`0.001` per frame to a cap of `13`, a score of `distance × 0.025`, cactus groups
of one to three, no more than two of the same obstacle in a row, pterodactyls
only once you pass speed `8.5`, and night mode every 700 points with the moon
cycling through seven phases.

Collision uses the original's two-pass scheme: a cheap bounding-box test first,
then per-sprite collision boxes — six on the dinosaur, two or three on each
obstacle, swapped for a flatter set while ducking.

The game world is always 600×150 and the display scales around it, so a desktop
monitor and a phone run identical physics rather than the phone getting a
slower, smaller variant.

## What's different

- **The artwork is hand-drawn, not Google's.** Every sprite is authored as pixel
  data inside `index.html` (`'#'` for a pixel, `'.'` for a hole) and painted into
  an offscreen atlas at startup. No image files, and no copied assets.
- **The sounds are synthesised** with three WebAudio oscillator blips instead of
  bundled audio files.
- **It's deliberately non-modular.** One scope, one script tag, no imports, no
  bundler, no minification. Readability and self-containment were the goal;
  file size was explicitly not.

## Files

| File | What it's for |
|---|---|
| `index.html` | The game. Everything is in here. |
| `dist/TRexRunner.apk` | The built Android app, ready to install. |
| `android/` | The APK project: a WebView wrapper that loads `index.html` from assets. |
| `desktop/` | The desktop app: an Electron shell around the same file. `npm install && npm run build` produces the Windows and Linux bundles. |
| `manifest.webmanifest` | Lets Android install the *web* version as an app. Icons are embedded as data URIs, so there are no binary files in the repo. |
| `sw.js` | Service worker that caches the page so a hosted copy works offline. |
| `.github/workflows/release.yml` | Builds the APK and desktop bundles and attaches them to a Release. |
| `.github/workflows/pages.yml` | Optional GitHub Pages deploy. |

`index.html` is the single source of truth: both the APK and the desktop app
copy it in at build time rather than keeping their own version of it.

`sw.js` and the manifest only matter when the game is served over http(s).
Opened straight from disk it is already local, and browsers don't register
service workers on `file://` anyway.

## Rebuilding the apps yourself

**APK** — needs a JDK and the Android SDK:

```
cd android && ./gradlew assembleRelease
# -> app/build/outputs/apk/release/app-release.apk
```

**Desktop** — needs Node. Builds Windows and Linux from any host, including
from Linux for Windows (the `.exe` icon and version info are patched in with
`resedit`, so no wine is required):

```
cd desktop && npm install && npm run build
# -> desktop/build/dist/TRexRunner-{windows,linux}-x64.zip
```
