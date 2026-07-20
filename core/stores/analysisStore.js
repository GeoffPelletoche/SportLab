const STORAGE_KEY = "sportlab_analyses_v1";

export function getAnalyses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveAnalysis(analysis) {
  const analyses = getAnalyses();
  const now = Date.now();
  const id = analysis.id || buildAnalysisId(analysis);

  const cleanAnalysis = {
    id,
    source: analysis.source || "FrenchFlair",
    sport: analysis.sport || "rugby",

    competition: analysis.competition || null,
    matchId: analysis.matchId || null,
    match: analysis.match || null,
    home: analysis.home || null,
    away: analysis.away || null,
    date: analysis.date || null,

    market: analysis.market || null,
    line: analysis.line ?? null,
    bookmaker: analysis.bookmaker || null,
    odds: Number(analysis.odds || 0),
    probability: Number(analysis.probability || 0),

    impliedProbability: Number(analysis.impliedProbability || 0),
    value: Number(analysis.value || 0),
    edge: Number(analysis.edge || 0),
    decision: analysis.decision || "PENDING",

    placed: Boolean(analysis.placed || false),
    stake: Number(analysis.stake || 0),

    status: analysis.status || "draft",
    result: analysis.result || "PENDING",
    notes: analysis.notes || "",

    createdAt: analysis.createdAt || now,
    updatedAt: now,
    scoreValue: Number(analysis.scoreValue || 0),
finalDecision: analysis.finalDecision || null,
confidence: Number(analysis.confidence || 0),
sigma: Number(analysis.sigma || 0),
predictedTotalPoints: Number(analysis.predictedTotalPoints || 0),
modelEdgePoints: Number(analysis.modelEdgePoints || 0),
modelEdgePercent: Number(analysis.modelEdgePercent || 0)
  };

  const existingIndex = analyses.findIndex(item => item.id === id);

  if (existingIndex >= 0) {
    analyses[existingIndex] = {
      ...analyses[existingIndex],
      ...cleanAnalysis,
      createdAt: analyses[existingIndex].createdAt
    };
  } else {
    analyses.push(cleanAnalysis);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));

  return cleanAnalysis;
}

export function getAnalysisById(id) {
  return getAnalyses().find(item => item.id === id) || null;
}

export function getAnalysisForMatch(matchId) {
  if (!matchId) return null;

  return getAnalyses().find(item =>
    String(item.matchId) === String(matchId)
  ) || null;
}

export function updateAnalysisStatus(id, status) {
  const analysis = getAnalysisById(id);

  if (!analysis) return null;

  return saveAnalysis({
    ...analysis,
    status
  });
}

function buildAnalysisId(analysis) {
  const source = analysis.source || "FrenchFlair";
  const matchId = analysis.matchId || analysis.match || crypto.randomUUID();

  return `${source}_${matchId}`;
}
