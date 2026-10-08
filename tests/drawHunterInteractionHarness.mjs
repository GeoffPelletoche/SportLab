import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const rootUrl = new URL('../', import.meta.url);
const memory = new Map();
const events = new Map();
const makeCard = id => ({ dataset: { matchId: String(id), workflowState: 'pending', dhDate: '2030-01-01T12:00:00Z', dhProbabilityRaw: '0.3' }, hidden: false,
  classList: { add() {}, remove() {} }, querySelector(selector) { return selector === '[data-dh-bookmaker-odds]' ? { value: '3.33' } : null; }, querySelectorAll() { return []; }, scrollIntoView() {}, focus() {} });
const cards = [makeCard(1), makeCard(2)];
const count = { textContent: '' };
const root = { dataset: {}, classList: { toggle() {} }, querySelector(selector) { return selector === '[data-dh-visible-count]' ? count : null; }, querySelectorAll(selector) { return selector === '[data-dh-card]' ? cards : []; }, addEventListener(type, fn) { events.set(type, fn); } };
const window = { addEventListener() {}, dispatchEvent() {}, setTimeout(fn) { fn(); } };
const context = vm.createContext({ requestAnimationFrame() {}, console, window, document: { querySelector: () => root }, localStorage: { getItem: key => memory.get(key) || null }, sessionStorage: { getItem: () => null, setItem() {} }, CustomEvent: class {}, Date, Map, Intl });
const source = fs.readFileSync(new URL('ui/interactions/drawHunterWorkflow.js', rootUrl), 'utf8');
const modules = new Map();
async function linker(specifier, reference) {
  const url = new URL(specifier, reference.identifier);
  if (modules.has(url.href)) return modules.get(url.href);
  let module;
  const mocks = {
    'sportlabUi.js': { showToast() {} },
    'config.js': { CONFIG: { drawhunter: { minValue: 0.01 } } },
    'quotaSafeStorage.js': { quotaSafeSetItem: (key, value) => { memory.set(key, value); return true; } },
    'drawHunterExplainabilityEngine.js': { explainBookmakerPrice() {} }
  };
  const mock = mocks[url.pathname.split('/').at(-1)];
  if (mock) module = new vm.SyntheticModule(Object.keys(mock), function() { for (const [name, value] of Object.entries(mock)) this.setExport(name, value); }, { context, identifier: url.href });
  else module = new vm.SourceTextModule(fs.readFileSync(url, 'utf8'), { context, identifier: url.href });
  modules.set(url.href, module);
  await module.link(linker);
  return module;
}
const module = new vm.SourceTextModule(source, { context, identifier: new URL('ui/interactions/drawHunterWorkflow.js', rootUrl).href });
await module.link(linker); await module.evaluate();
module.namespace.initDrawHunterWorkflow();
assert.equal(count.textContent, '2');
const action = { dataset: { dhAction: 'complete' }, closest: () => cards[0] };
events.get('click')({ target: { closest: () => action } });
assert.equal(cards[0].hidden, true); // hides immediately, before a network refresh or page reload
assert.equal(cards[1].hidden, false);
assert.equal(count.textContent, '1');
const saved = JSON.parse(memory.get('sportlab_drawhunter_workflow_v1'));
assert.equal(saved['1'].status, 'awaiting_result');
assert.equal(saved['1'].decision, 'NO BET');
assert.ok(Math.abs(saved['1'].value) < 0.01);
let finalized;
window.finishDrawHunterAnalysis = id => { finalized = id; };
action.closest = () => cards[1];
events.get('click')({ target: { closest: () => action } });
assert.equal(finalized, '2'); // runtime hook rebuilds the filtered view and preserves next-analysis navigation
assert.equal(JSON.parse(memory.get('sportlab_drawhunter_workflow_v1'))['2'].status, 'awaiting_result');
console.log('DrawHunter interaction passed');
