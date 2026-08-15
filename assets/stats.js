(function () {
  const message = document.getElementById("stats-msg");
  const live = document.getElementById("stats-live");
  const content = document.getElementById("stats-content");
  const body = document.getElementById("stats-body");
  const refreshButton = document.getElementById("stats-refresh");
  const REFRESH_MS = 3000;

  function loadStats() {
    let data = {};
    try { data = JSON.parse(localStorage.getItem("eliminator_local_analytics") || "{}"); } catch {}
    const now = new Date();
    const days = [];
    for (let offset = 13; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setUTCDate(now.getUTCDate() - offset);
      const key = date.toISOString().slice(0, 10);
      const day = data[key] || { visitors: [], generators: [], generations: 0 };
      days.push({
        date: key,
        visitors: Array.isArray(day.visitors) ? day.visitors.length : 0,
        generators: Array.isArray(day.generators) ? day.generators.length : 0,
        generations: Number(day.generations || 0)
      });
    }
    body.innerHTML = days.map((day) => `<tr><td>${day.date}</td><td>${day.visitors}</td><td>${day.generators}</td><td>${day.generations}</td></tr>`).join("");
    content.hidden = false;
    const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    message.textContent = `Local stats updated at ${stamp}.`;
    message.className = "msg ok";
    if (live) live.textContent = `Live refresh: on · ${stamp}`;
  }

  refreshButton?.addEventListener("click", loadStats);
  window.addEventListener("storage", (event) => {
    if (event.key === "eliminator_local_analytics") loadStats();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadStats();
  });
  loadStats();
  window.setInterval(loadStats, REFRESH_MS);
})();
