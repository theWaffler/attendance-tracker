import { getState, getTodayISO } from "./state.js";
import { getUpcomingHolidaysWithin } from "./holidays.js";

function daysBetween(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.round((b - a) / ms);
}

export function renderTimeline() {
  const container = document.getElementById("timeline");
  if (!container) return;

  const state = getState();
  container.innerHTML = "";

  const today = new Date(getTodayISO() + "T00:00:00");
  const end = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000); // next 12 months

  // Marks
  const markers = [];

  markers.push({
    type: "today",
    label: "Today",
    date: today
  });

  if (state.oldestWarningExpires) {
    const exp = new Date(state.oldestWarningExpires + "T00:00:00");
    if (!isNaN(exp.getTime()) && exp >= today && exp <= end) {
      markers.push({
        type: "warning-exp",
        label: "Oldest warning expires",
        date: exp
      });
    }
  }

  if (state.simDate) {
    const sim = new Date(state.simDate + "T00:00:00");
    if (!isNaN(sim.getTime()) && sim >= today && sim <= end) {
      markers.push({
        type: "sim",
        label: "Simulated absence",
        date: sim
      });
    }
  }

  // Holidays within next 12 months
  const holidays = getUpcomingHolidaysWithin(365, today);
  for (const h of holidays) {
    markers.push({
      type: "holiday",
      label: h.name,
      date: h.dateObj
    });
  }

  // Build axis
  const axis = document.createElement("div");
  axis.className = "timeline-axis";
  container.appendChild(axis);

  const totalDays = daysBetween(today, end);

  for (const m of markers) {
    const offsetDays = daysBetween(today, m.date);
    const pct = Math.max(0, Math.min(100, (offsetDays / totalDays) * 100));

    const dot = document.createElement("div");
    dot.className = "timeline-marker " + m.type;
    dot.style.left = `${pct}%`;
    dot.title = `${m.label} (${m.date.toISOString().slice(0, 10)})`;
    axis.appendChild(dot);
  }

  // Labels row (start / end)
  const labelsRow = document.createElement("div");
  labelsRow.className = "timeline-labels";
  labelsRow.innerHTML = `
    <span>${today.toISOString().slice(0, 10)}</span>
    <span>${end.toISOString().slice(0, 10)}</span>
  `;
  container.appendChild(labelsRow);

  // Legend
  const legend = document.createElement("div");
  legend.className = "timeline-legend";

  legend.innerHTML = `
    <span class="legend-item">
      <span class="legend-dot" style="background:#4ade80;"></span> Today
    </span>
    <span class="legend-item">
      <span class="legend-dot" style="background:#facc15;"></span> Oldest warning expiration
    </span>
    <span class="legend-item">
      <span class="legend-dot" style="background:#f97373;"></span> Simulated absence
    </span>
    <span class="legend-item">
      <span class="legend-dot" style="background:#2563eb;"></span> Holiday
    </span>
  `;

  container.appendChild(legend);
}

