import { ACTION_TYPES, MODULE_ID, SETTING_KEYS } from "./constants.js";
import { localize } from "./util/i18n.js";
import { SKILL_LABELS } from "./util/skill-map.js";

export let ActionHandler = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
    /** @override */
    async buildSystemActions(_groupIds) {
      const token =
        this.token ??
        canvas.tokens?.controlled?.[0] ??
        canvas.tokens?.hover ??
        null;

      const actor =
        this.actor ??
        token?.actor ??
        null;

      this.token = token ?? this.token;
      this.actor = actor ?? this.actor;

      if (!actor) return;

      const enableHouseRules = game.settings.get(MODULE_ID, SETTING_KEYS.ENABLE_HOUSE_RULES);
      const onlyEquippedWeapons = game.settings.get(MODULE_ID, SETTING_KEYS.ONLY_EQUIPPED_WEAPONS);

      this._addCombatActions(actor, { onlyEquippedWeapons, enableHouseRules });
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
    // Combat
    // -----------------------------

    _addCombatActions(actor, { onlyEquippedWeapons, enableHouseRules }) {
      const weapons = actor.items
        .filter(i => i.type === "weapon")
        .filter(i => (onlyEquippedWeapons ? !!i.system?.equipped : true))
        .filter(i => !i.system?.broken);

      // Non-weapon attacks in Attacks section (e.g. Steely Glare)
      const specialAttacks = actor.items
        .filter(i => i.type !== "weapon")
        .filter(i => (onlyEquippedWeapons ? !!i.system?.equipped : true))
        .filter(i => !i.system?.broken)
        .filter(i => i.system?.damage?.dice != null && `${i.system.damage.dice}` !== "");

      const toWeaponAction = (item) => {
        const isEquipped = !!item.system?.equipped;
        const sys = item.system ?? {};

        // Confirmed schema:
        // Reach: system.range
        // Base Damage: system.damage.dice
        const reachRaw = sys.range ?? null;
        const damageRaw = sys.damage?.dice ?? null;

        const weaponType = sys.weaponType ?? "";
        const parts = [];
        const WJ = "\u2060"; // Word Joiner (prevents line breaks)

        // Reach, if available (NPC attacks often have no weaponType; treat as melee unless explicitly ranged)
        if (reachRaw != null && `${reachRaw}` !== "" && weaponType !== "ranged") {
          parts.push(`${localize("TAH.Conan2d20.ReachShort", "Rch")}${WJ}${reachRaw}`);
        }

        if (damageRaw != null && `${damageRaw}` !== "") {
          parts.push(`${localize("TAH.Conan2d20.DamageShort", "Dmg")}${WJ}${damageRaw}`);
        }

        const info2Text = parts.length ? parts.join(`${WJ}·${WJ}`) : "";

        return {
          id: `${ACTION_TYPES.WEAPON_USE}.${item.id}`,
          name: item.name,
          img: item.img,
          info1: isEquipped ? { text: localize("TAH.Conan2d20.Equipped", "Equipped") } : null,
          info2: info2Text ? { text: info2Text } : null,
          tooltip:
            sys?.tooltip?.value ??
            sys?.tooltip ??
            sys?.description?.value ??
            sys?.description ??
            "",
          encodedValue: `${ACTION_TYPES.WEAPON_USE}|${item.id}`
        };
      };
      const melee = weapons.filter(w => w.system?.weaponType === "melee");
      const ranged = weapons.filter(w => w.system?.weaponType === "ranged");

      // Claim/Seize Turn should live in an existing Combat group so TAH Core will render it.
      // We prepend it to the melee attacks group to keep it above Melee.
      const turnAction = (game.combat)
        ? {
          id: "turn-claim-seize",
          name: game.i18n.localize(
            ((actor.type ?? "").toString().toLowerCase() === "npc")
              ? "TAH.Conan2d20.SeizeTurn"
              : "TAH.Conan2d20.ClaimTurn"
          ),
          img: null,
          encodedValue: ((actor.type ?? "").toString().toLowerCase() === "npc")
            ? `${ACTION_TYPES.TURN_SEIZE}`
            : `${ACTION_TYPES.TURN_CLAIM}`
        }
        : null;

      const meleeSpecial = specialAttacks.filter(a => (a.system?.weaponType ?? "melee") !== "ranged");
      const rangedSpecial = specialAttacks.filter(a => (a.system?.weaponType ?? "") === "ranged");

      // Always create the melee group during combat so Claim/Seize is visible even without melee weapons.
      if (game.combat || melee.length || meleeSpecial.length) {
        const actions = [...melee, ...meleeSpecial].map(toWeaponAction);
        if (turnAction) actions.unshift(turnAction);
        this.addActions(actions, { id: "attacks-melee", type: "system" });
      }

      if (ranged.length || rangedSpecial.length) {
        const actions = [...ranged, ...rangedSpecial].map(toWeaponAction);
        this.addActions(actions, { id: "attacks-ranged", type: "system" });
      }

      // Defensive rolls (as quick access shortcuts to skill rollers)
      // Defensive rolls (quick access to skill rollers)
const isNpc = (actor.type ?? "").toString().toLowerCase() === "npc";

if (!isNpc) {
  // PCs: Defensive rolls (quick access to skill rollers)
  const skills = actor.system?.skills ?? {};

  const mkDef = (id, nameKey, skillKey) => {
    const s = skills?.[skillKey];
const pick = (...vals) => {
  for (const v of vals) {
    if (v === 0) return "0";
    if (v == null) continue;
    const s = `${v}`.trim();
    if (s !== "" && s !== "undefined" && s !== "null") return s;
  }
  return "";
};

// PC schema: s.tn.value, s.expertise.value
// NPC schema commonly differs: s.tn, and skill level may be s.value / s.level / s.expertise
const tn = pick(
  s?.tn?.value,
  s?.tn,
  s?.targetNumber?.value,
  s?.targetNumber
);

// NPC skill level is s.value (cmb/frt/knw/mov/sns/scl)
const sl = isNpc
  ? pick(s?.value)
  : pick(
      s?.expertise?.value,
      s?.expertise,
      s?.value?.value,
      s?.value,
      s?.level?.value,
      s?.level
    );

    return {
      id,
      name: game.i18n.localize(nameKey),
      img: null,
      encodedValue: `${ACTION_TYPES.SKILL_ROLL}|${skillKey}`,
      info1: enableHouseRules ? { text: `${localize("TAH.Conan2d20.TNShort", "TN")} ${tn}`.trim() } : null,
      info2: enableHouseRules ? { text: `${localize("TAH.Conan2d20.SLShort", "SL")} ${sl}`.trim() } : null
    };
  };

  this.addActions(
    [
      mkDef("defense-parry", "TAH.Conan2d20.Defense.Parry", "par"),
      mkDef("defense-dodge", "TAH.Conan2d20.Defense.Dodge", "acr"),
      mkDef("defense-resistance", "TAH.Conan2d20.Defense.Resistance", "res"),
      mkDef("defense-discipline", "TAH.Conan2d20.Defense.Discipline", "dis")
    ],
    { id: "defensive-rolls", type: "system" }
  );
} else {
  // NPCs: Special Abilities + Doom Spends (Items with system.actionType = abilities|doom)
  const specials = actor.items
    .filter((i) => ["abilities", "doom"].includes((i.system?.actionType ?? "").toString().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => {
      const at = (item.system?.actionType ?? "").toString().toLowerCase();
      const tooltip =
        item.system?.tooltip?.value ??
        item.system?.tooltip ??
        item.system?.description?.value ??
        item.system?.description ??
        "";

      return {
        id: `${ACTION_TYPES.ACTION_POST}.${item.id}`,
        name: item.name,
        img: item.img,
        tooltip,
        info1: at === "doom" ? { text: game.i18n.localize("TAH.Conan2d20.DoomSpendShort") } : null,
        encodedValue: `${ACTION_TYPES.ACTION_POST}|${item.id}`
      };
    });

  this.addActions(specials, { id: "special-abilities", type: "system" });
}

      // (moved) Claim/Seize Turn is now added at the top of Combat actions
    }

    // -----------------------------
    // Skills
    // -----------------------------

    _addSkillActions(actor, { enableHouseRules }) {
      const skills = actor.system.skills ?? {};
      const keys = Object.keys(skills);

      keys.sort((a, b) => (SKILL_LABELS[a] ?? a).localeCompare(SKILL_LABELS[b] ?? b));

      const actions = keys.map(key => {
        const s = skills[key];
      const isNpc = (actor.type ?? "").toString().toLowerCase() === "npc";

      // NPC skill codes -> localized labels
      const NPC_SKILL_LABELS = {
        cmb: game.i18n.localize("TAH.Conan2d20.NPCSkill.cmb"),
        frt: game.i18n.localize("TAH.Conan2d20.NPCSkill.frt"),
        knw: game.i18n.localize("TAH.Conan2d20.NPCSkill.knw"),
        mov: game.i18n.localize("TAH.Conan2d20.NPCSkill.mov"),
        scl: game.i18n.localize("TAH.Conan2d20.NPCSkill.scl"),
        sns: game.i18n.localize("TAH.Conan2d20.NPCSkill.sns")
      };

      const label = (isNpc ? (NPC_SKILL_LABELS[key] ?? key) : (SKILL_LABELS[key] ?? key));

        const pick = (...vals) => {
        for (const v of vals) {
          if (v === 0) return "0";
          if (v == null) continue;
          const s = `${v}`.trim();
          if (s !== "" && s !== "undefined" && s !== "null") return s;
        }
        return "";
      };

      const WJ = "\u2060"; // Word Joiner (prevents line breaks)

      // House Rules:
      // - PC: TN normally exists on s.tn.value; SL = expertise
      // - NPC: TN must be derived from Attribute + Skill Level (s.value)
      const NPC_SKILL_ATTR = {
        cmb: "agi",
        frt: "bra",
        knw: "int",
        mov: "agi",
        sns: "awa",
        scl: "per"
      };

      const npcAttrKey = NPC_SKILL_ATTR[key];
      const npcAttr = npcAttrKey ? Number(actor.system?.attributes?.[npcAttrKey]?.value ?? 0) : 0;
      const npcSL = Number(s?.value ?? 0);
      const npcTN = npcAttr + npcSL;

      const tn = isNpc
        ? `${npcTN}`
        : pick(
            s?.tn?.value,
            s?.tn,
            s?.targetNumber?.value,
            s?.targetNumber
          );

      const sl = isNpc
        ? `${npcSL}`
        : pick(
            s?.expertise?.value,
            s?.expertise,
            s?.value?.value,
            s?.value,
            s?.level?.value,
            s?.level
          );

      // Render TN/SL on the same line (avoid info1/info2 column split)
      const tnslText = enableHouseRules
        ? `${localize("TAH.Conan2d20.TNShort", "TN")}${WJ}${tn}${WJ}·${WJ}${localize("TAH.Conan2d20.SLShort", "SL")}${WJ}${sl}`.trim()
        : "";

        const base = {
          id: `${ACTION_TYPES.SKILL_ROLL}.${key}`,
          name: label,
          img: null,
          // House rules: TN + SL in a single line to prevent column wrapping/splitting
          info1: enableHouseRules
            ? { text: tnslText }
            : { text: tn },
          info2: enableHouseRules
            ? null
            : { text: sl },
          encodedValue: `${ACTION_TYPES.SKILL_ROLL}|${key}`
        };

        if (enableHouseRules && !isNpc) {
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

    // -----------------------------
    // Actions (system.actionType: standard/minor/reaction/free)
    // -----------------------------

    _addActorActions(actor) {
      const items = actor.items.filter(i => i.type === "action");
      if (!items.length) return;

      const groupFor = (actionType) => {
        switch ((actionType ?? "other").toString().toLowerCase()) {
          case "standard": return "actions-standard";
          case "minor": return "actions-minor";
          case "reaction": return "actions-reactions";
          case "free": return "actions-free";
          default: return "actions-other";
        }
      };

      const buckets = new Map();
      for (const it of items) {
        const t = it.system?.actionType ?? "other";
        const gid = groupFor(t);
        if (!buckets.has(gid)) buckets.set(gid, []);
        buckets.get(gid).push(it);
      }

      for (const [groupId, list] of buckets.entries()) {
        const actions = list
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(item => {
            const tooltip =
              item.system?.tooltip?.value ??
              item.system?.tooltip ??
              item.system?.description?.value ??
              item.system?.description ??
              "";

            return {
              id: `${ACTION_TYPES.ACTION_POST}.${item.id}`,
              name: item.name,
              img: item.img,
              tooltip,
              encodedValue: `${ACTION_TYPES.ACTION_POST}|${item.id}`
            };
          });

        this.addActions(actions, { id: groupId, type: "system" });
      }
    }

    // -----------------------------
    // Talents (system.talentType: bloodline/caste/fortune/homeland/other/skill)
    // Show ranks as R* and show linked skill for talentType=skill
    // -----------------------------

    _addTalents(actor) {
      const talents = actor.items.filter(i => i.type === "talent");
      if (!talents.length) return;

      const groupFor = (talentType) => {
        switch ((talentType ?? "other").toString().toLowerCase()) {
          case "bloodline": return "talents-bloodline";
          case "caste": return "talents-caste";
          case "fortune": return "talents-fortune";
          case "homeland": return "talents-homeland";
          case "skill": return "talents-skill";
          default: return "talents-other";
        }
      };

      const buckets = new Map();
      for (const it of talents) {
        const t = it.system?.talentType ?? "other";
        const gid = groupFor(t);
        if (!buckets.has(gid)) buckets.set(gid, []);
        buckets.get(gid).push(it);
      }

      for (const [groupId, list] of buckets.entries()) {
        const actions = list
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(item => {
            const talentType = (item.system?.talentType ?? "other").toString().toLowerCase();
            const rank = Number(item.system?.rank?.value ?? 0);

            const linkedSkillKey = (item.system?.linkedSkill ?? "").toString();
            const linkedSkillLabel =
              SKILL_LABELS[linkedSkillKey] ?? linkedSkillKey;

            let suffix = "";
            if (rank > 0) suffix += ` R${rank}`;
            if (talentType === "skill" && linkedSkillKey) suffix += ` (${linkedSkillLabel})`;

            return {
              id: `${ACTION_TYPES.TALENT_POST}.${item.id}`,
              name: `${item.name}${suffix}`,
              img: item.img,
              tooltip:
                item.system?.tooltip?.value ??
                item.system?.tooltip ??
                item.system?.description?.value ??
                item.system?.description ??
                "",
              encodedValue: `${ACTION_TYPES.TALENT_POST}|${item.id}`
            };
          });

        this.addActions(actions, { id: groupId, type: "system" });
      }
    }

    // -----------------------------
    // Inventory
    // -----------------------------

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