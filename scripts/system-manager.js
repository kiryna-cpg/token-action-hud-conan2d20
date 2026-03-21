import { MODULE_ID, REQUIRED_CORE_MODULE_VERSION } from "./constants.js";
import { ActionHandler } from "./action-handler.js";
import { Conan2d20RollHandler, initConan2d20RollHandler } from "./system/conan2d20-roll-handler.js";
import { registerSettings } from "./settings.js";
import { localize } from "./util/i18n.js";

export let SystemManager = null;

let _registered = false;

/**
 * Register this system module with Token Action HUD Core.
 * This function is idempotent and safe to call multiple times.
 */
function _registerWithCore(coreModule) {
  if (_registered) return;
  if (!coreModule?.api?.SystemManager) return;

  // Ensure RollHandler class exists before Core tries to fetch it
  initConan2d20RollHandler(coreModule);

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

  const module = game.modules.get(MODULE_ID);
  if (!module) return;

  module.api = {
    requiredCoreModuleVersion: REQUIRED_CORE_MODULE_VERSION,
    SystemManager
  };

  _registered = true;

  // Notify Core that the system is ready
  Hooks.callAll("tokenActionHudSystemReady", module);
}

// Normal path: Core emits this when its API is ready
Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  _registerWithCore(coreModule);
});

// Fallback: if our module loads after Core already emitted the hook,
// Core API may already be present on the module instance.
Hooks.once("init", () => {
  const core = game.modules.get("token-action-hud-core");
  if (!core?.active) return;
  if (core.api) _registerWithCore(core);
});

function _buildDefaults() {
  // Groups must exist as first-class entries. Layout references these group IDs.
  const groups = [
    { id: "attacks-melee", name: localize("TAH.Melee", "Melee"), type: "system" },
    { id: "attacks-ranged", name: localize("TAH.Ranged", "Ranged"), type: "system" },
    { id: "combat-utility", name: localize("TAH.Utility", "Utility"), type: "system" },
    { id: "defensive-rolls", name: game.i18n.localize("TAH.Conan2d20.DefensiveRolls"), type: "system" },
    { id: "special-abilities", name: game.i18n.localize("TAH.Conan2d20.SpecialAbilities"), type: "system" },

    { id: "skills", name: localize("TAH.SkillTests", "Skill Tests"), type: "system" },

    // Actions by type
    { id: "actions-standard", name: game.i18n.localize("TAH.Conan2d20.Actions.Standard"), type: "system" },
    { id: "actions-minor", name: game.i18n.localize("TAH.Conan2d20.Actions.Minor"), type: "system" },
    { id: "actions-reactions", name: game.i18n.localize("TAH.Conan2d20.Actions.Reactions"), type: "system" },
    { id: "actions-free", name: game.i18n.localize("TAH.Conan2d20.Actions.Free"), type: "system" },
    { id: "actions-other", name: game.i18n.localize("TAH.Conan2d20.Actions.Other"), type: "system" },

    // Talents by type
    { id: "talents-bloodline", name: game.i18n.localize("TAH.Conan2d20.Talents.Bloodline"), type: "system" },
    { id: "talents-caste", name: game.i18n.localize("TAH.Conan2d20.Talents.Caste"), type: "system" },
    { id: "talents-fortune", name: game.i18n.localize("TAH.Conan2d20.Talents.Fortune"), type: "system" },
    { id: "talents-homeland", name: game.i18n.localize("TAH.Conan2d20.Talents.Homeland"), type: "system" },
    { id: "talents-skill", name: game.i18n.localize("TAH.Conan2d20.Talents.Skill"), type: "system" },
    { id: "talents-other", name: game.i18n.localize("TAH.Conan2d20.Talents.Other"), type: "system" },

    { id: "armor", name: localize("TAH.Armor", "Armor"), type: "system" },
    { id: "kits", name: localize("TAH.Kits", "Kits"), type: "system" },
    { id: "consumables", name: localize("TAH.Consumables", "Consumables"), type: "system" },
    { id: "miscellaneous", name: localize("TAH.Miscellaneous", "Miscellaneous"), type: "system" },

    { id: "spells", name: localize("TAH.Spells", "Spells"), type: "system" },
    { id: "petty-enchantments", name: localize("TAH.PettyEnchantments", "Petty Enchantments"), type: "system" }
  ].map((g) => ({
    ...g,
    listName: `Group: ${g.name}`
  }));

  const byId = Object.fromEntries(groups.map((g) => [g.id, g]));

  const layout = [
    {
      nestId: "combat",
      id: "combat",
      name: localize("TAH.Combat", "Combat"),
      groups: [
        { ...byId["attacks-melee"], nestId: "combat_attacks-melee" },
        { ...byId["attacks-ranged"], nestId: "combat_attacks-ranged" },
        { ...byId["defensive-rolls"], nestId: "combat_defensive-rolls" },
        { ...byId["special-abilities"], nestId: "combat_special-abilities" },
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
      groups: [
        { ...byId["actions-standard"], nestId: "actions_actions-standard" },
        { ...byId["actions-minor"], nestId: "actions_actions-minor" },
        { ...byId["actions-reactions"], nestId: "actions_actions-reactions" },
        { ...byId["actions-free"], nestId: "actions_actions-free" },
        { ...byId["actions-other"], nestId: "actions_actions-other" }
      ]
    },
    {
      nestId: "talents",
      id: "talents",
      name: localize("TAH.Talents", "Talents"),
      groups: [
        { ...byId["talents-bloodline"], nestId: "talents_talents-bloodline" },
        { ...byId["talents-caste"], nestId: "talents_talents-caste" },
        { ...byId["talents-fortune"], nestId: "talents_talents-fortune" },
        { ...byId["talents-homeland"], nestId: "talents_talents-homeland" },
        { ...byId["talents-skill"], nestId: "talents_talents-skill" },
        { ...byId["talents-other"], nestId: "talents_talents-other" }
      ]
    },
    {
      nestId: "inventory",
      id: "inventory",
      name: localize("TAH.Inventory", "Inventory"),
      groups: [
        { ...byId["armor"], nestId: "inventory_armor" },
        { ...byId["kits"], nestId: "inventory_kits" },
        { ...byId["consumables"], nestId: "inventory_consumables" },
        { ...byId["miscellaneous"], nestId: "inventory_miscellaneous" }
      ]
    },
    {
      nestId: "sorcery",
      id: "sorcery",
      name: localize("TAH.Sorcery", "Sorcery"),
      groups: [
        { ...byId["spells"], nestId: "sorcery_spells" },
        { ...byId["petty-enchantments"], nestId: "sorcery_petty-enchantments" }
      ]
    }
  ];

  return { groups, layout };
}