import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../core/config/config.js";

test("V11.7.0 adds Premiership Rugby and URC to FrenchFlair", () => {
  const comps = CONFIG.frenchflair.competitions;
  assert.ok(comps.some(c => c.id === 13 && c.name === "Premiership Rugby" && c.active));
  assert.ok(comps.some(c => c.id === 76 && c.name === "United Rugby Championship" && c.active));
});
