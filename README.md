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

Then visit <http://localhost:8000>.

## Controls

- **Start / Pause / Resume** button, or press <kbd>Space</kbd>
- **Reset**, or press <kbd>R</kbd>
- The first click is also what unlocks browser audio and speech.

The app asks for a screen wake lock while a workout is running (where supported) so the display stays on.

## How it is built

- `index.html` — layout and controls
- `styles.css` — dark, responsive UI
- `app.js` — workout timeline, combo generator, speech, and synthesized bell

Speech uses the browser's **Web Speech API** (`speechSynthesis`), so the voice depends on the voices installed on your device. The bell is synthesized with the **Web Audio API**; there are no audio files or network requests.

The workout is defined by the `PHASES` array at the top of `app.js`. Change the `duration` values there (in seconds) to alter the round and rest lengths; the timer, progress bar, and total automatically follow.
