# Token Action HUD - Conan 2d20

A **Token Action HUD Core** companion module for **Robert E. Howard's Conan: Adventures in an Age Undreamed Of (Conan 2d20)** on **Foundry VTT v13**.

This module adds Conan 2d20-specific actions to Token Action HUD (skills, attacks, inventory, talents/actions) so players and GMs can roll and manage common tasks directly from the HUD.

---

## Requirements

- Foundry VTT **v13**
- System: **Conan 2d20** (Modiphius)
- Module: **Token Action HUD Core** (required)
- (Optional) Any module that does not override the same HUD areas in a conflicting way

---

## Installation

### Manifest URL (recommended)

Paste this URL into Foundry VTT (**Add-on Modules → Install Module → Manifest URL**):

```text
https://raw.githubusercontent.com/kiryna-cpg/token-action-hud-conan2d20/main/module.json
```


### Manual install

Download/clone this repository and place it into:

`FoundryVTT/Data/modules/token-action-hud-conan2d20`

Then enable:
1. **Token Action HUD Core**
2. **Token Action HUD - Conan 2d20**

---

## Repository

- GitHub repository:
```text
https://github.com/kiryna-cpg/token-action-hud-conan2d20
```

- Issue tracker:
```text
https://github.com/kiryna-cpg/token-action-hud-conan2d20/issues
```

---

## Features

- **Combat**
  - Weapon attacks (melee/ranged) using the system’s native attack workflow.
  - Initiative roll action.
  - Weapons show an **Equipped** chip when applicable.

- **Skills**
  - Skill tests using the system’s native skill roller.
  - Optional “buy dice” sub-actions when House Rules are enabled.

- **Actions / Talents**
  - Post items to chat (title-only or full description, configurable).

- **Inventory**
  - Armor list with **equip/unequip toggle** directly from the HUD.
  - Kits list (left-click uses the kit if supported by the system; right-click opens sheet).

- **Quality of Life**
  - Standard interaction model:
    - **Left-click**: execute (roll/use)
    - **Right-click**: open sheet (actor/item)
  - HUD updates immediately when `system.equipped` changes (no token re-selection required).

---

## Usage

1. Enable **Token Action HUD Core** and **Token Action HUD - Conan 2d20**.
2. Select a token with an Actor.
3. Use the HUD tabs to roll attacks/skills and manage inventory.

> Tip: If you do not see actions, ensure the selected token’s Actor is owned by your user (or you are GM), and confirm Token Action HUD Core is enabled.

---

## Settings

This module exposes settings under **Module Settings**:

- **Enabled Tabs**
  - Toggle which top-level tabs appear (Combat, Skills, Actions, Talents, Inventory).

- **Only Equipped Weapons**
  - When enabled, Combat weapon lists only show equipped weapons.

- **Chat Post Mode**
  - Controls how Actions/Talents are posted to chat (e.g. title-only vs full description).

- **Enable House Rules**
  - Enables house-rule-specific skill sub-actions (e.g. “buy dice” workflow).

---

## Compatibility

- Designed for **Foundry VTT v13**.
- Tested with **Token Action HUD Core v2.x**.
- Uses Conan 2d20 system-native roll entry points (skill roller / attack flow).

If another module modifies the same Actor/item roll workflows or heavily changes item schemas, some actions may fall back to opening sheets.

---

## Troubleshooting

### Actions appear but do nothing
- Ensure you are using a compatible **Token Action HUD Core v2.x**.
- Check the console for errors and report them in Issues.

### HUD is empty / stale
- Try **Reload Application**.
- If you recently updated and the HUD seems cached, you can clear TAH Core storage for this system and reload:
  - `Data/modules/token-action-hud-core/storage/conan/`

### Right-click doesn’t execute special actions
- By design, **right-click opens sheets** (Token Action HUD Core behavior). Use left-click to execute actions.

---

## Development

- ESModules only.
- UI-visible strings must be localized via i18n (EN/ES).
- Avoid double-registering hooks and menus.
- Prefer Foundry v13-compatible patterns and forward-compatible APIs.

---

## License

This project is provided under the license included in this repository. If no license file is present, all rights are reserved by default.
