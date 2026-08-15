(function () {
  if (sessionStorage.getItem("eliminator_auth") !== "1") { window.location.replace("./index.html"); return; }
  const promptInput = document.getElementById("anime-prompt");
  const generateButton = document.getElementById("anime-generate");
  const animeStatus = document.getElementById("anime-status");
  const result = document.getElementById("image-result");
  const image = document.getElementById("generated-image");
  const imagePrompt = document.getElementById("image-prompt");
  const saveButton = document.getElementById("save-image");
  const downloadButton = document.getElementById("download-image");
  const imageActionMsg = document.getElementById("image-action-msg");
  const scoresList = document.getElementById("scores-list");
  const scoresStatus = document.getElementById("scores-status");
  const scoresUpdated = document.getElementById("scores-updated");
  const refreshScores = document.getElementById("scores-refresh");
  let generatedUrl = "";
  let generatedPrompt = "";

  function setText(el, text, type) { if (!el) return; el.textContent = text || ""; el.className = type ? `msg ${type}` : "msg"; }
  function escape(value) { return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function formatDate(value) { if (!value) return ""; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  function fileName() { return `eliminator-anime-${Date.now()}.png`; }
  async function downloadBlob() { const response = await fetch(generatedUrl); if (!response.ok) throw new Error("Image download was refused by the image host."); return response.blob(); }
  async function saveImage() {
    if (!generatedUrl) return setText(imageActionMsg, "Generate an image first.", "error");
    try {
      if (navigator.share && navigator.canShare) {
        const blob = await downloadBlob();
        const file = new File([blob], fileName(), { type: blob.type || "image/png" });
        if (navigator.canShare({ files: [file] })) { await navigator.share({ title: "ELIMINATOR anime artwork", files: [file] }); setText(imageActionMsg, "Image saved using the share menu.", "ok"); return; }
      }
      localStorage.setItem("eliminator_last_anime_image", JSON.stringify({ url: generatedUrl, prompt: generatedPrompt, savedAt: new Date().toISOString() }));
      setText(imageActionMsg, "Image saved in this browser. Use Download for your device storage.", "ok");
    } catch (error) { setText(imageActionMsg, error.message || "Could not save the image.", "error"); }
  }
  async function downloadImage() {
    if (!generatedUrl) return setText(imageActionMsg, "Generate an image first.", "error");
    try {
      const blob = await downloadBlob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName();
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      setText(imageActionMsg, "Download started.", "ok");
    } catch (error) {
      const link = document.createElement("a"); link.href = generatedUrl; link.target = "_blank"; link.rel = "noopener"; link.click();
      setText(imageActionMsg, error.message || "Direct download unavailable; image opened in a new tab.", "error");
    }
  }
  async function generateImage() {
    const prompt = String(promptInput?.value || "").trim();
    if (prompt.length < 3) return setText(animeStatus, "Enter an anime prompt first.", "error");
    generateButton.disabled = true; setText(animeStatus, "Generating anime artwork…", ""); result.hidden = true;
    try {
      const response = await fetch("/api/premium-image", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.imageUrl) throw new Error(data.error || "Image generation failed.");
      generatedUrl = data.imageUrl; generatedPrompt = data.prompt || prompt; image.src = generatedUrl; imagePrompt.textContent = generatedPrompt; result.hidden = false; setText(animeStatus, "Image ready.", "ok"); setText(imageActionMsg, "Choose Save or Download.", "");
    } catch (error) { setText(animeStatus, error.message || "Image generation failed.", "error"); }
    finally { generateButton.disabled = false; }
  }
  function renderGame(game) {
    const statusClass = /progress|live/i.test(game.status) ? "in-progress" : /final|complete/i.test(game.status) ? "final" : "scheduled";
    return `<article class="score-card"><div class="score-top"><span class="score-status ${statusClass}">${escape(game.status)}</span><span>${escape(game.clock || (game.period ? `Period ${game.period}` : formatDate(game.date)))}</span></div><div class="team-row"><div class="team-name"><img src="${escape(game.awayTeam.logo)}" alt="" loading="lazy" /><span>${escape(game.awayTeam.name)}</span></div><strong>${escape(game.awayTeam.score)}</strong></div><div class="team-row"><div class="team-name"><img src="${escape(game.homeTeam.logo)}" alt="" loading="lazy" /><span>${escape(game.homeTeam.name)}</span></div><strong>${escape(game.homeTeam.score)}</strong></div><div class="score-foot">${escape(game.venue || game.broadcast || game.shortName)}</div></article>`;
  }
  async function loadScores() {
    refreshScores.disabled = true; scoresStatus.textContent = "Updating…";
    try { const response = await fetch("/api/premium-livescore", { cache: "no-store" }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Could not load match results."); scoresList.innerHTML = data.games?.length ? data.games.map(renderGame).join("") : '<div class="empty-state">No live or scheduled games right now.</div>'; scoresStatus.textContent = "Live results"; scoresUpdated.textContent = data.updatedAt ? `Updated ${formatDate(data.updatedAt)}` : ""; }
    catch (error) { scoresStatus.textContent = "Unavailable"; scoresList.innerHTML = `<div class="empty-state error-state">${escape(error.message || "Could not load match results.")}</div>`; }
    finally { refreshScores.disabled = false; }
  }
  generateButton?.addEventListener("click", generateImage); promptInput?.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") generateImage(); }); saveButton?.addEventListener("click", saveImage); downloadButton?.addEventListener("click", downloadImage); refreshScores?.addEventListener("click", loadScores); loadScores(); setInterval(loadScores, 60000);
})();
