(function () {
  const passwordInput = document.getElementById("admin-password");
  const fileInput = document.getElementById("admin-file");
  const uploadButton = document.getElementById("admin-upload");
  const refreshButton = document.getElementById("admin-refresh");
  const message = document.getElementById("admin-msg");
  const list = document.getElementById("admin-list");

  function headers() { return { "x-admin-password": passwordInput.value }; }
  function setMessage(text, type) { message.textContent = text; message.className = `msg ${type || ""}`; }
  function formatSize(bytes) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
  function escape(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

  async function loadFiles() {
    try {
      const response = await fetch("/api/files", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load files");
      list.innerHTML = data.files.length ? data.files.map((file) => `<article class="file-card"><div><strong>${escape(file.pathname)}</strong><span>${formatSize(file.size)} · ${new Date(file.uploadedAt).toLocaleString()}</span></div><button class="btn danger" data-url="${escape(file.url)}" type="button">Delete</button></article>`).join("") : '<p class="hint">No files uploaded yet.</p>';
      list.querySelectorAll("[data-url]").forEach((button) => button.addEventListener("click", () => deleteFile(button.dataset.url)));
    } catch (error) { setMessage(error.message || "Could not load files.", "error"); }
  }

  async function deleteFile(url) {
    if (!window.confirm("Delete this file for everyone?")) return;
    const response = await fetch("/api/files", { method: "DELETE", headers: { ...headers(), "content-type": "application/json" }, body: JSON.stringify({ url }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Delete failed.", "error");
    setMessage("File deleted.", "ok");
    loadFiles();
  }

  async function uploadFile() {
    const file = fileInput.files[0];
    if (!passwordInput.value) return setMessage("Enter the admin password.", "error");
    if (!file) return setMessage("Choose a file first.", "error");
    if (file.size > 4 * 1024 * 1024) return setMessage("Files must be 4 MB or smaller.", "error");
    const form = new FormData();
    form.append("file", file);
    setMessage("Uploading…");
    const response = await fetch("/api/files", { method: "POST", headers: headers(), body: form });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Upload failed.", "error");
    fileInput.value = "";
    setMessage("File uploaded for all users.", "ok");
    loadFiles();
  }

  uploadButton?.addEventListener("click", uploadFile);
  refreshButton?.addEventListener("click", loadFiles);
  loadFiles();
})();
