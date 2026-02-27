# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [0.0.2] - 2026-02-27

### Added
- Armor items in the Inventory tab can now be equipped/unequipped directly from the HUD, including an "Equipped" status chip.
- Inventory actions update instantly when the equipped state changes (no token re-selection required).
- Added i18n keys for "Open" and "Equipped".

### Changed
- Updated roll execution to use Conan 2d20 system-native actor APIs:
  - Skill tests now use `Actor._rollSkillCheck(...)`.
  - Weapon attacks now use `Actor._executeAttack(itemId)`.
  - Kits can be used via `Actor.useKit(itemId)` on left-click.
- Standardized input behavior:
  - Left-click executes the action (roll/use).
  - Right-click opens the item/actor sheet.

### Fixed
- Fixed Token Action HUD hover/click errors caused by an incompatible roll handler implementation with Token Action HUD Core v2.0.x.
- Fixed token selection errors in Inventory action building caused by undefined variables.

## [0.0.1] - 2026-02-25

### Added
- Initial system companion implementation for Token Action HUD Core (Conan 2d20).
- Combat tab with weapon attacks grouped by melee/ranged and an initiative action.
- Skills tab listing all actor skills, displaying TN and Expertise in action info fields.
- Optional house-rules skill sub-actions to buy bonus d20s by spending stress.
- Actions tab grouping action items by action type and posting to chat.
- Talents tab grouping talent items by linked skill and posting to chat.
- Inventory tab with Armor and Kits (open sheet).
- Client/world settings to control tab visibility, equipped weapon filtering, house rules, and chat posting mode.
- English and Spanish localization scaffolding.