import { handleUpload } from "@vercel/blob/client";

if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.UPLOAD_ADMIN_PASSWORD_READ_WRITE_TOKEN) {
  process.env.BLOB_READ_WRITE_TOKEN = process.env.UPLOAD_ADMIN_PASSWORD_READ_WRITE_TOKEN;
}
if (!process.env.BLOB_STORE_ID && process.env.UPLOAD_ADMIN_PASSWORD_STORE_ID) {
  process.env.BLOB_STORE_ID = process.env.UPLOAD_ADMIN_PASSWORD_STORE_ID;
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    return await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let payload = {};
        try { payload = JSON.parse(clientPayload || "{}"); } catch {}
        if (!process.env.UPLOAD_ADMIN_PASSWORD || payload.password !== process.env.UPLOAD_ADMIN_PASSWORD) {
          throw new Error("Admin password required");
        }
        return {
          allowedContentTypes: undefined,
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true
        };
      },
      onUploadCompleted: async () => {}
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Upload authorization failed" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }
}
