import { ACTION_TYPES, MODULE_ID, SETTING_KEYS, CHAT_POST_MODES } from "../constants.js";

export class Conan2d20RollHandler {
  async handleAction({ actor, token, encodedValue }) {
    if (!actor || !encodedValue) return;

    const parts = encodedValue.split("|");
    const type = parts[0];

    switch (type) {
      case ACTION_TYPES.SKILL_ROLL: {
        const skillKey = parts[1];
        return this._rollSkill(actor, skillKey);
      }

      case ACTION_TYPES.BUY_DICE: {
        const skillKey = parts[1];
        const dice = Number(parts[2] ?? 0);
        return this._rollSkill(actor, skillKey, { buyDice: dice });
      }

      case ACTION_TYPES.WEAPON_USE: {
        const itemId = parts[1];
        const item = actor.items.get(itemId);
        if (!item) return;
        return this._useWeapon(actor, item);
      }

      case ACTION_TYPES.ITEM_OPEN: {
        const itemId = parts[1];
        const item = actor.items.get(itemId);
        if (!item) return;
        return item.sheet?.render(true);
      }

      case ACTION_TYPES.ACTION_POST:
      case ACTION_TYPES.TALENT_POST: {
        const itemId = parts[1];
        const item = actor.items.get(itemId);
        if (!item) return;
        return this._postItemToChat(item);
      }

      case ACTION_TYPES.INIT_ROLL: {
        return this._rollInitiative(actor);
      }

      default:
        return;
    }
  }

  async _rollSkill(actor, skillKey, options = {}) {
    const enableHouseRules = game.settings.get(MODULE_ID, SETTING_KEYS.ENABLE_HOUSE_RULES);

    if (enableHouseRules && options.buyDice) {
      await this._applyStressCost(actor, skillKey, options.buyDice);
    }

    const fn = actor?.rollSkill ?? actor?.rollSkillTest ?? null;
    if (typeof fn === "function") {
      return fn.call(actor, skillKey, options);
    }

    const macro = game?.conan2d20?.rollSkill ?? null;
    if (typeof macro === "function") {
      return macro(actor, skillKey, options);
    }

    return actor.sheet?.render(true);
  }

  async _useWeapon(actor, item) {
    if (typeof item.roll === "function") {
      return item.roll();
    }

    const fn = actor?.rollWeapon ?? actor?.rollAttack ?? null;
    if (typeof fn === "function") {
      return fn.call(actor, item);
    }

    return item.sheet?.render(true);
  }

  async _rollInitiative(actor) {
    if (typeof actor.rollInitiative === "function") {
      return actor.rollInitiative();
    }
    if (actor?.token?.combatant) {
      return actor.token.combatant.rollInitiative();
    }
    return;
  }

  async _postItemToChat(item) {
    const mode = game.settings.get(MODULE_ID, SETTING_KEYS.CHAT_POST_MODE);
    const content = mode === CHAT_POST_MODES.TITLE_ONLY
      ? `<h2>${item.name}</h2>`
      : `<h2>${item.name}</h2>${item.system?.description?.value ?? ""}`;

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: item.actor }),
      content
    });
  }

  async _applyStressCost(actor, skillKey, dice) {
    const skill = actor.system.skills?.[skillKey];
    const attr = skill?.attribute;

    const physicalAttrs = new Set(["agi", "bra", "coo"]);
    const isPhysical = physicalAttrs.has(attr);

    const path = isPhysical ? "system.health.physical.value" : "system.health.mental.value";
    const current = foundry.utils.getProperty(actor, path);

    if (typeof current !== "number") return;

    const next = Math.max(0, current - dice);
    await actor.update({ [path]: next });
  }
}