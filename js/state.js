import { loadState, saveState } from "./storage.js";
import { MAX_SAFE_OCCURRENCES, OCCURRENCES_PER_WARNING } from "./policy.js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const defaultState = {
  warnings: 0,
  extraCallouts: 0,
  oldestWarningExpires: "",
  simDates: [] // multiple simulated call-out dates
};

let state = Object.assign({}, defaultState, loadState() || {});

export function getState() {
  return state;
}

export function setWarnings(value) {
  const v = Math.max(0, Math.min(3, Number(value) || 0));
  state.warnings = v;
  persist();
}

export function setExtraCallouts(value) {
  const v = Math.max(0, Math.min(2, Number(value) || 0));
  state.extraCallouts = v;
  persist();
}

export function setOldestWarningExpires(dateStr) {
  state.oldestWarningExpires = dateStr || "";
  persist();
}

// Simulated call-out dates

export function getSimDates() {
  return state.simDates;
}

export function addSimDate(dateStr) {
  if (!dateStr) return;
  if (!state.simDates.includes(dateStr)) {
    state.simDates.push(dateStr);
    persist();
  }
}

export function removeSimDate(dateStr) {
  state.simDates = state.simDates.filter(d => d !== dateStr);
  persist();
}

// persistence

function persist() {
  saveState(state);
}

// Derived values

export function computeOccurrences() {
  const simCount = state.simDates.length;
  const total = state.warnings * OCCURRENCES_PER_WARNING + state.extraCallouts + simCount;
  const remaining = MAX_SAFE_OCCURRENCES - total;
  return { total, remaining };
}

export function getTodayISO() {
  return todayISO();
}
