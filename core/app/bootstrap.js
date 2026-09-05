import { eventBus } from "../events/eventBus.js";
import { createLogger } from "../diagnostics/logger.js";
import { localStorageService } from "../storage/storageService.js";
import { runStorageMigrations } from "../storage/migrations.js";
import { createSettingsStore } from "../settings/settingsStore.js";
import { createThemeService } from "../ui/themeService.js";
import { createNotificationService } from "../ui/notificationService.js";
import { createDialogService } from "../ui/dialogService.js";
import { createModuleRegistry } from "./moduleRegistry.js";
import { createLifecycle } from "./lifecycle.js";
import { createRouter } from "./router.js";
import { drawHunterModule } from "../../modules/drawhunter/index.js";
import { frenchFlairModule } from "../../modules/frenchflair/index.js";
import { createSyncEngine } from "../sync/syncEngine.js";
import { createSyncPanel } from "../sync/syncPanel.js";
import { createRecoveryManager } from "../sync/recoveryManager.js";

export async function bootstrapSportLabV7({ startLegacyApplication }) {
  const logger = createLogger({ namespace: "SportLab V7 Core", level: "info", eventBus });
  const settingsStore = createSettingsStore({ storage: localStorageService, eventBus });
  const themeService = createThemeService({ settingsStore, eventBus });
  const moduleRegistry = createModuleRegistry({ eventBus, logger });
  const lifecycle = createLifecycle({ eventBus, logger });
  const router = createRouter({ eventBus });
  const notifications = createNotificationService();
  const syncEngine = createSyncEngine({ eventBus, logger, notifications });
  const recoveryManager = createRecoveryManager({ syncEngine, eventBus, logger, notifications });
  const context = Object.freeze({
    version: "8.0.0", eventBus, logger, storage: localStorageService,
    settingsStore, themeService, notifications, syncEngine, recoveryManager,
    dialogs: createDialogService(), moduleRegistry, lifecycle, router
  });

  runStorageMigrations(localStorageService, logger);
  themeService.apply();
  moduleRegistry.register(drawHunterModule);
  moduleRegistry.register(frenchFlairModule);
  await lifecycle.start(context);
  await drawHunterModule.mount(context);
  await frenchFlairModule.mount(context);

  // V11.3.14 — Cloud Bootstrap First:
  // Le Cloud doit être disponible avant le chargement réseau Football/Rugby.
  // La V11.3.13 affichait l'UI rapidement mais conservait le bootstrap Core
  // bloqué sur startLegacyApplication(), rendant SportLabCore/cloud indisponible
  // pendant le chargement sportif.
  createSyncPanel({ engine: syncEngine, eventBus, notifications });
  syncEngine.start();

  window.SportLabCore = Object.freeze({
    version: context.version,
    cloud: Object.freeze({ status: syncEngine.getStatus, syncNow: syncEngine.syncNow, connect: syncEngine.connect, disconnect: syncEngine.disconnect, markDirty: syncEngine.markDirty }),
    recovery: Object.freeze({ state: recoveryManager.getState, preview: recoveryManager.preview, restoreCloudToLocal: recoveryManager.restoreCloudToLocal, forceLocalToCloud: recoveryManager.forceLocalToCloud, smartMerge: recoveryManager.smartMerge, restoreSnapshot: recoveryManager.restoreSnapshot, createSnapshot: recoveryManager.createSnapshot, clearResolvedConflictHistory: recoveryManager.clearResolvedConflictHistory }),
    modules: moduleRegistry.list().map(({ id, label, sport, capabilities }) => ({ id, label, sport, capabilities })),
    settings: () => settingsStore.getState(),
    setTheme: themeService.setTheme,
    setDensity: themeService.setDensity,
    diagnostics: () => logger.entries()
  });

  // Le rendu local peut maintenant consulter immédiatement l'état Cloud, puis
  // Football/Rugby continuent leur chargement sans désactiver les commandes Cloud.
  await startLegacyApplication();
  logger.info("Core Foundation opérationnel", { modules: moduleRegistry.list().map(module => module.id) });
  eventBus.emit("core:ready", { version: context.version });
  return context;
}
