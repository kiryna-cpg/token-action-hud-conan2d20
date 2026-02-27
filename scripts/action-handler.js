import { ACTION_TYPES, MODULE_ID, SETTING_KEYS } from "./constants.js";
import { localize } from "./util/i18n.js";
import { SKILL_LABELS } from "./util/skill-map.js";

export let ActionHandler = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
    /** @override */
    async buildSystemActions(groupIds) {
    // Core may provide token/actor in different combinations depending on context (hover, control, permissions).
    // Always resolve from the most reliable sources first.
    const token =
        this.token ??
        canvas.tokens?.controlled?.[0] ??
        canvas.tokens?.hover ??
        null;

    const actor =
        this.actor ??
        token?.actor ??
        null;

    // Persist resolved references for downstream helpers.
    this.token = token ?? this.token;
    this.actor = actor ?? this.actor;

    if (!actor) return;

      const enableHouseRules = game.settings.get(MODULE_ID, SETTING_KEYS.ENABLE_HOUSE_RULES);
      const onlyEquippedWeapons = game.settings.get(MODULE_ID, SETTING_KEYS.ONLY_EQUIPPED_WEAPONS);

      // Build groups expected by your DEFAULTS/layout (system-manager defaults)
      this._addCombatActions(actor, { onlyEquippedWeapons });
      this._addSkillActions(actor, { enableHouseRules });

      if (game.settings.get(MODULE_ID, SETTING_KEYS.SHOW_ACTIONS_TAB)) {
        this._addActorActions(actor);
      }

      if (game.settings.get(MODULE_ID, SETTING_KEYS.SHOW_TALENTS_TAB)) {
        this._addTalents(actor);
      }

      if (game.settings.get(MODULE_ID, SETTING_KEYS.SHOW_INVENTORY_TAB)) {
        this._addInventory(actor);
      }
    }

    /** @override */
    async softReset() {}

    /** @override */
    async reset() {
      return this.softReset();
    }

    // -----------------------------
    // Internal helpers
    // -----------------------------

    _addCombatActions(actor, { onlyEquippedWeapons }) {
      const weapons = actor.items
        .filter(i => i.type === "weapon")
        .filter(i => (onlyEquippedWeapons ? !!i.system.equipped : true))
        .filter(i => !i.system.broken);

      const toWeaponAction = (item) => {
        const isEquipped = !!item.system?.equipped;

        return {
            id: `${ACTION_TYPES.WEAPON_USE}.${item.id}`,
            name: item.name,
            img: item.img,
            info1: isEquipped ? { text: localize("TAH.Conan2d20.Equipped", "Equipped") } : null,
            encodedValue: `${ACTION_TYPES.WEAPON_USE}|${item.id}`
        };
        };

      const melee = weapons.filter(w => w.system.weaponType === "melee");
      const ranged = weapons.filter(w => w.system.weaponType === "ranged");

      if (melee.length) {
        const actions = melee.map(toWeaponAction);
        this.addActions(actions, { id: "attacks-melee", type: "system" });
      }

      if (ranged.length) {
        const actions = ranged.map(toWeaponAction);
        this.addActions(actions, { id: "attacks-ranged", type: "system" });
      }

      // Initiative / utility
      this.addActions(
        [{
          id: `${ACTION_TYPES.INIT_ROLL}`,
          name: localize("TAH.Initiative", "Initiative"),
          img: null,
          encodedValue: `${ACTION_TYPES.INIT_ROLL}`
        }],
        "combat-utility"
      );
    }

    _addSkillActions(actor, { enableHouseRules }) {
      const skills = actor.system.skills ?? {};
      const keys = Object.keys(skills);

      keys.sort((a, b) => (SKILL_LABELS[a] ?? a).localeCompare(SKILL_LABELS[b] ?? b));

      const actions = keys.map(key => {
        const s = skills[key];
        const label = SKILL_LABELS[key] ?? key;

        const base = {
          id: `${ACTION_TYPES.SKILL_ROLL}.${key}`,
          name: label,
          img: null,
          info1: { text: `${s?.tn?.value ?? ""}` },
          info2: { text: `${s?.expertise?.value ?? ""}` },
          encodedValue: `${ACTION_TYPES.SKILL_ROLL}|${key}`
        };

        if (enableHouseRules) {
          base.subactions = [
            { name: "+1d20", encodedValue: `${ACTION_TYPES.BUY_DICE}|${key}|1` },
            { name: "+2d20", encodedValue: `${ACTION_TYPES.BUY_DICE}|${key}|2` },
            { name: "+3d20", encodedValue: `${ACTION_TYPES.BUY_DICE}|${key}|3` }
          ];
        }

        return base;
      });

      this.addActions(actions, { id: "skills", type: "system" });
    }

    _addActorActions(actor) {
      const items = actor.items.filter(i => i.type === "action");
      const byType = new Map();

      for (const it of items) {
        const t = it.system.actionType ?? "other";
        if (!byType.has(t)) byType.set(t, []);
        byType.get(t).push(it);
      }

      for (const [type, list] of byType.entries()) {
        const actions = list.map(item => ({
          id: `${ACTION_TYPES.ACTION_POST}.${item.id}`,
          name: item.name,
          img: item.img,
          encodedValue: `${ACTION_TYPES.ACTION_POST}|${item.id}`
        }));

        // Group ids must exist in defaults OR Core will place them into "uncategorised" depending on settings.
        // Minimal approach: collapse all into a single group.
        this.addActions(actions, { id: "actions", type: "system" });
      }
    }

    _addTalents(actor) {
      const talents = actor.items.filter(i => i.type === "talent");
      const actions = talents.map(item => ({
        id: `${ACTION_TYPES.TALENT_POST}.${item.id}`,
        name: item.name,
        img: item.img,
        encodedValue: `${ACTION_TYPES.TALENT_POST}|${item.id}`
      }));

      this.addActions(actions, { id: "talents", type: "system" });
    }

    _addInventory(actor) {
      // Armor
      const armorItems = actor.items.filter(i => i.type === "armor");
      const armorActions = armorItems.map(item => {
        const isEquipped = !!item.system?.equipped;

        return {
          id: `${ACTION_TYPES.ITEM_TOGGLE_EQUIP}.${item.id}`,
          name: item.name,
          img: item.img,
          info1: isEquipped ? { text: localize("TAH.Conan2d20.Equipped", "Equipped") } : null,
          encodedValue: `${ACTION_TYPES.ITEM_TOGGLE_EQUIP}|${item.id}`,
          subactions: [
            {
              name: localize("TAH.Conan2d20.Open", "Open"),
              encodedValue: `${ACTION_TYPES.ITEM_OPEN}|${item.id}`
            }
          ]
        };
      });

      this.addActions(armorActions, { id: "armor", type: "system" });

      // Kits
      const kits = actor.items
        .filter(i => i.type === "kit")
        .map(item => ({
          id: `${ACTION_TYPES.ITEM_OPEN}.${item.id}`,
          name: item.name,
          img: item.img,
          encodedValue: `${ACTION_TYPES.ITEM_OPEN}|${item.id}`
        }));

      this.addActions(kits, { id: "kits", type: "system" });
    }
  };
});