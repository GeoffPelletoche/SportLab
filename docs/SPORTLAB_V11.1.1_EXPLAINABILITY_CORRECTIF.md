# SportLab V11.1.1 — Correctif Explainable AI DrawHunter

## Correction

Le bloc « Pourquoi cette estimation ? » exploite exclusivement les valeurs déjà
calculées et présentes dans la rencontre DrawHunter affichée.

Il ne dépend plus uniquement de `predictionStatus`, propriété qui pouvait ne pas
être conservée dans certaines analyses existantes. La disponibilité est désormais
établie à partir de la probabilité modèle, des indicateurs calculés et des
statistiques d'équipes déjà chargées.

Le moteur peut aussi reconstruire :

- le profil de nuls depuis les taux domicile/extérieur ;
- le profil de faibles scores depuis les statistiques d'équipes ;
- l'équilibre attaque/défense depuis les moyennes de buts ;
- la fiabilité depuis le volume effectif déjà calculé.

Aucun appel API ou historique supplémentaire n'est effectué par ce bloc.
