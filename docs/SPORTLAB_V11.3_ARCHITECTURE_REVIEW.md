# SportLab V11.3 — Revue d’architecture

## Base examinée

- Frontend : SportLab V11.2.3.
- Worker : API Bridge 3.10.0, inchangé.
- Source de données : `sportlab_learning_v1`, alimentée par le Passive Learning Engine.

## Décisions d’architecture

1. Le Calibration Engine est un module de lecture pur dans `core/calibration/`.
2. Il ne dépend ni du Worker ni d’un nouvel appel API.
3. Il ne modifie jamais les probabilités, seuils, décisions ou coefficients des modèles.
4. Les observations sont dérivées uniquement des prédictions déjà évaluées.
5. Les anciens enregistrements V11.2 restent compatibles grâce à une reconstruction contrôlée de l’événement observé.
6. Les `PUSH`, résultats non évaluables et observations sans probabilité sont exclus.
7. La page Calibration est séparée de Performances afin de ne pas surcharger les écrans existants.
8. Diagnostics reçoit uniquement un résumé du même moteur, évitant une seconde implémentation divergente.

## Métrique retenue

L’indice affiché vaut `100 - ECE`, où ECE est l’erreur de calibration attendue pondérée par le volume de chaque tranche de probabilité. Le Brier Score est également calculé et conservé dans le rapport interne.

## Garde-fous

- Moins de 20 observations : résultat indiqué comme échantillon insuffisant.
- Une compétition est comptée comme calibrée à partir de 10 observations.
- Aucun « Confidence Score » additionnel n’est ajouté.
- Aucun changement du Worker Cloudflare.
