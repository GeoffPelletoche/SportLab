import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const legacy = await readFile(new URL("../legacyApp.js", import.meta.url), "utf8");

test("V11.6.2 ne rend jamais les étapes progressives", () => {
  assert.match(legacy, /if \(isProgressUpdate\) return false/);
});

test("V11.6.2 ne rend que le sport actif une fois prêt", () => {
  assert.match(legacy, /if \(activeSportKind\) return isActiveSport && ready/);
});

test("V11.6.2 consolide le dashboard avant rendu", () => {
  assert.match(legacy, /currentPage === "home"/);
  assert.match(legacy, /drawHunterReady && frenchFlairReady && nflReady/);
});
