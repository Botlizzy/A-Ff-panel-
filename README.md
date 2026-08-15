# ELIMINATOR SENSI GENERATOR

Static website with a client-side access screen, device-based Sensei generation, local daily analytics, WhatsApp feedback, and shared administrator-uploaded files.

## Features

- Login page with the existing access code: `ELIMINATE`.
- Device input with deterministic “Get sensi” and variant generation.
- Local daily counts for visitors, unique Sensei generators, and total generation actions.
- Feedback page that opens WhatsApp with a pre-filled message addressed to `+234 903 972 7490`.
- **Uploaded Hacks** page at `/uploaded-hacks.html`, visible from the logged-in generator page, where users can download shared files.
- Separate administrator page at `/admin-uploaded-hacks.html` for uploading and deleting files.

## Deploy on Vercel

The local analytics needs no database, but shared file uploads require a Vercel Blob store. In Vercel, connect a Blob store to the project and add this environment variable:

```text
UPLOAD_ADMIN_PASSWORD=ELIZZY NOW
```

Vercel Blob supplies the storage token automatically after the store is connected. Redeploy after adding the environment variable. The administrator opens `/admin-uploaded-hacks.html`, enters the password, chooses a file, and uploads it. Files are limited to 4 MB and are listed for logged-in users on `/uploaded-hacks.html`.

The existing static login is a basic client-side gate, not a strong authentication system. The administrator password is checked server-side and must not be committed to GitHub. Only upload files you own or have permission to share; do not use the page to distribute malware, stolen data, or unauthorized material.

## Local analytics limitation

The stats page reports the last 14 UTC calendar days recorded by that browser. It does not combine visitors from different devices because this no-setup version uses browser local storage.

## Feedback flow

The feedback form does not send a message automatically. It opens WhatsApp at `https://wa.me/2349039727490` with the user’s text pre-filled, so the user can review and send it manually.
