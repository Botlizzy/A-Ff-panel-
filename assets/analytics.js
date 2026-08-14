(function () {
  const STORAGE_KEY = "eliminator_visitor_id";
  const visitorId = getVisitorId();

  function getVisitorId() {
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
          .replaceAll("-", "");
        localStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    } catch {
      return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }

  function track(event) {
    const body = JSON.stringify({ event, visitorId });
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true
      }).catch(() => {});
    } catch {
      // Analytics must never block or break the generator.
    }
  }

  window.EliminatorAnalytics = { track };
  track("page_view");
})();
