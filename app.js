/* Six Count — audio-cued boxing rounds */
(() => {
  "use strict";

  const PHASES = [
    { type: "round", round: 1, duration: 180 },
    { type: "rest", round: 1, duration: 30 },
    { type: "round", round: 2, duration: 180 },
    { type: "rest", round: 2, duration: 30 },
    { type: "round", round: 3, duration: 180 },
  ];
  const ROUNDS = 3;
  const TICK_MS = 100;
  const FIRST_COMBO_DELAY = 2.8;
  const PREFS_KEY = "six-count-prefs-v1";
  const NUMBER_WORDS = ["", "one", "two", "three", "four", "five", "six"];
  const PUNCH_WEIGHTS = { 1: 3, 2: 3, 3: 2, 4: 2, 5: 1.4, 6: 1.4 };

  const starts = [];
  let totalDuration = 0;
  for (const phase of PHASES) {
    starts.push(totalDuration);
    totalDuration += phase.duration;
  }

  const prefs = loadPrefs();
  const state = {
    status: "idle", // idle | running | paused | done
    index: 0,
    elapsed: 0, // seconds banked while paused / between ticks
    startedAt: 0,
    nextComboAt: Infinity,
    lastCombo: [],
  };

  const el = {
    stage: document.getElementById("stage"),
    statusPill: document.getElementById("statusPill"),
    statusText: document.getElementById("statusText"),
    timerMeta: document.getElementById("timerMeta"),
    timerTime: document.getElementById("timerTime"),
    timerSub: document.getElementById("timerSub"),
    ringProgress: document.getElementById("ringProgress"),
    comboLabel: document.getElementById("comboLabel"),
    comboChips: document.getElementById("comboChips"),
    startBtn: document.getElementById("startBtn"),
    startLabel: document.getElementById("startLabel"),
    iconPlay: document.querySelector(".icon-play"),
    iconPause: document.querySelector(".icon-pause"),
    resetBtn: document.getElementById("resetBtn"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),
    iconExpand: document.querySelector(".icon-expand"),
    iconCompress: document.querySelector(".icon-compress"),
    toast: document.getElementById("toast"),
    voiceToggle: document.getElementById("voiceToggle"),
    bellToggle: document.getElementById("bellToggle"),
    voiceHint: document.getElementById("voiceHint"),
    paceValue: document.getElementById("paceValue"),
    timelineTrack: document.getElementById("timelineTrack"),
    timelineLabels: document.getElementById("timelineLabels"),
    timelineTotal: document.getElementById("timelineTotal"),
  };

  const segments = [];
  const timelineLabelEls = [];
  const pendingTimeouts = new Set();
  let cachedVoice = null;
  let audioCtx = null;
  let masterGain = null;
  let wakeLock = null;
  let toastTimer = 0;

  const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  const reducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };
  const standaloneQuery = window.matchMedia
    ? window.matchMedia("(display-mode: standalone)")
    : null;

  /* ---------- preferences ---------- */

  function loadPrefs() {
    const defaults = { pace: 6, voice: true, bell: true };
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return defaults;
      const saved = JSON.parse(raw);
      return {
        pace: [4, 6, 8].includes(saved.pace) ? saved.pace : defaults.pace,
        voice: typeof saved.voice === "boolean" ? saved.voice : defaults.voice,
        bell: typeof saved.bell === "boolean" ? saved.bell : defaults.bell,
      };
    } catch {
      return defaults;
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* storage may be unavailable — settings just won't persist */
    }
  }

  /* ---------- scheduling & time ---------- */

  function schedule(fn, delay) {
    const id = window.setTimeout(() => {
      pendingTimeouts.delete(id);
      fn();
    }, delay);
    pendingTimeouts.add(id);
    return id;
  }

  function clearScheduled() {
    for (const id of pendingTimeouts) window.clearTimeout(id);
    pendingTimeouts.clear();
  }

  function globalElapsed() {
    if (state.status !== "running") return state.elapsed;
    return state.elapsed + (performance.now() - state.startedAt) / 1000;
  }

  function phaseIndexAt(time) {
    if (time >= totalDuration) return PHASES.length - 1;
    for (let i = PHASES.length - 1; i >= 0; i--) {
      if (time >= starts[i]) return i;
    }
    return 0;
  }

  function formatTime(seconds) {
    const whole = Math.max(0, Math.ceil(seconds - 1e-9));
    const minutes = Math.floor(whole / 60);
    return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
  }

  /* ---------- combo generation ---------- */

  function weightedPunch(exclude) {
    let pool = [];
    let weightTotal = 0;
    for (let n = 1; n <= 6; n += 1) {
      if (n === exclude) continue;
      pool.push({ n, weight: PUNCH_WEIGHTS[n] });
      weightTotal += PUNCH_WEIGHTS[n];
    }
    let roll = Math.random() * weightTotal;
    for (const item of pool) {
      roll -= item.weight;
      if (roll <= 0) return item.n;
    }
    return pool[pool.length - 1].n;
  }

  function generateCombo() {
    const lengths = [2, 2, 3, 3, 3, 4, 4];
    const length = lengths[Math.floor(Math.random() * lengths.length)];
    let combo = [];

    for (let attempt = 0; attempt < 8; attempt += 1) {
      combo = [];
      for (let i = 0; i < length; i += 1) {
        const previous = combo[i - 1];
        if (i === 0 && Math.random() < 0.45) {
          combo.push(1);
        } else if (previous && Math.random() < 0.1) {
          combo.push(previous);
        } else {
          combo.push(weightedPunch(previous));
        }
      }
      if (combo.join("-") !== state.lastCombo.join("-")) break;
    }
    return combo;
  }

  /* ---------- speech ---------- */

  function pickVoice() {
    if (!synth) return null;
    if (cachedVoice) return cachedVoice;
    const voices = synth.getVoices();
    if (!voices.length) return null;
    const english = voices.filter((voice) => /^en[-_]/i.test(voice.lang));
    const preferred = [
      /Google US English/i,
      /Samantha/i,
      /Aria/i,
      /Jenny/i,
      /Guy/i,
      /Daniel/i,
      /Alex/i,
      /Microsoft .*English/i,
      /English/i,
    ];
    for (const pattern of preferred) {
      const match = english.find((voice) => pattern.test(voice.name));
      if (match) {
        cachedVoice = match;
        return match;
      }
    }
    cachedVoice = english.find((voice) => voice.localService) || english[0] || voices[0];
    return cachedVoice;
  }

  function utter(text, { rate = 0.95, pitch = 0.9 } = {}) {
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice ? voice.lang : "en-US";
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;
    synth.speak(utterance);
  }

  function speak(text, options = {}) {
    if (!synth || !prefs.voice) return;
    if (options.interrupt !== false && (synth.speaking || synth.pending)) {
      synth.cancel();
    }
    utter(text, options);
  }

  function cancelSpeech() {
    if (synth && (synth.speaking || synth.pending)) synth.cancel();
  }

  /* ---------- bell ---------- */

  function ensureAudio() {
    try {
      if (!audioCtx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return;
        audioCtx = new AudioCtor();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(audioCtx.destination);
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
    } catch {
      audioCtx = null;
      masterGain = null;
    }
  }

  function strikeBell(when) {
    const partials = [
      { freq: 1046.5, amp: 0.42, decay: 1.15 },
      { freq: 2093, amp: 0.11, decay: 0.7 },
      { freq: 3135, amp: 0.045, decay: 0.45 },
      { freq: 523.25, amp: 0.14, decay: 1.35 },
    ];
    for (const { freq, amp, decay } of partials) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, when);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(amp, when + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + decay);
      osc.connect(gain).connect(masterGain);
      osc.start(when);
      osc.stop(when + decay + 0.03);
    }
  }

  function playBell(times = 1) {
    if (!prefs.bell) return;
    ensureAudio();
    if (!audioCtx || !masterGain) return;
    const now = audioCtx.currentTime + 0.03;
    for (let i = 0; i < times; i += 1) {
      strikeBell(now + i * 0.36);
    }
  }

  /* ---------- workout flow ---------- */

  function beginPhase(index, options = {}) {
    state.index = index;
    state.lastCombo = [];
    renderCombo();

    const phase = PHASES[index];
    if (phase.type === "round") {
      state.nextComboAt = starts[index] + FIRST_COMBO_DELAY;
      if (options.first) {
        // Spoken directly inside the Start click so mobile browsers unlock speech.
        if (synth && prefs.voice) {
          utter(`Round ${phase.round}`, { rate: 0.95, pitch: 0.9 });
        }
        schedule(() => playBell(1), 1250);
      } else {
        playBell(1);
        schedule(() => speak(`Round ${phase.round}`), 800);
      }
    } else {
      state.nextComboAt = Infinity;
      playBell(3);
      schedule(() => speak("Rest", { rate: 0.9, pitch: 0.9 }), 1450);
    }
  }

  function startWorkout() {
    clearScheduled();
    cancelSpeech();
    ensureAudio();
    state.status = "running";
    state.elapsed = 0;
    state.startedAt = performance.now();
    state.nextComboAt = Infinity;
    state.lastCombo = [];
    beginPhase(0, { first: true });
    requestWakeLock();
    render();
  }

  function pauseWorkout() {
    if (state.status !== "running") return;
    state.elapsed = globalElapsed();
    state.status = "paused";
    clearScheduled();
    cancelSpeech();
    releaseWakeLock();
    render();
  }

  function resumeWorkout() {
    if (state.status !== "paused") return;
    state.status = "running";
    state.startedAt = performance.now();
    if (PHASES[state.index].type === "round") {
      state.nextComboAt = Math.max(state.nextComboAt, globalElapsed() + 1.2);
    }
    requestWakeLock();
    render();
  }

  function resetWorkout() {
    clearScheduled();
    cancelSpeech();
    releaseWakeLock();
    state.status = "idle";
    state.index = 0;
    state.elapsed = 0;
    state.startedAt = 0;
    state.nextComboAt = Infinity;
    state.lastCombo = [];
    render();
    renderCombo();
  }

  function finishWorkout() {
    if (state.status === "done") return;
    state.status = "done";
    state.index = PHASES.length - 1;
    state.elapsed = totalDuration;
    state.nextComboAt = Infinity;
    state.lastCombo = [];
    clearScheduled();
    cancelSpeech();
    playBell(3);
    schedule(() => speak("Workout complete", { rate: 0.92, pitch: 0.9 }), 1500);
    releaseWakeLock();
    render();
    renderCombo();
  }

  function tick() {
    if (state.status !== "running") return;
    const now = globalElapsed();
    if (now >= totalDuration) {
      finishWorkout();
      return;
    }
    const index = phaseIndexAt(now);
    if (index !== state.index) beginPhase(index);
    if (PHASES[state.index].type === "round") maybeCallCombo(now);
    render();
  }

  function maybeCallCombo(now) {
    const phase = PHASES[state.index];
    if (phase.type !== "round") return;
    if (now < state.nextComboAt) return;

    const phaseEnd = starts[state.index] + phase.duration;
    if (now > phaseEnd - 1.5) return;

    state.nextComboAt = now + prefs.pace;
    const combo = generateCombo();
    state.lastCombo = combo;
    renderCombo();
    speakCombo(combo);
  }

  function speakCombo(combo) {
    if (!prefs.voice || !synth) return;
    const words = combo.map((punch) => NUMBER_WORDS[punch]).join(", ");
    speak(words, { rate: 0.92, pitch: 0.92 });
  }

  function handlePrimary() {
    if (state.status === "running") {
      pauseWorkout();
    } else if (state.status === "paused") {
      resumeWorkout();
    } else if (state.status === "done") {
      resetWorkout();
      startWorkout();
    } else {
      startWorkout();
    }
  }

  /* ---------- render ---------- */

  function render() {
    const done = state.status === "done";
    const phase = PHASES[state.index];
    const now = globalElapsed();
    const local = done
      ? phase.duration
      : Math.min(phase.duration, Math.max(0, now - starts[state.index]));
    const remaining = done ? 0 : Math.max(0, phase.duration - local);

    el.stage.dataset.phase = done ? "done" : phase.type;
    el.stage.dataset.status = state.status;
    el.stage.dataset.urgent =
      !done && state.status === "running" && phase.type === "round" && remaining <= 10
        ? "true"
        : "false";

    el.statusPill.dataset.status = state.status;
    const statusLabels = { idle: "Ready", running: "Live", paused: "Paused", done: "Complete" };
    const statusLabel = statusLabels[state.status];
    if (el.statusText.textContent !== statusLabel) el.statusText.textContent = statusLabel;

    let meta;
    let sub;
    if (done) {
      meta = "Workout complete";
      sub = "Nice work — three rounds in the bag";
    } else if (phase.type === "rest") {
      meta = "Rest";
      sub = phase.round < ROUNDS ? `Next: Round ${phase.round + 1}` : "Last round next";
    } else if (state.status === "paused") {
      meta = `Round ${phase.round} of ${ROUNDS}`;
      sub = "Paused — take your time";
    } else if (state.status === "idle") {
      meta = `Round ${phase.round} of ${ROUNDS}`;
      sub = "Get ready";
    } else {
      meta = `Round ${phase.round} of ${ROUNDS}`;
      sub = "Box";
    }
    if (el.timerMeta.textContent !== meta) el.timerMeta.textContent = meta;
    if (el.timerSub.textContent !== sub) el.timerSub.textContent = sub;

    const timeText = formatTime(remaining);
    if (el.timerTime.textContent !== timeText) el.timerTime.textContent = timeText;

    const fraction = done ? 1 : local / phase.duration;
    el.ringProgress.style.strokeDashoffset = String(Math.min(100, Math.max(0, fraction * 100)));

    renderTimeline(now, done);
    renderControls();
  }

  function renderTimeline(now, done) {
    for (let i = 0; i < segments.length; i += 1) {
      const phase = PHASES[i];
      let fill = 0;
      let status = "pending";

      if (done || i < state.index) {
        fill = 100;
        status = "complete";
      } else if (i === state.index) {
        const local = Math.min(phase.duration, Math.max(0, now - starts[i]));
        fill = (local / phase.duration) * 100;
        if (state.status !== "idle" && local > 0) status = "active";
      }

      segments[i].fill.style.width = `${fill}%`;
      segments[i].node.classList.toggle("complete", status === "complete");
      segments[i].node.classList.toggle("active", status === "active");
      timelineLabelEls[i].classList.toggle("active", status === "active");
    }
  }

  function renderControls() {
    const pause = state.status === "running";
    const done = state.status === "done";
    const label = pause ? "Pause" : state.status === "paused" ? "Resume" : done ? "Go again" : "Start";

    if (el.startLabel.textContent !== label) el.startLabel.textContent = label;
    el.iconPlay.hidden = pause;
    el.iconPause.hidden = !pause;
    el.startBtn.classList.toggle("is-pause", pause);
    el.startBtn.classList.toggle("is-done", done);
    el.startBtn.setAttribute("aria-label", label);

    el.resetBtn.disabled = state.status === "idle" || done;
    el.startBtn.disabled = false;
  }

  function renderCombo() {
    const phase = PHASES[state.index];
    const done = state.status === "done";
    let label = "Combination";
    let placeholder = "Your calls appear here";

    if (done) {
      label = "Session";
      placeholder = "Workout complete";
    } else if (phase.type === "rest") {
      label = "Rest";
      placeholder = "Breathe — next round is coming up";
    } else if (state.status === "paused") {
      label = "Paused";
      placeholder = "Tap resume to keep going";
    } else if (state.status === "running" && !state.lastCombo.length) {
      placeholder = "Listen for the first call";
    }

    if (el.comboLabel.textContent !== label) el.comboLabel.textContent = label;
    el.comboChips.replaceChildren();

    if (state.lastCombo.length) {
      state.lastCombo.forEach((punch, i) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = String(punch);
        chip.style.animationDelay = reducedMotion.matches ? "0ms" : `${i * 55}ms`;
        el.comboChips.append(chip);
      });
      el.comboChips.setAttribute("aria-label", `Combination ${state.lastCombo.join(", ")}`);
    } else {
      const empty = document.createElement("span");
      empty.className = "combo-empty";
      empty.textContent = placeholder;
      el.comboChips.append(empty);
      el.comboChips.removeAttribute("aria-label");
    }
  }

  /* ---------- wake lock ---------- */

  async function requestWakeLock() {
    if (!("wakeLock" in navigator)) return;
    if (state.status !== "running") return;
    if (document.visibilityState !== "visible" || wakeLock) return;
    try {
      const lock = await navigator.wakeLock.request("screen");
      if (state.status !== "running") {
        lock.release().catch(() => {});
        return;
      }
      wakeLock = lock;
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    } catch {
      wakeLock = null;
    }
  }

  function releaseWakeLock() {
    if (!wakeLock) return;
    try {
      wakeLock.release().catch(() => {});
    } catch {
      /* ignore */
    }
    wakeLock = null;
  }

  /* ---------- settings UI ---------- */

  function updatePrefsUI() {
    el.paceValue.textContent = `${prefs.pace}s`;
    document.querySelectorAll("[data-pace]").forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.pace) === prefs.pace));
    });
    el.voiceToggle.setAttribute("aria-checked", String(Boolean(prefs.voice && synth)));
    el.voiceToggle.disabled = !synth;
    el.bellToggle.setAttribute("aria-checked", String(Boolean(prefs.bell)));
    el.voiceHint.hidden = Boolean(synth);
  }

  function buildTimeline() {
    const columns = PHASES.map((phase) => `${phase.duration}fr`).join(" ");
    el.timelineTrack.style.gridTemplateColumns = columns;
    el.timelineLabels.style.gridTemplateColumns = columns;
    el.timelineTotal.textContent = formatTime(totalDuration);

    PHASES.forEach((phase) => {
      const node = document.createElement("div");
      node.className = `tl-seg${phase.type === "rest" ? " rest" : ""}`;
      node.title =
        phase.type === "round"
          ? `Round ${phase.round} — ${formatTime(phase.duration)}`
          : `Rest — ${formatTime(phase.duration)}`;

      const fill = document.createElement("span");
      fill.className = "tl-fill";
      node.append(fill);
      el.timelineTrack.append(node);
      segments.push({ node, fill });

      const label = document.createElement("span");
      label.textContent = phase.type === "round" ? `R${phase.round}` : "";
      el.timelineLabels.append(label);
      timelineLabelEls.push(label);
    });
  }

  /* ---------- fullscreen ---------- */

  function fullscreenSupported() {
    const root = document.documentElement;
    return Boolean(root.requestFullscreen || root.webkitRequestFullscreen);
  }

  function isFullscreen() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function isStandalone() {
    return Boolean(
      (standaloneQuery && standaloneQuery.matches) || window.navigator.standalone === true
    );
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      el.toast.classList.remove("is-visible");
    }, 4500);
  }

  function updateFullscreenUI() {
    const active = isFullscreen();
    const supported = fullscreenSupported();
    const standalone = isStandalone();

    document.body.classList.toggle("is-fullscreen", active);
    el.fullscreenBtn.setAttribute("aria-pressed", String(active));
    el.fullscreenBtn.setAttribute("aria-label", active ? "Exit full screen" : "Enter full screen");
    el.fullscreenBtn.title = active ? "Exit full screen" : "Enter full screen";
    el.iconExpand.hidden = active;
    el.iconCompress.hidden = !active;
    el.fullscreenBtn.hidden = standalone && !supported;
  }

  async function toggleFullscreen() {
    const root = document.documentElement;
    try {
      if (isFullscreen()) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        return;
      }

      if (root.requestFullscreen) {
        await root.requestFullscreen({ navigationUI: "hide" });
      } else if (root.webkitRequestFullscreen) {
        root.webkitRequestFullscreen();
      } else {
        showToast("For full screen on iPhone, tap Share, then Add to Home Screen.");
      }
    } catch {
      showToast("Full screen couldn't start. Try again from the browser menu.");
    }
  }

  /* ---------- events ---------- */

  el.startBtn.addEventListener("click", handlePrimary);
  el.resetBtn.addEventListener("click", resetWorkout);
  el.fullscreenBtn.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", updateFullscreenUI);
  document.addEventListener("webkitfullscreenchange", updateFullscreenUI);

  document.querySelectorAll("[data-pace]").forEach((button) => {
    button.addEventListener("click", () => {
      const pace = Number(button.dataset.pace);
      if (![4, 6, 8].includes(pace) || pace === prefs.pace) return;
      prefs.pace = pace;
      savePrefs();
      updatePrefsUI();
      if (PHASES[state.index].type === "round" && state.status !== "idle" && state.status !== "done") {
        state.nextComboAt = globalElapsed() + prefs.pace;
      }
      render();
    });
  });

  el.voiceToggle.addEventListener("click", () => {
    if (!synth) return;
    prefs.voice = !prefs.voice;
    savePrefs();
    updatePrefsUI();
    if (prefs.voice) {
      speak("Voice cues on", { rate: 0.95, pitch: 0.9 });
    } else {
      cancelSpeech();
    }
  });

  el.bellToggle.addEventListener("click", () => {
    prefs.bell = !prefs.bell;
    savePrefs();
    updatePrefsUI();
    if (prefs.bell) playBell(1);
  });

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest("input, textarea, select, [contenteditable='true']")) return;

    if (event.code === "Space") {
      if (event.target.closest("button, a")) return;
      event.preventDefault();
      handlePrimary();
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      resetWorkout();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.status === "running") {
      requestWakeLock();
    }
  });

  if (synth) {
    const refreshVoices = () => {
      cachedVoice = null;
      pickVoice();
    };
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", refreshVoices);
    } else {
      synth.onvoiceschanged = refreshVoices;
    }
    pickVoice();
  }

  if (standaloneQuery && typeof standaloneQuery.addEventListener === "function") {
    standaloneQuery.addEventListener("change", updateFullscreenUI);
  }

  /* ---------- boot ---------- */

  buildTimeline();
  updatePrefsUI();
  updateFullscreenUI();
  render();
  renderCombo();
  window.setInterval(tick, TICK_MS);
})();


