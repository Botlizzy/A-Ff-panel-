import { del, get, list, put } from "@vercel/blob";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const PREFIX = "uploaded-hacks/";

// Vercel can prefix Blob variables with the store connection name.
// Support both the standard names and the prefixed names shown in the dashboard.
if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.UPLOAD_ADMIN_PASSWORD_READ_WRITE_TOKEN) {
  process.env.BLOB_READ_WRITE_TOKEN = process.env.UPLOAD_ADMIN_PASSWORD_READ_WRITE_TOKEN;
}
if (!process.env.BLOB_STORE_ID && process.env.UPLOAD_ADMIN_PASSWORD_STORE_ID) {
  process.env.BLOB_STORE_ID = process.env.UPLOAD_ADMIN_PASSWORD_STORE_ID;
}

const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.UPLOAD_ADMIN_PASSWORD_READ_WRITE_TOKEN;

function isAdmin(request) {
  return Boolean(process.env.UPLOAD_ADMIN_PASSWORD) && request.headers.get("x-admin-password") === process.env.UPLOAD_ADMIN_PASSWORD;
}
const blobStoreId = process.env.BLOB_STORE_ID || process.env.UPLOAD_ADMIN_PASSWORD_STORE_ID;
const blobCredentials = blobToken ? { token: blobToken } : (blobStoreId ? { storeId: blobStoreId } : {});

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}

export default async function handler(request) {
  try {
    if (request.method === "GET") {
      const requestedPath = new URL(request.url).searchParams.get("pathname");
      if (requestedPath) {
        const result = await get(requestedPath, { access: "public", ...blobCredentials });
        if (!result || result.statusCode !== 200) return new Response("Not found", { status: 404 });
        const filename = (requestedPath.startsWith(PREFIX) ? requestedPath.slice(PREFIX.length) : requestedPath).replace(/^[0-9]+-[a-zA-Z0-9]+-/, "");
        return new Response(result.stream, {
          status: 200,
          headers: {
            "content-type": result.blob.contentType || "application/octet-stream",
            "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
            "x-content-type-options": "nosniff",
            "cache-control": "private, no-cache"
          }
        });
      }

      const listResult = list({ limit: 1000, ...blobCredentials });
      const result = await Promise.race([
        listResult,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Blob listing timed out")), 8000))
      ]);
      const files = result.blobs.map((blob) => ({
        pathname: blob.pathname.replace(PREFIX, "").replace(/^[0-9]+-[a-zA-Z0-9]+-/, ""),
        url: blob.url,
        downloadUrl: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        contentType: blob.contentType || "application/octet-stream"
      }));
      return json(200, { files });
    }

    if (!isAdmin(request)) return json(401, { error: "Admin password required" });

    if (request.method === "POST") {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || !file.name) return json(400, { error: "Choose a file first" });
      if (file.size > MAX_FILE_SIZE) return json(413, { error: "Files must be 100 MB or smaller" });

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);
      const blob = await put(`${PREFIX}${Date.now()}-${safeName}`, file, {
        access: "public",
        addRandomSuffix: true,
        ...blobCredentials,
        contentType: file.type || "application/octet-stream"
      });
      return json(201, { file: { pathname: safeName, url: blob.url, size: blob.size, uploadedAt: new Date().toISOString() } });
    }

    if (request.method === "DELETE") {
      const body = await request.json();
      const url = String(body.url || "");
      if (!url) return json(400, { error: "Missing file URL" });
      await del(url, blobCredentials);
      return json(200, { ok: true });
    }

    return json(405, { error: "Method not allowed" });
  } catch (error) {
    console.error("File API error", error);
    return json(503, { error: "The Blob store is not responding. Connect this store to the Vercel project and Production, then redeploy." });
  }
}
