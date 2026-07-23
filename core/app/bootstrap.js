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

export async function bootstrapSportLabV7({ startLegacyApplication }) {
  const logger = createLogger({ namespace: "SportLab V7 Core", level: "info", eventBus });
  const settingsStore = createSettingsStore({ storage: localStorageService, eventBus });
  const themeService = createThemeService({ settingsStore, eventBus });
  const moduleRegistry = createModuleRegistry({ eventBus, logger });
  const lifecycle = createLifecycle({ eventBus, logger });
  const router = createRouter({ eventBus });
  const context = Object.freeze({
    version: "7.0.0", eventBus, logger, storage: localStorageService,
    settingsStore, themeService, notifications: createNotificationService(),
    dialogs: createDialogService(), moduleRegistry, lifecycle, router
  });

  runStorageMigrations(localStorageService, logger);
  themeService.apply();
  moduleRegistry.register(drawHunterModule);
  moduleRegistry.register(frenchFlairModule);
  await lifecycle.start(context);
  await drawHunterModule.mount(context);
  await frenchFlairModule.mount(context);
  await startLegacyApplication();

  window.SportLabCore = Object.freeze({
    version: context.version,
    modules: moduleRegistry.list().map(({ id, label, sport, capabilities }) => ({ id, label, sport, capabilities })),
    settings: () => settingsStore.getState(),
    setTheme: themeService.setTheme,
    setDensity: themeService.setDensity,
    diagnostics: () => logger.entries()
  });
  logger.info("Core Foundation opérationnel", { modules: moduleRegistry.list().map(module => module.id) });
  eventBus.emit("core:ready", { version: context.version });
  return context;
}
