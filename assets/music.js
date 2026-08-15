(function () {
  const button = document.getElementById("music-toggle");
  if (!button || !window.AudioContext && !window.webkitAudioContext) return;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  let context;
  let master;
  let timer;
  let playing = false;
  const notes = [220, 277.18, 329.63, 440, 554.37, 659.25];

  function updateLabel() {
    button.setAttribute("aria-pressed", String(playing));
    button.title = playing ? "Pause background music" : "Start background music";
    button.querySelector("span").textContent = playing ? "Music on" : "Music off";
    button.classList.toggle("is-playing", playing);
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

  async function start() {
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
    playing = false;
    clearInterval(timer);
    if (context && context.state === "running") context.suspend();
    updateLabel();
  }

  button.addEventListener("click", () => {
    if (playing) pause();
    else start().catch(() => updateLabel());
  });
  updateLabel();
})();
