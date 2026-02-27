# Token Action HUD - Conan 2d20

System companion module for **Token Action HUD Core** that adds a Conan 2d20 action layout (skills, weapons, actions, talents, inventory) and action execution support for Foundry VTT v13.

## Requirements

- Foundry VTT v13 (verified on 13.351)
- System: **conan2d20**
- Module: **token-action-hud-core**

## Installation

Install the module using a manifest URL (when published) or place the module folder into:

`FoundryVTT/Data/modules/token-action-hud-conan2d20`

Enable:
1. **Token Action HUD Core**
2. **Token Action HUD - Conan 2d20**

## Usage

Select a token with an Actor owned by you. The HUD will populate actions based on the selected Actor.

### Tabs

- **Combat**
  - Attacks (Melee / Ranged), filtered by equipped state (optional)
  - Initiative
- **Skills**
  - Skill tests (TN and Expertise displayed in the action info fields)
  - Optional house-rules sub-actions for buying bonus dice with stress
- **Actions**
  - Action reference entries grouped by action type
- **Talents**
  - Talents grouped by linked skill
- **Inventory**
  - Armor and Kits (open sheet)

### Action behavior

- **Skills:** triggers a skill roll using the system API when available.
- **Weapons:** triggers a weapon attack/roll using the system API when available.
- **Actions/Talents:** posts the item title or full description to chat (configurable).
- **Open:** opens the item sheet.

If the system does not expose a direct roll method, the module falls back to opening the relevant sheet.

## Settings

- **Enable house rules (Skill & Metacurrency Revision)**
  - Enables stress-based bonus dice helper actions for skills.
  - Intended for projects that remove Fortune and allow buying bonus dice by spending physical/mental stress.
- **Show Actions tab**
- **Show Talents tab**
- **Show Inventory tab**
- **Only show equipped weapons**
- **Chat posting mode**
  - Full description
  - Title only

## Compatibility notes

This module does not replace or modify the Conan 2d20 system. It only reads Actor/Item data and calls system roll methods when available.

## License

This project is licensed under the MIT License. See `LICENSE`.

## Credits

- Token Action HUD Core by its respective authors.
- Conan 2d20 system by its respective authors.