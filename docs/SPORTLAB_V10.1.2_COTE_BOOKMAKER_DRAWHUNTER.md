# SportLab V10.1.2 — Cote bookmaker DrawHunter

## Objectif

DrawHunter ne simule plus une cote fixe de 3,10. La cote du match nul doit être saisie manuellement à partir du bookmaker réellement utilisé.

## Fonctionnement

1. SportLab calcule la probabilité du match nul avec son modèle.
2. L'utilisateur saisit la cote bookmaker, par exemple 3,16.
3. La probabilité implicite, la value, l'edge et la décision sont recalculés immédiatement.
4. La cote et le calcul sont conservés dans le workflow local du match.
5. Il est impossible de terminer l'analyse sans cote valide.
6. Si la cote produit une VALUE, le formulaire de pari devient disponible.

## Calculs

- Probabilité implicite = 1 / cote.
- Value = probabilité modèle - probabilité implicite.
- Edge = probabilité modèle × cote - 1.

Le seuil de value reste celui de la configuration DrawHunter existante.
