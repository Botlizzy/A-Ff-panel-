
(function () {
  const passwordInput = document.getElementById("admin-password");
  const uploadButton = document.getElementById("admin-upload");
  const refreshButton = document.getElementById("admin-refresh");
  const message = document.getElementById("admin-msg");
  const list = document.getElementById("admin-list");

  function headers() { return { "x-admin-password": passwordInput?.value || "" }; }
  function setMessage(text, type) { message.textContent = text; message.className = `msg ${type || ""}`; }
  function formatSize(bytes) {
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
      list.innerHTML = data.files.length ? data.files.map((file) => `<article class="file-card"><div><strong>${escape(file.pathname)}</strong><span>${formatSize(file.size)} · ${new Date(file.uploadedAt).toLocaleString()}</span></div><button class="btn danger" data-path="${escape(file.pathname)}" type="button">Delete</button></article>`).join("") : '<p class="hint">No files uploaded yet.</p>';
      list.querySelectorAll("[data-path]").forEach((button) => button.addEventListener("click", () => deleteFile(button.dataset.path)));
    } catch (error) { setMessage(error.message || "Could not load files.", "error"); }
  }

  async function deleteFile(url) {
    if (!window.confirm("Delete this file for everyone?")) return;
    try {
      await readJson(await fetch("/api/supabase-files", { method: "DELETE", headers: { ...headers(), "content-type": "application/json" }, body: JSON.stringify({ pathname: url }) }));
      setMessage("File deleted.", "ok");
      await loadFiles();
    } catch (error) { setMessage(error.message || "Delete failed.", "error"); }
  }  uploadButton?.addEventListener("click", () => {
    setMessage("Upload the file from Supabase Storage, then tap Refresh list.", "ok");
    window.open("https://supabase.com/dashboard", "_blank", "noopener");
  });
;
  refreshButton?.addEventListener("click", loadFiles);
  loadFiles();
})();
