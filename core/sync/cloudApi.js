export function createCloudApi({ getConfig }) {
  async function request(path, { method = "GET", body, setupSecret } = {}) {
    const config = getConfig();
    const endpoint = String(config.endpoint || "").replace(/\/+$/, "");
    if (!endpoint) throw new Error("URL du Worker absente.");
    const headers = { accept: "application/json" };
    if (body !== undefined) headers["content-type"] = "application/json";
    if (setupSecret) headers["x-setup-secret"] = setupSecret;
    else if (config.token) headers.authorization = `Bearer ${config.token}`;
    const response = await fetch(`${endpoint}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.error?.message || `Erreur cloud ${response.status}`);
      error.status = response.status; error.code = payload?.error?.code; error.details = payload?.error?.details; error.payload = payload;
      throw error;
    }
    return payload;
  }
  return Object.freeze({
    health: () => request("/health"),
    bootstrap: (displayName, setupSecret) => request("/v1/auth/bootstrap", { method: "POST", body: { displayName }, setupSecret }),
    me: () => request("/v1/me"),
    registerDevice: device => request("/v1/devices", { method: "POST", body: device }),
    push: payload => request("/v1/sync/push", { method: "POST", body: payload }),
    pull: (cursor = 0, limit = 500) => request(`/v1/sync/pull?cursor=${encodeURIComponent(cursor)}&limit=${encodeURIComponent(limit)}`),
    snapshot: () => request("/v1/sync/snapshot"),
    backup: () => request("/v1/backup"),
    restore: (records, deviceId) => request("/v1/restore", { method: "POST", body: { records, deviceId } })
  });
}
