import { ACTION_TYPES, MODULE_ID, SETTING_KEYS } from "../constants.js";
import { localize } from "../util/i18n.js";
import { SKILL_LABELS } from "../util/skill-map.js";

export class Conan2d20ActionHandler {
  async buildActionList({ actor, token }) {
    if (!actor) return null;

    const enableHouseRules = game.settings.get(MODULE_ID, SETTING_KEYS.ENABLE_HOUSE_RULES);
    const onlyEquippedWeapons = game.settings.get(MODULE_ID, SETTING_KEYS.ONLY_EQUIPPED_WEAPONS);

    const actionList = this._newActionList();

    this._addCombatTab(actionList, actor, { onlyEquippedWeapons });
    this._addSkillsTab(actionList, actor, { enableHouseRules });

    if (game.settings.get(MODULE_ID, SETTING_KEYS.SHOW_ACTIONS_TAB)) {
      this._addActionsTab(actionList, actor);
    }

    if (game.settings.get(MODULE_ID, SETTING_KEYS.SHOW_TALENTS_TAB)) {
      this._addTalentsTab(actionList, actor);
    }

    if (game.settings.get(MODULE_ID, SETTING_KEYS.SHOW_INVENTORY_TAB)) {
      this._addInventoryTab(actionList, actor);
    }

    return actionList;
  }

  _newActionList() {
    return {
      tabs: []
    };
  }

  _addCombatTab(actionList, actor, { onlyEquippedWeapons }) {
    const tab = this._newTab("combat", localize("TAH.Combat", "Combat"));
    const attacks = this._newGroup("attacks", localize("TAH.Attacks", "Attacks"));

    const weapons = actor.items.filter(i => i.type === "weapon")
      .filter(i => (onlyEquippedWeapons ? !!i.system.equipped : true))
      .filter(i => !i.system.broken);

    const melee = weapons.filter(w => w.system.weaponType === "melee");
    const ranged = weapons.filter(w => w.system.weaponType === "ranged");

    if (melee.length) {
      const g = this._newSubGroup("melee", localize("TAH.Melee", "Melee"));
      melee.forEach(item => g.actions.push(this._weaponAction(item)));
      attacks.subgroups.push(g);
    }

    if (ranged.length) {
      const g = this._newSubGroup("ranged", localize("TAH.Ranged", "Ranged"));
      ranged.forEach(item => g.actions.push(this._weaponAction(item)));
      attacks.subgroups.push(g);
    }

    const util = this._newGroup("combatUtil", localize("TAH.Utility", "Utility"));
    util.actions.push(this._initAction());

    tab.groups.push(attacks, util);
    actionList.tabs.push(tab);
  }

  _addSkillsTab(actionList, actor, { enableHouseRules }) {
    const tab = this._newTab("skills", localize("TAH.Skills", "Skills"));
    const group = this._newGroup("skills", localize("TAH.SkillTests", "Skill Tests"));

    const skills = actor.system.skills ?? {};
    const keys = Object.keys(skills);

    keys.sort((a, b) => (SKILL_LABELS[a] ?? a).localeCompare(SKILL_LABELS[b] ?? b));

    for (const key of keys) {
      const s = skills[key];
      const label = SKILL_LABELS[key] ?? key;
      group.actions.push(this._skillAction(key, label, s, { enableHouseRules }));
    }

    tab.groups.push(group);
    actionList.tabs.push(tab);
  }

  _addActionsTab(actionList, actor) {
    const tab = this._newTab("actions", localize("TAH.Actions", "Actions"));

    const actions = actor.items.filter(i => i.type === "action");
    const byType = new Map();

    for (const a of actions) {
      const t = a.system.actionType ?? "other";
      if (!byType.has(t)) byType.set(t, []);
      byType.get(t).push(a);
    }

    for (const [type, list] of byType.entries()) {
      const group = this._newGroup(`action.${type}`, type.toUpperCase());
      list.forEach(item => group.actions.push(this._postAction(item, ACTION_TYPES.ACTION_POST)));
      tab.groups.push(group);
    }

    actionList.tabs.push(tab);
  }

  _addTalentsTab(actionList, actor) {
    const tab = this._newTab("talents", localize("TAH.Talents", "Talents"));

    const talents = actor.items.filter(i => i.type === "talent");
    const bySkill = new Map();

    for (const t of talents) {
      const k = t.system.linkedSkill ?? "other";
      if (!bySkill.has(k)) bySkill.set(k, []);
      bySkill.get(k).push(t);
    }

    for (const [skillKey, list] of bySkill.entries()) {
      const label = skillKey === "other" ? "Other" : (SKILL_LABELS[skillKey] ?? skillKey);
      const group = this._newGroup(`talent.${skillKey}`, label);
      list.forEach(item => group.actions.push(this._postAction(item, ACTION_TYPES.TALENT_POST)));
      tab.groups.push(group);
    }

    actionList.tabs.push(tab);
  }

  _addInventoryTab(actionList, actor) {
    const tab = this._newTab("inventory", localize("TAH.Inventory", "Inventory"));

    const armorGroup = this._newGroup("armor", localize("TAH.Armor", "Armor"));
    actor.items.filter(i => i.type === "armor").forEach(item => {
      armorGroup.actions.push(this._openAction(item));
    });

    const kitGroup = this._newGroup("kits", localize("TAH.Kits", "Kits"));
    actor.items.filter(i => i.type === "kit").forEach(item => {
      kitGroup.actions.push(this._openAction(item));
    });

    tab.groups.push(armorGroup, kitGroup);
    actionList.tabs.push(tab);
  }

  _weaponAction(item) {
    return {
      id: `${ACTION_TYPES.WEAPON_USE}.${item.id}`,
      name: item.name,
      img: item.img,
      encodedValue: `${ACTION_TYPES.WEAPON_USE}|${item.id}`
    };
  }

  _skillAction(skillKey, label, skillData, { enableHouseRules }) {
    const base = {
      id: `${ACTION_TYPES.SKILL_ROLL}.${skillKey}`,
      name: label,
      img: null,
      info1: `${skillData?.tn?.value ?? ""}`,
      info2: `${skillData?.expertise?.value ?? ""}`,
      encodedValue: `${ACTION_TYPES.SKILL_ROLL}|${skillKey}`
    };

    if (!enableHouseRules) return base;

    base.subactions = [
      { name: "+1d20", encodedValue: `${ACTION_TYPES.BUY_DICE}|${skillKey}|1` },
      { name: "+2d20", encodedValue: `${ACTION_TYPES.BUY_DICE}|${skillKey}|2` },
      { name: "+3d20", encodedValue: `${ACTION_TYPES.BUY_DICE}|${skillKey}|3` }
    ];

    return base;
  }

  _postAction(item, actionType) {
    return {
      id: `${actionType}.${item.id}`,
      name: item.name,
      img: item.img,
      encodedValue: `${actionType}|${item.id}`
    };
  }

  _openAction(item) {
    return {
      id: `${ACTION_TYPES.ITEM_OPEN}.${item.id}`,
      name: item.name,
      img: item.img,
      encodedValue: `${ACTION_TYPES.ITEM_OPEN}|${item.id}`
    };
  }

  _initAction() {
    return {
      id: `${ACTION_TYPES.INIT_ROLL}`,
      name: localize("TAH.Initiative", "Initiative"),
      img: null,
      encodedValue: `${ACTION_TYPES.INIT_ROLL}`
    };
  }

  _newTab(id, name) {
    return { id, name, groups: [] };
  }

  _newGroup(id, name) {
    return { id, name, actions: [], subgroups: [] };
  }

  _newSubGroup(id, name) {
    return { id, name, actions: [] };
  }
}