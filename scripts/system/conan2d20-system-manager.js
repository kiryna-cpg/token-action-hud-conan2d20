import { Conan2d20ActionHandler } from "./conan2d20-action-handler.js";
import { Conan2d20RollHandler } from "./conan2d20-roll-handler.js";

export class Conan2d20SystemManager {
  /**
   * Token Action HUD Core 2.x expects a static init() function on the SystemManager class.
   * Core calls this to obtain a fully configured manager instance.
   */
  static init(coreModuleApi) {
    return new Conan2d20SystemManager(coreModuleApi);
  }

  constructor(coreModuleApi) {
    this.coreModuleApi = coreModuleApi;
    this.actionHandler = new Conan2d20ActionHandler();
    this.rollHandler = new Conan2d20RollHandler();
  }

  getActionHandler() {
    return this.actionHandler;
  }

  getRollHandler() {
    return this.rollHandler;
  }

  getSystemId() {
    return "conan2d20";
  }
}