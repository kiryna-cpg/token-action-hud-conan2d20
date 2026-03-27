import { ACTION_TYPES, MODULE_ID, SETTING_KEYS, CHAT_POST_MODES } from "../constants.js";

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
          if (game.combat && Number(game.combat.round ?? 0) === 0) {
            ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.CombatNotStarted"));
            return;
          }

          const alreadyDone = await this._isTurnDone(actor);
          if (alreadyDone) {
            ui.notifications.warn(game.i18n.format("TAH.Conan2d20.TurnAlreadyDone", { name: actor.name }));
            return;
          }

          const c = await this._setCombatTurnToActor(actor);

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
          if (game.combat && Number(game.combat.round ?? 0) === 0) {
            ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.CombatNotStarted"));
            return;
          }

          const alreadyDone = await this._isTurnDone(actor);
          if (alreadyDone) {
            ui.notifications.warn(game.i18n.format("TAH.Conan2d20.TurnAlreadyDone", { name: actor.name }));
            return;
          }

          const c = await this._setCombatTurnToActor(actor);

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
          return this._postItemToChat(actor, itemId, CHAT_POST_MODES.ACTIONS);
        }

        case ACTION_TYPES.TALENT_POST: {
          const itemId = parts[1];
          return this._postItemToChat(actor, itemId, CHAT_POST_MODES.TALENTS);
        }

        default:
          return;
      }
    }

    // --- keep your existing private helpers below (unchanged) ---
    // (I’m not rewriting them here; paste the rest of your current file content below this point.)
  };
}

// Normal path: Core emits this when its API is ready
Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  initConan2d20RollHandler(coreModule);
});

// Fallback: if our module loads after the hook already fired
Hooks.once("init", () => {
  const core = game.modules.get("token-action-hud-core");
  if (!core?.active) return;
  if (core.api) initConan2d20RollHandler(core);
});