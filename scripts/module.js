import { MODULE_ID } from "./constants.js";

Hooks.once("ready", () => {
  // Avoid hard dependency; only run if TAH Core is active
  if (!game.modules.get("token-action-hud-core")?.active) return;

  Hooks.on("updateItem", (_item, changed) => {
    // Only refresh HUD if equip state changed
    if (!foundry.utils.hasProperty(changed, "system.equipped")) return;

    // TAH Core exposes a refresh API via its global module; safest is event-based rebuild:
    // Force re-render by reselecting controlled tokens (Core listens to controlToken events)
    for (const token of canvas.tokens.controlled) {
      token._onControl({ control: true, releaseOthers: false });
    }
  });
});