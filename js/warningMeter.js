import { computeOccurrences } from "./state.js";
import { MAX_SAFE_OCCURRENCES } from "./policy.js";

export function renderWarningMeter() {
  const { total } = computeOccurrences();
  const fillEl = document.getElementById("meterFill");
  const labelEl = document.getElementById("meterCountLabel");
  if (!fillEl || !labelEl) return;

  const pct = Math.max(0, Math.min(100, (total / MAX_SAFE_OCCURRENCES) * 100));
  fillEl.style.width = `${pct}%`;
  labelEl.textContent = `${total} / ${MAX_SAFE_OCCURRENCES}`;
}

