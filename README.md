# T-Rex Runner

A rebuild of the dinosaur game Chrome shows when you have no internet. Endless,
offline, and pre-built — there is nothing to compile, install, or download at
runtime.

The whole game is **one file**: `index.html`. Open it and play.

---

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

## Play it on Android

**With a home-screen icon (recommended).** Publish it once with the included
GitHub Pages workflow — enable it under *Settings → Pages → Source: GitHub
Actions*, and every push to `main` deploys the game. Open the resulting URL in
Chrome on your phone, then *menu → Add to Home screen*. It launches full-screen
from the icon after that, and the service worker keeps it playable in airplane
mode.

**Without any hosting.** Copy `index.html` to the phone (cable, Drive, email —
anything) and open it with Chrome from a file manager. It plays exactly the
same; you just don't get the app icon.

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
| `manifest.webmanifest` | Lets Android install it as a real app. Icons are embedded as data URIs, so there are no binary files in the repo. |
| `sw.js` | Service worker that caches the page so a hosted copy works offline. |
| `.github/workflows/pages.yml` | Optional GitHub Pages deploy. |

`sw.js` and the manifest only matter when the game is served over http(s).
Opened straight from disk it is already local, and browsers don't register
service workers on `file://` anyway.
