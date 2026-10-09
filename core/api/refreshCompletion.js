// An incomplete network sweep must not replace the last complete snapshot.
export function completeRefreshMeta(meta) {
  const failed = (meta.syncLog || []).filter(item => ["ERROR", "RATE_LIMITED"].includes(item.status));
  const historyErrors = Number(meta.historyDiagnostics?.errors || 0);
  if (!failed.length && !historyErrors) return meta;
  return { ...meta, error: true, refreshDeferred: true,
    errorMessage: "Récupération incomplète. Les dernières données sont conservées ; utilisez Actualiser après la pause.",
    failedCompetitions: failed.length };
}
