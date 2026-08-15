const LIVE_SCORE_URL = "https://apis.davidcyril.name.ng/sports/live";
const TIMEOUT_MS = 20000;
function json(status, payload) { return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }); }
function team(value) { return { name: value?.name || "Unknown team", shortName: value?.shortName || value?.name || "Unknown", logo: value?.logo || "", score: value?.score ?? "-", winner: Boolean(value?.winner) }; }
export async function GET() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(LIVE_SCORE_URL, { headers: { accept: "application/json" }, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return json(response.status, { error: data.message || "LiveScore service unavailable." });
    const games = (Array.isArray(data.games) ? data.games : []).map((game) => ({ id: String(game.id || `${game.name}-${game.date}`), name: game.name || "Live match", shortName: game.shortName || game.name || "Match", date: game.date || null, status: game.status || "Scheduled", period: game.period ?? null, clock: game.clock || "", homeTeam: team(game.homeTeam), awayTeam: team(game.awayTeam), venue: game.venue || "", broadcast: game.broadcast || "" }));
    return json(200, { success: true, updatedAt: new Date().toISOString(), games });
  } catch (error) { return json(error?.name === "AbortError" ? 504 : 502, { error: error?.name === "AbortError" ? "LiveScore request timed out." : "Could not load live scores." }); }
  finally { clearTimeout(timer); }
}
export async function POST() { return json(405, { error: "Method not allowed" }); }
