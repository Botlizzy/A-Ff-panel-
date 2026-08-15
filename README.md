# ELIMINATOR SENSI GENERATOR

Static website with a client-side access screen, device-based Sensei generation, local daily analytics, WhatsApp feedback, and shared administrator-uploaded files.

## Features

- Login page with the existing access code configured by the site owner.
- Device input with deterministic “Get sensi” and variant generation.
- Local daily counts for visitors, unique Sensei generators, and total generation actions.
- Feedback page that opens WhatsApp with a pre-filled message. The recipient number is intentionally kept out of this public repository.
- **Uploaded Hacks** page at `/uploaded-hacks.html`, visible from the logged-in generator page, where users can download shared files.
- File management page at `/admin-uploaded-hacks.html` for uploading and deleting files.

## Vercel Blob setup

Shared uploads require a Vercel Blob store connected to this Vercel project. In the Vercel dashboard, open the project’s **Storage** section, create or select a Blob store, and connect it to the project’s Production environment. Keep the store credentials managed by Vercel; never copy them into this repository.

The Blob store may be private. The application serves private files through its server-side download route rather than exposing the Blob credential or private storage URL to the browser.

## File management access

Password protection has intentionally been removed from the file-management page at the owner’s request. Anyone who knows or discovers `/admin-uploaded-hacks.html` can upload or delete files. Use an unshared deployment URL or add Vercel Authentication before using this in a public production site.

ZIP, APK, and other file types are supported up to the configured upload limit. Only upload files you own or have permission to share. Do not use the feature to distribute malware, stolen data, or unauthorized material.

## Local analytics limitation

The stats page reports the last 14 UTC calendar days recorded by that browser. It does not combine visitors from different devices because this no-setup version uses browser local storage.

## Security note

The website’s basic login is client-side and should not be treated as strong authentication. The file-management page is also unprotected after password removal. If you need real administrator-only access, enable Vercel Authentication or another server-side authentication layer before sharing the admin page publicly.
