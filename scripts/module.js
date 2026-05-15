import { MODULE_ID } from "./constants.js";
import { getCombatantTurnDone, setCombatantTurnDone, setCombatTurn } from "./util/combat-turns.js";

Hooks.once("ready", () => {
  if (!game.modules.get("token-action-hud-core")?.active) return;

  // --- Small helper: normalize HTML arg (jQuery vs HTMLElement) ---
  const getRootEl = (html) => {
    if (!html) return null;
    if (html instanceof HTMLElement) return html;
    if (html?.[0] instanceof HTMLElement) return html[0];
    return null;
  };

  const isCombatTrackerMomentumUpdateEnabled = () => {
    try {
      return !!game.settings.get("conan2d20", "combatTrackerMomentumUpdate");
    } catch (_e) {
      // If the system setting is missing for any reason, default to disabled.
      return false;
    }
  };

  const getMomentumInput = () =>
    document?.querySelector?.(
      "input.input-momentum[data-type='momentum'], input[data-type='momentum'], input[name='momentum']"
    ) ?? null;

  const reimburseMomentum = async () => {
    if (!isCombatTrackerMomentumUpdateEnabled()) return false;

    const input = getMomentumInput();
    if (!input) return false;

    const current = Number(input.value ?? 0);
    if (!Number.isFinite(current)) return false;

    input.value = String(current + 1);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    const msg = game.i18n.localize("TAH.Conan2d20.MomentumReimbursed");
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      content: msg
    });

    return true;
  };

  // --- Paint + DOM guards (works with v13/v14 HTML hooks) ---
  const onRenderTrackerHTML = async (_app, html) => {
    const combat = game.combat;
    if (!combat) return;

    const root = getRootEl(html);
    if (!root) return;

    // Attach once per render root
    if (root.dataset.tahc2d20Bound !== "1") {
      root.dataset.tahc2d20Bound = "1";

      const isNextRoundBtn = (target) =>
        !!target?.closest?.("button[data-action='nextRound']");

      const isNextTurnBtn = (target) =>
        !!target?.closest?.("button[data-action='nextTurn']");

      const isPrevTurnBtn = (target) =>
        !!target?.closest?.("button[data-action='previousTurn']");

      const isPrevRoundBtn = (target) =>
        !!target?.closest?.("button[data-action='previousRound']");

      const isTurnToggle = (target) =>
        !!target?.closest?.("a.conan-combatant-control[data-action='toggleCombatantTurnDone']");

      const swallow = (datasetKey, predicate) => (ev) => {
        if (root.dataset[datasetKey] !== "1") return;
        if (!predicate(ev.target)) return;
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation?.();
      };

      // 1) Next Round confirmation (capture)
      const handleNextRound = async (ev) => {
        const combatNow = game.combat;
        if (!combatNow) return;
        if (!isNextRoundBtn(ev.target)) return;

        // If all completed (system state), do not interfere.
        const allDone = combatNow.combatants.contents.every((c) => getCombatantTurnDone(c));
        if (allDone) return;

        // Begin Encounter: allow system flow (round 0 -> 1)
        const currentRound = Number(combatNow.round ?? 0);
        if (currentRound === 0) return;

        // Block system handler to avoid Momentum spend on cancel
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation?.();

        // Arm a short-lived swallow so the upcoming CLICK does not trigger the system's nextRound handler
        root.dataset.tahc2d20SwallowNextRound = "1";
        setTimeout(() => { root.dataset.tahc2d20SwallowNextRound = "0"; }, 1000);

        if (!game.user?.isGM) {
          ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.RoundAdvanceGMOnly"));
          return;
        }

        const pending = combatNow.combatants.contents
          .filter((c) => !getCombatantTurnDone(c))
          .map((c) => c.name);

        const targetRound = currentRound + 1;
        const intro = game.i18n.format("TAH.Conan2d20.RoundConfirmContent", { round: targetRound });
        const listTitle = game.i18n.localize("TAH.Conan2d20.RoundConfirmPendingTitle");
        const listHtml = pending.length
          ? `<p><strong>${listTitle}</strong></p><ul>${pending.map((n) => `<li>${n}</li>`).join("")}</ul>`
          : "";

        const confirmed = await foundry.applications.api.DialogV2.confirm({
          window: { title: game.i18n.localize("TAH.Conan2d20.RoundConfirmTitle") },
          content: `<p>${intro}</p>${listHtml}`,
          modal: true,
          rejectClose: false,
          // Match previous defaultYes: false (default to "No")
          yes: { default: false },
          no: { default: true }
        });

        if (!confirmed) return;

        // Confirm => advance round explicitly
        await combatNow.nextRound();
      };

      // 2) Manual Turn Completed toggle persistence (capture)
      const handleTurnToggle = async (ev) => {
        const combatNow = game.combat;
        if (!combatNow) return;
        if (!isTurnToggle(ev.target)) return;
        if (!game.user?.isGM) return;

        // Do not allow toggling before the encounter starts (round 0)
        if (Number(combatNow.round ?? 0) === 0) {
          ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.CombatNotStarted"));
          return;
        }

        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation?.();

        const row = ev.target.closest("li.combatant[data-combatant-id]");
        const combatantId = row?.dataset?.combatantId;
        if (!combatantId) return;

        const combatant = combatNow.combatants.get(combatantId);
        if (!combatant) return;

        const next = !getCombatantTurnDone(combatant);
        await setCombatantTurnDone(combatant, next, { bankMomentum: true });

        try { await ui.combat?.render?.(); } catch (_e) {}
      };

      // 3) Next Turn: cycle through NOT completed combatants (no round changes)
      const handleNextTurn = async (ev) => {
        const combatNow = game.combat;
        if (!combatNow) return;
        if (!isNextTurnBtn(ev.target)) return;

        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation?.();

        root.dataset.tahc2d20SwallowNextTurn = "1";
        setTimeout(() => { root.dataset.tahc2d20SwallowNextTurn = "0"; }, 750);

        const turns = combatNow.turns ?? [];
        const pendingIdx = [];
        for (let i = 0; i < turns.length; i++) {
          if (!getCombatantTurnDone(turns[i])) pendingIdx.push(i);
        }

        // No pending combatants => warn and stay in round
        if (!pendingIdx.length) {
          ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.NextTurnAllActed"));
          return;
        }

        const cur = Number(combatNow.turn ?? 0);

        // Find first pending index strictly greater than current; else wrap to first pending
        const next = pendingIdx.find((i) => i > cur) ?? pendingIdx[0];

        await setCombatTurn(combatNow, next);
      };

      // 4) Previous Turn: cycle through COMPLETED combatants (no round changes)
      const handlePreviousTurn = async (ev) => {
        const combatNow = game.combat;
        if (!combatNow) return;
        if (!isPrevTurnBtn(ev.target)) return;

        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation?.();

        root.dataset.tahc2d20SwallowPrevTurn = "1";
        setTimeout(() => { root.dataset.tahc2d20SwallowPrevTurn = "0"; }, 750);

        const turns = combatNow.turns ?? [];
        const doneIdx = [];
        for (let i = 0; i < turns.length; i++) {
          if (getCombatantTurnDone(turns[i])) doneIdx.push(i);
        }

        // No completed combatants => warn and stay in round
        if (!doneIdx.length) {
          ui.notifications.warn(game.i18n.localize("TAH.Conan2d20.PreviousTurnNoneActedThisRound"));
          return;
        }

        const cur = Number(combatNow.turn ?? 0);

        // Find last done index strictly less than current; else wrap to last done
        let prev = -1;
        for (let i = doneIdx.length - 1; i >= 0; i--) {
          if (doneIdx[i] < cur) { prev = doneIdx[i]; break; }
        }
        if (prev < 0) prev = doneIdx[doneIdx.length - 1];

        await setCombatTurn(combatNow, prev);
      };

      // 5) Previous Round: always reimburse momentum
      const handlePreviousRound = async (ev) => {
        const combatNow = game.combat;
        if (!combatNow) return;
        if (!isPrevRoundBtn(ev.target)) return;

        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation?.();

        root.dataset.tahc2d20SwallowPrevRound = "1";
        setTimeout(() => { root.dataset.tahc2d20SwallowPrevRound = "0"; }, 750);

        if (typeof combatNow.previousRound === "function") {
          await combatNow.previousRound();
        } else {
          await combatNow.update({ round: Math.max(0, Number(combatNow.round ?? 0) - 1) });
        }

        await reimburseMomentum();
      };

      // Prevent duplicate dialogs: handle only once per user interaction
      let lastNextRoundAt = 0;
      const handleNextRoundOnce = async (ev) => {
        const now = Date.now();
        if (now - lastNextRoundAt < 400) return;

        // Only throttle when we're actually handling a nextRound interaction
        if (!isNextRoundBtn(ev.target)) return;

        lastNextRoundAt = now;
        return handleNextRound(ev);
      };

      // Capture listeners
      root.addEventListener("pointerdown", handleNextRoundOnce, true);
      root.addEventListener("pointerdown", handleNextTurn, true);
      root.addEventListener("pointerdown", handlePreviousTurn, true);
      root.addEventListener("pointerdown", handlePreviousRound, true);

      // Swallow subsequent click/mousedown so system handlers don't run
      const swallowNextRound = swallow("tahc2d20SwallowNextRound", isNextRoundBtn);
      const swallowNextTurn = swallow("tahc2d20SwallowNextTurn", isNextTurnBtn);
      const swallowPrevTurn = swallow("tahc2d20SwallowPrevTurn", isPrevTurnBtn);
      const swallowPrevRound = swallow("tahc2d20SwallowPrevRound", isPrevRoundBtn);

      root.addEventListener("mousedown", swallowNextRound, true);
      root.addEventListener("click", swallowNextRound, true);

      root.addEventListener("mousedown", swallowNextTurn, true);
      root.addEventListener("click", swallowNextTurn, true);

      root.addEventListener("mousedown", swallowPrevTurn, true);
      root.addEventListener("click", swallowPrevTurn, true);

      root.addEventListener("mousedown", swallowPrevRound, true);
      root.addEventListener("click", swallowPrevRound, true);

      // Manual toggle
      root.addEventListener("pointerdown", handleTurnToggle, true);
    }

    // Paint rows based on SYSTEM state
    const rows = Array.from(root.querySelectorAll("li.combatant[data-combatant-id]"));
    for (const row of rows) {
      const combatantId = row.dataset.combatantId;
      const combatant = combat.combatants.get(combatantId);
      if (!combatant) continue;

      const done = getCombatantTurnDone(combatant);

      row.classList.toggle("tahc2d20-turn-done", done);
      row.classList.toggle("tahc2d20-turn-not-done", !done);

      const toggle = row.querySelector("a.conan-combatant-control[data-action='toggleCombatantTurnDone']");
      if (toggle) {
        toggle.classList.toggle("tahc2d20-turn-done", done);
        toggle.classList.toggle("tahc2d20-turn-not-done", !done);
        toggle.classList.toggle("active", done);
        toggle.setAttribute("aria-pressed", done ? "true" : "false");

        const icon = toggle.querySelector("i");
        if (icon) {
          icon.classList.toggle("tahc2d20-turn-done", done);
          icon.classList.toggle("tahc2d20-turn-not-done", !done);
          icon.classList.toggle("active", done);
        }
      }
    }
  };

  Hooks.on("renderCombatTrackerHTML", onRenderTrackerHTML);
  Hooks.on("renderCombatTracker2d20V2HTML", onRenderTrackerHTML);
  Hooks.on("renderCombatTracker", onRenderTrackerHTML);
  Hooks.on("renderCombatTracker2d20V2", onRenderTrackerHTML);

  // Repaint the tracker on round changes. The Conan system stores completion per round,
  // so no manual combatant flag reset is needed here.
  Hooks.on("updateCombat", async (combat, changed) => {
    if (!("round" in changed)) return;
    if (!combat) return;

    try { await ui.combat?.render?.(); } catch (_e) {}
  });
});