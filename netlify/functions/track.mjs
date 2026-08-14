import { getStore } from "@netlify/blobs";

const ALLOWED_EVENTS = new Set(["page_view", "sensi_generated"]);
const VISITOR_ID_PATTERN = /^[a-zA-Z0-9_-]{16,100}$/;

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    },
    body: JSON.stringify(body)
  };
}

export default async function handler(event) {
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const eventName = String(payload.event || "");
  const visitorId = String(payload.visitorId || "");
  if (!ALLOWED_EVENTS.has(eventName) || !VISITOR_ID_PATTERN.test(visitorId)) {
    return json(400, { error: "Invalid analytics event" });
  }

  const date = new Date().toISOString().slice(0, 10);
  const store = getStore({ name: "eliminator-analytics", consistency: "strong" });
  const key = `day:${date}`;
  const current = (await store.get(key, { type: "json" })) || {
    date,
    visitors: [],
    generators: [],
    generations: 0
  };

  if (eventName === "page_view" && !current.visitors.includes(visitorId)) {
    current.visitors.push(visitorId);
  }

  if (eventName === "sensi_generated") {
    if (!current.visitors.includes(visitorId)) current.visitors.push(visitorId);
    if (!current.generators.includes(visitorId)) current.generators.push(visitorId);
    current.generations += 1;
  }

  await store.setJSON(key, current);
  return json(200, { ok: true });
}
