import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";
import { Conan2d20SystemManager } from "./system/conan2d20-system-manager.js";

Hooks.once("init", () => {
  registerSettings();
});

/**
 * Token Action HUD Core 2.x registers system modules via hooks.
 * The system module must expose { SystemManager } on module.api
 * and then notify Core via tokenActionHudSystemReady.
 */
Hooks.on("tokenActionHudCoreApiReady", () => {
  if (game.system.id !== "conan2d20") return;

  const module = game.modules.get(MODULE_ID);
  if (!module) return;

  module.api = {
    SystemManager: Conan2d20SystemManager
  };

  Hooks.call("tokenActionHudSystemReady", module);
});