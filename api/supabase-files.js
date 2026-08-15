const MAX_LIST = 1000;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}

function config() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  const bucket = process.env.SUPABASE_BUCKET || "uploaded-hacks";
  if (!url || !key) throw new Error("Supabase Storage is not configured");
  return { url, key, bucket };
}

function headers(key) {
  return { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" };
}

function isAdmin(request) {
  return Boolean(process.env.UPLOAD_ADMIN_PASSWORD) && request.headers.get("x-admin-password") === process.env.UPLOAD_ADMIN_PASSWORD;
}

function publicUrl(url, bucket, name) {
  return `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${name.split("/").map(encodeURIComponent).join("/")}`;
}

export default async function handler(request) {
  try {
    const { url, key, bucket } = config();

    if (request.method === "GET") {
      const response = await fetch(`${url}/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
        method: "POST",
        headers: headers(key),
        body: JSON.stringify({ prefix: "", limit: MAX_LIST, offset: 0, sortBy: { column: "created_at", order: "desc" } })
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) return json(response.status, { error: data.message || data.error || "Could not list Supabase files" });
      const files = (Array.isArray(data) ? data : []).filter((item) => item.name).map((item) => ({
        pathname: item.name,
        url: publicUrl(url, bucket, item.name),
        downloadUrl: publicUrl(url, bucket, item.name),
        size: Number(item.metadata?.size || item.size || 0),
        contentType: item.metadata?.mimetype || item.metadata?.contentType || "application/octet-stream",
        uploadedAt: item.created_at || item.updated_at || new Date().toISOString()
      }));
      return json(200, { files, provider: "supabase" });
    }

    if (!isAdmin(request)) return json(401, { error: "Admin password required" });
    if (request.method !== "DELETE") return json(405, { error: "Method not allowed" });

    const body = await request.json().catch(() => ({}));
    const pathname = String(body.pathname || "").replace(/^\/+/, "");
    if (!pathname || pathname.includes("..")) return json(400, { error: "Missing or invalid file path" });
    const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}`, {
      method: "DELETE",
      headers: headers(key),
      body: JSON.stringify({ prefixes: [pathname] })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return json(response.status, { error: data.message || data.error || "Could not delete file" });
    return json(200, { ok: true });
  } catch (error) {
    console.error("Supabase file API error", error);
    return json(503, { error: "Supabase Storage is not configured or is unavailable." });
  }
}
