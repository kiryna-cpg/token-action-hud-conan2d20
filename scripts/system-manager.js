import { MODULE_ID, REQUIRED_CORE_MODULE_VERSION } from "./constants.js";
import { ActionHandler } from "./action-handler.js";
import { Conan2d20RollHandler } from "./system/conan2d20-roll-handler.js";
import { registerSettings } from "./settings.js";
import { localize } from "./util/i18n.js";

export let SystemManager = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  // Define SystemManager only after Core API is ready
  SystemManager = class SystemManager extends coreModule.api.SystemManager {
    /** @override */
    getActionHandler() {
      return new ActionHandler();
    }

    /** @override */
    getRollHandler() {
      return new Conan2d20RollHandler();
    }

    /** @override */
    getAvailableRollHandlers() {
      // Single default roll handler for now.
      return [{ id: "default", name: "Default" }];
    }

    /** @override */
    registerSettings(onChangeFunction) {
      registerSettings(onChangeFunction);
    }

    /** @override */
    async registerDefaults() {
      return _buildDefaults();
    }

    /** @override */
    getSystemId() {
      return "conan2d20";
    }
  };

  // Register the system module with Core AFTER SystemManager is defined.
  const module = game.modules.get(MODULE_ID);
  if (!module) return;

  module.api = {
    requiredCoreModuleVersion: REQUIRED_CORE_MODULE_VERSION,
    SystemManager
  };

  Hooks.call("tokenActionHudSystemReady", module);
});

function _buildDefaults() {
  const groups = [
    { id: "attacks-melee", name: localize("TAH.Melee", "Melee"), type: "system" },
    { id: "attacks-ranged", name: localize("TAH.Ranged", "Ranged"), type: "system" },
    { id: "combat-utility", name: localize("TAH.Utility", "Utility"), type: "system" },

    { id: "skills", name: localize("TAH.SkillTests", "Skill Tests"), type: "system" },

    { id: "actions", name: localize("TAH.Actions", "Actions"), type: "system" },
    { id: "talents", name: localize("TAH.Talents", "Talents"), type: "system" },

    { id: "armor", name: localize("TAH.Armor", "Armor"), type: "system" },
    { id: "kits", name: localize("TAH.Kits", "Kits"), type: "system" }
  ].map(g => ({
    ...g,
    listName: `Group: ${g.name}`
  }));

  const byId = Object.fromEntries(groups.map(g => [g.id, g]));

  const layout = [
    {
      nestId: "combat",
      id: "combat",
      name: localize("TAH.Combat", "Combat"),
      groups: [
        { ...byId["attacks-melee"], nestId: "combat_attacks-melee" },
        { ...byId["attacks-ranged"], nestId: "combat_attacks-ranged" },
        { ...byId["combat-utility"], nestId: "combat_combat-utility" }
      ]
    },
    {
      nestId: "skills",
      id: "skills",
      name: localize("TAH.Skills", "Skills"),
      groups: [{ ...byId["skills"], nestId: "skills_skills" }]
    },
    {
      nestId: "actions",
      id: "actions",
      name: localize("TAH.Actions", "Actions"),
      groups: [{ ...byId["actions"], nestId: "actions_actions" }]
    },
    {
      nestId: "talents",
      id: "talents",
      name: localize("TAH.Talents", "Talents"),
      groups: [{ ...byId["talents"], nestId: "talents_talents" }]
    },
    {
      nestId: "inventory",
      id: "inventory",
      name: localize("TAH.Inventory", "Inventory"),
      groups: [
        { ...byId["armor"], nestId: "inventory_armor" },
        { ...byId["kits"], nestId: "inventory_kits" }
      ]
    }
  ];

  return { layout, groups };
}