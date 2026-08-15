const ANIMAGINE_URL = "https://apis.davidcyril.name.ng/animagine";
const TIMEOUT_MS = 45000;

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const prompt = String(req.body?.prompt || "").trim();
  if (prompt.length < 3) return send(res, 400, { error: "Enter an anime image prompt first." });
  if (prompt.length > 1000) return send(res, 400, { error: "Prompt must be 1000 characters or fewer." });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${ANIMAGINE_URL}?prompt=${encodeURIComponent(prompt)}`, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false || !data.cdn_url) {
      return send(res, response.ok ? 502 : response.status, { error: data.message || data.error || "Anime image generation failed." });
    }
    return send(res, 200, { success: true, prompt: data.prompt || prompt, imageUrl: data.cdn_url, ratio: data.ratio || "1:1", provider: "Animagine" });
  } catch (error) {
    return send(res, error.name === "AbortError" ? 504 : 502, { error: error.name === "AbortError" ? "Image generation timed out. Try again." : "Image generation service is temporarily unavailable." });
  } finally {
    clearTimeout(timer);
  }
};
