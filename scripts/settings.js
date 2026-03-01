import { MODULE_ID, SETTING_KEYS, CHAT_POST_MODES } from "./constants.js";

export function registerSettings(onChangeFunction) {
  const onChange = typeof onChangeFunction === "function" ? onChangeFunction : undefined;

  game.settings.register(MODULE_ID, SETTING_KEYS.ENABLE_HOUSE_RULES, {
    name: game.i18n.localize("TAH.Setting.EnableHouseRules.Name"),
    hint: game.i18n.localize("TAH.Setting.EnableHouseRules.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.SHOW_ACTIONS_TAB, {
    name: game.i18n.localize("TAH.Setting.ShowActionsTab.Name"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.SHOW_TALENTS_TAB, {
    name: game.i18n.localize("TAH.Setting.ShowTalentsTab.Name"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.SHOW_INVENTORY_TAB, {
    name: game.i18n.localize("TAH.Setting.ShowInventoryTab.Name"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange
  });

    game.settings.register(MODULE_ID, SETTING_KEYS.SHOW_SORCERY_TAB, {
    name: game.i18n.localize("TAH.Conan2d20.Setting.ShowSorceryTab.Name"),
    hint: game.i18n.localize("TAH.Conan2d20.Setting.ShowSorceryTab.Hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.ONLY_EQUIPPED_WEAPONS, {
    name: game.i18n.localize("TAH.Setting.OnlyEquippedWeapons.Name"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.CHAT_POST_MODE, {
    name: game.i18n.localize("TAH.Setting.ChatPostMode.Name"),
    scope: "client",
    config: true,
    type: String,
    choices: {
      [CHAT_POST_MODES.FULL]: game.i18n.localize("TAH.Setting.ChatPostMode.Full"),
      [CHAT_POST_MODES.TITLE_ONLY]: game.i18n.localize("TAH.Setting.ChatPostMode.TitleOnly")
    },
    default: CHAT_POST_MODES.FULL,
    onChange
  });
}