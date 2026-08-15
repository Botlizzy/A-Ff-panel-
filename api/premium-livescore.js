const LIVE_SCORE_URL = "https://apis.davidcyril.name.ng/sports/live";
const TIMEOUT_MS = 20000;

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}
function team(team) {
  return { name: team?.name || "Unknown team", shortName: team?.shortName || team?.name || "Unknown", logo: team?.logo || "", score: team?.score ?? "-", winner: Boolean(team?.winner) };
}
module.exports = async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(LIVE_SCORE_URL, { headers: { accept: "application/json" }, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return send(res, response.status, { error: data.message || "LiveScore service unavailable." });
    const games = (Array.isArray(data.games) ? data.games : []).map((game) => ({
      id: String(game.id || `${game.name}-${game.date}`),
      name: game.name || "Live match",
      shortName: game.shortName || game.name || "Match",
      date: game.date || null,
      status: game.status || "Scheduled",
      period: game.period ?? null,
      clock: game.clock || "",
      homeTeam: team(game.homeTeam),
      awayTeam: team(game.awayTeam),
      venue: game.venue || "",
      broadcast: game.broadcast || ""
    }));
    return send(res, 200, { success: true, updatedAt: new Date().toISOString(), games });
  } catch (error) {
    return send(res, error.name === "AbortError" ? 504 : 502, { error: error.name === "AbortError" ? "LiveScore request timed out." : "Could not load live scores." });
  } finally {
    clearTimeout(timer);
  }
};
