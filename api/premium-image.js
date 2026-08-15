const ANIMAGINE_URL = "https://apis.davidcyril.name.ng/animagine";
const TIMEOUT_MS = 45000;
function json(status, payload) { return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }); }
function proxyUrl(request, mode, target) { return `${new URL(request.url).origin}/api/premium-image?${mode}=${encodeURIComponent(target)}`; }
async function fetchImage(target, signal) {
  let response = await fetch(target, { signal });
  const type = response.headers.get("content-type") || "";
  if (type.startsWith("image/") && response.body) return response;
  if (!type.includes("text/html")) return response;
  const html = await response.text();
  const match = html.match(/https:\/\/tmpfiles\.org\/dl\/[^"'\s<]+/i);
  if (!match) return new Response(null, { status: 404 });
  return fetch(match[0], { signal });
}
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = String(body.prompt || "").trim();
    if (prompt.length < 3) return json(400, { error: "Enter an anime image prompt first." });
    if (prompt.length > 1000) return json(400, { error: "Prompt must be 1000 characters or fewer." });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`${ANIMAGINE_URL}?prompt=${encodeURIComponent(prompt)}`, { headers: { accept: "application/json" }, signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false || !data.cdn_url) return json(response.ok ? 502 : response.status, { error: data.message || data.error || "Anime image generation failed." });
      return json(200, { success: true, prompt: data.prompt || prompt, imageUrl: proxyUrl(request, "view", data.cdn_url), downloadUrl: proxyUrl(request, "download", data.cdn_url), ratio: data.ratio || "1:1", provider: "Animagine" });
    } finally { clearTimeout(timer); }
  } catch (error) { return json(error?.name === "AbortError" ? 504 : 502, { error: error?.name === "AbortError" ? "Image generation timed out. Try again." : "Image generation service is temporarily unavailable." }); }
}
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const target = params.get("download") || params.get("view") || "";
  let remote;
  try { remote = new URL(target); } catch { return json(400, { error: "Invalid image URL" }); }
  if (remote.protocol !== "https:" || remote.hostname !== "tmpfiles.org") return json(403, { error: "Image host is not allowed" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetchImage(remote.toString(), controller.signal);
    if (!response.ok || !response.body) return json(response.status || 502, { error: "Generated image is no longer available." });
    const headers = { "content-type": response.headers.get("content-type") || "image/png", "cache-control": "private, no-cache" };
    if (params.has("download")) headers["content-disposition"] = "attachment; filename*=UTF-8''eliminator-anime.png";
    return new Response(response.body, { status: 200, headers });
  } catch (error) { return json(error?.name === "AbortError" ? 504 : 502, { error: "Could not load the generated image." }); }
  finally { clearTimeout(timer); }
}
