import { CONFIG } from "../config/config.js";
import { readLearningDataset } from "../learning/learningDatasetBuilder.js";
import { createPerformanceRepository } from "./performanceRepository.js";
import { saveDrawHunterMatchWorkflow } from "../stores/drawHunterWorkflowStore.js";
import { saveFrenchFlairMatchWorkflow } from "../stores/frenchFlairWorkflowStore.js";
import { getAnalysisForMatch, saveAnalysis } from "../stores/analysisStore.js";
import { recordPassiveLearning } from "../learning/passiveLearningEngine.js";

const DATASET_KEY = "sportlab.v7.learning.dataset";

export async function evaluatePendingPredictions(storage = globalThis.localStorage) {
  const dataset = readLearningDataset(storage);
  const now = Date.now();
  const pending = dataset.filter(item => item?.matchId && item?.date && !item?.evaluatedAt && new Date(item.date).getTime() < now - 60 * 60 * 1000).slice(0, 20);
  if (!pending.length) return { checked:0, evaluated:0, errors:0 };

  const repository = createPerformanceRepository(storage);
  const records = repository.read();
  const recordKeys = new Set(records.map(item => item.evaluationId));
  let evaluated = 0, errors = 0;

  for (const snapshot of pending) {
    try {
      const game = await fetchResult(snapshot);
      if (!game?.isFinished) continue;
      const evaluation = evaluateSnapshot(snapshot, game);
      const evaluatedAt = new Date().toISOString();
      Object.assign(snapshot, evaluation, { evaluatedAt, finalGame: game });
      persistLifecycleEvaluation(snapshot, evaluation, game, evaluatedAt);
      recordPassiveLearning(snapshot, evaluation, game, evaluatedAt, storage);
      const evaluationId = `${snapshot.id}:${snapshot.modelVersion}`;
      if (!recordKeys.has(evaluationId)) {
        records.push({
          evaluationId,
          moduleId:snapshot.moduleId,
          source:snapshot.moduleId,
          matchId:snapshot.matchId,
          probability:Number(snapshot.probability || 0),
          confidence:Number(snapshot.confidence || 0),
          result:evaluation.result,
          decisionQuality:evaluation.decisionQuality,
          placed:false,
          stake:0,
          profit:0,
          evaluatedAt:snapshot.evaluatedAt,
          predictionError:evaluation.predictionError ?? null
        });
        recordKeys.add(evaluationId);
      }
      evaluated += 1;
    } catch (error) { errors += 1; console.warn("[PredictionEvaluation]", snapshot.matchId, error); }
  }

  storage?.setItem?.(DATASET_KEY, JSON.stringify(dataset.slice(-10000)));
  repository.write(records);
  return { checked:pending.length, evaluated, errors };
}

async function fetchResult(snapshot) {
  const path = snapshot.moduleId === "drawhunter" ? "/football/game-result" : "/rugby/game-result";
  const url = new URL(CONFIG.api.workerBaseUrl + path);
  url.searchParams.set("id", snapshot.matchId);
  const response = await fetch(url, { headers:{Accept:"application/json"}, cache:"no-store" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`);
  return payload?.response;
}

function evaluateSnapshot(snapshot, game) {
  const decision = String(snapshot.modelDecision || "").toUpperCase();
  if (snapshot.moduleId === "drawhunter") {
    const predictedDraw = Number(snapshot.probability || 0) >= 0.30;
    const actualDraw = game.isDraw === true;
    const won = predictedDraw === actualDraw;
    return {
      result: won ? "WON" : "LOST",
      decisionQuality: decision.includes("NO") ? (actualDraw ? "MISSED_OPPORTUNITY" : "GOOD_PASS") : (actualDraw ? "GOOD_VALUE" : "BAD_VALUE")
    };
  }
  const total = Number(game.totalPoints);
  const reference = Number(snapshot.line ?? snapshot.features?.historicalReferenceTotal);
  const trend = String(snapshot.prediction || "").toUpperCase();
  if (!Number.isFinite(total) || !Number.isFinite(reference) || (!trend.includes("OVER") && !trend.includes("UNDER"))) return { result:"PUSH", decisionQuality:"NOT_EVALUABLE" };
  const result = total === reference ? "PUSH" : trend.includes("OVER") ? (total > reference ? "WON" : "LOST") : (total < reference ? "WON" : "LOST");
  const predicted = Number(snapshot.features?.predictedTotalPoints);
  return {
    result,
    predictionError:Number.isFinite(predicted) ? Math.abs(predicted-total) : null,
    decisionQuality: decision.includes("NO") ? (result === "LOST" ? "GOOD_PASS" : result === "WON" ? "MISSED_OPPORTUNITY" : "NEUTRAL_PASS") : (result === "WON" ? "GOOD_VALUE" : result === "LOST" ? "BAD_VALUE" : "PUSH")
  };
}


function persistLifecycleEvaluation(snapshot, evaluation, game, evaluatedAt) {
  const saveWorkflow = snapshot.moduleId === "drawhunter"
    ? saveDrawHunterMatchWorkflow
    : saveFrenchFlairMatchWorkflow;

  saveWorkflow(snapshot.matchId, {
    status: "resulted",
    evaluatedAt,
    evaluation,
    finalGame: game,
    event: {
      type: "resulted",
      label: "Prédiction évaluée automatiquement",
      note: decisionQualityLabel(evaluation.decisionQuality)
    }
  });

  const analysis = getAnalysisForMatch(snapshot.matchId);
  if (analysis) {
    saveAnalysis({
      ...analysis,
      status: "resulted",
      lifecycleStatus: "resulted",
      evaluatedAt,
      result: evaluation.result,
      decisionQuality: evaluation.decisionQuality,
      finalScore: formatFinalScore(game),
      finalHomePoints: game.homePoints ?? game.homeGoals ?? null,
      finalAwayPoints: game.awayPoints ?? game.awayGoals ?? null,
      finalTotalPoints: game.totalPoints ?? null
    });
  }
}

function decisionQualityLabel(value) {
  return ({
    GOOD_PASS: "Bonne abstention : ne pas parier était justifié",
    MISSED_OPPORTUNITY: "Opportunité manquée",
    GOOD_VALUE: "Bonne sélection VALUE",
    BAD_VALUE: "Sélection VALUE incorrecte",
    NEUTRAL_PASS: "Décision neutre",
    NOT_EVALUABLE: "Prédiction non évaluable"
  })[value] || "Évaluation enregistrée";
}

function formatFinalScore(game = {}) {
  const home = game.homePoints ?? game.homeGoals;
  const away = game.awayPoints ?? game.awayGoals;
  return Number.isFinite(Number(home)) && Number.isFinite(Number(away)) ? `${home}-${away}` : null;
}
