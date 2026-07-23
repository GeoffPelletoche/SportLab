export function resolveConflicts(conflicts = []) {
  // Le serveur est la source de vérité. Les enregistrements distants sont appliqués
  // puis toute nouvelle modification locale sera détectée au prochain cycle.
  return conflicts.map(conflict => conflict.server || conflict.current || conflict.record).filter(Boolean);
}
