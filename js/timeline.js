import { getState, getTodayISO } from "./state.js";
import { getUpcomingHolidaysWithin } from "./holidays.js";

function daysBetween(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.round((b - a) / ms);
}

export function renderTimeline() {
  const container = document.getElementById("timeline");
  if (!container) return;

  container.innerHTML = "";

  const state = getState();
  const today = new Date(getTodayISO() + "T00:00:00");
  const end = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000); // 12 months ahead

  const todayStr = today.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const markers = [];

  // Today
  markers.push({
    type: "today",
    label: "Today",
    date: today
  });

  // Oldest warning expiration (if within next 12 months)
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

  // Simulated call-outs
  if (state.simDates && state.simDates.length) {
    state.simDates.forEach(d => {
      const sim = new Date(d + "T00:00:00");
      if (!isNaN(sim.getTime()) && sim >= today && sim <= end) {
        markers.push({
          type: "sim",
          label: "Simulated call-out",
          date: sim
        });
      }
    });
  }

  // Holidays within next 12 months
  const holidays = getUpcomingHolidaysWithin(365, today);
  holidays.forEach(h => {
    markers.push({
      type: "holiday",
      label: h.name,
      date: h.dateObj
    });
  });

  // Axis
  const axis = document.createElement("div");
  axis.className = "timeline-axis";
  container.appendChild(axis);

  const totalDays = daysBetween(today, end) || 1;

  markers.forEach(m => {
    const offset = daysBetween(today, m.date);
    const pct = Math.max(0, Math.min(100, (offset / totalDays) * 100));

    const dot = document.createElement("div");
    dot.className = "timeline-marker " + m.type;
    dot.style.left = `${pct}%`;
    dot.title = `${m.label} (${m.date.toISOString().slice(0, 10)})`;
    axis.appendChild(dot);
  });

  // Date labels under the axis (start and end)
  const labelsRow = document.createElement("div");
  labelsRow.className = "timeline-labels";
  labelsRow.innerHTML = `
    <span>${todayStr}</span>
    <span>${endStr}</span>
  `;
  container.appendChild(labelsRow);

  // Legend
  const legend = document.createElement("div");
  legend.className = "timeline-legend";
  legend.innerHTML = `
    <span class="legend-item">
      <span class="legend-dot legend-today"></span> Today
    </span>
    <span class="legend-item">
      <span class="legend-dot legend-warning"></span> Oldest warning expiration
    </span>
    <span class="legend-item">
      <span class="legend-dot legend-sim"></span> Simulated call-out
    </span>
    <span class="legend-item">
      <span class="legend-dot legend-holiday"></span> Holiday
    </span>
  `;
  container.appendChild(legend);
}
