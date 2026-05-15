# Token Action HUD - Conan 2d20

Token Action HUD - Conan 2d20 is a companion module for **Token Action HUD Core** and the Conan 2d20 system.

It exposes common Conan actor actions in Token Action HUD while preserving the native Conan roll and combat workflows.

## v14 status

- Foundry VTT: **v14**
- Conan 2d20 system: **2.5.0**
- Token Action HUD Core: **2.0.16**
- Languages: English and Spanish

This module intentionally remains pinned to **Token Action HUD Core 2.0.16** because that is the Token Action HUD Core version supported by the Conan 2d20 system integration during this v14 migration.

## Main features

- Conan skills, attacks, equipment actions, and utility actions in Token Action HUD.
- Conan combat tracker helpers for claiming, seizing, completing, and advancing turns.
- Support for Conan's round-based completed-turn state.
- Doom validation and payment for NPC **Seize Turn** / **Arrebatar Turno**.
- English and Spanish labels.

## Combat turn handling

The module reads and writes Conan's v14 combat completed-turn state from the combat document:

```txt
flags.conan2d20.combatantsTurnDone[round]
```

This keeps Token Action HUD actions aligned with the native Conan combat tracker.

## Requirements

- Foundry VTT: `14`
- Conan 2d20 system: `2.5.0`
- Token Action HUD Core: `2.0.16`

## Installation

Install with this manifest URL:

```txt
https://raw.githubusercontent.com/kiryna-cpg/token-action-hud-conan2d20/main/module.json
```

Enable both modules in the world:

- Token Action HUD Core
- Token Action HUD - Conan 2d20

## Notes

Do not update this companion to Token Action HUD Core 2.1.x unless the Conan 2d20 system integration also supports that API line.

## Support

Report issues at:

```txt
https://github.com/kiryna-cpg/token-action-hud-conan2d20/issues
```

Include Foundry version, Conan system version, Token Action HUD Core version, reproduction steps, and console logs.

## License

MIT.
