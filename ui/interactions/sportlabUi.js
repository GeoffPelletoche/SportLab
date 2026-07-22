/**
 * SportLab V6.3.7 — UI Interactions
 * Modal, toast et tabs sans dépendance externe.
 */

let activeModal = null;
let previousFocus = null;
let modalTriggersReady = false;

export function initSportLabUi(root = document) {
  initTabs(root);
  initModalTriggers(root);
  ensureToastRegion();
}

export function initTabs(root = document) {
  root.querySelectorAll("[data-sl-tabs]").forEach(tabList => {
    if (tabList.dataset.slReady === "true") {
      return;
    }

    tabList.dataset.slReady = "true";

    tabList.addEventListener("click", event => {
      const tab = event.target.closest("[data-sl-tab]");
      if (!tab || !tabList.contains(tab)) {
        return;
      }

      activateTab(tabList, tab.dataset.slTab);
    });

    tabList.addEventListener("keydown", event => {
      const tabs = [...tabList.querySelectorAll("[data-sl-tab]")];
      const currentIndex = tabs.indexOf(document.activeElement);

      if (!["ArrowLeft", "ArrowRight"].includes(event.key) || currentIndex < 0) {
        return;
      }

      event.preventDefault();

      const offset = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (currentIndex + offset + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      activateTab(tabList, tabs[nextIndex].dataset.slTab);
    });
  });
}

export function activateTab(tabList, tabId) {
  const owner = tabList.closest("[data-sl-tab-system]") || document;

  tabList.querySelectorAll("[data-sl-tab]").forEach(tab => {
    const active = tab.dataset.slTab === tabId;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  owner.querySelectorAll("[data-sl-tab-panel]").forEach(panel => {
    panel.hidden = panel.dataset.slTabPanel !== tabId;
  });
}

export function initModalTriggers(root = document) {
  if (modalTriggersReady) {
    return;
  }

  modalTriggersReady = true;

  root.addEventListener("click", event => {
    const openButton = event.target.closest("[data-sl-modal-open]");
    if (openButton) {
      openModal(openButton.dataset.slModalOpen);
      return;
    }

    const closeButton = event.target.closest("[data-sl-modal-close]");
    if (closeButton) {
      closeModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && activeModal) {
      closeModal();
    }

    if (event.key === "Tab" && activeModal) {
      trapFocus(event, activeModal);
    }
  });
}

export function openModal(idOrElement) {
  const modal =
    typeof idOrElement === "string"
      ? document.getElementById(idOrElement)
      : idOrElement;

  if (!modal) {
    return false;
  }

  if (activeModal && activeModal !== modal) {
    closeModal();
  }

  previousFocus = document.activeElement;
  activeModal = modal;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("sl-modal-open");

  const firstFocusable = getFocusable(modal)[0];
  (firstFocusable || modal).focus?.();

  return true;
}

export function closeModal() {
  if (!activeModal) {
    return false;
  }

  activeModal.hidden = true;
  activeModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("sl-modal-open");
  activeModal = null;

  previousFocus?.focus?.();
  previousFocus = null;

  return true;
}

export function showToast({
  title = "Information",
  text = "",
  tone = "info",
  icon = "",
  duration = 4200
} = {}) {
  const region = ensureToastRegion();
  const toast = document.createElement("article");

  toast.className = `sl-toast sl-toast-${sanitizeTone(tone)}`;
  toast.setAttribute("role", tone === "danger" ? "alert" : "status");

  toast.innerHTML = `
    <span aria-hidden="true">${escapeHtml(icon || getToneIcon(tone))}</span>
    <div>
      <strong class="sl-toast-title">${escapeHtml(title)}</strong>
      ${text ? `<p class="sl-toast-text">${escapeHtml(text)}</p>` : ""}
    </div>
    <button class="sl-toast-close" type="button" aria-label="Fermer">×</button>
  `;

  toast.querySelector(".sl-toast-close").addEventListener("click", () => {
    removeToast(toast);
  });

  region.appendChild(toast);

  const timeout = window.setTimeout(
    () => removeToast(toast),
    Math.max(1500, Number(duration) || 4200)
  );

  toast.dataset.timeoutId = String(timeout);

  return toast;
}

function removeToast(toast) {
  if (!toast?.isConnected) {
    return;
  }

  window.clearTimeout(Number(toast.dataset.timeoutId));
  toast.classList.add("is-leaving");
  window.setTimeout(() => toast.remove(), 180);
}

function ensureToastRegion() {
  let region = document.querySelector(".sl-toast-region");

  if (!region) {
    region = document.createElement("section");
    region.className = "sl-toast-region";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-label", "Notifications");
    document.body.appendChild(region);
  }

  return region;
}

function trapFocus(event, modal) {
  const focusable = getFocusable(modal);

  if (!focusable.length) {
    event.preventDefault();
    modal.focus?.();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function getFocusable(root) {
  return [...root.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )];
}

function sanitizeTone(value) {
  return ["info", "success", "warning", "danger"].includes(value)
    ? value
    : "info";
}

function getToneIcon(tone) {
  return {
    success: "✅",
    warning: "⚠️",
    danger: "⛔",
    info: "ℹ️"
  }[tone] || "ℹ️";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
