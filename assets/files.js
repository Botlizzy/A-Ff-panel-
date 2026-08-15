(function () {
  if (sessionStorage.getItem("eliminator_auth") !== "1") {
    window.location.replace("./index.html");
    return;
  }

  const list = document.getElementById("files-list");
  const message = document.getElementById("files-msg");
  const refresh = document.getElementById("files-refresh");

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function loadFiles() {
    message.textContent = "Loading files…";
    try {
      const response = await fetch("/api/files", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load files");
      if (!data.files.length) {
        list.innerHTML = '<div class="note"><div class="note-title">No files yet</div><div class="note-text">The administrator has not uploaded any files.</div></div>';
      } else {
        list.innerHTML = data.files.map((file) => `<article class="file-card"><div><strong>${escapeHtml(file.pathname)}</strong><span>${formatSize(file.size)} · ${new Date(file.uploadedAt).toLocaleString()}</span></div><a class="btn glow" href="${escapeAttr(file.url)}" download>Download</a></article>`).join("");
      }
      message.textContent = `${data.files.length} file${data.files.length === 1 ? "" : "s"} available.`;
      message.className = "msg ok";
    } catch (error) {
      message.textContent = error.message || "Could not load files.";
      message.className = "msg error";
    }
  }

  function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value); }
  refresh?.addEventListener("click", loadFiles);
  loadFiles();
})();
