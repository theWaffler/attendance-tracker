import { getState, getTodayISO } from "./state.js";
import { getUpcomingHolidaysWithin } from "./holidays.js";

function daysBetween(a, b) {
  const ms = 86400000;
  return Math.round((b - a) / ms);
}

export function renderTimeline() {
  const container = document.getElementById("timeline");
  if (!container) return;

  container.innerHTML = "";

  const state = getState();
  const today = new Date(getTodayISO() + "T00:00:00");
  const end = new Date(today.getTime() + 365 * 86400000);

  const markers = [];

  markers.push({ type: "today", label: "Today", date: today });

  if (state.oldestWarningExpires) {
    const exp = new Date(state.oldestWarningExpires + "T00:00:00");
    if (exp >= today && exp <= end)
      markers.push({ type: "warning-exp", label: "Warning exp", date: exp });
  }

  state.simDates.forEach(d => {
    const sim = new Date(d + "T00:00:00");
    if (sim >= today && sim <= end)
      markers.push({ type: "sim", label: "Simulated", date: sim });
  });

  const holidays = getUpcomingHolidaysWithin(365, today);
  holidays.forEach(h =>
    markers.push({ type: "holiday", label: h.name, date: h.dateObj })
  );

  const axis = document.createElement("div");
  axis.className = "timeline-axis";
  container.appendChild(axis);

  const totalDays = daysBetween(today, end);

  markers.forEach(m => {
    const offset = daysBetween(today, m.date);
    const pct = Math.max(0, Math.min(100, (offset / totalDays) * 100));

    const dot = document.createElement("div");
    dot.className = "timeline-marker " + m.type;
    dot.style.left = `${pct}%`;
    dot.title = `${m.label}: ${m.date.toISOString().slice(0, 10)}`;
    axis.appendChild(dot);
  });
}
