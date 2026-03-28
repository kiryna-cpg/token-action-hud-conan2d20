# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [0.1.2] - 2026-03-28

### Fixed
- Hardened the startup registration flow with Token Action HUD Core to mitigate the intermittent `Token Action HUD | 0` console error during module load:
  - Split companion startup into two phases: prepare the companion API as soon as Core exposes its API, but delay the `tokenActionHudSystemReady` announcement until Foundry reaches `ready`.
  - Avoided re-entrant HUD construction during Core startup by preventing the system-ready hook from firing inside Core's own API registration call stack.
  - Kept ActionHandler and RollHandler initialization centralized and idempotent before the companion is announced as ready to Token Action HUD Core.

## [0.0.6] - 2026-03-21

### Fixed
- Fixed an intermittent initialization race condition with Token Action HUD Core that could log Token Action HUD | 0 during startup:
  - Ensured the Conan2d20 RollHandler is initialized idempotently and before the system module announces readiness to the Core API.
  - Added a fallback initialization path for cases where the Core API hook fires before the module registers its listener (load-order dependent).

## [0.0.5] - 2026-03-07

### Fixed
- Fixed a sporadic console message on module load (Token Action HUD | 0) by avoiding hook calls that return a numeric listener count when no handlers are registered (switched to Hooks.callAll for the system-ready hook dispatch).


## [0.0.4] - 2026-03-01

### Added
- Inventory tab now also lists:
  - **Consumables** (items of type `enchantment`).
  - **Miscellaneous** (items of type `miscellaneous`, with legacy compatibility for `miscellaneus`).
- Added a new **Sorcery** tab:
  - **Spells** (type `spell`) with left-click to **Cast Spell**.
  - **Petty Enchantments** (type `enchantment`) with left-click to **attack/use** (mirrors the actor sheet behavior).
- Added combat safety warning when attempting turn management before the encounter starts:
  - “Combat has not started yet. Click "Begin Encounter".” / “Aún no ha empezado el combate. Pulsa "Comenzar Encuentro".”

### Changed
- **Enchantments** no longer appear as attacks in the **Combat** tab; their attack/use action is now shown under **Sorcery** instead.
- Turn management actions (**Claim/Seize Turn** and manual **Turn Completed** toggle) are blocked while combat is at **round 0** (before “Begin Encounter”).

## [0.0.3] - 2026-03-01

### Added
- Full integration with **CombatTracker2d20V2** using Foundry v13 HTML hook variants (`renderCombatTrackerHTML` / `renderCombatTracker2d20V2HTML`) to avoid jQuery-dependent behavior.
- Persistent **Turn Completed** handling for the Conan system tracker:
  - Manual toggle (`toggleCombatantTurnDone`) now writes system flags (`flags.conan2d20.turnDone` and `flags.conan2d20.turnCompleted`).
  - Tracker icon is styled consistently via module CSS classes.
- **Next Round** GM confirmation when not all combatants have completed their turn:
  - Cancel keeps the current round and prevents any premature metacurrency changes.
  - Confirm advances the round normally.
- Enhanced tracker navigation:
  - **Next Turn** cycles through combatants who have **not acted** (Turn not completed), in order, wrapping around.
  - **Previous Turn** cycles through combatants who have **acted** (Turn completed), in reverse order, wrapping around.
  - Added warnings for edge cases:
    - “All combatants have already acted this round.”
    - “No combatant has acted yet this round.”
- **Momentum reimbursement** when moving to a previous round (via **Previous Round** and only if the checkbox Momentum/Doom is checked in system settings), including a chat message:
  - “Momentum Point Reimbursed”.

### Changed
- **Claim Turn / Seize Turn** now fully synchronizes with the system’s Turn Completed state:
  - Claim/Seize marks the Conan tracker toggle as completed immediately and applies consistent styling.
  - Manual unmarking resets completion state accordingly.
- **Claim Turn** now posts a chat message (matching Seize Turn behavior).
- HUD Combat layout:
  - Claim/Seize Turn is now placed at the **top of Combat** by prepending into the existing `attacks-melee` group.
  - The melee group is created during combat even if the actor has no melee weapons, ensuring Claim/Seize is always visible.

### Fixed
- Fixed Turn Completed manual toggle not updating state (and therefore not affecting Claim/Seize gating or round validation).
- Fixed metacurrency timing when attempting to advance rounds:
  - Prevented system handlers from firing when the module confirmation takes control, ensuring Momentum is only impacted when the round actually advances.
- Fixed completion state carrying over between rounds:
  - On round change, all combatants’ completion flags are reset (system flags and module sync flag).

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