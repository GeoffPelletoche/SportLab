import { SPORTLAB_STORAGE_SCHEMA } from "../storage/schema.js";

const DEFAULTS = Object.freeze({ theme: "premium", density: "comfortable", diagnosticsLevel: "info" });

export function createSettingsStore({ storage, eventBus }) {
  let state = Object.freeze({ ...DEFAULTS, ...storage.getJSON(SPORTLAB_STORAGE_SCHEMA.keys.settings, {}) });
  function getState() { return state; }
  function update(patch = {}) {
    state = Object.freeze({ ...state, ...patch });
    storage.setJSON(SPORTLAB_STORAGE_SCHEMA.keys.settings, state);
    eventBus?.emit?.("settings:changed", state);
    return state;
  }
  function reset() { return update(DEFAULTS); }
  return Object.freeze({ getState, update, reset });
}
