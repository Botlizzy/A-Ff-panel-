(function () {
  const passwordInput = document.getElementById("admin-password");
  const fileInput = document.getElementById("admin-file");
  const uploadButton = document.getElementById("admin-upload");
  const refreshButton = document.getElementById("admin-refresh");
  const message = document.getElementById("admin-msg");
  const list = document.getElementById("admin-list");
  const musicFileInput = document.getElementById("admin-music-file");
  const musicUploadButton = document.getElementById("admin-music-upload");
  const musicRefreshButton = document.getElementById("admin-music-refresh");
  const musicMessage = document.getElementById("admin-music-msg");
  const musicList = document.getElementById("admin-music-list");

  function headers() { return { "x-admin-password": passwordInput?.value || "" }; }
  function setMessage(text, type) { if (message) { message.textContent = text; message.className = `msg ${type || ""}`; } }
  function setMusicMessage(text, type) { if (musicMessage) { musicMessage.textContent = text; musicMessage.className = `msg ${type || ""}`; } }
  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  function escape(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  async function readJson(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }
  async function loadFiles() {
    try {
      const data = await readJson(await fetch("/api/supabase-files", { cache: "no-store" }));
      list.innerHTML = data.files.length
        ? data.files.map((file) => `<article class="file-card"><div><strong>${escape(file.pathname)}</strong><span>${formatSize(file.size)} · ${new Date(file.uploadedAt).toLocaleString()}</span></div><button class="btn danger" data-path="${escape(file.pathname)}" type="button">Delete</button></article>`).join("")
        : '<p class="hint">No files uploaded yet.</p>';
      list.querySelectorAll("[data-path]").forEach((button) => button.addEventListener("click", () => deleteFile(button.dataset.path)));
    } catch (error) {
      setMessage(error.message || "Could not load files.", "error");
    }
  }
  async function loadMusic() {
    try {
      const data = await readJson(await fetch("/api/supabase-files?music=1", { cache: "no-store" }));
      musicList.innerHTML = data.music.length
        ? data.music.map((track) => `<article class="music-admin-item"><div><strong>${escape(track.pathname.replace(/^music\//, ""))}</strong><span>${formatSize(track.size)} · ${new Date(track.uploadedAt).toLocaleString()}</span></div><audio controls preload="none" src="${escape(track.url)}"></audio><button class="btn danger" data-music-path="${escape(track.pathname)}" type="button">Delete</button></article>`).join("")
        : '<p class="hint">No background music uploaded yet. The public pages will use their ambient fallback.</p>';
      musicList.querySelectorAll("[data-music-path]").forEach((button) => button.addEventListener("click", () => deleteMusic(button.dataset.musicPath)));
    } catch (error) {
      setMusicMessage(error.message || "Could not load background music.", "error");
    }
  }
  async function uploadFile() {
    const file = fileInput?.files?.[0];
    if (!passwordInput?.value) return setMessage("Enter the upload password first.", "error");
    if (!file) return setMessage("Choose a file first.", "error");
    if (file.size > 100 * 1024 * 1024) return setMessage("Files must be 100 MB or smaller.", "error");
    const form = new FormData();
    form.append("file", file, file.name);
    uploadButton.disabled = true;
    setMessage("Uploading file…", "");
    try {
      await readJson(await fetch("/api/supabase-files", { method: "POST", headers: headers(), body: form }));
      fileInput.value = "";
      setMessage("File uploaded and shared with all users.", "ok");
      await loadFiles();
    } catch (error) {
      setMessage(error.message || "Upload failed.", "error");
    } finally {
      uploadButton.disabled = false;
    }
  }
  async function uploadMusic() {
    const file = musicFileInput?.files?.[0];
    if (!passwordInput?.value) return setMusicMessage("Enter the upload password first.", "error");
    if (!file) return setMusicMessage("Choose an audio file first.", "error");
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("kind", "music");
    musicUploadButton.disabled = true;
    setMusicMessage("Uploading background music…", "");
    try {
      await readJson(await fetch("/api/supabase-files", { method: "POST", headers: headers(), body: form }));
      musicFileInput.value = "";
      setMusicMessage("Background music uploaded. Refresh the public page to use it.", "ok");
      await loadMusic();
    } catch (error) {
      setMusicMessage(error.message || "Music upload failed.", "error");
    } finally {
      musicUploadButton.disabled = false;
    }
  }
  async function deleteFile(pathname) {
    if (!window.confirm("Delete this file for everyone?")) return;
    try {
      await readJson(await fetch("/api/supabase-files", { method: "DELETE", headers: { ...headers(), "content-type": "application/json" }, body: JSON.stringify({ pathname }) }));
      setMessage("File deleted.", "ok");
      await loadFiles();
    } catch (error) {
      setMessage(error.message || "Delete failed.", "error");
    }
  }
  async function deleteMusic(pathname) {
    if (!window.confirm("Delete this background track for everyone?")) return;
    try {
      await readJson(await fetch("/api/supabase-files", { method: "DELETE", headers: { ...headers(), "content-type": "application/json" }, body: JSON.stringify({ pathname, kind: "music" }) }));
      setMusicMessage("Background track deleted.", "ok");
      await loadMusic();
    } catch (error) {
      setMusicMessage(error.message || "Music deletion failed.", "error");
    }
  }
  uploadButton?.addEventListener("click", uploadFile);
  refreshButton?.addEventListener("click", loadFiles);
  musicUploadButton?.addEventListener("click", uploadMusic);
  musicRefreshButton?.addEventListener("click", loadMusic);
  loadFiles();
  loadMusic();
})();
