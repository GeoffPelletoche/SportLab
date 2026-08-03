import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCalibrationDashboard,
  summarizeCalibration,
  calibrationGrade
} from "../core/calibration/calibrationEngine.js";
import { renderCalibration } from "../ui/views/calibrationView.js";

function record({ id, moduleId = "drawhunter", probability, outcome, competition = "Ligue 1" }) {
  return {
    learningId: id,
    moduleId,
    probability,
    eventOccurred: outcome,
    predictionCorrect: outcome,
    result: outcome ? "WON" : "LOST",
    competition,
    evaluatedAt: "2026-08-03T08:00:00.000Z"
  };
}

test("normalise les probabilités décimales et calcule un indice de calibration", () => {
  const records = [
    record({ id: "a", probability: 0.8, outcome: true }),
    record({ id: "b", probability: 0.8, outcome: true }),
    record({ id: "c", probability: 0.8, outcome: false }),
    record({ id: "d", probability: 0.8, outcome: true })
  ];
  const summary = summarizeCalibration(records);
  assert.equal(summary.count, 4);
  assert.equal(summary.meanPredicted, 80);
  assert.equal(summary.observedRate, 75);
  assert.equal(summary.expectedCalibrationError, 5);
  assert.equal(summary.score, 95);
});

test("sépare DrawHunter, FrenchFlair et les compétitions", () => {
  const records = [
    record({ id: "a", moduleId: "drawhunter", probability: 0.3, outcome: true, competition: "Ligue 1" }),
    record({ id: "b", moduleId: "drawhunter", probability: 0.3, outcome: false, competition: "Ligue 1" }),
    record({ id: "c", moduleId: "frenchflair", probability: 0.7, outcome: true, competition: "Top 14" })
  ];
  const dashboard = buildCalibrationDashboard(records);
  assert.equal(dashboard.observations, 3);
  assert.equal(dashboard.modules.drawhunter.count, 2);
  assert.equal(dashboard.modules.frenchflair.count, 1);
  assert.deepEqual(dashboard.competitions.map(item => item.label).sort(), ["Ligue 1", "Top 14"]);
  assert.equal(dashboard.modelModified, false);
});

test("reconstruit l'événement DrawHunter pour les anciens enregistrements", () => {
  const dashboard = buildCalibrationDashboard([
    {
      learningId: "legacy-draw",
      moduleId: "drawhunter",
      probability: 0.34,
      result: "WON",
      competition: "Premier League",
      evaluatedAt: "2026-08-03T08:00:00.000Z"
    }
  ]);
  assert.equal(dashboard.observations, 1);
  assert.equal(dashboard.global.observedRate, 100);
});

test("ignore les push et les prédictions non évaluées", () => {
  const dashboard = buildCalibrationDashboard([
    { learningId: "pending", moduleId: "frenchflair", probability: 0.6 },
    { learningId: "push", moduleId: "frenchflair", probability: 0.6, result: "PUSH", evaluatedAt: "2026-08-03T08:00:00.000Z" }
  ]);
  assert.equal(dashboard.observations, 0);
  assert.equal(dashboard.excluded, 2);
});

test("applique les seuils de qualification validés", () => {
  assert.equal(calibrationGrade(93, 20).label, "Excellente");
  assert.equal(calibrationGrade(90, 20).label, "Très bonne");
  assert.equal(calibrationGrade(84, 20).label, "Correcte");
  assert.equal(calibrationGrade(75, 20).label, "À surveiller");
  assert.equal(calibrationGrade(69, 20).label, "Faible");
  assert.equal(calibrationGrade(99, 4).label, "Échantillon insuffisant");
});

test("la vue Calibration reste passive et n'affiche pas de Confidence Score", () => {
  const html = renderCalibration(buildCalibrationDashboard([]));
  assert.match(html, /Calibration Engine/);
  assert.match(html, /strictement passif/);
  assert.doesNotMatch(html, /Confidence Score/i);
});
