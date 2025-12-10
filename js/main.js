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

  // warnings
  warningsInput.value = s.warnings;
  warningsInput.addEventListener("input", () => {
    setWarnings(warningsInput.value);
    renderAll();
  });

  // extra callouts
  extraInput.value = s.extraCallouts;
  chips.forEach(chip => {
    const v = Number(chip.dataset.extra);
    if (v === s.extraCallouts) chip.classList.add("chip-selected");
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("chip-selected"));
      chip.classList.add("chip-selected");
      setExtraCallouts(v);
      extraInput.value = v;
      renderAll();
    });
  });

  // oldest warning expiration
  oldestExp.value = s.oldestWarningExpires || "";
  oldestExp.addEventListener("input", () => {
    setOldestWarningExpires(oldestExp.value);
    renderAll();
  });

  // multiple simulation dates
  const addSimBtn = document.getElementById("addSimBtn");
  const simInput = document.getElementById("simInput");

  addSimBtn.addEventListener("click", () => {
    if (simInput.value) {
      addSimDate(simInput.value);
      simInput.value = "";
      renderAll();
    }
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

  let html = `
    <p>You currently report <strong>${state.warnings}</strong> active warnings.</p>
    <p>Unscheduled call-outs since last warning: <strong>${state.extraCallouts}</strong>.</p>
    <p>Simulated call-outs: <strong>${state.simDates.length}</strong></p>
    <p>Total occurrences counted: <strong>${total}</strong></p>
  `;

  if (remaining <= 0)
    html += `<p class="bad">At or beyond termination threshold.</p>`;
  else if (remaining <= 3)
    html += `<p class="warn">Close to threshold. Remaining safe occurrences: <strong>${remaining}</strong>.</p>`;
  else
    html += `<p class="good">Remaining safe occurrences: <strong>${remaining}</strong>.</p>`;

  box.innerHTML = html;
}

function renderSimList() {
  const box = document.getElementById("simList");
  const sims = getSimDates();

  if (sims.length === 0) {
    box.innerHTML = "<p>No simulated call-outs.</p>";
    return;
  }

  let html = sims.map(d => `
    <div class="sim-item">
      <span>${d}</span>
      <button class="sim-remove" data-remove="${d}">✕</button>
    </div>
  `).join("");

  box.innerHTML = html;

  document.querySelectorAll(".sim-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      removeSimDate(btn.dataset.remove);
      renderAll();
    });
  });
}

function renderSimResult() {
  const box = document.getElementById("simResult");
  const sims = getSimDates();

  if (sims.length === 0) {
    box.innerHTML = "<p>No simulations added.</p>";
    return;
  }

  let html = `<p>Simulated call-out details:</p>`;

  sims.forEach(dateStr => {
    const d = new Date(dateStr + "T00:00:00");
    const h = isHoliday(d);
    const near = isDayBeforeOrAfterHoliday(d);

    html += `<div class="sim-block"><p><strong>${dateStr}</strong></p>`;

    if (h) html += `<p class="warn">Holiday: ${h.name}</p>`;
    else if (near) html += `<p class="warn">Near holiday: ${near.name}</p>`;
    else html += `<p class="good">No holiday issues.</p>`;

    html += `</div>`;
  });

  html += `<p>Simulated dates add <strong>${sims.length}</strong> occurrence(s).</p>`;
  box.innerHTML = html;
}

init();
