const QUEUE_KEY = "sportlab.v7.cloud.queue";
function read() { try { const value = JSON.parse(localStorage.getItem(QUEUE_KEY)); return Array.isArray(value) ? value : []; } catch { return []; } }
function write(items) { localStorage.setItem(QUEUE_KEY, JSON.stringify(items)); return items; }
export const queueManager = Object.freeze({
  list: read,
  enqueue(changes) { const map = new Map(read().map(item => [`${item.namespace}:${item.key}`, item])); for (const change of changes) map.set(`${change.namespace}:${change.key}`, change); return write([...map.values()]); },
  clear() { return write([]); },
  size() { return read().length }
});
