import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

function response(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}

export default async function handler(request) {
  if (request.method !== "GET") return response(405, { error: "Method not allowed" });
  if (!process.env.STATS_KEY || request.headers.get("x-stats-key") !== process.env.STATS_KEY) {
    return response(401, { error: "Unauthorized" });
  }

  const today = new Date();
  const days = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);
    const dateKey = date.toISOString().slice(0, 10);
    const [visitors, generators, generations] = await Promise.all([
      redis.scard(`eliminator:${dateKey}:visitors`),
      redis.scard(`eliminator:${dateKey}:generators`),
      redis.get(`eliminator:${dateKey}:generations`)
    ]);
    days.push({
      date: dateKey,
      visitors: Number(visitors || 0),
      generators: Number(generators || 0),
      generations: Number(generations || 0)
    });
  }

  return response(200, { days });
}
