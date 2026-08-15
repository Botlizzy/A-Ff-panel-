import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const allowedEvents = new Set(["page_view", "sensi_generated"]);
const visitorPattern = /^[a-zA-Z0-9_-]{16,100}$/;

function response(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return response(405, { error: "Method not allowed" });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return response(400, { error: "Invalid JSON" });
  }

  const eventName = String(payload.event || "");
  const visitorId = String(payload.visitorId || "");
  if (!allowedEvents.has(eventName) || !visitorPattern.test(visitorId)) {
    return response(400, { error: "Invalid analytics event" });
  }

  const date = new Date().toISOString().slice(0, 10);
  const visitorsKey = `eliminator:${date}:visitors`;
  const generatorsKey = `eliminator:${date}:generators`;
  const generationsKey = `eliminator:${date}:generations`;

  await redis.sadd(visitorsKey, visitorId);
  if (eventName === "sensi_generated") {
    await redis.sadd(generatorsKey, visitorId);
    await redis.incr(generationsKey);
  }

  return response(200, { ok: true });
}
