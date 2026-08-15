import { upload } from "https://esm.sh/@vercel/blob@1.1.1/client";

(function () {
  const passwordInput = document.getElementById("admin-password");
  const fileInput = document.getElementById("admin-file");
  const uploadButton = document.getElementById("admin-upload");
  const refreshButton = document.getElementById("admin-refresh");
  const message = document.getElementById("admin-msg");
  const list = document.getElementById("admin-list");
  const MAX_SIZE = 100 * 1024 * 1024;

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
      const data = await readJson(await fetch("/api/files", { cache: "no-store" }));
      list.innerHTML = data.files.length ? data.files.map((file) => `<article class="file-card"><div><strong>${escape(file.pathname)}</strong><span>${formatSize(file.size)} · ${new Date(file.uploadedAt).toLocaleString()}</span></div><button class="btn danger" data-url="${escape(file.url)}" type="button">Delete</button></article>`).join("") : '<p class="hint">No files uploaded yet.</p>';
      list.querySelectorAll("[data-url]").forEach((button) => button.addEventListener("click", () => deleteFile(button.dataset.url)));
    } catch (error) { setMessage(error.message || "Could not load files.", "error"); }
  }

  async function deleteFile(url) {
    if (!window.confirm("Delete this file for everyone?")) return;
    try {
      await readJson(await fetch("/api/files", { method: "DELETE", headers: { ...headers(), "content-type": "application/json" }, body: JSON.stringify({ url }) }));
      setMessage("File deleted.", "ok");
      await loadFiles();
    } catch (error) { setMessage(error.message || "Delete failed.", "error"); }
  }

  async function uploadFile() {
    const file = fileInput.files[0];
    if (!passwordInput?.value) return setMessage("Enter the upload password.", "error");
    if (!file) return setMessage("Choose a file first.", "error");
    if (file.size > MAX_SIZE) return setMessage("Files must be 100 MB or smaller.", "error");

    uploadButton.disabled = true;
    setMessage(`Uploading ${file.name}…`);
    try {
      await upload(`uploaded-hacks/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload-token",
        clientPayload: JSON.stringify({ password: passwordInput?.value || "" })
      });
      fileInput.value = "";
      setMessage("File uploaded for all users.", "ok");
      await loadFiles();
    } catch (error) {
      setMessage(error.message || "Upload failed. Check the Blob connection and password.", "error");
    } finally {
      uploadButton.disabled = false;
    }
  }

  uploadButton?.addEventListener("click", uploadFile);
  refreshButton?.addEventListener("click", loadFiles);
  loadFiles();
})();
