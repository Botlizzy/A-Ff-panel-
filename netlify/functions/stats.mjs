import { getStore } from "@netlify/blobs";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
    body: JSON.stringify(body)
  };
}

export default async function handler(event) {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });
  const configuredKey = process.env.STATS_KEY;
  const suppliedKey = event.headers["x-stats-key"] || event.headers["X-Stats-Key"];
  if (!configuredKey || suppliedKey !== configuredKey) {
    return json(401, { error: "Unauthorized" });
  }

  const store = getStore({ name: "eliminator-analytics", consistency: "strong" });
  const today = new Date();
  const days = [];
  for (let offset = 0; offset < 14; offset += 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);
    const key = `day:${date.toISOString().slice(0, 10)}`;
    const item = (await store.get(key, { type: "json" })) || {
      date: key.slice(4), visitors: [], generators: [], generations: 0
    };
    days.push({
      date: item.date,
      visitors: Array.isArray(item.visitors) ? item.visitors.length : 0,
      generators: Array.isArray(item.generators) ? item.generators.length : 0,
      generations: Number(item.generations || 0)
    });
  }

  return json(200, { days: days.reverse() });
}
