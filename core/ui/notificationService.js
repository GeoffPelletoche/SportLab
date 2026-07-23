import { showToast } from "../../ui/interactions/sportlabUi.js";
export function createNotificationService() {
  return Object.freeze({
    info: (text, title = "Information") => showToast({ title, text, tone: "info" }),
    success: (text, title = "Succès") => showToast({ title, text, tone: "success" }),
    warning: (text, title = "Attention") => showToast({ title, text, tone: "warning" }),
    error: (text, title = "Erreur") => showToast({ title, text, tone: "danger" })
  });
}
