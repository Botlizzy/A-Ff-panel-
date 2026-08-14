# ELIMINATOR SENSI GENERATOR

Static website with a client-side access screen, device-based Sensei generation, daily analytics, and WhatsApp feedback.

## Features

- Login page with the existing access code: `ELIMINATE`.
- Device input with deterministic “Get sensi” and variant generation.
- Daily counts for unique visitors, unique Sensei generators, and total generation actions.
- Feedback page that opens WhatsApp with a pre-filled message addressed to `+234 903 972 7490`.
- Protected stats dashboard at `/stats.html`.

## Deploy on Netlify

Netlify is required for the included analytics functions and persistent Netlify Blobs storage.

1. Push or connect this repository to Netlify.
2. Build command: **none**.
3. Publish directory: **the repository root** (`.`).
4. Add a Netlify environment variable named `STATS_KEY` with a long private value. This key protects the analytics dashboard and should not be shared publicly.
5. Redeploy the site after adding the environment variable.
6. Open `/stats.html`, enter the same `STATS_KEY`, and select **Load stats**.

The dashboard reports the last 14 UTC calendar days. “Unique generators” counts distinct browser visitor IDs that generated at least one Sensei that day. “Generations” counts every successful generation, including variants. The tracker stores a random browser ID in local storage and does not send names, device details, IP addresses, or generated settings to the analytics endpoint.

## Feedback flow

The feedback form does not send a message automatically. It opens WhatsApp at `https://wa.me/2349039727490` with the user’s text pre-filled, so the user can review and send it manually.

## Deploy on Vercel

The original static pages can still be deployed on Vercel, but the included daily analytics functions use Netlify Blobs and therefore require Netlify for analytics storage. If deploying on Vercel, the site pages will work but `/api/track` and `/api/stats` will need to be replaced with a Vercel-compatible database or analytics provider.

## Security note

The access code remains a **client-side lock** and is suitable only for basic gating. The analytics dashboard is protected separately by the server-side `STATS_KEY` environment variable.
