import {
  getState,
  setWarnings,
  setExtraCallouts,
  setOldestWarningExpires,
  setSimDate,
  computeOccurrences
} from "./state.js";
import { renderWarningMeter } from "./warningMeter.js";
import { loadHolidays, isHoliday, isDayBeforeOrAfterHoliday } from "./holidays.js";
import { renderTimeline } from "./timeline.js";
import { loadTheme, saveTheme } from "./storage.js";
import { MAX_SAFE_OCCURRENCES } from "./policy.js";

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function vibrate(ms) {
  if (navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

async function init() {
  await loadHolidays();
  setupTheme();
  setupInputs();
  renderAll();
  registerServiceWorker();
}

function setupTheme() {
  const savedTheme = loadTheme();
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    saveTheme(theme);
    if (btn) btn.textContent = theme === "dark" ? "🌙" : "☀️";
  }

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const initial = savedTheme || (prefersDark ? "dark" : "dark");
  applyTheme(initial);

  if (!btn) return;
  btn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
  });
}

function setupInputs() {
  const state = getState();

  const warningsInput = document.getElementById("warningsInput");
  const extraInput = document.getElementById("extraCalloutsInput");
  const oldestExp = document.getElementById("oldestWarningExpires");
  const simDate = document.getElementById("simDate");
  const chips = Array.from(document.querySelectorAll("#extraChips .chip"));
  const steppers = Array.from(document.querySelectorAll(".stepper-btn"));

  if (warningsInput) {
    warningsInput.value = state.warnings;
    warningsInput.addEventListener("input", () => {
      const v = Number(warningsInput.value || 0);
      setWarnings(v);
      renderAll();
    });
  }

  if (extraInput) {
    extraInput.value = state.extraCallouts;
  }

  if (chips.length) {
    chips.forEach(chip => {
      const val = Number(chip.dataset.extra || 0);
      if (val === state.extraCallouts) {
        chip.classList.add("chip-selected");
      }
      chip.addEventListener("click", () => {
        chips.forEach(c => c.classList.remove("chip-selected"));
        chip.classList.add("chip-selected");
        setExtraCallouts(val);
        if (extraInput) extraInput.value = val;
        renderAll();
      });
    });
  }

  if (oldestExp) {
    oldestExp.value = state.oldestWarningExpires || "";
    oldestExp.addEventListener("input", () => {
      setOldestWarningExpires(oldestExp.value);
      renderAll();
    });
  }

  if (simDate) {
    simDate.value = state.simDate || "";
    simDate.addEventListener("input", () => {
      setSimDate(simDate.value);
      renderAll();
    });
  }

  if (steppers.length && warningsInput) {
    steppers.forEach(btn => {
      btn.addEventListener("click", () => {
        const step = Number(btn.dataset.step || 0);
        const current = Number(warningsInput.value || 0);
        let next = current + step;
        if (isNaN(next)) next = 0;
        next = Math.max(0, Math.min(3, next));
        warningsInput.value = next;
        setWarnings(next);
        renderAll();
      });
    });
  }
}

function renderAll() {
  renderRiskSummary();
  renderWarningMeter();
  renderSimResult();
  renderTimeline();
}

function renderRiskSummary() {
  const box = document.getElementById("riskSummary");
  if (!box) return;

  const state = getState();
  const { total, remaining } = computeOccurrences();

  let html = "";

  html += `<p>You currently report <strong>${state.warnings}</strong> active attendance warning(s).</p>`;
  html += `<p>You estimate <strong>${state.extraCallouts}</strong> unscheduled call-out(s) since your last warning.</p>`;
  html += `<p>Minimum counted occurrences so far = <strong>${total}</strong>.</p>`;

  if (remaining <= 0) {
    html += `<p class="bad">You are at or beyond the safe limit (relative to a 4th warning). Any additional unscheduled call-out could be treated as termination-level risk.</p>`;
    vibrate(60);
  } else if (remaining <= 3) {
    html += `<p class="warn">You are close to the edge. Estimated unscheduled call-outs remaining before you reach the 4th warning threshold: <strong>${remaining}</strong>.</p>`;
  } else {
    html += `<p class="good">Estimated unscheduled call-outs remaining before you hit the 4th warning threshold: <strong>${remaining}</strong>.</p>`;
  }

  if (state.warnings > 0) {
    if (state.oldestWarningExpires) {
      const expDate = new Date(state.oldestWarningExpires + "T00:00:00");
      if (!isNaN(expDate.getTime())) {
        const today = new Date();
        const status =
          expDate >= today
            ? `Your oldest warning is set to expire on <strong>${formatDate(expDate)}</strong>.`
            : `The expiration date you entered (<strong>${formatDate(expDate)}</strong>) is in the past. Update it if that’s not correct.`;
        html += `<p>${status}</p>`;
      }
      const warningsAfter = Math.max(0, state.warnings - 1);
      const occAfterMin = warningsAfter * 3;
      const remainingAfter = MAX_SAFE_OCCURRENCES - occAfterMin;
      html += `<p class="good">If no new warnings are issued and that warning drops off, you would have <strong>${warningsAfter}</strong> active warning(s) and an approximate “safe” room of <strong>${remainingAfter}</strong> occurrences (assuming no other violations).</p>`;
    } else {
      html += `<p class="hint">Add the expiration date for your oldest warning to see how your risk changes after it drops off.</p>`;
    }
  }

  html += `<p class="hint">This is a rough estimator based on math. HR can act more strictly or more leniently than this model.</p>`;

  box.innerHTML = html;
}

function renderSimResult() {
  const box = document.getElementById("simResult");
  if (!box) return;

  const state = getState();
  const { total } = computeOccurrences();

  if (!state.simDate) {
    box.innerHTML = "<p>Select a date to simulate.</p>";
    return;
  }

  const sim = new Date(state.simDate + "T00:00:00");
  if (isNaN(sim.getTime())) {
    box.innerHTML = "<p class='bad'>Invalid simulated date.</p>";
    return;
  }

  const newTotal = total + 1; // assume simulated call-out adds 1 occurrence
  const overLimit = newTotal > MAX_SAFE_OCCURRENCES;

  let html = "";
  html += `<p>Simulating an unscheduled call-out on <strong>${formatDate(sim)}</strong>:</p>`;
  html += `<p>Occurrences would increase from <strong>${total}</strong> to <strong>${newTotal}</strong>.</p>`;

  if (overLimit) {
    html += `<p class="bad">This would push you beyond the safe threshold related to the 4th warning. This is highly risky.</p>`;
    vibrate(80);
  } else if (MAX_SAFE_OCCURRENCES - newTotal <= 2) {
    html += `<p class="warn">This leaves very little room before the 4th warning threshold.</p>`;
  } else {
    html += `<p class="good">This stays within the estimated safe range, but you are still adding risk.</p>`;
  }

  const h = isHoliday(sim);
  const near = isDayBeforeOrAfterHoliday(sim);

  if (h) {
    html += `<p class="warn">This date is a company holiday: <strong>${h.name}</strong>. Depending on your policy, an unscheduled call-out on this day may affect pay or be prohibited.</p>`;
  } else if (near) {
    html += `<p class="warn">This date is <strong>the day before or after</strong> a holiday: <strong>${near.name}</strong>. Your policy may deny holiday pay in this scenario.</p>`;
  } else {
    html += `<p class="good">This date is not directly adjacent to a listed holiday in the configuration.</p>`;
  }

  html += `<p class="hint">Always confirm actual holiday and attendance rules with HR. This tool uses a configurable holiday list in <code>data/holidays.json</code>.</p>`;

  box.innerHTML = html;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("./service-worker.js")
    .catch(() => {
      // ignore errors
    });
}

init();

