const MAX_LIST = 1000;
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 9000;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function config() {
  let url = String(process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}.supabase.co`;
  url = url.replace(/\/+(rest|storage|auth|graphql)(\/.*)?$/i, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  const bucket = String(process.env.SUPABASE_BUCKET || "uploaded-hacks").trim() || "uploaded-hacks";
  if (!url || !key) throw new Error("Supabase Storage is not configured");
  return { url, key, bucket };
}

function getHeader(request, name) {
  if (request?.headers?.get) return request.headers.get(name) || "";
  return request?.headers?.[name] || request?.headers?.[name.toLowerCase()] || "";
}

function headers(key, contentType = "application/json") {
  return { apikey: key, authorization: `Bearer ${key}`, "content-type": contentType };
}

function isAdmin(request) {
  const expected = String(process.env.UPLOAD_ADMIN_PASSWORD || "");
  return Boolean(expected) && getHeader(request, "x-admin-password") === expected;
}

function publicUrl(url, bucket, name) {
  return `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${name.split("/").map(encodeURIComponent).join("/")}`;
}

async function fetchWithTimeout(resource, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function fileDetails(item, url, bucket) {
  return {
    pathname: item.name,
    url: publicUrl(url, bucket, item.name),
    downloadUrl: publicUrl(url, bucket, item.name),
    size: Number(item.metadata?.size || item.size || 0),
    contentType: item.metadata?.mimetype || item.metadata?.contentType || "application/octet-stream",
    uploadedAt: item.created_at || item.updated_at || new Date().toISOString()
  };
}

export default async function handler(request) {
  try {
    const { url, key, bucket } = config();

    if (request.method === "GET") {
      const response = await fetchWithTimeout(`${url}/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
        method: "POST",
        headers: headers(key),
        body: JSON.stringify({ prefix: "", limit: MAX_LIST, offset: 0, sortBy: { column: "created_at", order: "desc" } })
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) return json(response.status, { error: data.message || data.error || "Could not list Supabase files" });
      const files = (Array.isArray(data) ? data : []).filter((item) => item.name).map((item) => fileDetails(item, url, bucket));
      return json(200, { files, provider: "supabase" });
    }

    if (!isAdmin(request)) return json(401, { error: "Admin password required" });

    if (request.method === "POST") {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || !file.name) return json(400, { error: "Choose a file first" });
      if (file.size > MAX_UPLOAD_SIZE) return json(413, { error: "Files must be 100 MB or smaller" });
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160) || "shared-file";
      const objectPath = `${Date.now()}-${safeName}`;
      const response = await fetchWithTimeout(`${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(objectPath)}`, {
        method: "POST",
        headers: { ...headers(key, file.type || "application/octet-stream"), "x-upsert": "false" },
        body: file
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return json(response.status, { error: data.message || data.error || "Could not upload file" });
      return json(201, {
        file: {
          pathname: objectPath,
          url: publicUrl(url, bucket, objectPath),
          downloadUrl: publicUrl(url, bucket, objectPath),
          size: file.size,
          contentType: file.type || "application/octet-stream",
          uploadedAt: new Date().toISOString()
        },
        storage: data
      });
    }

    if (request.method === "DELETE") {
      const body = await request.json().catch(() => ({}));
      const pathname = String(body.pathname || "").replace(/^\/+/, "");
      if (!pathname || pathname.includes("..")) return json(400, { error: "Missing or invalid file path" });
      const response = await fetchWithTimeout(`${url}/storage/v1/object/${encodeURIComponent(bucket)}`, {
        method: "DELETE",
        headers: headers(key),
        body: JSON.stringify({ prefixes: [pathname] })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return json(response.status, { error: data.message || data.error || "Could not delete file" });
      return json(200, { ok: true });
    }

    return json(405, { error: "Method not allowed" });
  } catch (error) {
    console.error("Supabase file API error", error);
    const message = error?.name === "AbortError" ? "Supabase Storage request timed out. Check the Vercel Supabase URL and keys." : "Supabase Storage is not configured or is unavailable.";
    return json(503, { error: message });
  }
}
