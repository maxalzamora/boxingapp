/* Jabber — audio-cued boxing rounds */
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
  const REST_WARNING_SECONDS = 5;
  const FINAL_ROUND_WARNING_SECONDS = 30;
  const PREFS_KEY = "six-count-prefs-v1";
  const COPY = {
    en: {
      title: "Jabber — Boxing Round Timer",
      description:
        "Jabber is a boxing round timer that calls out punch combinations while you train. 3 rounds of 3 minutes with 30 second rests.",
      brandSub: "Boxing round timer",
      session: "Session",
      sessionMeta: "3 rounds · 3:00 work · 0:30 rest",
      sessionProgress: "Session progress",
      workoutTimer: "Workout timer",
      settingsPanel: "Workout settings and punch guide",
      language: "Language",
      languageGroup: "Interface language",
      cadence: "Cadence",
      combinationEvery: "Combination every",
      combinationFrequency: "Combination frequency",
      voiceCues: "Voice cues",
      voiceCuesSub: "Numbers & round calls",
      ringBell: "Ring bell",
      ringBellSub: "Round start & end",
      voiceUnsupported: "Voice cues aren't supported in this browser.",
      punchNumbers: "Punch numbers",
      punch1: "Jab",
      punch2: "Cross",
      punch3: "Lead hook",
      punch4: "Rear hook",
      punch5: "Lead uppercut",
      punch6: "Rear uppercut",
      punchNote: "Called at random in 2–4 punch combinations. Stay loose and reset your stance.",
      reset: "Reset",
      resetKey: "reset",
      startPauseKey: "start / pause",
      status: { idle: "Ready", running: "Live", paused: "Paused", done: "Complete" },
      workoutComplete: "Workout complete",
      niceWork: "Nice work — three rounds in the bag",
      rest: "Rest",
      nextRound: (round) => `Next: Round ${round}`,
      lastRoundNext: "Last round next",
      getReadyRound: (round) => `Get ready — Round ${round}`,
      roundOf: (round, total) => `Round ${round} of ${total}`,
      pausedSub: "Paused — take your time",
      getReady: "Get ready",
      finalThirtySub: "Final 30 — all in",
      boxSub: "Box",
      combination: "Combination",
      sessionCombo: "Session",
      pausedLabel: "Paused",
      comboPlaceholder: "Your calls appear here",
      restPlaceholder: "Breathe — next round is coming up",
      pausedPlaceholder: "Tap resume to keep going",
      listenPlaceholder: "Listen for the first call",
      combinationAria: (combo) => `Combination ${combo.join(", ")}`,
      start: "Start",
      pause: "Pause",
      resume: "Resume",
      goAgain: "Go again",
      timelineRound: (round, time) => `Round ${round} — ${time}`,
      timelineRest: (time) => `Rest — ${time}`,
      enterFullScreen: "Enter full screen",
      exitFullScreen: "Exit full screen",
      fullscreenUnsupported: "For full screen on iPhone, tap Share, then Add to Home Screen.",
      fullscreenWakeWarning: "Full screen is on, but this browser can't keep the screen awake.",
      fullscreenError: "Full screen couldn't start. Try again from the browser menu.",
      voiceOn: "Voice cues on",
      roundCall: (round) => `Round ${round}`,
      restVoice: "Rest",
      workoutCompleteVoice: "Workout complete",
      restWarningVoice: "Five seconds. Get ready.",
      finalThirtyVoice: "Final 30 seconds. All in!",
    },
    ca: {
      title: "Jabber — Temporitzador de boxa",
      description:
        "Jabber és un temporitzador de rondes de boxa que anuncia combinacions de cops mentre entrenes. 3 rondes de 3 minuts amb descansos de 30 segons.",
      brandSub: "Temporitzador de boxa",
      session: "Sessió",
      sessionMeta: "3 rondes · 3:00 treball · 0:30 descans",
      sessionProgress: "Progrés de la sessió",
      workoutTimer: "Temporitzador d'entrenament",
      settingsPanel: "Ajustos de l'entrenament i guia de cops",
      language: "Idioma",
      languageGroup: "Idioma de la interfície",
      cadence: "Cadència",
      combinationEvery: "Combinació cada",
      combinationFrequency: "Freqüència de les combinacions",
      voiceCues: "Indicacions de veu",
      voiceCuesSub: "Números i rondes",
      ringBell: "Campana",
      ringBellSub: "Inici i final de ronda",
      voiceUnsupported: "Aquest navegador no admet indicacions de veu.",
      punchNumbers: "Números de cop",
      punch1: "Jab",
      punch2: "Creuat",
      punch3: "Ganxo davanter",
      punch4: "Ganxo posterior",
      punch5: "Uppercut davanter",
      punch6: "Uppercut posterior",
      punchNote: "Combinacions aleatòries de 2–4 cops. Mantén-te relaxat i recupera la posició.",
      reset: "Reinicia",
      resetKey: "reinicia",
      startPauseKey: "inici / pausa",
      status: { idle: "A punt", running: "En marxa", paused: "En pausa", done: "Complet" },
      workoutComplete: "Entrenament complet",
      niceWork: "Bona feina — tres rondes fetes",
      rest: "Descans",
      nextRound: (round) => `Següent: Ronda ${round}`,
      lastRoundNext: "Última ronda",
      getReadyRound: (round) => `Prepara't — Ronda ${round}`,
      roundOf: (round, total) => `Ronda ${round} de ${total}`,
      pausedSub: "En pausa — sense pressa",
      getReady: "Prepara't",
      finalThirtySub: "Últims 30 — a fons",
      boxSub: "Boxa",
      combination: "Combinació",
      sessionCombo: "Sessió",
      pausedLabel: "En pausa",
      comboPlaceholder: "Les combinacions apareixeran aquí",
      restPlaceholder: "Respira — la següent ronda s'acosta",
      pausedPlaceholder: "Toca reprendre per continuar",
      listenPlaceholder: "Escolta la primera combinació",
      combinationAria: (combo) => `Combinació ${combo.join(", ")}`,
      start: "Comença",
      pause: "Pausa",
      resume: "Reprèn",
      goAgain: "Torna-hi",
      timelineRound: (round, time) => `Ronda ${round} — ${time}`,
      timelineRest: (time) => `Descans — ${time}`,
      enterFullScreen: "Entra a pantalla completa",
      exitFullScreen: "Surt de pantalla completa",
      fullscreenUnsupported:
        "Per a pantalla completa a l'iPhone, toca Compartir i després Afegeix a la pantalla d'inici.",
      fullscreenWakeWarning:
        "La pantalla completa està activa, però aquest navegador no pot mantenir la pantalla encesa.",
      fullscreenError:
        "No s'ha pogut iniciar la pantalla completa. Torna-ho a provar des del menú del navegador.",
      voiceOn: "Indicacions de veu activades",
      roundCall: (round) => `Ronda ${round}`,
      restVoice: "Descans",
      workoutCompleteVoice: "Entrenament complet",
      restWarningVoice: "Cinc segons. Prepara't.",
      finalThirtyVoice: "Últims 30 segons. A fons!",
    },
  };
  const NUMBER_WORDS = {
    en: ["", "one", "two", "three", "four", "five", "six"],
    ca: ["", "un", "dos", "tres", "quatre", "cinc", "sis"],
  };
  const SPEECH_LANG = { en: "en-US", ca: "ca-ES" };
  const PUNCH_WEIGHTS = { 1: 3, 2: 3, 3: 2, 4: 2, 5: 1.4, 6: 1.4 };

  const starts = [];
  let totalDuration = 0;
  for (const phase of PHASES) {
    starts.push(totalDuration);
    totalDuration += phase.duration;
  }

  const prefs = loadPrefs();

  function strings() {
    return COPY[prefs.lang] || COPY.en;
  }

  const state = {
    status: "idle", // idle | running | paused | done
    index: 0,
    elapsed: 0, // seconds banked while paused / between ticks
    startedAt: 0,
    nextComboAt: Infinity,
    lastCombo: [],
    restWarningPlayed: false,
    finalRoundWarningPlayed: false,
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
  let wakeLockPending = false;
  let toastTimer = 0;

  const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  const reducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };
  const standaloneQuery = window.matchMedia
    ? window.matchMedia("(display-mode: standalone)")
    : null;

  /* ---------- preferences ---------- */

  function detectLanguage() {
    return (navigator.language || "en").toLowerCase().startsWith("ca") ? "ca" : "en";
  }

  function loadPrefs() {
    const defaults = { pace: 6, voice: true, bell: true, lang: detectLanguage() };
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return defaults;
      const saved = JSON.parse(raw);
      return {
        pace: [4, 6, 8].includes(saved.pace) ? saved.pace : defaults.pace,
        voice: typeof saved.voice === "boolean" ? saved.voice : defaults.voice,
        bell: typeof saved.bell === "boolean" ? saved.bell : defaults.bell,
        lang: ["en", "ca"].includes(saved.lang) ? saved.lang : defaults.lang,
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

  function setIconHidden(icon, hidden) {
    // SVG elements do not reliably reflect the `hidden` IDL property to an attribute.
    icon.toggleAttribute("hidden", hidden);
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

    const languagePattern = prefs.lang === "ca" ? /^ca(?:[-_]|$)/i : /^en(?:[-_]|$)/i;
    const matching = voices.filter((voice) => languagePattern.test(voice.lang));
    if (!matching.length) return null;

    const preferred = {
      en: [
        /Google US English/i,
        /Samantha/i,
        /Aria/i,
        /Jenny/i,
        /Guy/i,
        /Daniel/i,
        /Alex/i,
        /Microsoft .*English/i,
        /English/i,
      ],
      ca: [
        /Google catal/i,
        /Google Catalan/i,
        /Monic/i,
        /Jordi/i,
        /Montserrat/i,
        /Catalan/i,
        /Català/i,
      ],
    };

    for (const pattern of preferred[prefs.lang] || []) {
      const match = matching.find((voice) => pattern.test(voice.name));
      if (match) {
        cachedVoice = match;
        return match;
      }
    }
    cachedVoice = matching.find((voice) => voice.localService) || matching[0];
    return cachedVoice;
  }

  function utter(text, { rate = 0.95, pitch = 0.9 } = {}) {
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG[prefs.lang] || "en-US";
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
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

  function playTone(freq, when, duration, amount) {
    if (!audioCtx || !masterGain) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(amount, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain).connect(masterGain);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  function cueRestWarning() {
    if (prefs.bell) {
      ensureAudio();
      if (audioCtx && masterGain) {
        const now = audioCtx.currentTime + 0.03;
        playTone(880, now, 0.11, 0.14);
        playTone(1174.66, now + 0.16, 0.16, 0.12);
      }
    }
    if (prefs.voice && synth) {
      schedule(() => speak(strings().restWarningVoice, { rate: 0.98, pitch: 0.98 }), 260);
    }
  }

  function cueFinalRound() {
    if (prefs.bell) playBell(2);
    if (prefs.voice && synth) {
      schedule(() => speak(strings().finalThirtyVoice, { rate: 0.92, pitch: 0.95 }), 900);
    }
  }

  /* ---------- workout flow ---------- */

  function beginPhase(index, options = {}) {
    state.index = index;
    state.lastCombo = [];
    renderCombo();
    const copy = strings();

    const phase = PHASES[index];
    if (phase.type === "round") {
      state.nextComboAt = starts[index] + FIRST_COMBO_DELAY;
      if (options.first) {
        // Spoken directly inside the Start click so mobile browsers unlock speech.
        if (synth && prefs.voice) {
          utter(copy.roundCall(phase.round), { rate: 0.95, pitch: 0.9 });
        }
        schedule(() => playBell(1), 1250);
      } else {
        playBell(1);
        schedule(() => speak(strings().roundCall(phase.round)), 800);
      }
    } else {
      state.nextComboAt = Infinity;
      state.restWarningPlayed = false;
      playBell(3);
      schedule(() => speak(strings().restVoice, { rate: 0.9, pitch: 0.9 }), 1450);
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
    state.restWarningPlayed = false;
    state.finalRoundWarningPlayed = false;
    beginPhase(0, { first: true });
    syncWakeLock();
    render();
  }

  function pauseWorkout() {
    if (state.status !== "running") return;
    state.elapsed = globalElapsed();
    state.status = "paused";
    clearScheduled();
    cancelSpeech();
    syncWakeLock();
    render();
    renderCombo();
  }

  function resumeWorkout() {
    if (state.status !== "paused") return;
    state.status = "running";
    state.startedAt = performance.now();
    if (PHASES[state.index].type === "round") {
      state.nextComboAt = Math.max(state.nextComboAt, globalElapsed() + 1.2);
    }
    syncWakeLock();
    render();
    renderCombo();
  }

  function resetWorkout() {
    clearScheduled();
    cancelSpeech();
    state.status = "idle";
    state.index = 0;
    state.elapsed = 0;
    state.startedAt = 0;
    state.nextComboAt = Infinity;
    state.lastCombo = [];
    state.restWarningPlayed = false;
    state.finalRoundWarningPlayed = false;
    syncWakeLock();
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
    schedule(() => speak(strings().workoutCompleteVoice, { rate: 0.92, pitch: 0.9 }), 1500);
    syncWakeLock();
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
    const phase = PHASES[state.index];
    const remaining = starts[state.index] + phase.duration - now;

    if (
      phase.type === "rest" &&
      remaining <= REST_WARNING_SECONDS &&
      !state.restWarningPlayed
    ) {
      state.restWarningPlayed = true;
      cueRestWarning();
    }

    if (
      phase.type === "round" &&
      state.index === PHASES.length - 1 &&
      remaining <= FINAL_ROUND_WARNING_SECONDS &&
      !state.finalRoundWarningPlayed
    ) {
      state.finalRoundWarningPlayed = true;
      cueFinalRound();
    }

    if (phase.type === "round") maybeCallCombo(now);
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
    const words = combo.map((punch) => NUMBER_WORDS[prefs.lang][punch]).join(", ");
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
    const copy = strings();
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
    const statusLabel = copy.status[state.status];
    if (el.statusText.textContent !== statusLabel) el.statusText.textContent = statusLabel;

    let meta;
    let sub;
    if (done) {
      meta = copy.workoutComplete;
      sub = copy.niceWork;
    } else if (phase.type === "rest") {
      meta = copy.rest;
      sub =
        phase.round < ROUNDS ? copy.nextRound(phase.round + 1) : copy.lastRoundNext;
      if (state.status === "running" && remaining <= REST_WARNING_SECONDS) {
        sub = copy.getReadyRound(phase.round + 1);
      }
    } else if (state.status === "paused") {
      meta = copy.roundOf(phase.round, ROUNDS);
      sub = copy.pausedSub;
    } else if (state.status === "idle") {
      meta = copy.roundOf(phase.round, ROUNDS);
      sub = copy.getReady;
    } else {
      meta = copy.roundOf(phase.round, ROUNDS);
      sub =
        phase.round === ROUNDS && remaining <= FINAL_ROUND_WARNING_SECONDS
          ? copy.finalThirtySub
          : copy.boxSub;
    }
    if (el.timerMeta.textContent !== meta) el.timerMeta.textContent = meta;
    if (el.timerSub.textContent !== sub) el.timerSub.textContent = sub;

    const timeText = formatTime(remaining);
    if (el.timerTime.textContent !== timeText) el.timerTime.textContent = timeText;

    const progress = done ? 100 : Math.min(100, Math.max(0, (local / phase.duration) * 100));
    // The ring and the inner fill both grow with elapsed time.
    el.ringProgress.style.strokeDashoffset = String(100 - progress);
    el.stage.style.setProperty("--phase-progress", `${progress}%`);

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
    const copy = strings();
    const pause = state.status === "running";
    const done = state.status === "done";
    const label = pause
      ? copy.pause
      : state.status === "paused"
        ? copy.resume
        : done
          ? copy.goAgain
          : copy.start;

    if (el.startLabel.textContent !== label) el.startLabel.textContent = label;
    setIconHidden(el.iconPlay, pause);
    setIconHidden(el.iconPause, !pause);
    el.startBtn.classList.toggle("is-pause", pause);
    el.startBtn.classList.toggle("is-done", done);
    el.startBtn.setAttribute("aria-label", label);

    el.resetBtn.disabled = state.status === "idle" || done;
    el.startBtn.disabled = false;
  }

  function renderCombo() {
    const copy = strings();
    const phase = PHASES[state.index];
    const done = state.status === "done";
    let label = copy.combination;
    let placeholder = copy.comboPlaceholder;

    if (done) {
      label = copy.sessionCombo;
      placeholder = copy.workoutComplete;
    } else if (phase.type === "rest") {
      label = copy.rest;
      placeholder = copy.restPlaceholder;
    } else if (state.status === "paused") {
      label = copy.pausedLabel;
      placeholder = copy.pausedPlaceholder;
    } else if (state.status === "running" && !state.lastCombo.length) {
      placeholder = copy.listenPlaceholder;
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
      el.comboChips.setAttribute("aria-label", copy.combinationAria(state.lastCombo));
    } else {
      const empty = document.createElement("span");
      empty.className = "combo-empty";
      empty.textContent = placeholder;
      el.comboChips.append(empty);
      el.comboChips.removeAttribute("aria-label");
    }
  }

  /* ---------- wake lock ---------- */

  function shouldKeepAwake() {
    return state.status === "running" || isFullscreen() || isStandalone();
  }

  async function requestWakeLock() {
    if (!("wakeLock" in navigator)) return;
    if (!shouldKeepAwake()) return;
    if (document.visibilityState !== "visible" || wakeLock || wakeLockPending) return;

    wakeLockPending = true;
    try {
      const lock = await navigator.wakeLock.request("screen");
      if (!shouldKeepAwake() || document.visibilityState !== "visible") {
        lock.release().catch(() => {});
        return;
      }
      wakeLock = lock;
      lock.addEventListener("release", () => {
        if (wakeLock === lock) wakeLock = null;
      });
    } catch {
      wakeLock = null;
    } finally {
      wakeLockPending = false;
    }
  }

  async function syncWakeLock() {
    if (shouldKeepAwake()) {
      await requestWakeLock();
    } else {
      releaseWakeLock();
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
    document.querySelectorAll("[data-lang]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.lang === prefs.lang));
    });
    el.voiceToggle.setAttribute("aria-checked", String(Boolean(prefs.voice && synth)));
    el.voiceToggle.disabled = !synth;
    el.bellToggle.setAttribute("aria-checked", String(Boolean(prefs.bell)));
    el.voiceHint.hidden = Boolean(synth);
  }

  function updateTimelineText() {
    const copy = strings();
    PHASES.forEach((phase, i) => {
      if (!segments[i]) return;
      segments[i].node.title =
        phase.type === "round"
          ? copy.timelineRound(phase.round, formatTime(phase.duration))
          : copy.timelineRest(formatTime(phase.duration));
    });
  }

  function buildTimeline() {
    const columns = PHASES.map((phase) => `${phase.duration}fr`).join(" ");
    el.timelineTrack.style.gridTemplateColumns = columns;
    el.timelineLabels.style.gridTemplateColumns = columns;
    el.timelineTotal.textContent = formatTime(totalDuration);

    PHASES.forEach((phase) => {
      const node = document.createElement("div");
      node.className = `tl-seg${phase.type === "rest" ? " rest" : ""}`;

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

    updateTimelineText();
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
    const copy = strings();
    const active = isFullscreen();
    const supported = fullscreenSupported();
    const standalone = isStandalone();

    document.body.classList.toggle("is-fullscreen", active);
    el.fullscreenBtn.setAttribute("aria-pressed", String(active));
    el.fullscreenBtn.setAttribute(
      "aria-label",
      active ? copy.exitFullScreen : copy.enterFullScreen
    );
    el.fullscreenBtn.title = active ? copy.exitFullScreen : copy.enterFullScreen;
    setIconHidden(el.iconExpand, active);
    setIconHidden(el.iconCompress, !active);
    el.fullscreenBtn.hidden = standalone && !supported;

    if (active && !("wakeLock" in navigator)) {
      showToast(copy.fullscreenWakeWarning);
    }
    syncWakeLock();
  }

  async function toggleFullscreen() {
    const copy = strings();
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
        showToast(copy.fullscreenUnsupported);
      }
    } catch {
      showToast(copy.fullscreenError);
    }
  }

  /* ---------- language ---------- */

  function applyStaticTranslations() {
    const copy = strings();
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const value = copy[node.dataset.i18n];
      if (typeof value === "string") node.textContent = value;
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
      const value = copy[node.dataset.i18nAriaLabel];
      if (typeof value === "string") node.setAttribute("aria-label", value);
    });
  }

  function applyLanguage() {
    const copy = strings();
    const active = isFullscreen();

    document.documentElement.lang = prefs.lang;
    document.title = copy.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", copy.description);

    applyStaticTranslations();
    updateTimelineText();
    updatePrefsUI();

    el.fullscreenBtn.setAttribute(
      "aria-label",
      active ? copy.exitFullScreen : copy.enterFullScreen
    );
    el.fullscreenBtn.title = active ? copy.exitFullScreen : copy.enterFullScreen;
  }

  function setLanguage(lang) {
    if (!["en", "ca"].includes(lang) || lang === prefs.lang) return;
    cancelSpeech();
    prefs.lang = lang;
    savePrefs();
    cachedVoice = null;
    applyLanguage();
    render();
    renderCombo();
    if (prefs.voice && synth) {
      speak(lang === "ca" ? "Català" : "English", { rate: 0.95, pitch: 0.95 });
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

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });

  el.voiceToggle.addEventListener("click", () => {
    if (!synth) return;
    prefs.voice = !prefs.voice;
    savePrefs();
    updatePrefsUI();
    if (prefs.voice) {
      speak(strings().voiceOn, { rate: 0.95, pitch: 0.9 });
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
    if (document.visibilityState === "visible") {
      syncWakeLock();
    } else {
      // Browsers drop the screen lock when the page is hidden.
      wakeLock = null;
    }
  });

  document.addEventListener(
    "pointerdown",
    () => {
      if (shouldKeepAwake() && !wakeLock) requestWakeLock();
    },
    { passive: true }
  );

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

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (!window.isSecureContext || location.protocol === "file:") return;
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* offline support is optional */
    });
  }

  if (document.readyState === "complete") {
    registerServiceWorker();
  } else {
    window.addEventListener("load", registerServiceWorker);
  }

  buildTimeline();
  applyLanguage();
  updateFullscreenUI();
  render();
  renderCombo();
  window.setInterval(tick, TICK_MS);
})();


