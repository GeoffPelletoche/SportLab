/**
 * SportLab V6.3.7 — UI Components Premium
 *
 * Fonctions de rendu sans état métier.
 * Toutes les valeurs textuelles sont échappées par défaut.
 */

export function renderButton({
  label,
  variant = "primary",
  size = "md",
  type = "button",
  icon = "",
  className = "",
  attributes = "",
  disabled = false,
  loading = false
} = {}) {
  const sizeClass =
    size === "sm"
      ? "sl-button-sm"
      : size === "lg"
        ? "sl-button-lg"
        : "";

  const variantClass =
    [
      "primary",
      "secondary",
      "success",
      "warning",
      "danger",
      "ghost"
    ].includes(variant)
      ? `sl-button-${variant}`
      : "sl-button-primary";

  return `
    <button
      type="${escapeAttribute(type)}"
      class="sl-button ${variantClass} ${sizeClass} ${escapeAttribute(className)}"
      ${disabled || loading ? "disabled" : ""}
      ${loading ? 'aria-busy="true"' : ""}
      ${attributes}
    >
      ${loading ? '<span class="sl-button-spinner" aria-hidden="true"></span>' : ""}
      ${icon ? `<span aria-hidden="true">${escapeHtml(icon)}</span>` : ""}
      <span>${escapeHtml(label ?? "")}</span>
    </button>
  `;
}

export function renderBadge({
  label,
  tone = "neutral",
  icon = "",
  className = ""
} = {}) {
  const safeTone =
    ["info", "success", "warning", "danger", "neutral"].includes(tone)
      ? tone
      : "neutral";

  return `
    <span class="sl-badge sl-badge-${safeTone} ${escapeAttribute(className)}">
      ${icon ? `<span aria-hidden="true">${escapeHtml(icon)}</span>` : ""}
      ${escapeHtml(label ?? "")}
    </span>
  `;
}

export function renderCard({
  title = "",
  description = "",
  body = "",
  footer = "",
  actions = "",
  compact = false,
  elevated = false,
  interactive = false,
  className = "",
  tag = "article",
  attributes = ""
} = {}) {
  const safeTag =
    ["article", "section", "div", "button"].includes(tag)
      ? tag
      : "article";

  const classes = [
    "sl-card",
    compact ? "sl-card-compact" : "",
    elevated ? "sl-card-elevated" : "",
    interactive ? "sl-card-interactive" : "",
    className
  ].filter(Boolean).join(" ");

  return `
    <${safeTag} class="${escapeAttribute(classes)}" ${attributes}>
      ${
        title || description || actions
          ? `
            <header class="sl-card-header">
              <div>
                ${title ? `<h3 class="sl-card-title">${escapeHtml(title)}</h3>` : ""}
                ${description ? `<p class="sl-card-description">${escapeHtml(description)}</p>` : ""}
              </div>
              ${actions ? `<div class="sl-card-actions">${actions}</div>` : ""}
            </header>
          `
          : ""
      }

      ${body}

      ${footer ? `<footer class="sl-card-footer">${footer}</footer>` : ""}
    </${safeTag}>
  `;
}

export function renderKpi({
  label,
  value,
  icon = "",
  trend = "",
  trendTone = "neutral",
  support = "",
  className = ""
} = {}) {
  const trendClass =
    trendTone === "positive"
      ? "sl-positive"
      : trendTone === "negative"
        ? "sl-negative"
        : "sl-muted";

  return `
    <article class="sl-kpi-card ${escapeAttribute(className)}">
      <div class="sl-kpi-head">
        <span class="sl-kpi-icon" aria-hidden="true">${escapeHtml(icon)}</span>
        ${trend ? `<span class="sl-kpi-trend ${trendClass}">${escapeHtml(trend)}</span>` : ""}
      </div>

      <div class="sl-kpi-main">
        <strong class="sl-kpi-value">${escapeHtml(value ?? "")}</strong>
        <span class="sl-kpi-label">${escapeHtml(label ?? "")}</span>
      </div>

      ${support ? `<p class="sl-kpi-support">${escapeHtml(support)}</p>` : ""}
    </article>
  `;
}

export function renderAlert({
  title,
  description = "",
  icon = "ℹ️",
  tone = "info",
  actions = "",
  className = ""
} = {}) {
  const safeTone =
    ["info", "success", "warning", "danger"].includes(tone)
      ? tone
      : "info";

  return `
    <article class="sl-alert sl-alert-${safeTone} ${escapeAttribute(className)}">
      <span class="sl-alert-icon" aria-hidden="true">${escapeHtml(icon)}</span>

      <div class="sl-alert-content">
        <strong class="sl-alert-title">${escapeHtml(title ?? "")}</strong>
        ${description ? `<p class="sl-alert-description">${escapeHtml(description)}</p>` : ""}
        ${actions ? `<div class="sl-alert-actions">${actions}</div>` : ""}
      </div>
    </article>
  `;
}

export function renderEmptyState({
  icon = "📭",
  title = "Aucune donnée",
  text = "",
  action = "",
  className = ""
} = {}) {
  return `
    <section class="sl-empty-state ${escapeAttribute(className)}">
      <span class="sl-empty-state-icon" aria-hidden="true">${escapeHtml(icon)}</span>
      <h3 class="sl-empty-state-title">${escapeHtml(title)}</h3>
      ${text ? `<p class="sl-empty-state-text">${escapeHtml(text)}</p>` : ""}
      ${action}
    </section>
  `;
}

export function renderProgress({
  label,
  value = 0,
  max = 100,
  displayValue = "",
  className = ""
} = {}) {
  const safeMax = Math.max(1, toNumber(max));
  const safeValue = Math.min(safeMax, Math.max(0, toNumber(value)));
  const percent = Math.round((safeValue / safeMax) * 100);

  return `
    <div
      class="sl-progress ${escapeAttribute(className)}"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="${safeMax}"
      aria-valuenow="${safeValue}"
    >
      <div class="sl-progress-header">
        <span>${escapeHtml(label ?? "")}</span>
        <strong>${escapeHtml(displayValue || `${percent} %`)}</strong>
      </div>

      <div class="sl-progress-track">
        <span class="sl-progress-bar" style="--sl-progress:${percent}%"></span>
      </div>
    </div>
  `;
}

export function renderField({
  label,
  name,
  value = "",
  type = "text",
  placeholder = "",
  help = "",
  error = "",
  required = false,
  className = "",
  inputClassName = "",
  attributes = ""
} = {}) {
  const stateClass = error ? "is-error" : "";

  return `
    <label class="sl-field ${stateClass} ${escapeAttribute(className)}">
      <span class="sl-field-label">
        ${escapeHtml(label ?? "")}
        ${required ? '<span aria-hidden="true"> *</span>' : ""}
      </span>

      <input
        class="sl-input ${escapeAttribute(inputClassName)}"
        type="${escapeAttribute(type)}"
        name="${escapeAttribute(name ?? "")}"
        value="${escapeAttribute(value)}"
        placeholder="${escapeAttribute(placeholder)}"
        ${required ? "required" : ""}
        ${error ? 'aria-invalid="true"' : ""}
        ${attributes}
      >

      ${
        error
          ? `<span class="sl-field-message">${escapeHtml(error)}</span>`
          : help
            ? `<span class="sl-field-help">${escapeHtml(help)}</span>`
            : ""
      }
    </label>
  `;
}

export function renderSkeleton({
  lines = 3,
  className = ""
} = {}) {
  const count = Math.max(1, Math.min(12, Math.round(toNumber(lines))));

  return `
    <div class="sl-stack ${escapeAttribute(className)}" aria-hidden="true">
      ${Array.from({ length: count }, (_, index) => `
        <span
          class="sl-skeleton"
          style="height:${index === 0 ? "22px" : "14px"};width:${index === count - 1 ? "70%" : "100%"}"
        ></span>
      `).join("")}
    </div>
  `;
}

export function renderDataList(items = [], className = "") {
  const safeItems = Array.isArray(items) ? items : [];

  return `
    <dl class="sl-data-list ${escapeAttribute(className)}">
      ${safeItems.map(item => `
        <div class="sl-data-row">
          <dt class="sl-data-label">${escapeHtml(item?.label ?? "")}</dt>
          <dd class="sl-data-value">${escapeHtml(item?.value ?? "")}</dd>
        </div>
      `).join("")}
    </dl>
  `;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function escapeAttribute(value) {
  return escapeHtml(value);
}
