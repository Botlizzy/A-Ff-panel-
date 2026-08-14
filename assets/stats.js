(function () {
  const keyInput = document.getElementById("stats-key");
  const loadButton = document.getElementById("stats-load");
  const refreshButton = document.getElementById("stats-refresh");
  const message = document.getElementById("stats-msg");
  const content = document.getElementById("stats-content");
  const body = document.getElementById("stats-body");
  let statsKey = sessionStorage.getItem("eliminator_stats_key") || "";
  if (statsKey) keyInput.value = statsKey;

  function setMessage(text, type) {
    message.textContent = text;
    message.className = `msg ${type || ""}`;
  }

  async function loadStats() {
    statsKey = String(keyInput.value || "").trim();
    if (!statsKey) return setMessage("Enter the stats key first.", "error");
    setMessage("Loading…");
    try {
      const response = await fetch("/api/stats", { headers: { "x-stats-key": statsKey } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load stats");
      sessionStorage.setItem("eliminator_stats_key", statsKey);
      body.innerHTML = data.days.map((day) => `<tr><td>${day.date}</td><td>${day.visitors}</td><td>${day.generators}</td><td>${day.generations}</td></tr>`).join("");
      content.hidden = false;
      setMessage("Stats loaded.", "ok");
    } catch (error) {
      content.hidden = true;
      setMessage(error.message || "Could not load stats.", "error");
    }
  }

  loadButton?.addEventListener("click", loadStats);
  refreshButton?.addEventListener("click", loadStats);
  keyInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") loadStats();
  });
})();
