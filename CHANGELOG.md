# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1] - 2026-05-15
### Changed
- Updated release metadata for Foundry VTT v14 and Conan 2d20 system 2.5.0.
- Kept Token Action HUD Core pinned to `2.0.16`, the Conan-supported core version for this migration.
- Updated README and manifest links for the v14 release line.

### Fixed
- Fixed **Seize Turn / Arrebatar Turno** for NPCs so it requires available Doom before changing the turn.
- Fixed NPC Seize Turn so it spends exactly 1 Doom through the Conan system tracker when available.
- Fixed combat turn completion checks to use Conan's v14 combat-level completed-turn flag state.

## [0.2.0] - 2026-05-15
### Changed
- Migrated the Conan companion module to Foundry VTT v14 while preserving Token Action HUD Core 2.0.16 compatibility.
- Updated completed-turn display and next-turn handling for Conan v14 combat data.

## [0.1.x]
### Added
- Initial Conan 2d20 system module for Token Action HUD Core.
