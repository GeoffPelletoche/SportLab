// services/renderService.js

import {
  renderDashboard
} from "../ui/views/dashboardView.js";

import {
  renderNavigation
} from "../ui/views/navigationView.js";

import {
  renderDrawHunter
} from "../ui/views/drawhunterView.js";

import {
  renderFrenchFlair
} from "../ui/views/frenchflairView.js";

import {
  renderJournal
} from "../ui/views/journalView.js";

import {
  renderBets
} from "../ui/views/betsView.js";

import {
  renderPortfolio
} from "../ui/views/portfolioView.js";

import {
  renderDiagnostics
} from "../ui/views/diagnosticsView.js";

import { renderCloudDashboard } from "../ui/views/cloudDashboardView.js";
import { renderRecoveryCenter } from "../ui/views/recoveryCenterView.js";
import { renderModelPerformance } from "../ui/views/modelPerformanceView.js";
import { buildModelPerformance } from "../core/performance/modelPerformanceEngine.js";
import { createPerformanceRepository } from "../core/performance/performanceRepository.js";
import { capturePredictionDataset } from "../core/learning/learningDatasetBuilder.js";
import { buildLearningSummary, getLearningRecords } from "../core/learning/learningStore.js";
import { getBets } from "../core/stores/betsStore.js";
import { buildCalibrationDashboard } from "../core/calibration/calibrationEngine.js";
import { renderCalibration } from "../ui/views/calibrationView.js";

/**
 * SPORTLAB V6.3.1
 *
 * Render central de l'application.
 *
 * Responsabilité :
 * - construire les différentes vues ;
 * - transmettre leur HTML à dashboardView ;
 * - ne contenir aucune logique métier.
 */
export function renderApplication(app, data = {}) {
  const activePage =
    data.currentPage || "home";

  const learningDataset = capturePredictionDataset({
    drawhunter: data.drawhunterPayload?.matches || [],
    frenchflair: data.frenchflairPayload?.matches || [],
    analyses: data.analyses || []
  });
  const learningRecords = getLearningRecords();
  const calibrationDashboard = buildCalibrationDashboard(learningRecords);
  const calibrationHtml = renderCalibration(calibrationDashboard);

  const performanceRepository = createPerformanceRepository();
  const modelPerformanceHtml = renderModelPerformance({
    performance: buildModelPerformance({
      dataset: learningDataset,
      learning: learningRecords,
      bets: getBets(),
      legacy: performanceRepository.read()
    }),
    learningCount: learningDataset.length
  });

  const navigationHtml =
    renderNavigation(activePage);

  const drawhunterHtml =
    renderDrawHunter(
      data.drawhunterPayload
    );

  const frenchflairHtml =
    renderFrenchFlair(
      data.frenchflairPayload
    );

  const teamBrandingLookup = buildTeamBrandingLookup({
    drawhunter: data.drawhunterPayload?.matches || [],
    frenchflair: data.frenchflairPayload?.matches || []
  });

  const journalHtml =
    renderJournal(
      data.journal,
      teamBrandingLookup
    );

  const betsHtml =
    renderBets(
      data.dashboard?.bets || [],
      teamBrandingLookup
    );

  const portfolioHtml =
    renderPortfolio({
      summary:
        data.dashboard?.portfolio || {},

      statistics:
        data.statistics || {}
    });

  const diagnosticsHtml =
    renderDiagnostics({
      settlement: data.diagnostic,
      drawhunterMeta: data.drawhunterPayload?.meta || {},
      frenchflairMeta: data.frenchflairPayload?.meta || {},
      learningDataset,
      learningSummary: buildLearningSummary(learningRecords),
      calibration: calibrationDashboard
    });

  const cloudState = window.SportLabCore?.cloud?.status?.() || {};
  const recoveryState = window.SportLabCore?.recovery?.state?.() || {};
  const cloudHtml = renderCloudDashboard({
    cloud: cloudState,
    storageSummary: buildCloudStorageSummary(),
    recovery: recoveryState
  });
  const recoveryHtml = renderRecoveryCenter({ recovery: recoveryState, cloud: cloudState });

  app.innerHTML =
    renderDashboard({
      activePage,
      navigationHtml,
      drawhunterHtml,
      frenchflairHtml,
      journalHtml,
      betsHtml,
      portfolioHtml,
      diagnosticsHtml,
      cloudHtml,
      recoveryHtml,
      modelPerformanceHtml,
      calibrationHtml,
      dashboard:

      data.dashboard || {},

    drawhunterPayload:

      data.drawhunterPayload || {},

    frenchflairPayload:

      data.frenchflairPayload || {}

    });
}

function buildCloudStorageSummary() {
  const counts = { analyses: 0, bets: 0, drawhunter: 0, frenchflair: 0, total: 0 };
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || "";
    if (key.startsWith("sportlab.v7.cloud")) continue;
    let value;
    try { value = JSON.parse(localStorage.getItem(key)); } catch { value = localStorage.getItem(key); }
    const count = Array.isArray(value) ? value.length : value && typeof value === "object" ? Object.keys(value).length : value ? 1 : 0;
    counts.total += count;
    const normalized = key.toLowerCase();
    if (normalized.includes("analys")) counts.analyses += count;
    if (normalized.includes("bet") || normalized.includes("pari")) counts.bets += count;
    if (normalized.includes("drawhunter")) counts.drawhunter += count;
    if (normalized.includes("frenchflair")) counts.frenchflair += count;
  }
  return counts;
}


function buildTeamBrandingLookup({ drawhunter = [], frenchflair = [] } = {}) {
  const lookup = new Map();

  const normalizeTeamKey = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&apos;|&#0*39;/g, "'")
    .replace(/&amp;/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const pairKey = (sport, home, away) => {
    const homeKey = normalizeTeamKey(home);
    const awayKey = normalizeTeamKey(away);
    if (!homeKey || !awayKey) return "";
    return `pair:${String(sport || "").toLowerCase()}:${homeKey}|${awayKey}`;
  };

  const register = (match, sport) => {
    if (!match) return;

    const branding = {
      sport,
      homeId: match.homeId ?? null,
      awayId: match.awayId ?? null,
      homeLogo: match.homeLogo || "",
      awayLogo: match.awayLogo || "",
      home: match.home || "",
      away: match.away || ""
    };

    if (match.id !== undefined && match.id !== null) {
      lookup.set(String(match.id), branding);
      lookup.set(`id:${String(match.id)}`, branding);
    }

    const key = pairKey(sport, match.home, match.away);
    if (key) lookup.set(key, branding);
  };

  drawhunter.forEach(match => register(match, "football"));
  frenchflair.forEach(match => register(match, "rugby"));

  // Helpers non énumérables pour permettre aux vues de retrouver les
  // anciens paris même lorsque leur matchId n'est plus disponible.
  lookup.resolve = ({ matchId, sport, home, away } = {}) => {
    const byId = matchId !== undefined && matchId !== null
      ? lookup.get(String(matchId)) || lookup.get(`id:${String(matchId)}`)
      : null;
    if (byId) return byId;
    const key = pairKey(sport, home, away);
    return key ? (lookup.get(key) || null) : null;
  };

  return lookup;
}
