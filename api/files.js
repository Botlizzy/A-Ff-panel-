import { del, list, put } from "@vercel/blob";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const PREFIX = "uploaded-hacks/";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}

function isAdmin(request) {
  return Boolean(process.env.UPLOAD_ADMIN_PASSWORD) &&
    request.headers.get("x-admin-password") === process.env.UPLOAD_ADMIN_PASSWORD;
}

export default async function handler(request) {
  if (request.method === "GET") {
    const result = await list({ prefix: PREFIX, limit: 1000 });
    const files = result.blobs.map((blob) => ({
      pathname: blob.pathname.replace(PREFIX, ""),
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt
    }));
    return json(200, { files });
  }

  if (!isAdmin(request)) return json(401, { error: "Admin password required" });

  if (request.method === "POST") {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.name) return json(400, { error: "Choose a file first" });
    if (file.size > MAX_FILE_SIZE) return json(413, { error: "Files must be 4 MB or smaller" });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);
    const blob = await put(`${PREFIX}${Date.now()}-${safeName}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || "application/octet-stream"
    });
    return json(201, { file: { pathname: safeName, url: blob.url, size: blob.size, uploadedAt: new Date().toISOString() } });
  }

  if (request.method === "DELETE") {
    const body = await request.json();
    const url = String(body.url || "");
    if (!url) return json(400, { error: "Missing file URL" });
    await del(url);
    return json(200, { ok: true });
  }

  return json(405, { error: "Method not allowed" });
}
