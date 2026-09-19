# SportLab V11.5.4 — Safari Sync readonly fix

## Correctif

Safari/iOS expose certaines propriétés de `DOMException` en lecture seule. V11.5.3 tentait d’ajouter `code`, `storage` et `storageKey` directement à l’exception native lors d’un dépassement de quota localStorage, ce qui provoquait `Attempted to assign to readonly property.` avant tout appel réseau.

V11.5.4 encapsule désormais l’exception native dans un `Error` SportLab modifiable, avec le code `local_storage_quota_exceeded`. La file existante est conservée et peut être poussée en priorité.

Aucune purge des données métier ni de la file Sync V2 n’est effectuée.
