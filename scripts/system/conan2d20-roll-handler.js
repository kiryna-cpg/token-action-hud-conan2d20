import { ACTION_TYPES, MODULE_ID, SETTING_KEYS, CHAT_POST_MODES } from "../constants.js";
import { getCombatantTurnDone, setCombatantTurnDone, setCombatTurn } from "../util/combat-turns.js";

export let Conan2d20RollHandler = null;

/**
 * Initialize the RollHandler class once Core API is available.
 * Idempotent: safe to call multiple times.
 */
export function initConan2d20RollHandler(coreModule) {
  if (Conan2d20RollHandler) return;
  if (!coreModule?.api?.RollHandler) return;

  Conan2d20RollHandler = class Conan2d20RollHandler extends coreModule.api.RollHandler {
    /** @override */
    async handleActionClick(event, encodedValue) {
      const actor = this.actor;
      if (!actor || !encodedValue) return;

      const isRightClick =
        event?.button === 2 ||
        event?.which === 3 ||
        event?.type === "contextmenu";

      const parts = encodedValue.split(this.delimiter);
      const type = parts[0];

      switch (type) {
        case ACTION_TYPES.SKILL_ROLL: {
          const skillKey = parts[1];
          if (isRightClick) return actor.sheet?.render(true);

          if (typeof actor._rollSkillCheck === "function") {
            return actor._rollSkillCheck(skillKey, null, 0);
          }

          return actor.sheet?.render(true);
        }

        case ACTION_TYPES.BUY_DICE: {
          const skillKey = parts[1];
          const dice = Number(parts[2] ?? 0);
          if (isRightClick) return actor.sheet?.render(true);

          const enableHouseRules = game.settings.get(MODULE_ID, SETTING_KEYS.ENABLE_HOUSE_RULES);
          if (enableHouseRules && dice > 0) {
            await this._applyStressCost(actor, skillKey, dice);
          }

          if (typeof actor._rollSkillCheck === "function") {
            return actor._rollSkillCheck(skillKey, null, dice);
          }

          return actor.sheet?.render(true);
        }

        case ACTION_TYPES.SPELL_CAST: {
          const itemId = parts[1];
          if (isRightClick) return this.renderItem(actor, itemId);

          const item = actor.items.get(itemId);
          if (!item) return;

          if (typeof actor._castSpell === "function") return actor._castSpell(itemId);
          if (typeof actor.castSpell === "function") return actor.castSpell(itemId);
          if (typeof actor._executeAttack === "function") return actor._executeAttack(itemId);

          if (typeof item.roll === "function") return item.roll();
          return item.sheet?.render(true);
        }

        case ACTION_TYPES.WEAPON_USE: {
          const itemId = parts[1];
          if (isRightClick) return this.renderItem(actor, itemId);

          if (typeof actor._executeAttack === "function") {
            return actor._executeAttack(itemId);
          }

          const item = actor.items.get(itemId);
          if (!item) return;
          if (typeof item.roll === "function") return item.roll();
          return item.sheet?.render(true);
        }

        case ACTION_TYPES.ITEM_TOGGLE_EQUIP: {
          const itemId = parts[1];
          const item = actor.items.get(itemId);
          if (!item) return;

          if (isRightClick) return item.sheet?.render(true);

          const current = !!item.system?.equipped;
          return item.update({ "system.equipped": !current });
        }

        case ACTION_TYPES.ITEM_OPEN: {
          const itemId = parts[1];
          const item = actor.items.get(itemId);
          if (!item) return;

          if (!isRightClick && item.type === "kit" && typeof actor.useKit === "function") {
            return actor.useKit(itemId);
          }

          return item.sheet?.render(true);
        }

        case ACTION_TYPES.TURN_CLAIM: {
          if (!game.combat) {
            ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.NoActiveCombat"));
            return;
          }

          if (Number(game.combat.round ?? 0) === 0) {
            ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.CombatNotStarted"));
            return;
          }

          const c = this._getActorCombatant(actor);
          if (!c) {
            ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.NoCombatant"));
            return;
          }

          const alreadyDone = getCombatantTurnDone(c);
          if (alreadyDone) {
            ui.notifications.warn(game.i18n.format("TAH.Conan2d20.TurnAlreadyDone", { name: actor.name }));
            return;
          }

          await this._setCombatTurnToCombatant(c);

          const msg = game.i18n.format("TAH.Conan2d20.ClaimTurnChat", { name: actor.name });
          ui.notifications.info(msg);
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: msg
          });

          await this._setTurnDone(actor, true, c);
          await ui.combat?.render?.();
          return;
        }

        case ACTION_TYPES.TURN_SEIZE: {
          if (!game.combat) {
            ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.NoActiveCombat"));
            return;
          }

          if (Number(game.combat.round ?? 0) === 0) {
            ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.CombatNotStarted"));
            return;
          }

          const c = this._getActorCombatant(actor);
          if (!c) {
            ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.NoCombatant"));
            return;
          }

          const alreadyDone = getCombatantTurnDone(c);
          if (alreadyDone) {
            ui.notifications.warn(game.i18n.format("TAH.Conan2d20.TurnAlreadyDone", { name: actor.name }));
            return;
          }

          const spentDoom = await this._spendDoom(1);
          if (!spentDoom) return;

          await this._setCombatTurnToCombatant(c);

          const msg = game.i18n.format("TAH.Conan2d20.SeizeTurnChat", { name: actor.name });
          ui.notifications.info(msg);
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: msg
          });

          await this._setTurnDone(actor, true, c);
          await ui.combat?.render?.();
          return;
        }

        case ACTION_TYPES.ACTION_POST: {
          const itemId = parts[1];
          return this._postItemToChat(actor, itemId);
        }

        case ACTION_TYPES.TALENT_POST: {
          const itemId = parts[1];
          return this._postItemToChat(actor, itemId);
        }

        default:
          return;
      }
    }

    // -----------------------------
    // Helpers
    // -----------------------------

    renderItem(actor, itemId) {
      const item = actor?.items?.get(itemId);
      return item?.sheet?.render(true);
    }

    _getActorCombatant(actor) {
      const combat = game.combat;
      if (!combat) return null;

      const token =
        this.token ??
        actor.getActiveTokens?.(true, true)?.[0] ??
        actor.getActiveTokens?.()?.[0] ??
        null;

      return (
        token?.combatant ??
        combat.combatants?.find((c) => c.tokenId === token?.id) ??
        combat.combatants?.find((c) => c.actorId === actor.id) ??
        null
      );
    }

    async _setCombatTurnToCombatant(combatant) {
      const combat = game.combat;
      if (!combat || !combatant) return null;

      const turns = combat.turns ?? [];
      const idx = turns.findIndex((t) => t?.id === combatant.id);
      if (idx >= 0) {
        await setCombatTurn(combat, idx);
      }

      return combatant;
    }

    async _setCombatTurnToActor(actor) {
      return this._setCombatTurnToCombatant(this._getActorCombatant(actor));
    }

    async _isTurnDone(actor) {
      const combatant = this._getActorCombatant(actor);
      if (!combatant) return false;

      // The Conan system stores turn-completion on the Combat document per round.
      return getCombatantTurnDone(combatant);
    }

    async _setTurnDone(_actor, done, combatantOverride = null) {
      const combat = game.combat;
      if (!combat) return;

      const combatant = combatantOverride ?? combat.combatant;
      if (!combatant) return;

      await setCombatantTurnDone(combatant, done, { bankMomentum: true });
    }


    async _spendDoom(cost = 1) {
      const systemId = "conan2d20";
      const current = Number(game.settings.get(systemId, "doom") ?? 0);

      if (!Number.isFinite(current)) {
        ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.DoomNotFound"));
        return false;
      }

      if (current < cost) {
        ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.NoDoomAvailable"));
        return false;
      }

      try {
        const tracker = globalThis.conan?.apps?.MomentumTrackerV2;
        if (typeof tracker?.changeCounter === "function") {
          await tracker.changeCounter(-cost, "doom");
        } else {
          await game.settings.set(systemId, "doom", Math.max(0, current - cost));
        }
        return true;
      } catch (err) {
        console.warn(`${MODULE_ID} | Failed to spend Doom.`, err);
        ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.DoomNotFound"));
        return false;
      }
    }

    async _applyStressCost(actor, skillKey, dice) {
      // House-rule: spend Vigor for physical checks, Resolve for mental checks.
      // Try to infer attribute from system data; fallback to Resolve.
      const attr =
        actor.system?.skills?.[skillKey]?.attribute ??
        actor.system?.skills?.[skillKey]?.attr ??
        null;

      const physical = new Set(["agility", "awareness", "brawn", "coordination"]);
      const pool = physical.has(String(attr).toLowerCase()) ? "vigor" : "resolve";

      const path = pool === "vigor" ? "system.vigor.value" : "system.resolve.value";
      const cur = Number(foundry.utils.getProperty(actor, path) ?? 0);
      const next = Math.max(0, cur - dice);

      await actor.update({ [path]: next });
    }

    async _postItemToChat(actor, itemId) {
      const item = actor.items.get(itemId);
      if (!item) return;

      const mode = game.settings.get(MODULE_ID, SETTING_KEYS.CHAT_POST_MODE);

      if (mode === CHAT_POST_MODES.FULL && typeof item.toChat === "function") {
        return item.toChat();
      }

      const title = `<h3>${foundry.utils.escapeHTML(item.name ?? "")}</h3>`;
      const desc =
        item.system?.description?.value ??
        item.system?.description ??
        item.system?.tooltip?.value ??
        item.system?.tooltip ??
        "";

      return ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `${title}${mode === CHAT_POST_MODES.FULL ? desc : ""}`
      });
    }
  };
}