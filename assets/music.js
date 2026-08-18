(function () {
  const button = document.getElementById("music-toggle");
  if (!button) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  let context;
  let master;
  let timer;
  let audio;
  let playing = false;
  const bundledTrack = "/assets/audio/background-music.mp3";
  let managedTrack = bundledTrack;
  let enabled = localStorage.getItem("eliminator_music_off") !== "1";
  const notes = [220, 277.18, 329.63, 440, 554.37, 659.25];

  function updateLabel() {
    button.setAttribute("aria-pressed", String(enabled));
    button.title = enabled ? "Turn background music off" : "Turn background music on";
    button.querySelector("span").textContent = enabled ? "Music on" : "Music off";
    button.classList.toggle("is-playing", enabled);
  }
  function playNote() {
    if (!playing || !context || !master) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = notes[Math.floor(Math.random() * notes.length)];
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + 1.8);
  }
  function loadBundledTrack() {
    audio = new Audio(bundledTrack);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.32;
    audio.addEventListener("error", () => { managedTrack = ""; audio = null; });
    if (enabled) start().catch(() => {});
  }
  async function start() {
    if (!enabled) return;
    if (managedTrack && audio) {
      await audio.play();
      playing = true;
      updateLabel();
      return;
    }
    if (!AudioCtor) return;
    context ||= new AudioCtor();
    master ||= context.createGain();
    master.gain.value = 0.22;
    master.connect(context.destination);
    await context.resume();
    playing = true;
    playNote();
    clearInterval(timer);
    timer = setInterval(playNote, 1150);
    updateLabel();
  }
  function pause() {
    enabled = false;
    playing = false;
    localStorage.setItem("eliminator_music_off", "1");
    clearInterval(timer);
    if (audio) audio.pause();
    if (context && context.state === "running") context.suspend();
    updateLabel();
  }
  function enable() {
    enabled = true;
    localStorage.removeItem("eliminator_music_off");
    start().catch(() => updateLabel());
    updateLabel();
  }
  button.addEventListener("click", () => {
    if (enabled) pause();
    else enable();
  });
  ["pointerdown", "touchstart", "keydown"].forEach((eventName) => {
    document.addEventListener(eventName, () => {
      if (enabled && !playing) start().catch(() => {});
    }, { passive: true });
  });
  updateLabel();
  loadBundledTrack();
})();
