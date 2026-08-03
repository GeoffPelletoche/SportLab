# SportLab V11.2.1 — Team Branding

## Objectif
Afficher les logos officiels des équipes dans les cartes DrawHunter et FrenchFlair sans modifier les moteurs métier.

## Source des images
Les URLs média API-Sports sont construites à partir du sport et de l’identifiant d’équipe déjà présents dans les fixtures :

- Football : `https://media.api-sports.io/football/teams/{id}.png`
- Rugby : `https://media.api-sports.io/rugby/teams/{id}.png`

## Robustesse
- `loading=lazy` et `decoding=async` ;
- cache HTTP du navigateur ;
- logo masqué automatiquement en cas d’erreur ;
- aucune requête vers l’API REST supplémentaire ;
- aucun changement du Worker Cloudflare 3.10.0.
