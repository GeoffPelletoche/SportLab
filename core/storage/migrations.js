import { SPORTLAB_STORAGE_SCHEMA } from "./schema.js";

const MIGRATIONS = Object.freeze([
  {
    id: "v7-core-foundation",
    run(storage) {
      // Sprint 7.1 protège volontairement toutes les clés V6.5.3.
      storage.setJSON(SPORTLAB_STORAGE_SCHEMA.keys.migrations, {
        schemaVersion: SPORTLAB_STORAGE_SCHEMA.version,
        migratedAt: new Date().toISOString(),
        legacyDataPreserved: true
      });
    }
  }
]);

export function runStorageMigrations(storage, logger) {
  const state = storage.getJSON(SPORTLAB_STORAGE_SCHEMA.keys.migrations, {});
  const completed = new Set(state.completed || []);
  const executed = [];
  for (const migration of MIGRATIONS) {
    if (completed.has(migration.id)) continue;
    migration.run(storage);
    completed.add(migration.id);
    executed.push(migration.id);
  }
  storage.setJSON(SPORTLAB_STORAGE_SCHEMA.keys.migrations, {
    ...storage.getJSON(SPORTLAB_STORAGE_SCHEMA.keys.migrations, {}),
    schemaVersion: SPORTLAB_STORAGE_SCHEMA.version,
    completed: [...completed]
  });
  logger?.info?.("Migrations de stockage vérifiées", { executed });
  return executed;
}
