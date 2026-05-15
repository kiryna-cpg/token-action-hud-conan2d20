import { MODULE_ID } from "../constants.js";

const SYSTEM_ID = "conan2d20";

/**
 * Return the Combat document that owns a combatant.
 * @param {Combatant} combatant
 * @returns {Combat|null}
 */
function getCombatantCombat(combatant) {
  return combatant?.parent ?? combatant?.combat ?? game.combat ?? null;
}

/**
 * Clone the Conan system round-completion flag into an Array-compatible shape.
 * The system stores round data at flags.conan2d20.combatantsTurnDone[round].
 * @param {Combat} combat
 * @returns {Array<object>}
 */
function getTurnDoneRounds(combat) {
  const raw = combat?.getFlag?.(SYSTEM_ID, "combatantsTurnDone") ?? [];

  if (Array.isArray(raw)) return foundry.utils.deepClone(raw);
  if (!raw || typeof raw !== "object") return [];

  const rounds = [];
  for (const [round, value] of Object.entries(raw)) {
    const index = Number(round);
    if (Number.isInteger(index) && index >= 0) {
      rounds[index] = foundry.utils.deepClone(value ?? {});
    }
  }
  return rounds;
}

/**
 * Return true when the Conan system should bank actor Momentum/Doom on turn completion.
 * @param {Combat} combat
 * @returns {boolean}
 */
function shouldBankMomentum(combat) {
  if (typeof combat?.shouldUpdateMomentum === "boolean") return combat.shouldUpdateMomentum;

  try {
    return !!game.settings.get(SYSTEM_ID, "combatTrackerMomentumUpdate");
  } catch (_err) {
    return false;
  }
}

/**
 * Keep old per-combatant flags aligned as a non-authoritative compatibility mirror.
 * The Conan v14 system source of truth is the Combat flag above.
 * @param {Combatant} combatant
 * @param {boolean} value
 * @returns {Promise<void>}
 */
async function setLegacyCombatantFlags(combatant, value) {
  if (!combatant?.setFlag) return;
  const v = !!value;

  await Promise.allSettled([
    combatant.setFlag(SYSTEM_ID, "turnDone", v),
    combatant.setFlag(SYSTEM_ID, "turnCompleted", v),
    combatant.setFlag(MODULE_ID, "turnDone", v)
  ]);
}

/**
 * Read turn-completion from the Conan system's current-round Combat flag.
 * Missing entries are false, matching CombatTracker2d20V2._prepareTrackerContext.
 * @param {Combatant} combatant
 * @returns {boolean}
 */
export function getCombatantTurnDone(combatant) {
  if (!combatant) return false;

  const combat = getCombatantCombat(combatant);
  if (!combat) return false;

  const round = Number(combat.round ?? 0);
  const roundData = combat.combatantsTurnsDoneThisRound ?? getTurnDoneRounds(combat)[round] ?? {};

  return !!roundData?.[combatant.id];
}

/**
 * Persist turn-completion to the Conan system's current-round Combat flag.
 * @param {Combatant} combatant
 * @param {boolean} value
 * @param {object} options
 * @param {boolean} [options.bankMomentum=true]
 * @returns {Promise<boolean>} Whether the system source-of-truth flag was updated.
 */
export async function setCombatantTurnDone(combatant, value, { bankMomentum = true } = {}) {
  if (!combatant) return false;

  const combat = getCombatantCombat(combatant);
  const v = !!value;
  const wasDone = getCombatantTurnDone(combatant);

  let updatedSystemFlag = false;

  if (combat?.setFlag) {
    const round = Number(combat.round ?? 0);
    const rounds = getTurnDoneRounds(combat);
    const roundData = { ...(rounds[round] ?? {}) };
    roundData[combatant.id] = v;
    rounds[round] = roundData;

    try {
      await combat.setFlag(SYSTEM_ID, "combatantsTurnDone", rounds);
      updatedSystemFlag = true;
    } catch (err) {
      console.warn(`${MODULE_ID} | Failed to update Conan combat turn state.`, err);
    }
  }

  if (updatedSystemFlag && bankMomentum && v && !wasDone && shouldBankMomentum(combat)) {
    await combatant.actor?.bankMomentum?.();
  }

  await setLegacyCombatantFlags(combatant, v);

  return updatedSystemFlag;
}

/**
 * Set the active combat turn through the Conan system API when available.
 * @param {Combat} combat
 * @param {number} turn
 * @returns {Promise<void>}
 */
export async function setCombatTurn(combat, turn) {
  if (!combat) return;

  if (typeof combat.setTurn === "function") {
    await combat.setTurn(turn);
    return;
  }

  await combat.update({ turn });
}
