# ELIMINATOR SENSI GENERATOR

Static website with a client-side access screen, device-based Sensei generation, local daily analytics, and WhatsApp feedback.

## Features

- Login page with the existing access code: `ELIMINATE`.
- Device input with deterministic “Get sensi” and variant generation.
- Daily counts for visitors, unique Sensei generators, and total generation actions.
- Feedback page that opens WhatsApp with a pre-filled message addressed to `+234 903 972 7490`.
- Stats dashboard at `/stats.html`.

## Deploy on Vercel

This version requires no database, Redis connection, API key, or external analytics service. Deploy the repository as a static site on Vercel with no build command and `.` as the output directory.

Open `/stats.html` to view the last 14 UTC calendar days recorded by that browser. “Unique generators” counts distinct browser IDs that generated at least one Sensei that day. “Generations” counts every successful generation, including variants.

Because this no-setup version uses browser local storage, the dashboard shows statistics from the browser where they were generated. It does not combine visitors from different phones, browsers, or devices. The tracker stores a random browser ID locally and does not send names, IP addresses, device names, or generated settings anywhere.

## Feedback flow

The feedback form does not send a message automatically. It opens WhatsApp at `https://wa.me/2349039727490` with the user’s text pre-filled, so the user can review and send it manually.

## Security note

The access code is a **client-side lock** and is suitable only for basic gating. The local analytics dashboard is also browser-local and is not a server-side admin report.
