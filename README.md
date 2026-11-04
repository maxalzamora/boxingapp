# Six Count

A small boxing round timer that calls punch combinations out loud while you train.

## The workout

- 3 rounds of **3:00** work
- **0:30** rest between rounds
- Voice calls **"Round 1"**, random 2–4 punch combinations during the round, **"Rest"**, and **"Workout complete"** at the end
- Punch numbers: **1** jab, **2** cross, **3** lead hook, **4** rear hook, **5** lead uppercut, **6** rear uppercut

Combinations are called every **6 seconds** by default. Use the 4s / 6s / 8s buttons to change the cadence. Voice cues and the ring bell can be toggled separately. Settings are saved in `localStorage`.

## Run it

No build step or dependencies. Open `index.html` directly, or serve the folder:

```sh
cd /home/boxingapp
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. Serving over HTTP or HTTPS is recommended so the home-screen app and offline cache can work.

## Controls

- **Start / Pause / Resume** button, or press <kbd>Space</kbd>
- **Reset**, or press <kbd>R</kbd>
- **Fullscreen** button in the top-right corner
- The first click is also what unlocks browser audio and speech.

## Mobile and fullscreen

- Use the fullscreen button for an immersive browser view. On supported browsers the app exits fullscreen with the same button.
- The screen wake lock is held whenever a workout is running, when the app is in fullscreen, or when it is launched from the home screen. Leaving fullscreen while the timer is stopped releases it.
- Browsers without the Screen Wake Lock API show a short warning when fullscreen is entered.
- On iPhone and iPad, Safari does not expose the Fullscreen API. Tap **Share → Add to Home Screen** instead; the installed app launches in standalone mode.
- The web app manifest, Apple standalone metadata, and service worker make the app installable and allow it to run offline after the first visit.

## How it is built

- `index.html` — layout, metadata, and controls
- `styles.css` — dark, responsive UI with safe-area support
- `app.js` — workout timeline, combo generator, speech, synthesized bell, fullscreen, and wake lock
- `manifest.webmanifest` — home-screen app metadata
- `sw.js` — offline cache
- `icons/` — app and home-screen icons

Speech uses the browser's **Web Speech API** (`speechSynthesis`), so the voice depends on the voices installed on your device. The bell is synthesized with the **Web Audio API**; there are no audio files or network requests.

The workout is defined by the `PHASES` array at the top of `app.js`. Change the `duration` values there (in seconds) to alter the round and rest lengths; the timer, progress bar, and total automatically follow.

When changing any cached asset, bump `CACHE_NAME` in `sw.js` so installed copies pick up the update.
