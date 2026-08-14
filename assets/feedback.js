(function () {
  const form = document.getElementById("feedback-form");
  const nameInput = document.getElementById("feedback-name");
  const messageInput = document.getElementById("feedback-message");
  const status = document.getElementById("feedback-msg");
  const whatsappNumber = "2349039727490";

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = String(nameInput?.value || "").trim();
    const message = String(messageInput?.value || "").trim();
    if (!message) {
      status.textContent = "Please write your feedback first.";
      status.className = "msg error";
      messageInput?.focus();
      return;
    }

    const text = `ELIMINATOR feedback${name ? ` from ${name}` : ""}:\n\n${message}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    status.textContent = "WhatsApp opened in a new tab. Review the message and send it there.";
    status.className = "msg ok";
  });
})();
