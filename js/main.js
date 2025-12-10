import {
  getState,
  getSimDates,
  addSimDate,
  removeSimDate,
  setWarnings,
  setExtraCallouts,
  setOldestWarningExpires,
  computeOccurrences
} from "./state.js";

import { renderWarningMeter } from "./warningMeter.js";
import { loadHolidays, isHoliday, isDayBeforeOrAfterHoliday } from "./holidays.js";
import { renderTimeline } from "./timeline.js";
import { MAX_SAFE_OCCURRENCES } from "./policy.js";

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

async function init() {
  await loadHolidays();
  setupInputs();
  renderAll();
}

function setupInputs() {
  const s = getState();

  const warningsInput = document.getElementById("warningsInput");
  const extraInput = document.getElementById("extraCalloutsInput");
  const oldestExp = document.getElementById("oldestWarningExpires");
  const chips = Array.from(document.querySelectorAll("#extraChips .chip"));

  // warnings direct input
  warningsInput.value = s.warnings;
  warningsInput.addEventListener("input", () => {
    setWarnings(warningsInput.value);
    renderAll();
  });

  // stepper buttons for warnings
  document.querySelectorAll(".stepper-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const step = Number(btn.dataset.step || 0);
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      let val = Number(input.value || 0);
      if (isNaN(val)) val = 0;
      val = Math.max(0, Math.min(3, val + step));
      input.value = val;
      setWarnings(val);
      renderAll();
    });
  });

  // extra call-outs
  extraInput.value = s.extraCallouts;
  chips.forEach(chip => {
    const v = Number(chip.dataset.extra || 0);
    if (v === s.extraCallouts) chip.classList.add("chip-selected");
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("chip-selected"));
      chip.classList.add("chip-selected");
      setExtraCallouts(v);
      extraInput.value = v;
      renderAll();
    });
  });

  // oldest warning expiration date
  oldestExp.value = s.oldestWarningExpires || "";
  oldestExp.addEventListener("input", () => {
    setOldestWarningExpires(oldestExp.value);
    renderAll();
  });

  // simulated call-out dates
  const addSimBtn = document.getElementById("addSimBtn");
  const simInput = document.getElementById("simInput");

  addSimBtn.addEventListener("click", () => {
    if (!simInput.value) return;
    addSimDate(simInput.value);
    simInput.value = "";
    renderAll();
  });
}

function renderAll() {
  renderRiskSummary();
  renderWarningMeter();
  renderSimList();
  renderSimResult();
  renderTimeline();
}

function renderRiskSummary() {
  const box = document.getElementById("riskSummary");
  const state = getState();
  const { total, remaining } = computeOccurrences();

  let html = "";

  html += `<p>You currently report <strong>${state.warnings}</strong> active attendance warning(s).</p>`;
  html += `<p>Unscheduled call-outs since your last warning: <strong>${state.extraCallouts}</strong>.</p>`;
  html += `<p>Simulated future call-outs: <strong>${state.simDates.length}</strong>.</p>`;
  html += `<p>Total counted occurrences (real + simulated) = <strong>${total}</strong>.</p>`;

  if (remaining <= 0) {
    html += `<p class="bad">You are at or beyond the model’s termination threshold (relative to a 4th warning). Any additional unscheduled call-out is extremely high risk.</p>`;
  } else if (remaining <= 3) {
    html += `<p class="warn">You are very close to the threshold. Estimated “safe” occurrences remaining before reaching a 4th warning: <strong>${remaining}</strong>.</p>`;
  } else {
    html += `<p class="good">Estimated “safe” occurrences remaining before the 4th warning threshold: <strong>${remaining}</strong>.</p>`;
  }

  if (state.warnings > 0 && state.oldestWarningExpires) {
    const exp = new Date(state.oldestWarningExpires + "T00:00:00");
    if (!isNaN(exp.getTime())) {
      const today = new Date();
      const status =
        exp >= today
          ? `Your oldest warning is set to expire on <strong>${formatDate(exp)}</strong>.`
          : `The expiration date you entered (<strong>${formatDate(exp)}</strong>) is already in the past. Update it if that’s incorrect.`;

      html += `<p>${status}</p>`;

      const warningsAfter = Math.max(0, state.warnings - 1);
      const occAfterMin = warningsAfter * 3;
      const remainingAfter = MAX_SAFE_OCCURRENCES - occAfterMin;
      html += `<p class="good">If no new warnings are issued and that warning drops off, you would have <strong>${warningsAfter}</strong> active warning(s) and roughly <strong>${remainingAfter}</strong> occurrences of room, assuming no new violations.</p>`;
    }
  }

  html += `<p class="hint">Remember: this is just math based on a generic policy model. Your employer can always handle cases differently.</p>`;

  box.innerHTML = html;
}

function renderSimList() {
  const box = document.getElementById("simList");
  const sims = getSimDates();

  if (!sims.length) {
    box.innerHTML = "<p>No simulated call-outs added.</p>";
    return;
  }

  let html = "";
  sims.forEach(d => {
    html += `
      <div class="sim-item">
        <span>${d}</span>
        <button class="sim-remove" data-remove="${d}">✕</button>
      </div>
    `;
  });

  box.innerHTML = html;

  document.querySelectorAll(".sim-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      const dateStr = btn.dataset.remove;
      removeSimDate(dateStr);
      renderAll();
    });
  });
}

function renderSimResult() {
  const box = document.getElementById("simResult");
  const sims = getSimDates();

  if (!sims.length) {
    box.innerHTML = "<p>No simulated dates. Add some above to see holiday conflicts and cumulative impact.</p>";
    return;
  }

  let html = `<p>Details for simulated call-out dates:</p>`;

  sims.forEach(dateStr => {
    const d = new Date(dateStr + "T00:00:00");
    const h = isHoliday(d);
    const near = isDayBeforeOrAfterHoliday(d);

    html += `<div class="sim-block">`;
    html += `<p><strong>${dateStr}</strong></p>`;

    if (h) {
      html += `<p class="warn">This date is a holiday: <strong>${h.name}</strong>. Your policy may forbid calling out or may deny holiday pay.</p>`;
    } else if (near) {
      html += `<p class="warn">This date is the day before or after a holiday: <strong>${near.name}</strong>. Many policies deny holiday pay in this situation.</p>`;
    } else {
      html += `<p class="good">This date is not directly next to a configured holiday.</p>`;
    }

    html += `</div>`;
  });

  html += `<p>These simulated dates currently add <strong>${sims.length}</strong> occurrence(s) to your total.</p>`;
  html += `<p class="hint">Simulations are hypothetical only. They help you understand risk before you decide whether you actually call out.</p>`;

  box.innerHTML = html;
}

init();
