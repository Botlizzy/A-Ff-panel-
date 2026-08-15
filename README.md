# ELIMINATOR SENSI GENERATOR

Static website with a client-side access screen, device-based Sensei generation, daily analytics, and WhatsApp feedback.

## Features

- Login page with the existing access code: `ELIMINATE`.
- Device input with deterministic “Get sensi” and variant generation.
- Daily counts for unique visitors, unique Sensei generators, and total generation actions.
- Feedback page that opens WhatsApp with a pre-filled message addressed to `+234 903 972 7490`.
- Protected stats dashboard at `/stats.html`.

## Deploy on Vercel

The analytics now uses Vercel serverless API routes and a Redis database connected through the Vercel Marketplace.

1. In Vercel, open the project and connect a Redis/Upstash database from **Storage** or the **Marketplace**. This supplies `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the project.
2. Add this environment variable in **Project Settings → Environment Variables**:

   ```text
   STATS_KEY=ELIZZY NOW
   ```

3. Apply the variable to Production, Preview, and Development if you want the dashboard available in each environment.
4. Redeploy the project.
5. Open `/stats.html`, enter `ELIZZY NOW`, and select **Load stats**.

The dashboard reports the last 14 UTC calendar days. “Unique generators” counts distinct browser visitor IDs that generated at least one Sensei that day. “Generations” counts every successful generation, including variants. The tracker stores a random browser ID in local storage and does not send names, device details, IP addresses, or generated settings to the analytics endpoint.

Do not put `STATS_KEY` in GitHub source files. It must remain a Vercel environment variable.

## Feedback flow

The feedback form does not send a message automatically. It opens WhatsApp at `https://wa.me/2349039727490` with the user’s text pre-filled, so the user can review and send it manually.

## Security note

The access code remains a **client-side lock** and is suitable only for basic gating. The analytics dashboard is protected separately by the server-side `STATS_KEY` environment variable.
