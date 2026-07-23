export function createDialogService() {
  function ensureDialog() {
    let dialog = document.getElementById("sportlab-core-dialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "sportlab-core-dialog";
    dialog.className = "sl-core-dialog";
    document.body.appendChild(dialog);
    return dialog;
  }
  function confirm({ title = "Confirmation", message = "Confirmer cette action ?", confirmLabel = "Confirmer", cancelLabel = "Annuler" } = {}) {
    const dialog = ensureDialog();
    return new Promise(resolve => {
      dialog.innerHTML = `<form method="dialog" class="sl-core-dialog-card"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><div class="sl-core-dialog-actions"><button value="cancel">${escapeHtml(cancelLabel)}</button><button class="sl-button sl-button-primary" value="confirm">${escapeHtml(confirmLabel)}</button></div></form>`;
      dialog.addEventListener("close", () => resolve(dialog.returnValue === "confirm"), { once: true });
      dialog.showModal();
    });
  }
  return Object.freeze({ confirm });
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[char])); }
