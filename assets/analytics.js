(function () {
  const VISITOR_KEY = "eliminator_visitor_id";
  const DATA_KEY = "eliminator_local_analytics";
  const visitorId = getVisitorId();

  function getVisitorId() {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`).replaceAll("-", "");
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function readData() {
    try { return JSON.parse(localStorage.getItem(DATA_KEY) || "{}"); } catch { return {}; }
  }

  function writeData(data) {
    try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); } catch {}
  }

  function track(event) {
    const date = today();
    const data = readData();
    const day = data[date] || { visitors: [], generators: [], generations: 0 };
    if (event === "page_view" && !day.visitors.includes(visitorId)) day.visitors.push(visitorId);
    if (event === "sensi_generated") {
      if (!day.visitors.includes(visitorId)) day.visitors.push(visitorId);
      if (!day.generators.includes(visitorId)) day.generators.push(visitorId);
      day.generations += 1;
    }
    data[date] = day;
    writeData(data);
  }

  window.EliminatorAnalytics = { track, readData };
  track("page_view");
})();
