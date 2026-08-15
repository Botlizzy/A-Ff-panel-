# ELIMINATOR SENSI GENERATOR

Static website with a client-side access screen, device-based Sensei generation, local daily analytics, WhatsApp feedback, and shared uploaded files.

## Features

- Login page with the existing access code configured by the site owner.
- Device input with deterministic “Get sensi” and variant generation.
- Local daily counts for visitors, unique Sensei generators, and total generation actions.
- Feedback page that opens WhatsApp with a pre-filled message. The recipient number is intentionally kept out of this public repository.
- **Uploaded Hacks** page at `/upload` or `/uploaded-hacks.html`, where users can download shared files.
- Password-protected upload page at `/admin-upload` or `/admin-upload.html`.

## Supabase Storage setup

The file list now uses **Supabase Storage** instead of Vercel Blob. Create a Supabase project and a public bucket named `uploaded-hacks`. Upload files from the Supabase Storage dashboard; the website will list them automatically.

Add these environment variables in Vercel Production:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
SUPABASE_BUCKET=uploaded-hacks
```

The service-role key is server-only. Never place it in browser code, GitHub, screenshots, or public messages.

## Upload password

Add the administrator password only in Vercel under **Project Settings → Environment Variables**:

```text
Name: UPLOAD_ADMIN_PASSWORD
Value: your-private-upload-password
Environment: Production
```

The real password is intentionally not stored in this README or in GitHub. Redeploy after adding or changing the variable. Use the admin page to open Supabase Storage and refresh the list or delete files, and open `/upload` to view and download them.

ZIP, APK, and other file types are supported up to 100 MB. Only upload files you own or have permission to share. Do not use the feature to distribute malware, stolen data, or unauthorized material.

## Local analytics limitation

The stats page reports the last 14 UTC calendar days recorded by that browser. It does not combine visitors from different devices because this no-setup version uses browser local storage.

## Security note

The main website login is client-side and should not be treated as strong authentication. The delete API operation uses the server-side `UPLOAD_ADMIN_PASSWORD` environment variable, while file storage is handled by Supabase Storage. If the password is exposed, rotate it in Vercel and redeploy.
