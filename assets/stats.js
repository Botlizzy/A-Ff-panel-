(function () {
  const message = document.getElementById("stats-msg");
  const content = document.getElementById("stats-content");
  const body = document.getElementById("stats-body");
  const refreshButton = document.getElementById("stats-refresh");

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
    message.textContent = "Local stats loaded on this browser.";
    message.className = "msg ok";
  }

  refreshButton?.addEventListener("click", loadStats);
  loadStats();
})();
